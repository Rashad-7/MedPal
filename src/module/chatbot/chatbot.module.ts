
import { Module } from '@nestjs/common';
import { ChatBotController } from './chatbot.controller';
import { ChatBotService } from './chatbot.service';
import { PatientModel } from 'src/DB/model/patient.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { ChatSessionModel } from 'src/DB/model/ChatSession.model';
import { ChatSessionRepositoryService } from 'src/DB/repository/chatSession.repository.service';
import { UserModel } from 'src/DB/model/User.model';

@Module({
  imports: [PatientModel,ChatSessionModel,UserModel],
  controllers: [ChatBotController],
  providers: [ChatBotService, PatientRepositoryService, ChatSessionRepositoryService],
})
export class ChatBotModule {}