// src/module/medication/medication.module.ts
import { Module } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { MedicationController } from './medication.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Medicine, MedicineSchema } from 'src/DB/model/Medication.model';
import { MedicationLog, MedicationLogSchema } from 'src/DB/model/MedicationLog.model';
import { PatientModel } from 'src/DB/model/patient.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { CloudService } from 'src/common/multer/cloud.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Medicine.name, schema: MedicineSchema },
      { name: MedicationLog.name, schema: MedicationLogSchema },
    ]),
    PatientModel,
  ],
  controllers: [MedicationController],
  providers: [MedicationService, PatientRepositoryService, CloudService],
})
export class MedicationModule {}