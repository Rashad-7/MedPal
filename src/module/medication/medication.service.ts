// src/module/medication/medication.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { UserDocument } from 'src/DB/model/User.model';
import { PatientDocument } from 'src/DB/model/patient.model';
import { Medicine, MedicineDocument } from 'src/DB/model/Medication.model';
import { MedicationLog, MedicationLogDocument, MedicationStatus } from 'src/DB/model/MedicationLog.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { NotificationService } from 'src/common/service/notification.service';
import { AIMedicineService } from 'src/common/service/aiMedicine.service';
import { AddMedicationDto } from './dto/medication.dto';
import { CloudService } from 'src/common/multer/cloud.service';

@Injectable()
export class MedicationService {
  constructor(
    @InjectModel(Medicine.name)
    private readonly medicineModel: Model<MedicineDocument>,
    @InjectModel(MedicationLog.name)
    private readonly logModel: Model<MedicationLogDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
    private readonly userRepository: UserRepositoryService<UserDocument>,
    private readonly notificationService: NotificationService,
    private readonly aiMedicineService: AIMedicineService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cloudService: CloudService,

  ) {}

  // ============ Endpoint 1: إضافة دوا ============
  async addMedication(user: UserDocument, body: AddMedicationDto, file?: Express.Multer.File) {

    // 1. جيب بيانات الدوا من الـ AI
    const aiData = await this.aiMedicineService.getMedicineData(body.medicineName, file);

    // 2. لو في صورة → ارفعها على Cloudinary
    let imageData;
    if (file) {
      const uploaded = await this.cloudService.uploadFile(file, {
        folder: `${process.env.APP_NAME}/medicines`,
      });
      imageData = { secure_url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    // 3. احفظ الدوا أو جيبه لو موجود
    let medicine = await this.medicineModel.findOne({
      tradName: { $regex: aiData.tradName, $options: 'i' },
    });

    if (!medicine) {
      medicine = await this.medicineModel.create({
        ...aiData,
        ...(imageData && { image: imageData }),
      });
    }

    // 4. أضف للـ patient medications array
    const patient = await this.patientRepository.findOne({ filter: { userId: user._id } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    // تحقق مش موجود قبل كده
    const alreadyAdded = patient.medications?.some(
      (m) => m.medicineId?.toString() === medicine._id.toString(),
    );
    if (alreadyAdded) throw new BadRequestException('الدوا ده مضاف قبل كده');

    await this.patientRepository.updateOne({
      filter: { userId: user._id },
      data: {
        $push: {
          medications: {
            medicineId: medicine._id,
            medicineName: medicine.tradName,
            dosage: body.dosage,
            frequency: body.frequency,
            startDate: new Date(body.startDate),
            active: true,
          },
        },
      },
    });

    // 5. إنشاء أول MedicationLog
    const scheduledTime = this.getNextDoseTime(new Date(body.startDate), body.frequency);
    const log = await this.logModel.create({
      patientId: user._id,
      medicineId: medicine._id,
      medicineName: medicine.tradName,
      status: MedicationStatus.PENDING,
      attemptCount: 0,
      scheduledTime,
    });

    // 6. جدول الريمايندر
    await this.scheduleReminder({
      logId: log._id.toString(),
      patientId: user._id.toString(),
      scheduledTime,
      medicineName: medicine.tradName,
      frequency: body.frequency,
    });

    return { message: 'Done', medicine, scheduledTime, logId: log._id };
  }

  // ============ Endpoint 2: تسجيل أخد الدوا ============
  async takeMedication(user: UserDocument, logId: string) {
    const log = await this.logModel.findOne({
      _id: new mongoose.Types.ObjectId(logId),
      patientId: user._id,
      status: MedicationStatus.PENDING,
    });

    if (!log) throw new NotFoundException('Log مش موجود أو اتسجل قبل كده');

    // امسح الريمايندر الجاري
    this.clearReminder(logId);

    // سجل إنه اخد الدوا
    log.status = MedicationStatus.TAKEN;
    log.takenAt = new Date();
    await log.save();

    // جدول الجرعة الجاية
    const patient = await this.patientRepository.findOne({ filter: { userId: user._id } });
    const med = patient?.medications?.find(
      (m) => m.medicineId.toString() === log.medicineId.toString(),
    );

    if (med?.active) {
      const nextTime = this.getNextDoseTime(new Date(), med.frequency);
      const nextLog = await this.logModel.create({
        patientId: user._id,
        medicineId: log.medicineId,
        medicineName: log.medicineName,
        status: MedicationStatus.PENDING,
        attemptCount: 0,
        scheduledTime: nextTime,
      });

      await this.scheduleReminder({
        logId: nextLog._id.toString(),
        patientId: user._id.toString(),
        scheduledTime: nextTime,
        medicineName: log.medicineName,
        frequency: med.frequency,
      });
    }

    return { message: '✅ تم تسجيل أخد الدوا', takenAt: log.takenAt };
  }

  // ============ Endpoint 3: تقرير الأدوية للـ AI ============
  async getPatientMedicinesContext(userId: mongoose.Types.ObjectId) {
    // ده بيرجع بيانات الأدوية كاملة مع الأعراض الجانبية
    // الـ AI هيستخدمه لما المريض يسأل عن عرض جانبي
    const patient = await this.patientRepository.findOne({
      filter: { userId },
      populate: [
        {
          path: 'medications.medicineId',
          model: 'Medicine',
          select: 'tradName activeIngredient sideEffects contraindications interactions',
        },
      ],
    });

    if (!patient) throw new NotFoundException('Patient not found');

    return patient.medications?.map((m) => ({
      name: m.medicineName,
      dosage: m.dosage,
      frequency: m.frequency,
      sideEffects: (m.medicineId as any)?.sideEffects || [],
      contraindications: (m.medicineId as any)?.contraindications || [],
      interactions: (m.medicineId as any)?.interactions || [],
    }));
  }

  // ============ Endpoint 4: تقرير المريض ============
  async getMedicationReport(user: UserDocument) {
    const logs = await this.logModel
      .find({ patientId: user._id })
      .sort({ scheduledTime: -1 })
      .lean();

    const taken = logs.filter((l) => l.status === MedicationStatus.TAKEN).length;
    const missed = logs.filter((l) => l.status === MedicationStatus.MISSED).length;
    const pending = logs.filter((l) => l.status === MedicationStatus.PENDING).length;

    const adherenceRate = logs.length
      ? Math.round((taken / (taken + missed)) * 100) || 0
      : 0;

    return {
      total: logs.length,
      taken,
      missed,
      pending,
      adherenceRate: `${adherenceRate}%`,
      logs,
    };
  }

  // ============ Reminder Logic ============
  private async scheduleReminder({
    logId, patientId, scheduledTime, medicineName, frequency,
  }: {
    logId: string;
    patientId: string;
    scheduledTime: Date;
    medicineName: string;
    frequency: string;
  }) {
    // لو الوقت في الماضي → ابدأ بعد دقيقة (للتجربة)
    const fireTime = scheduledTime < new Date()
      ? new Date(Date.now() + 60 * 1000)
      : scheduledTime;

    const jobName = `reminder_${logId}_attempt_1`;
    const job = new CronJob(fireTime, async () => {
      await this.ringReminder({ logId, patientId, medicineName, frequency, attempt: 1 });
    });

    try {
      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
    } catch {
      // لو الـ job موجود قبل كده امسحه وعيد
      this.schedulerRegistry.deleteCronJob(jobName);
      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
    }
  }

  private async ringReminder({
    logId, patientId, medicineName, frequency, attempt,
  }: {
    logId: string;
    patientId: string;
    medicineName: string;
    frequency: string;
    attempt: number;
  }) {
    const log = await this.logModel.findById(logId);
    if (!log || log.status !== MedicationStatus.PENDING) return;

    log.attemptCount = attempt;
    await log.save();

    // ⭐ جيب الـ FCM token وابعت إشعار حقيقي
    const userDoc = await this.userRepository.findOne({ filter: { _id: patientId } });
    if (userDoc?.fcmToken) {
      await this.notificationService.sendToDevice(
        userDoc.fcmToken,
        `💊 وقت دواك!`,
        `حان وقت أخد ${medicineName} — المحاولة ${attempt} من 3`,
        { logId, medicineName, attempt: String(attempt) },
      );
    }

    console.log(`🔔 Reminder #${attempt} for ${medicineName} - patient ${patientId}`);

    if (attempt >= 3) {
      // بعد 3 محاولات → missed
      log.status = MedicationStatus.MISSED;
      await log.save();

      // إشعار إن الجرعة اتفوت
      if (userDoc?.fcmToken) {
        await this.notificationService.sendToDevice(
          userDoc.fcmToken,
          `❌ فاتتك جرعة`,
          `فاتتك جرعة ${medicineName}. تم تسجيلها كـ missed في التقرير.`,
          { logId, type: 'missed' },
        );
      }

      // جدول الجرعة الجاية
      const nextTime = this.getNextDoseTime(new Date(), frequency);
      const nextLog = await this.logModel.create({
        patientId: new mongoose.Types.ObjectId(patientId),
        medicineId: log.medicineId,
        medicineName,
        status: MedicationStatus.PENDING,
        attemptCount: 0,
        scheduledTime: nextTime,
      });

      await this.scheduleReminder({
        logId: nextLog._id.toString(),
        patientId,
        scheduledTime: nextTime,
        medicineName,
        frequency,
      });

    } else {
      // بعد 15 دقيقة → محاولة تانية
      this.clearReminderAttempt(logId, attempt);
      const retryTime = new Date(Date.now() + 15 * 60 * 1000);

      const jobName = `reminder_${logId}_attempt_${attempt + 1}`;
      const job = new CronJob(retryTime, async () => {
        await this.ringReminder({ logId, patientId, medicineName, frequency, attempt: attempt + 1 });
      });
      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
    }
  }

  private clearReminder(logId: string) {
    [1, 2, 3].forEach((i) => this.clearReminderAttempt(logId, i));
  }

  private clearReminderAttempt(logId: string, attempt: number) {
    try {
      this.schedulerRegistry.deleteCronJob(`reminder_${logId}_attempt_${attempt}`);
    } catch {}
  }

  private getNextDoseTime(from: Date, frequencyHours: string): Date {
    const hours = parseFloat(frequencyHours);
    return new Date(from.getTime() + hours * 60 * 60 * 1000);
  }
}