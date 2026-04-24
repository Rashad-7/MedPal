// src/DB/model/SOS.model.ts
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export enum SOSUpdateType {
  EMERGENCY = 'emergency',
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

@Schema({ timestamps: true })
export class SOS {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  patientId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  doctorId: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: SOSUpdateType, required: true })
  updateType: SOSUpdateType;

  @Prop({ type: String, required: true })
  details: string;

  @Prop({ type: Boolean, default: false })
  isResolved: boolean;
}

export type SOSDocument = HydratedDocument<SOS>;
export const SOSSchema = SchemaFactory.createForClass(SOS);

export const SOSModel = MongooseModule.forFeatureAsync([
  {
    name: SOS.name,
    useFactory: () => SOSSchema,
  },
]);