import { PatientRepositoryService } from './../../DB/repository/patient.repository.service';
import { CloudService } from './../../common/multer/cloud.service';
import { RoleType, UserDocument } from 'src/DB/model/User.model';
import { UserRepositoryService } from './../../DB/repository/user.repository.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import mongoose, { Model, model } from 'mongoose';
import { UpdateProfileDto } from './udateProfile.dto';
import { GetDoctorsDto, SendRequestDto } from './dto/user.dto';
import { getPagination } from 'src/common/service/Pagination.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { Doctor, DoctorDocument, doctorModel } from 'src/DB/model/doctor.model';
import { ReqRepositoryService } from 'src/DB/repository/req.repository.service';
import { RequestDocument, RequestStatus } from 'src/DB/model/Req.model';
import { PatientDocument } from 'src/DB/model/patient.model';

@Injectable()
export class UserService {
  constructor(
    private readonly CloudService: CloudService,
    private readonly userRepository: UserRepositoryService<UserDocument>,
    private readonly doctorRepository: DoctorRepositoryService<DoctorDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
    private readonly reqRepository: ReqRepositoryService<RequestDocument>,

  ) {}
  profile(user: UserDocument) {
    return { message: 'done', data: { user } };
  }
  async updateImage(file: Express.Multer.File, user: UserDocument) {
    if (!file) throw new BadRequestException('Profile image is required');

    try {
      const folderId = String(Math.floor(100000 + Math.random() * 900000));
      const { secure_url, public_id } = await this.CloudService.uploadFile(
        file,
        {
          folder: `${process.env.APP_NAME}/users/${user._id}/profile/${folderId}`,
        },
      );

      user.image = { secure_url, public_id };
      await user.save();

      return { message: 'done', secure_url, public_id };
    } catch (err) {
      console.error('Error in updateImage:', err);
      throw new InternalServerErrorException(err!.message);
    }
  }
  async updateProfile(user: UserDocument, body: UpdateProfileDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        filter: { _id: new mongoose.Types.ObjectId(user._id) },
      });
      if (!existingUser) throw new NotFoundException('Invalid user');

      const updatedData: Partial<UserDocument> = { ...body };

      const updatedUser = await this.userRepository.updateOne({
        filter: { _id: new mongoose.Types.ObjectId(user._id) },
        data: { $set: updatedData },
      });

      return { message: 'done', user: updatedUser };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      throw new InternalServerErrorException(err!.message);
    }
  }
  async getDoctors(query: GetDoctorsDto) {
  const {
    specialization,
    address,
    fullName,
    experienceYears,
    page ,
    limit ,
    qualification,
    rate,
  } = query;

  const { limitNumber, skip } = getPagination(page, limit);

  const filter: any = {};

  if (specialization) filter.specialization = specialization;
  if (experienceYears) filter.experienceYears = { $gte: experienceYears };
  if (qualification) filter.qualification = qualification;
  if (rate) filter.rate = { $gte: rate };

  const doctors = await this.doctorRepository.find({
    filter,
    skip,
    limit: limitNumber,
    populate: [
      {
        path: "userId", 
        match: {
          ...(fullName && {
            fullName: { $regex: fullName, $options: "i" },
          }),
          ...(address && {
            address: { $regex: address, $options: "i" },
          }),
        },
        select: "fullName address email",
      },
    ],
  });

  const filteredDoctors = doctors.filter(doc => doc.userId);

  return filteredDoctors;
}
async sendRequest(senderId: mongoose.Types.ObjectId,param:SendRequestDto) {
  const {receiverId}=param
  if (senderId === receiverId) {
    throw new BadRequestException('You cannot send request to yourself');
  }

  // 🔥 check receiver is doctor using repository (same style)
  const receiver = await this.userRepository.findById({
    id: receiverId,
    select: 'role',
  });

  if (!receiver) {
    throw new NotFoundException('Receiver not found');
  }

  if (receiver.role !== RoleType.ADMIN) {
    throw new BadRequestException('You can only send requests to doctors');
  }

  // 🔥 check duplicate request using repository
  const exists = await this.reqRepository.find({
    filter: {
      senderId,
      receiverId,
      status: RequestStatus.PENDING,
    },
    limit: 1,
  });

  if (exists.length > 0) {
    throw new BadRequestException('Request already exists');
  }
  
// ✅ Check if doctor already exists
const patient = await this.patientRepository.findOne({
  filter: { userId: senderId }
});

  console.log('Patient:', patient);
  console.log('Patient doctors:', patient?.doctors);
  console.log('ReceiverID:', receiverId);
  console.log('ReceiverID type:', typeof receiverId);

if (patient && patient.doctors && patient.doctors.some(doc => doc.toString() === receiverId.toString())) {
  throw new BadRequestException('This doctor is already in your doctors list');
}
  return this.reqRepository.create({
    senderId,
    receiverId,
    status: RequestStatus.PENDING,
  });
}
}
