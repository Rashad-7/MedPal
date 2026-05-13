
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export enum SOSUpdateType {
  FALL = 'fall',
  CHEST_PAIN = 'chest_pain',
  BREATHING = 'breathing',
  UNCONSCIOUS = 'unconscious',
  OTHER = 'other',
}

export enum SOSSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
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

  @Prop({ type: String, enum: SOSSeverity, required: true })
  severity: SOSSeverity;
  @Prop({ type: Boolean, default: false })
  isResolved: boolean;

  @Prop({ type: Date })
  resolvedAt?: Date;
}

export type SOSDocument = HydratedDocument<SOS>;
export const SOSSchema = SchemaFactory.createForClass(SOS);

export const SOSModel = MongooseModule.forFeatureAsync([
  {
    name: SOS.name,
    useFactory: () => SOSSchema,
  },
]);