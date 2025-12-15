import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorDocument = Doctor & Document;

@Schema({ timestamps: true })
export class Doctor {
  @Prop({ type: String, required: true })
  specialization: string;

  @Prop({ type: String, required: true })
  qualification: string;

  @Prop({ type: Number, required: true })
  experienceYears: number;

  @Prop({ type: Number, required: true })
  rating: number;

  @Prop({ type: String, required: true })
  hospitalName: string;

  @Prop({ type: [String], required: true })
  patiants: string[];
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
export type DoctorModel = Doctor & Document;