import { MongooseModule, Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, HydratedDocument, mongo } from 'mongoose';
import type { IChronicDiseases } from 'src/module/report/interface/chronicDiseases.interface';
import type { IHealthReport } from 'src/module/report/interface/report.interface';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ type: mongoose.Types.ObjectId, required: true, unique: true,ref:'User' })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: Date, required: false })
  Reminder: Date;

  @Prop({
    type: {
      medications: [String],
      diagnosis: String,
      note: String,
      lastUpdate: Date,
    },
    ref: 'Report',
    required: false,
  })
  healthReport: IHealthReport;

  @Prop({ type: [String], required: false })
  medications: string[];

  @Prop({ type: String, required: true })
  bloodType: string;

  @Prop({ type: String, required: false })
  allergies: string;

  @Prop({
  type: [
    {
      name: String,
      diagnosisDate: Date,
      medications: [String],
      status: {
        type: String,
        enum: ['stable', 'critical', 'under control'],
      },
      notes: String,
    }
  ],
  required: false,
})
chronicDiseases: IChronicDiseases[];

}

export const PatientSchema = SchemaFactory.createForClass(Patient);
export const PatientModel = MongooseModule.forFeatureAsync([
  {
    name: Patient.name,
    useFactory: () => {
      return PatientSchema;
    },
  },
]);
