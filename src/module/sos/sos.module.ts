// src/module/sos/sos.module.ts
import { Module } from '@nestjs/common';
import { SOSService } from './sos.service';
import { SOSController } from './sos.controller';
import { SOSModel } from 'src/DB/model/SOS.model';
import { SOSRepositoryService } from 'src/DB/repository/sos.repository.service';
import { PatientModel } from 'src/DB/model/patient.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';

@Module({
  imports: [SOSModel, PatientModel],
  controllers: [SOSController],
  providers: [SOSService, SOSRepositoryService, PatientRepositoryService],
})
export class SOSModule {}