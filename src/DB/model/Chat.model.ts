import  { Prop, Schema,SchemaFactory, } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String })
  response: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = HydratedDocument <Chat>
