import { ReqRepositoryService } from './../../DB/repository/req.repository.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { UserDocument, UserModel } from 'src/DB/model/User.model';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import mongoose from 'mongoose';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { RequestDocument } from 'src/DB/model/Req.model';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { DoctorDocument } from 'src/DB/model/doctor.model';

@Injectable()
export class PatientService {
  constructor(
    private readonly patientRepositoryService: PatientRepositoryService<PatientDocument>,
             private readonly reqRepository:ReqRepositoryService<RequestDocument>,
             private readonly doctorRepositoryService:DoctorRepositoryService<DoctorDocument>
    
  ) {}
  async updateProfile(user: UserDocument, body: UpdateProfileDto) {
    try {
      const patient = await this.patientRepositoryService.findOne({
        filter: { userId: user._id },
      });
      if (!patient) throw new NotFoundException('Invalid user');
      const updatedData: any = { ...body };
      const updatedUser = await this.patientRepositoryService.updateOne({
        filter: { userId: user._id },
        data: { $set: updatedData },
      });

      return { message: 'done', patient };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      throw new InternalServerErrorException(err.message);
    }
  }
  async getMyRequests(user: UserDocument) {
    const requests = await this.reqRepository.find({
      filter: { senderId: user._id },
      populate: [
        {
          path: 'receiverId',
          select: 'fullName email',
        },
      ],
    });

    return { message: 'done', total: requests.length, data: requests };
  }
    // ============ Get Patient Profile ============
  async getMyProfile(user: UserDocument) {
    const patient = await this.patientRepositoryService.findOne({
      filter: { userId: user._id },
      populate: [
        {
          path: 'userId',
          select: 'fullName email phone address DOB gender image',
        },
      ],
    });

    if (!patient) throw new NotFoundException('Patient profile not found');

    return { message: 'done', data: patient };
  }
async getMyDoctors(user: UserDocument) {
  const patient = await this.patientRepositoryService.findOne({
    filter: { userId: user._id },
  });

  if (!patient) throw new NotFoundException('Patient not found');

  const doctors = await this.doctorRepositoryService.find({
    filter: { userId: { $in: patient.doctors || [] } },
    populate: [
      {
        path: 'userId',
        select: '-password -confirmEmailOTP -forgetPasswordOtp -changeCredentialTime -isVerified ',
      },
    ],
    select: '-createdAt -updatedAt',
  });

  return { message: 'done', total: doctors.length, data: doctors };
}
}
