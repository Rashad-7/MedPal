import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PatientModel } from 'src/DB/model/patient.model';
import { UserModel } from 'src/DB/model/User.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { ReqRepositoryService } from 'src/DB/repository/req.repository.service';
import { RequestModel } from 'src/DB/model/Req.model';

@Module({
  imports: [PatientModel,UserModel,RequestModel],
  controllers: [PatientController],
  providers: [PatientService,PatientRepositoryService,ReqRepositoryService],
})
export class PatientModule {}
