import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { UserDocument, UserModel } from 'src/DB/model/User.model';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import mongoose from 'mongoose';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';

@Injectable()
export class PatientService {
    constructor(private readonly patientRepositoryService: PatientRepositoryService<PatientDocument>) {}
     async updateProfile(
    user: UserDocument,
    body: UpdateProfileDto,
   
  ) {
    try {
    const patient = await this.patientRepositoryService.findOne({ filter: { userId: user._id }  });
    if (!patient) throw new NotFoundException('Invalid user');
    const updatedData: any = { ...body };
      const updatedUser = await this.patientRepositoryService.updateOne(
        { filter: { userId: user._id },data: { $set: updatedData }  }

      );

      return { message: "done", user: updatedUser };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      throw new InternalServerErrorException(err.message);
    }
  }
}