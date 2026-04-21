// src/DB/model/Chat.model.ts
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = HydratedDocument<Chat>;

export const ChatModel = MongooseModule.forFeatureAsync([
  {
    name: Chat.name,
    useFactory: () => ChatSchema,
  },
]);