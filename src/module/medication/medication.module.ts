// src/module/medication/medication.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicationService } from './medication.service';
import { MedicationController } from './medication.controller';
import { Medicine, MedicineSchema } from 'src/DB/model/Medication.model';
import { MedicationLog, MedicationLogSchema } from 'src/DB/model/MedicationLog.model';
import { PatientModel } from 'src/DB/model/patient.model';
import { UserModel } from 'src/DB/model/User.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { CloudService } from 'src/common/multer/cloud.service';
import { NotificationService } from 'src/common/service/notification.service';
import { AIMedicineService } from 'src/common/service/aiMedicine.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Medicine.name, schema: MedicineSchema },
      { name: MedicationLog.name, schema: MedicationLogSchema },
    ]),
    PatientModel,
    UserModel,
  ],
  controllers: [MedicationController],
  providers: [
    MedicationService,
    PatientRepositoryService,
    CloudService,
    NotificationService,
    AIMedicineService,
  ],
  exports: [MedicationService], // عشان الـ AI Chat يستخدمه
})
export class MedicationModule {}