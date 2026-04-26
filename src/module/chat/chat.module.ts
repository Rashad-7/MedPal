// src/module/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/DB/model/Chat.model';
import { PatientModel } from 'src/DB/model/patient.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { doctorModel } from 'src/DB/model/doctor.model';
import { CloudService } from 'src/common/multer/cloud.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    PatientModel,
    doctorModel,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    PatientRepositoryService,
    DoctorRepositoryService,
    CloudService,
  ],
})
export class ChatModule {}