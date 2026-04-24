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

@Injectable()
export class DoctorService {
constructor(
        private readonly userRepository:UserRepositoryService<UserDocument>,
         private readonly doctorRepository:DoctorRepositoryService<DoctorDocument>,
         private readonly reqRepository:ReqRepositoryService<RequestDocument>,
         private readonly patientRepository:PatientRepositoryService<PatientDocument>
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
if (request.receiverId!=user._id) {
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
   populate: [{ path: 'senderId', select: 'fullName email phone' }],
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
}
