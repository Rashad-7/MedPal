// src/DB/model/Medication.model.ts
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum WarningLevel {
  SAFE = 'safe',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum RepeatType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  EVERY_X_HOURS = 'every_x_hours',
}

@Schema({ timestamps: true })
export class Medicine {
  @Prop({ type: String, required: true, trim: true, unique: true })
  medicationName: string;

  @Prop({ type: String, required: true })
  dosage: string; // مثلاً "500mg"

  @Prop({ type: String, enum: RepeatType, required: true })
  repeat: RepeatType; // daily | weekly | monthly | every_x_hours

  @Prop({ type: Number, required: false })
  repeatEveryHours?: number; 

  @Prop({ type: String, required: true })
  reminderTime: string;

  @Prop({ type: [String], default: [] })
  sideEffects: string[];

  @Prop({ type: String, enum: WarningLevel, default: WarningLevel.SAFE })
  warningLevel: WarningLevel;

  // بيانات إضافية للـ AI والتقرير
  @Prop({ type: String })
  activeIngredient?: string;

  @Prop({ type: String })
  category?: string;

  @Prop({ type: [String], default: [] })
  contraindications: string[];

  @Prop({ type: [String], default: [] })
  interactions: string[];

  @Prop({ type: String })
  instructions?: string;

  @Prop({ type: { secure_url: String, public_id: String }, required: false })
  image?: { secure_url: string; public_id: string };
}

export type MedicineDocument = HydratedDocument<Medicine>;
export const MedicineSchema = SchemaFactory.createForClass(Medicine);

export const MedicineModel = MongooseModule.forFeatureAsync([
  {
    name: Medicine.name,
    useFactory: () => MedicineSchema,
  },
]);