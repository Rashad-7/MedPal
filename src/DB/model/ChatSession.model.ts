
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: [{ role: String, content: String, createdAt: Date }],
    default: [],
  })
  history: { role: 'user' | 'assistant'; content: string; createdAt: Date }[];
}

export type ChatSessionDocument = HydratedDocument<ChatSession>;
export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

export const ChatSessionModel = MongooseModule.forFeatureAsync([
  { name: ChatSession.name, useFactory: () => ChatSessionSchema },
]);