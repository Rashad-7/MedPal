import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


@Schema({ timestamps: true })
export class Medicine {
  @Prop({ type: String, required: true })
  tradName: string;

  @Prop({ type: String })
  dosage: string;

  @Prop({ type: String, required: true })
  activeIngredient: string;

  @Prop({ type: String })
  frequency: string;

  @Prop({ type: String })
  genericName: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  strength: string;

  @Prop({ type: String })
  sideEffects: string;

  @Prop({ type: String })
  manufacturer: string;

  @Prop({ type: String })
  instructions: string;
}
export type MedicineDocument = HydratedDocument<Medicine>;

export const MedicineSchema = SchemaFactory.createForClass(Medicine);
