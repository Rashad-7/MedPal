import { MongooseModule, Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, HydratedDocument, mongo } from 'mongoose';
import { DiseaseStatus, type IChronicDiseases } from 'src/module/report/interface/chronicDiseases.interface';
import type { IHealthReport } from 'src/module/report/interface/report.interface';

export type PatientDocument = Patient & Document;
@Schema({ _id: false })
class HealthReport  implements IHealthReport{
  @Prop({ type: [String] }) medications: string[];
  @Prop({ type: String }) diagnosis: string;
  @Prop({ type: String }) note: string;
  @Prop({ type: Date }) lastUpdate: Date;
}
const HealthReportSchema = SchemaFactory.createForClass(HealthReport);
@Schema({ _id: false })
class ChronicDisease implements IChronicDiseases {
  @Prop({ type: String }) name: string;
  @Prop({ type: Date }) diagnosisDate: Date;
  @Prop({ type: [String] }) medications?: string[];
  @Prop({ type: String, enum: DiseaseStatus }) status: DiseaseStatus;
  @Prop({ type: String }) notes?: string;
  
}
const ChronicDiseaseSchema = SchemaFactory.createForClass(ChronicDisease);
@Schema({ timestamps: true })
export class Patient {
  @Prop({ type: mongoose.Types.ObjectId, required: true, unique: true,ref:'User' })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: Date, required: false })
  Reminder: Date;

    @Prop({ type: HealthReportSchema })  // ✅ Sub-schema
  healthReport: HealthReport;


  @Prop({ type: [String], required: false })
  medications: string[];

  @Prop({ type: String, required: true })
  bloodType: string;
 @Prop({ type: Number, required: false })
height: number; 

@Prop({ type: Number, required: false })
weight: number;
  @Prop({ type: String, required: false })
  allergies: string;
@Prop({type:String,required:false}
)
note?:string
  @Prop({
  type: [ChronicDiseaseSchema],
  required: false,
})
chronicDiseases: ChronicDisease[];

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
