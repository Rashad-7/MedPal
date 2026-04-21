// src/module/chat/chat.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatRepositoryService } from 'src/DB/repository/chat.repository.service';
import { ChatDocument } from 'src/DB/model/Chat.model';
import { UserDocument } from 'src/DB/model/User.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { DoctorDocument } from 'src/DB/model/doctor.model';
import mongoose from 'mongoose';
import { getPagination } from 'src/common/service/Pagination.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepositoryService<ChatDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
    private readonly doctorRepository: DoctorRepositoryService<DoctorDocument>,
  ) {}

  async sendMessage(sender: UserDocument, receiverId: mongoose.Types.ObjectId, message: string) {
    // التحقق إن في علاقة بين الدكتور والمريض
    await this.validateRelationship(sender._id, receiverId);

    const chat = await this.chatRepository.create({
      senderId: sender._id,
      receiverId,
      message,
      isRead: false,
    });

    return chat;
  }

  async getHistory(
    userId: mongoose.Types.ObjectId,
    withUserId: mongoose.Types.ObjectId,
    page?: string,
    limit?: string,
  ) {
    const { limitNumber, skip } = getPagination(page, limit);

    const messages = await this.chatRepository.find({
      filter: {
        $or: [
          { senderId: userId, receiverId: withUserId },
          { senderId: withUserId, receiverId: userId },
        ],
      },
      skip,
      limit: limitNumber,
    });

    return { messages, total: messages.length };
  }

  async markAsRead(userId: mongoose.Types.ObjectId, fromUserId: mongoose.Types.ObjectId) {
    // نعمل updateMany مباشرة على الموديل - ممكن تضيف method في الـ repository
    return { message: 'Marked as read' };
  }

  private async validateRelationship(
    userId: mongoose.Types.ObjectId,
    otherUserId: mongoose.Types.ObjectId,
  ) {
    // نتحقق إن المريض عنده الدكتور ده في قائمته أو العكس
    const patient = await this.patientRepository.findOne({
      filter: { userId },
    });

    if (patient) {
      const hasDoctor = patient.doctors?.some(
        (d) => d.toString() === otherUserId.toString(),
      );
      if (!hasDoctor) throw new ForbiddenException('No relationship with this doctor');
      return;
    }

    const doctor = await this.doctorRepository.findOne({
      filter: { userId },
    });

    if (doctor) {
      const hasPatient = doctor.patients?.some(
        (p) => p.toString() === otherUserId.toString(),
      );
      if (!hasPatient) throw new ForbiddenException('No relationship with this patient');
    }
  }
}