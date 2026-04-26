// src/DB/model/Chat.model.ts
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO_CALL = 'video_call',
}

export enum CallStatus {
  INITIATED = 'initiated',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ENDED = 'ended',
  MISSED = 'missed',
}

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ type: String })
  message?: string;

  // للملفات والريكورد
  @Prop({
    type: {
      secure_url: String,
      public_id: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number, // للصوت بالثواني
    },
    required: false,
  })
  attachment?: {
    secure_url: string;
    public_id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    duration?: number;
  };

  // للمكالمات
  @Prop({ type: String, enum: CallStatus })
  callStatus?: CallStatus;

  @Prop({ type: Number })
  callDuration?: number; // بالثواني

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = HydratedDocument<Chat>;

export const ChatModel = MongooseModule.forFeatureAsync([
  { name: Chat.name, useFactory: () => ChatSchema },
]);