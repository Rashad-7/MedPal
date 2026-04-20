import { MongooseModule, Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import type { IAttachment } from 'src/common/multer/cloud.service';

export type DoctorDocument = Doctor & Document;

@Schema({ timestamps: true })
export class Doctor {
   @Prop({ type: mongoose.Types.ObjectId, required: true, unique: true,ref:'User' })
    userId: mongoose.Types.ObjectId;
  @Prop({ type: String, required: true })
  specialization: string;

  @Prop({ type: String, required: true })
  qualification: string;

  @Prop({ type: Number, required: true })
  experienceYears: number;
  @Prop({ type: Number, required: true })
  licenseNumbers: number;
  @Prop({ type: Number, required: false })
  rating?: number;
    @Prop({ type: Boolean, required: true,default:false })
  isVerified?: boolean
  @Prop({ type: String, required: false })
  clinicLocation?: string;
  @Prop(
    raw({
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    }),
  )
  proofDocument: IAttachment;
  @Prop({ type: [mongoose.Types.ObjectId], ref: 'User', required: false, default: [] })
  patients?: mongoose.Types.ObjectId[];
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
export const doctorModel = MongooseModule.forFeatureAsync([
  {
    name: Doctor.name,
    useFactory: () => {
      return DoctorSchema;
    },
  },
]);
