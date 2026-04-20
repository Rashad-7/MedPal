import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document, HydratedDocument } from 'mongoose';
export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Request {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: String, enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;
}
export const RequestSchema = SchemaFactory.createForClass(Request);
export type RequestDocument = HydratedDocument<Request>;
export const RequestModel = MongooseModule.forFeatureAsync([
  {
    name: Request.name,
    useFactory: () => {
      return RequestSchema;
    },
  },
]);