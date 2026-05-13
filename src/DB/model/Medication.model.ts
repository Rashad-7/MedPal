
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';








export enum RepeatType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  EVERY_X_HOURS = 'every_x_hours',
}

@Schema({ timestamps: true })
export class Medicine {
    @Prop({ type: mongoose.Types.ObjectId, required: true, unique: true,ref:'User' })
    userId: mongoose.Types.ObjectId;
  @Prop({ type: String, required: true, trim: true})
  medicationName: string;

  @Prop({ type: String, required: true })
  dosage: string; 

  @Prop({ type: String, enum: RepeatType, required: true })
  repeat: RepeatType; 

  @Prop({ type: Number, required: false })
  repeatEveryHours?: number; 

  @Prop({ type: String, required: true })
  reminderTime: string;

  @Prop({ type: [String], default: [] })
  sideEffects: string[];

  @Prop({ type: String, required: false })
  warningLevel: string;

  
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