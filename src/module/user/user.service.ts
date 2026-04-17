import { CloudService } from './../../common/multer/cloud.service';
import { UserDocument } from 'src/DB/model/User.model';
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
import { GetDoctorsDto } from './dto/user.dto';
import { getPagination } from 'src/common/service/Pagination.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { Doctor, DoctorDocument, doctorModel } from 'src/DB/model/doctor.model';

@Injectable()
export class UserService {
  constructor(
    private readonly CloudService: CloudService,
    private readonly userRepository: UserRepositoryService<UserDocument>,
    private readonly doctorRepository: DoctorRepositoryService<DoctorDocument>,
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
}
