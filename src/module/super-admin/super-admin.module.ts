
import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { UserModel } from 'src/DB/model/User.model';
import { doctorModel } from 'src/DB/model/doctor.model';
import { PatientModel } from 'src/DB/model/patient.model';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { SOSRepositoryService } from 'src/DB/repository/sos.repository.service';
import { SOSModel } from 'src/DB/model/SOS.model';
import { RequestModel } from 'src/DB/model/Req.model';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicationLog, MedicationLogSchema } from 'src/DB/model/MedicationLog.model';

@Module({
  imports: [UserModel, doctorModel, PatientModel,SOSModel,   RequestModel,
    MongooseModule.forFeature([
      { name: MedicationLog.name, schema: MedicationLogSchema },
    ]),],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, DoctorRepositoryService, PatientRepositoryService,SOSRepositoryService
    
  ],
})
export class SuperAdminModule {}