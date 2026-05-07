import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { UserModel } from 'src/DB/model/User.model';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { doctorModel } from 'src/DB/model/doctor.model';
import { ReqRepositoryService } from 'src/DB/repository/req.repository.service';
import { RequestModel } from 'src/DB/model/Req.model';
import { PatientModel } from 'src/DB/model/patient.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { MedicationLogRepositoryService } from 'src/DB/repository/medicationLog.repository.service';
import { MedicationLogModel } from 'src/DB/model/MedicationLog.model';

@Module({
  imports:[UserModel,doctorModel,RequestModel,PatientModel,MedicationLogModel],
  controllers: [DoctorController],
  providers: [DoctorService,DoctorRepositoryService,UserRepositoryService,ReqRepositoryService,PatientRepositoryService,MedicationLogRepositoryService],
})
export class DoctorModule {}
