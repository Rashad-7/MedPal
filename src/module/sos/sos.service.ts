// src/module/sos/sos.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SOSDocument, SOSUpdateType } from 'src/DB/model/SOS.model';
import { SOSRepositoryService } from 'src/DB/repository/sos.repository.service';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { UserDocument } from 'src/DB/model/User.model';
import mongoose from 'mongoose';
import { CreateSOSDto } from './dto/sos.dto';

@Injectable()
export class SOSService {
  constructor(
    private readonly sosRepository: SOSRepositoryService<SOSDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
  ) {}

  async createSOS(user: UserDocument, body: CreateSOSDto) {
    const { doctorId, updateType, details } = body;

    // تأكد إن الدكتور ده فعلاً دكتور المريض
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
      doctorId: new mongoose.Types.ObjectId(doctorId),
      updateType,
      details,
      isResolved: false,
    });

    return { message: 'SOS sent', data: sos };
  }

  // الدكتور يشوف الـ SOS بتوعه
  async getDoctorSOS(user: UserDocument) {
    const sosList = await this.sosRepository.find({
      filter: { doctorId:new mongoose.Types.ObjectId(user._id), isResolved: false },
      populate: [
        {
          path: 'patientId',
          select: 'fullName email phone',
        },
      ],
    });

    return { message: 'done', total: sosList.length, data: sosList };
  }

  // الدكتور يعمل resolve للـ SOS
  async resolveSOS(sosId: string, user: UserDocument) {
    const sos = await this.sosRepository.findOne({
      filter: {
        _id: new mongoose.Types.ObjectId(sosId),
        doctorId: user._id,
      },
    });

    if (!sos) throw new NotFoundException('SOS not found');

    await this.sosRepository.updateOne({
      filter: { _id: new mongoose.Types.ObjectId(sosId) },
      data: { isResolved: true },
    });

    return { message: 'SOS resolved' };
  }
}