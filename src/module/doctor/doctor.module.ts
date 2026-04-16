import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { UserModel } from 'src/DB/model/User.model';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { doctorModel } from 'src/DB/model/doctor.model';

@Module({
  imports:[UserModel,doctorModel],
  controllers: [DoctorController],
  providers: [DoctorService,DoctorRepositoryService,UserRepositoryService],
})
export class DoctorModule {}
