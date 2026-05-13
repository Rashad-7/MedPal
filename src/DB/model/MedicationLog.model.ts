
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export enum MedicationStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class MedicationLog {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  patientId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Medicine', required: true })
  medicineId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  medicineName: string;

  @Prop({ type: String, enum: MedicationStatus, default: MedicationStatus.PENDING })
  status: MedicationStatus;

  @Prop({ type: Number, default: 0 })
  attemptCount: number; 
  @Prop({ type: Date, required: true })
  scheduledTime: Date; 

  @Prop({ type: Date })
  takenAt?: Date; 
}

export type MedicationLogDocument = HydratedDocument<MedicationLog>;
export const MedicationLogSchema = SchemaFactory.createForClass(MedicationLog);

export const MedicationLogModel = MongooseModule.forFeatureAsync([
  {
    name: MedicationLog.name,
    useFactory: () => MedicationLogSchema,
  },
]);