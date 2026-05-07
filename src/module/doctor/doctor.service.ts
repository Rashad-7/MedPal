import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DoctorDocument } from 'src/DB/model/doctor.model';
import { UserDocument } from 'src/DB/model/User.model';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { UpdateRequestStatusDto } from './dto/doctor.dto';
import { RequestStatus, RequestDocument } from 'src/DB/model/Req.model';
import { ReqRepositoryService } from 'src/DB/repository/req.repository.service';
import mongoose, { Types } from 'mongoose';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { MedicationLogDocument } from 'src/DB/model/MedicationLog.model';
import { MedicationLogRepositoryService } from 'src/DB/repository/medicationLog.repository.service';

@Injectable()
export class DoctorService {
constructor(
        private readonly userRepository:UserRepositoryService<UserDocument>,
         private readonly doctorRepository:DoctorRepositoryService<DoctorDocument>,
         private readonly reqRepository:ReqRepositoryService<RequestDocument>,
         private readonly patientRepository:PatientRepositoryService<PatientDocument>,
         private readonly medicationLogRepository: MedicationLogRepositoryService<MedicationLogDocument>
){   
}
      async profile(user:UserDocument){
       const doctor=await this.doctorRepository.findOne({filter:{userId:user._id}})
        return ({message:"done",data:{user,doctor}})
       }
    async acceptRequest(
  requestId: mongoose.Types.ObjectId,
  user: UserDocument,
): Promise<UpdateRequestStatusDto> {
  const request = await this.reqRepository.findOne({ filter:{_id:requestId}});
  if (!request) {
    throw new NotFoundException('Request not found');
  }
if (request.receiverId.toString() !== user._id.toString()){
  throw new BadRequestException('Only receiver can accept request');
}
  if (request.status !== RequestStatus.PENDING) {
    throw new BadRequestException('Request is already processed');
  }
 
  request.status = RequestStatus.ACCEPTED;
  await request.save();

  const doctor = await this.doctorRepository.findOne({
    filter: { userId: new mongoose.Types.ObjectId(request.receiverId) }
  });

  if (!doctor) {
    throw new NotFoundException('Doctor not found');
  }

if (!doctor) {
  throw new NotFoundException('Doctor not found');
}
  const patinet = await this.patientRepository.findOne({
    filter: { userId: new mongoose.Types.ObjectId(request.senderId) }
  });

const patientId = patinet!.userId;

  // Add patient to doctor's patients list
  await this.doctorRepository.updateOne({
    filter: { _id: doctor._id },
    data: { $addToSet: { patients: request.senderId } }  // senderId = patient userId
  });
   const patient = await this.patientRepository.findOne({
    filter: { userId: new mongoose.Types.ObjectId(request.senderId) }
  });

  if (!patient) {
    throw new NotFoundException('Patient not found');
  }

  await this.patientRepository.updateOne({
    filter: { _id: patient._id },
    data: { $addToSet: { doctors:new mongoose.Types.ObjectId (request.receiverId) } }  // receiverId = doctor userId
  });
//   const result = await this.doctorRepository.updateOne({
//   filter: { _id: doctorId },
//   data: { $addToSet: { patients: patientId } }
// });
await this.reqRepository.deleteOne({
  filter: { _id: new mongoose.Types.ObjectId(requestId) }
});
  return { status: RequestStatus.ACCEPTED };
}
 
async rejectRequest(
  requestId: any,
  userId: any,
): Promise<UpdateRequestStatusDto> {
  const request = await this.reqRepository.findById({ id: requestId });

  if (!request) {
    throw new NotFoundException('Request not found');
  }

  // Compare ObjectIds directly
  if (!request.receiverId==userId) {
    throw new BadRequestException('Only receiver can reject request');
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new BadRequestException('Request is already processed');
  }

  await this.reqRepository.updateOne({
    filter: { _id: new Types.ObjectId(requestId) },
    data: { status: RequestStatus.REJECTED }
  });
await this.reqRepository.deleteOne({
  filter: { _id: new Types.ObjectId(requestId) }
});
  return { status: RequestStatus.REJECTED };
}
 async getMyRequests(user: UserDocument) {
  const requests = await this.reqRepository.find({
    filter: { receiverId: user._id },
  populate: [
  { path: 'senderId', select: '_id fullName email phone' }
]
  });
  return { message: 'done', data: requests };
}
async getPatient(patientUserId: string, user: UserDocument) {
  // تأكد إن المريض ده فعلاً في قائمة الدكتور
  const doctor = await this.doctorRepository.findOne({
    filter: { userId: user._id },
  });

  if (!doctor) throw new NotFoundException('Doctor not found');

  const isMyPatient = doctor.patients?.some(
    (p) => p.toString() === patientUserId,
  );

  // if (!isMyPatient) throw new ForbiddenException('This patient is not under your care');
  const patient = await this.patientRepository.findOne({
    filter: { userId: new mongoose.Types.ObjectId(patientUserId) },
    populate: [
      {
        path: 'userId',
        select: 'fullName email phone address DOB gender image',
      },
    ],
  });

  if (!patient) throw new NotFoundException('Patient not found');

  return { message: 'done', data: patient };
}
async getMyPatients(user: UserDocument) {
  
  const doctor = await this.doctorRepository.findOne({
    filter: { userId: user._id },
  });

  if (!doctor) throw new NotFoundException('Doctor not found');
  const patients = await this.patientRepository.find({
    filter: { userId: { $in: doctor.patients || [] } },
    populate: [
      { path: 'userId', select: 'fullName email phone address  DOB gender image' },
    ],
  });

  return { message: 'done', total: patients.length || 0, data: patients };
}
async getPatientsReport(
  user: UserDocument,
  patientId?: mongoose.Types.ObjectId,
) {
  const doctor = await this.doctorRepository.findOne({
    filter: { userId: user._id },
  });

  if (!doctor) {
    throw new NotFoundException('Doctor not found');
  }

  // فلتر المرضى
  const filter: any = {
    userId: { $in: doctor.patients || [] },
  };

  // لو بعت patientId هيرجع مريض واحد
  if (patientId) {
    filter.userId = patientId;
  }

  // جيب المرضى
  const patients = await this.patientRepository.find({
    filter,
    populate: [
      {
        path: 'userId',
        select: 'fullName email phone DOB gender image',
      },
    ],
  });

  if (!patients.length) {
    throw new NotFoundException('No patients found');
  }

  // =========================
  // احسب الإحصائيات
  // =========================
  const patientsWithStats = await Promise.all(
    patients.map(async (patient: any) => {
      const activeMeds =
        patient.medications?.filter((m: any) => m.active) || [];

      const severeMeds = activeMeds.filter((m: any) =>
        ['severe', 'moderate'].includes(m.warningLevel),
      );

      const chronicCount =
        patient.chronicDiseases?.length || 0;

      // =========================
      // missed doses لكل دواء
      // =========================
      const medicationStats = await Promise.all(
        activeMeds.map(async (med: any) => {
        const missedLogs =
  await this.medicationLogRepository.find({
    filter: {
      patientId: patient.userId._id,
      medicineId: med._id,
      status: 'missed',
    },
  });

const missedCount = missedLogs.length;
          return {
            medicineId: med._id,
            medicineName: med.name,
            missedDoses: missedCount,
          };
        }),
      );

      // إجمالي الجرعات الفائتة
      const missedDoses = medicationStats.reduce(
        (sum, med) => sum + med.missedDoses,
        0,
      );

      // =========================
      // الحالة الصحية
      // =========================
      let healthStatus = 'stable';

      if (
        severeMeds.length > 0 ||
        chronicCount >= 3 ||
        missedDoses >= 5
      ) {
        healthStatus = 'critical';
      } else if (
        chronicCount >= 1 ||
        activeMeds.length >= 3 ||
        missedDoses > 0
      ) {
        healthStatus = 'moderate';
      }

      return {
        patientInfo: patient.userId,

        bloodType: patient.bloodType,
        height: patient.height,
        weight: patient.weight,

        allergies: patient.allergies,

        chronicDiseases:
          patient.chronicDiseases || [],

        activeMedications: activeMeds,

        medicationStats,

        stats: {
          totalMedications: activeMeds.length,

          warningMedications: severeMeds.length,

          chronicDiseases: chronicCount,

          missedDoses,

          healthStatus,
        },
      };
    }),
  );

  // =========================
  // Summary
  // =========================
  const summary = {
    totalPatients: patientsWithStats.length,

    criticalPatients: patientsWithStats.filter(
      (p) => p.stats.healthStatus === 'critical',
    ).length,

    moderatePatients: patientsWithStats.filter(
      (p) => p.stats.healthStatus === 'moderate',
    ).length,

    stablePatients: patientsWithStats.filter(
      (p) => p.stats.healthStatus === 'stable',
    ).length,

    totalActiveMedications:
      patientsWithStats.reduce(
        (sum, p) =>
          sum + p.stats.totalMedications,
        0,
      ),

    patientsWithWarningMeds:
      patientsWithStats.filter(
        (p) =>
          p.stats.warningMedications > 0,
      ).length,

    totalMissedDoses:
      patientsWithStats.reduce(
        (sum, p) =>
          sum + p.stats.missedDoses,
        0,
      ),
  };

  return {
    message: 'done',
    summary,
    data: patientId
      ? patientsWithStats[0]
      : patientsWithStats,
  };
}
}
