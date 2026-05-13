
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { Chat, ChatDocument, CallStatus, MessageType } from 'src/DB/model/Chat.model';
import { UserDocument } from 'src/DB/model/User.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { DoctorDocument } from 'src/DB/model/doctor.model';
import { CloudService } from 'src/common/multer/cloud.service';
import { getPagination } from 'src/common/service/Pagination.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
    private readonly doctorRepository: DoctorRepositoryService<DoctorDocument>,
    private readonly cloudService: CloudService,
  ) {}

  
  async sendMessage(
    sender: UserDocument,
    receiverId: mongoose.Types.ObjectId,
    message: string,
  ) {
    await this.validateRelationship(sender._id, receiverId);
    return this.chatModel.create({
      senderId: sender._id,
      receiverId,
      type: MessageType.TEXT,
      message,
      isRead: false,
    });
  }

  
  async uploadAttachment(
    sender: UserDocument,
    receiverId: mongoose.Types.ObjectId,
    file: Express.Multer.File,
    duration?: number,
  ) {
    await this.validateRelationship(sender._id, receiverId);

    const isAudio = file.mimetype.startsWith('audio/');
    const isVideo = file.mimetype.startsWith('video/');

    const resourceType = isAudio || isVideo ? 'video' : 'image';

    const { secure_url, public_id, bytes } = await this.cloudService.uploadFile(
      file,
      {
        folder: `${process.env.APP_NAME}/chat/${sender._id}`,
        resource_type: resourceType,
      },
    );

    const chat = await this.chatModel.create({
      senderId: sender._id,
      receiverId,
      type: isAudio ? MessageType.AUDIO : MessageType.FILE,
      attachment: {
        secure_url,
        public_id,
        fileName: file.originalname,
        fileSize: bytes || file.size,
        mimeType: file.mimetype,
        ...(isAudio && duration && { duration }),
      },
      isRead: false,
    });

    return chat;
  }

  
  async initiateCall(
    sender: UserDocument,
    receiverId: mongoose.Types.ObjectId,
  ) {
    await this.validateRelationship(sender._id, receiverId);

    const call = await this.chatModel.create({
      senderId: sender._id,
      receiverId,
      type: MessageType.VIDEO_CALL,
      callStatus: CallStatus.INITIATED,
      isRead: false,
    });

    return call;
  }

  
  async updateCallStatus(
    callId: string,
    status: CallStatus,
    duration?: number,
  ) {
    const update: any = { callStatus: status };
    if (duration) update.callDuration = duration;

    return this.chatModel.findByIdAndUpdate(
      callId,
      { $set: update },
      { new: true },
    );
  }

  
  async getHistory(
    userId: mongoose.Types.ObjectId,
    withUserId: mongoose.Types.ObjectId,
    page?: string,
    limit?: string,
  ) {
    const { limitNumber, skip } = getPagination(page, limit);

    const messages = await this.chatModel
      .find({
        $or: [
          { senderId: userId, receiverId: withUserId },
          { senderId: withUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    return { messages, total: messages.length };
  }

  
  private async validateRelationship(
    userId: mongoose.Types.ObjectId,
    otherUserId: mongoose.Types.ObjectId,
  ) {
    const patient = await this.patientRepository.findOne({ filter: { userId } });

    if (patient) {
      const hasDoctor = patient.doctors?.some(
        (d) => d.toString() === otherUserId.toString(),
      );
      if (!hasDoctor) throw new ForbiddenException("You can only chat with your doctor");
      return;
    }

    const doctor = await this.doctorRepository.findOne({ filter: { userId } });
    if (doctor) {
      const hasPatient = doctor.patients?.some(
        (p) => p.toString() === otherUserId.toString(),
      );
      if (!hasPatient) throw new ForbiddenException("You can only chat with your doctor");
    }
  }
}