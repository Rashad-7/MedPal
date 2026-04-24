// src/module/sos/sos.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SOSDocument } from 'src/DB/model/SOS.model';
import { SOSRepositoryService } from 'src/DB/repository/sos.repository.service';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { UserDocument } from 'src/DB/model/User.model';
import { CreateSOSDto } from './dto/sos.dto';
import mongoose from 'mongoose';

@Injectable()
export class SOSService {
  constructor(
    private readonly sosRepository: SOSRepositoryService<SOSDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
  ) {}

  // ============ المريض يبعت SOS ============
  async createSOS(user: UserDocument, body: CreateSOSDto) {
    const { doctorId, updateType, severity, details } = body;

    // تأكد إن الدكتور في قائمة المريض
    const patient = await this.patientRepository.findOne({
      filter: { userId: user._id },
    });

    if (!patient) throw new NotFoundException('Patient not found');

    const isMyDoctor = patient.doctors?.some(
      (d) => d.toString() === doctorId.toString(),
    );

    if (!isMyDoctor) throw new ForbiddenException('هذا الدكتور مش في قائمتك');

    const sos = await this.sosRepository.create({
      patientId: user._id,
      doctorId,
      updateType,
      severity,
      details,
      isResolved: false,
    });

    return { message: 'SOS sent successfully', data: sos };
  }

  // ============ الدكتور يشوف الـ SOS بتوعه ============
  async getDoctorSOS(user: UserDocument, isResolved?: string) {
    const filter: any = { doctorId: user._id };

    if (isResolved !== undefined) {
      filter.isResolved = isResolved === 'true';
    }

    const sosList = await this.sosRepository.find({
      filter,
      populate: [
        {
          path: 'patientId',
          select: 'fullName email phone',
        },
      ],
    });

    // رتب بالـ severity — critical الأول
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = sosList.sort(
      (a: any, b: any) =>
        severityOrder[a.severity] - severityOrder[b.severity],
    );

    return { message: 'done', total: sorted.length, data: sorted };
  }

  // ============ الدكتور يعمل resolve ============
  async resolveSOS(sosId: string, user: UserDocument) {
    const sos = await this.sosRepository.findOne({
      filter: {
        _id: new mongoose.Types.ObjectId(sosId),
        doctorId: user._id,
      },
    });

    if (!sos) throw new NotFoundException('SOS not found');
    if ((sos as any).isResolved) throw new NotFoundException('SOS already resolved');

    await this.sosRepository.updateOne({
      filter: { _id: new mongoose.Types.ObjectId(sosId) },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    return { message: 'SOS resolved successfully' };
  }

  // ============ المريض يشوف الـ SOS بتوعه ============
  async getPatientSOS(user: UserDocument) {
    const sosList = await this.sosRepository.find({
      filter: { patientId: user._id },
      populate: [
        {
          path: 'doctorId',
          select: 'fullName email',
        },
      ],
    });

    return { message: 'done', total: sosList.length, data: sosList };
  }
}