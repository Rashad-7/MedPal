import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PatientModel } from 'src/DB/model/patient.model';
import { UserModel } from 'src/DB/model/User.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';

@Module({
  imports: [PatientModel,UserModel],
  controllers: [PatientController],
  providers: [PatientService,PatientRepositoryService],
})
export class PatientModule {}
