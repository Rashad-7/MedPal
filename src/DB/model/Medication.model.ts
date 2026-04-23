// src/DB/model/Medication.model.ts
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Medicine {
  @Prop({ type: String, required: true, trim: true })
  tradName: string; // الاسم التجاري

  @Prop({ type: String, required: true })
  activeIngredient: string; // المادة الفعالة

  @Prop({ type: String })
  genericName?: string; // الاسم العلمي

  @Prop({ type: String })
  dosage?: string; // الجرعة المعتادة

  @Prop({ type: String })
  frequency?: string; // تكرار الاستخدام

  @Prop({ type: String })
  strength?: string; // التركيز مثلاً 500mg

  @Prop({ type: String })
  description?: string; // وصف عام

  @Prop({ type: String })
  instructions?: string; // تعليمات الاستخدام

  @Prop({ type: String })
  manufacturer?: string; // الشركة المصنعة

  // ⭐ مهم للـ AI
  @Prop({ type: [String], default: [] })
  sideEffects: string[]; // الأعراض الجانبية

  // ⭐ مهم للـ AI
  @Prop({ type: [String], default: [] })
  contraindications: string[]; // موانع الاستخدام

  // ⭐ مهم للـ AI
  @Prop({ type: [String], default: [] })
  interactions: string[]; // تفاعلات مع أدوية أخرى

  @Prop({ type: String })
  category?: string; // تصنيف الدوا (مسكن، مضاد حيوي...)

  // صورة الدوا لو اتحفظت
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