import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { UserDocument } from 'src/DB/model/User.model';
import { PatientDocument } from 'src/DB/model/patient.model';
import { Medicine, MedicineDocument, RepeatType } from 'src/DB/model/Medication.model';
import { MedicationLog, MedicationLogDocument, MedicationStatus } from 'src/DB/model/MedicationLog.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { NotificationService } from 'src/common/service/notification.service';
import { AddMedicationDto } from './dto/medication.dto';
import { CloudService } from 'src/common/multer/cloud.service';
import { AIMedicineService } from 'src/common/service/aiMedicine.service';
import { AIMedicineGroqService } from 'src/common/service/aiMedicine.groq.service';


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
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cloudService: CloudService,
    private readonly aiMedicineService: AIMedicineService,
    private readonly aiMedicineGroqService: AIMedicineGroqService,

  ) {}
async addMedication(
  user: UserDocument,
  body: AddMedicationDto,
  file?: Express.Multer.File,
) {
  const { repeat, repeatEveryHours, reminderTime, startDate } = body;

  
  const aiData = await this.aiMedicineGroqService.getMedicineData(
    body.medicationName,
    
  );

  
  const patient = await this.patientRepository.findOne({
    filter: { userId: user._id },
    options: { lean: true },
  });

  if (!patient) {
    throw new NotFoundException('Patient profile not found');
  }

  const currentMedNames =
    patient.medications?.filter((m) => m.active).map((m) => m.medicationName) ||
    [];

  const diseases =
    patient.chronicDiseases?.map((d) => ({
      name: d.name,
      status: d.status,
      medications: d.medications,
    })) || [];

  
  const [interactionResult, compatibilityResult] = await Promise.all([
    this.aiMedicineGroqService.checkDrugInteractions(
      aiData.medicationName,
      currentMedNames,
    ),
    this.aiMedicineGroqService.checkChronicDiseaseCompatibility(
      aiData.medicationName,
      diseases,
    ),
  ]);

  
  if (
    interactionResult.severity === 'severe' ||
    compatibilityResult.warningLevel === 'avoid'
  ) {
    return {
      message: 'warning',
      added: false,
      interactionCheck: interactionResult,
      compatibilityCheck: compatibilityResult,
      warning:
        'This medication is not safe with your current conditions or medications.',
    };
  }

  
  let imageData: any = undefined;

  if (file) {
    try {
      const uploaded = await this.cloudService.uploadFile(file, {
        folder: `${process.env.APP_NAME}/medicines`,
      });

      imageData = {
        secure_url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    } catch (err) {
      console.error('Image upload failed:', err.message);
      
    }
  }

  
  let medicine = await this.medicineModel.findOne({
    medicationName: { $regex: `^${aiData.medicationName}$`, $options: 'i' },
  });

  
  if (!medicine?.userId?.equals(user._id)) {
    medicine = await this.medicineModel.create({
      userId: user._id,
      medicationName: aiData.medicationName,
      dosage: body.dosage || aiData.dosage || 'N/A',
      repeat,
      repeatEveryHours,
      reminderTime,
      sideEffects: aiData.sideEffects,
      warningLevel: aiData.warningLevel || 'safe',
      activeIngredient: aiData.activeIngredient,
      genericName: aiData.genericName,
      category: aiData.category,
      contraindications: aiData.contraindications,
      interactions: aiData.interactions,
      instructions: aiData.instructions,
      ...(imageData && { image: imageData }),
    });
  }

  
  const alreadyAdded = patient.medications?.some(
    (m) => m.medicineId?.toString() === medicine._id.toString(),
  );

  if (alreadyAdded) {
    throw new BadRequestException("You've already added this medicine");
  }

  
  await this.patientRepository.updateOne({
    filter: { userId: user._id },
    data: {
      $push: {
        medications: {
          medicineId: medicine._id,
          medicationName: medicine.medicationName,
          dosage: body.dosage || aiData.dosage || 'N/A',
          repeat,
          repeatEveryHours,
          reminderTime,
          sideEffects: aiData.sideEffects,
          warningLevel: aiData.warningLevel || 'safe',
          startDate: new Date(startDate),
          active: true,
        },
      },
    },
  });

  
  const scheduledTime = this.getFirstDoseTime(startDate, reminderTime);

  const log = await this.logModel.create({
    patientId: user._id,
    medicineId: medicine._id,
    medicineName: medicine.medicationName,
    status: MedicationStatus.PENDING,
    attemptCount: 0,
    scheduledTime,
  });

  
  this.scheduleReminder({
    logId: log._id.toString(),
    patientId: user._id.toString(),
    scheduledTime,
    medicineName: medicine.medicationName,
    repeat,
    repeatEveryHours,
    reminderTime,
  });

  return {
    message: 'Done',
    added: true,
    medicine,
    scheduledTime,
    logId: log._id,
    interactionCheck: interactionResult,
    compatibilityCheck: compatibilityResult,
  };
}

































































































































































  
 
  async getAllMedicines() {
    const medicines = await this.medicineModel.find().lean();
    return { message: 'done', total: medicines.length, data: medicines };
  }

  
  async getMedicine(medicineId: string) {
    const medicine = await this.medicineModel.findById(medicineId).lean();
    if (!medicine) throw new NotFoundException('Medicine not found');
    return { message: 'done', data: medicine };
  }

  
  async getPatientMedications(user: UserDocument) {
    const patient = await this.patientRepository.findOne({
      filter: { userId: user._id },
      populate: [
        {
          path: 'medications.medicineId',
          model: 'Medicine',
          select: 'medicationName dosage repeat reminderTime sideEffects warningLevel activeIngredient category contraindications interactions instructions',
        },
      ],
    });

    if (!patient) throw new NotFoundException('Patient not found');


    const grouped = {
      safe: [] as any[],
      mild: [] as any[],
      moderate: [] as any[],
      severe: [] as any[],
    };

    patient.medications?.forEach((med) => {
      const level = med.warningLevel || 'safe';
      if (grouped[level]) grouped[level].push(med);
    });

    return {
      message: 'done',
      total: patient.medications?.length || 0,
      data: patient.medications,
      groupedByWarning: grouped,
    };
  }

  
  async getMedicationReport(user: UserDocument) {
    const [logs, patient] = await Promise.all([
      this.logModel.find({ patientId: user._id }).sort({ scheduledTime: -1 }).lean(),
      this.patientRepository.findOne({ filter: { userId: user._id } }),
    ]);

    const taken = logs.filter((l) => l.status === MedicationStatus.TAKEN).length;
    const missed = logs.filter((l) => l.status === MedicationStatus.MISSED).length;
    const pending = logs.filter((l) => l.status === MedicationStatus.PENDING).length;
    const adherenceRate = taken + missed > 0
      ? Math.round((taken / (taken + missed)) * 100)
      : 0;

    
    const warningMeds = patient?.medications?.filter(
      (m) => m.warningLevel === 'severe' || m.warningLevel === 'moderate',
    ) || [];

    return {
      message: 'done',
      summary: {
        total: logs.length,
        taken,
        missed,
        pending,
        adherenceRate: `${adherenceRate}%`,
        activeMedications: patient?.medications?.filter((m) => m.active).length || 0,
        warningMedications: warningMeds.length,
      },
      warningMedications: warningMeds,
      logs,
    };
  }

  
  async takeMedication(user: UserDocument, logId: string) {
    const log = await this.logModel.findOne({
      _id: new mongoose.Types.ObjectId(logId),
      patientId: user._id,
      status: MedicationStatus.PENDING,
    });

    if (!log) throw new NotFoundException('Medication log not found or already taken/missed');

    this.clearReminder(logId);

    log.status = MedicationStatus.TAKEN;
    log.takenAt = new Date();
    await log.save();

    const patient = await this.patientRepository.findOne({ filter: { userId: user._id } });
    const med = patient?.medications?.find(
      (m) => m.medicineId.toString() === log.medicineId.toString(),
    );

    if (med?.active) {
      const nextTime = this.getNextDoseTime(new Date(), med.repeat, med.repeatEveryHours, med.reminderTime);
      const nextLog = await this.logModel.create({
        patientId: user._id,
        medicineId: log.medicineId,
        medicineName: log.medicineName,
        status: MedicationStatus.PENDING,
        attemptCount: 0,
        scheduledTime: nextTime,
      });

      this.scheduleReminder({
        logId: nextLog._id.toString(),
        patientId: user._id.toString(),
        scheduledTime: nextTime,
        medicineName: log.medicineName,
        repeat: med.repeat,
        repeatEveryHours: med.repeatEveryHours,
        reminderTime: med.reminderTime,
      });
    }

    return { message: '✅ medication signed', takenAt: log.takenAt };
  }

  
  private scheduleReminder({
    logId, patientId, scheduledTime, medicineName,
    repeat, repeatEveryHours, reminderTime,
  }: {
    logId: string;
    patientId: string;
    scheduledTime: Date;
    medicineName: string;
    repeat: string;
    repeatEveryHours?: number;
    reminderTime: string;
  }) {
    const fireTime = scheduledTime < new Date()
      ? new Date(Date.now() + 10 * 1000) 
      : scheduledTime;

    const jobName = `reminder_${logId}_1`;

    try { this.schedulerRegistry.deleteCronJob(jobName); } catch {}

    const job = new CronJob(fireTime, async () => {
      await this.ringReminder({ logId, patientId, medicineName, repeat, repeatEveryHours, reminderTime, attempt: 1 });
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
  }

  private async ringReminder({
    logId, patientId, medicineName, repeat,
    repeatEveryHours, reminderTime, attempt,
  }: {
    logId: string;
    patientId: string;
    medicineName: string;
    repeat: string;
    repeatEveryHours?: number;
    reminderTime: string;
    attempt: number;
  }) {
    const log = await this.logModel.findById(logId);
    if (!log || log.status !== MedicationStatus.PENDING) return;

    log.attemptCount = attempt;
    await log.save();

    const userDoc = await this.userRepository.findOne({ filter: { _id: patientId } });
    if (userDoc?.fcmToken) {
      await this.notificationService.sendToDevice(
        userDoc.fcmToken,
        `💊 وقت دواك!`,
        `حان وقت أخد ${medicineName} — المحاولة ${attempt} من 3`,
        { logId, medicineName, attempt: String(attempt) },
      );
    }

    if (attempt >= 3) {
      
      log.status = MedicationStatus.MISSED;
      await log.save();

      if (userDoc?.fcmToken) {
        await this.notificationService.sendToDevice(
          userDoc.fcmToken,
          `❌ missed dose!`,
          `missed dose! ${medicineName}`,
          { logId, type: 'missed' },
        );
      }

      const nextTime = this.getNextDoseTime(new Date(), repeat, repeatEveryHours, reminderTime);
      const nextLog = await this.logModel.create({
        patientId: new mongoose.Types.ObjectId(patientId),
        medicineId: log.medicineId,
        medicineName,
        status: MedicationStatus.PENDING,
        attemptCount: 0,
        scheduledTime: nextTime,
      });

      this.scheduleReminder({
        logId: nextLog._id.toString(),
        patientId,
        scheduledTime: nextTime,
        medicineName,
        repeat,
        repeatEveryHours,
        reminderTime,
      });

    } else {
      
      try { this.schedulerRegistry.deleteCronJob(`reminder_${logId}_${attempt}`); } catch {}

      const retryTime = new Date(Date.now() + 15 * 60 * 1000);
      const jobName = `reminder_${logId}_${attempt + 1}`;
      const job = new CronJob(retryTime, async () => {
        await this.ringReminder({ logId, patientId, medicineName, repeat, repeatEveryHours, reminderTime, attempt: attempt + 1 });
      });
      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
    }
  }

  private clearReminder(logId: string) {
    [1, 2, 3].forEach((i) => {
      try { this.schedulerRegistry.deleteCronJob(`reminder_${logId}_${i}`); } catch {}
    });
  }

  
  private getFirstDoseTime(startDate: string, reminderTime: string): Date {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const date = new Date(startDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private getNextDoseTime(
    from: Date,
    repeat: string,
    repeatEveryHours?: number,
    reminderTime?: string,
  ): Date {
    const next = new Date(from);

    switch (repeat) {
      case RepeatType.EVERY_X_HOURS:
        next.setHours(next.getHours() + (repeatEveryHours || 8));
        break;
      case RepeatType.DAILY:
        next.setDate(next.getDate() + 1);
        if (reminderTime) {
          const [h, m] = reminderTime.split(':').map(Number);
          next.setHours(h, m, 0, 0);
        }
        break;
      case RepeatType.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RepeatType.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }
  async getPendingLogs(user: UserDocument) {
  const logs = await this.logModel
    .find({
      patientId: user._id,
      status: MedicationStatus.PENDING,
    })
    .sort({ scheduledTime: 1 })
    .lean();

  return { message: 'done', total: logs.length, data: logs };
}
async scanAndSave(user: UserDocument, file: Express.Multer.File) {
  if (!file) throw new BadRequestException('Image is required');

  const medicineName = await this.aiMedicineService.getMedicineNameFromImage(file);
  console.log('Detected medicine name:', medicineName);

  const medicineDetails = await this.aiMedicineGroqService.getMedicineData(medicineName);

  let medicine = await this.medicineModel.findOne({
    medicationName: { $regex: `^${medicineName}$`, $options: 'i' },
  });

  if (!medicine?.userId.equals(user._id)) {
    medicine = await this.medicineModel.create({
    userId: user._id,
     medicationName: medicineDetails.medicationName || medicineName,
      dosage: medicineDetails.dosage || 'Not specified',
      repeat: RepeatType.DAILY,           
      reminderTime: '08:00',              
      sideEffects: medicineDetails.sideEffects || [],
      warningLevel: 'safe',               
      activeIngredient: medicineDetails.activeIngredient || '',
      category: medicineDetails.category || '',
      contraindications: medicineDetails.contraindications || [],
      interactions: medicineDetails.interactions || [],
      instructions: medicineDetails.instructions || '',
    });
  }

  return {
    message: 'Done',
    detectedName: medicineName,
    medicine,
  };
}
async checkInteraction(user: UserDocument, medicineName: string) {
  const patient = await this.patientRepository.findOne({ filter: { userId: user._id } });
  if (!patient) throw new NotFoundException('Patient not found');

  const currentMeds = patient.medications
    ?.filter((m) => m.active)
    .map((m) => m.medicationName) || [];

  const result = await this.aiMedicineGroqService.checkDrugInteractions(
    medicineName,
    currentMeds,
  );

  return {
    message: 'done',
    checkedDrug: medicineName,
    currentMedications: currentMeds,
    result,
  };
}
async removeMedication(user: UserDocument, medicineId: string) {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new BadRequestException('Invalid medicineId');
  }

  const patient = await this.patientRepository.findOne({ filter: { userId: user._id } });
  if (!patient) throw new NotFoundException('Patient not found');

  const exists = patient.medications?.some(
    (m) => m.medicineId?.toString() === medicineId,
  );
  if (!exists) throw new NotFoundException('Medicine not found in your medications');
  
  
  await this.patientRepository.updateOne({
    filter: { userId: user._id },
    data: {
      $pull: {
        medications: { medicineId: new mongoose.Types.ObjectId(medicineId) },
      },
    },
  });

  
  await this.logModel.deleteMany({
    patientId: user._id,
    medicineId: new mongoose.Types.ObjectId(medicineId),
    status: MedicationStatus.PENDING,
  });
await this.medicineModel.deleteOne({
  userId: patient.userId,
})
  
  this.clearReminderByMedicineId(medicineId);

  return { message: 'Medicine removed successfully' };
}

private clearReminderByMedicineId(medicineId: string) {
  
  const attempts = [1, 2, 3];
  this.logModel
    .find({ medicineId: new mongoose.Types.ObjectId(medicineId), status: MedicationStatus.PENDING })
    .then((logs) => {
      logs.forEach((log) => {
        attempts.forEach((i) => {
          try {
            this.schedulerRegistry.deleteCronJob(`reminder_${log._id}_${i}`);
          } catch {}
        });
      });
    });
}
}