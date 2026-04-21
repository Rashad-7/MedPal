// src/module/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';

import { ChatGateway } from './chat.gateway';
import { ChatRepositoryService } from 'src/DB/repository/chat.repository.service';
import { ChatModel } from 'src/DB/model/Chat.model';
import { PatientModel } from 'src/DB/model/patient.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { doctorModel } from 'src/DB/model/doctor.model';
import { ChatController } from './chat.controller';

@Module({
  imports: [ChatModel, PatientModel, doctorModel],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ChatRepositoryService,
    PatientRepositoryService,
    DoctorRepositoryService,
  ],
})
export class ChatModule {}