

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModel } from 'src/DB/model/User.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientModel } from 'src/DB/model/patient.model';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { doctorModel } from 'src/DB/model/doctor.model';
import { CloudService } from 'src/common/multer/cloud.service';
@Module({
    imports:[UserModel,PatientModel,doctorModel],
controllers:[AuthController],
providers:[AuthService,PatientRepositoryService,DoctorRepositoryService,CloudService],

})
export class AuthModule {}
