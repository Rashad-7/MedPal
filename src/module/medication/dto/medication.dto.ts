// src/module/medication/dto/medication.dto.ts
import { IsString, IsOptional, IsDateString, IsMongoId } from 'class-validator';
import mongoose from 'mongoose';

export class AddMedicationDto {
  @IsOptional()
  @IsString()
  medicineName?: string; // لو بعت اسم

  // لو بعت صورة هتيجي كـ file

  @IsString()
  dosage: string; // مثلاً "500mg"

  @IsString()
  frequency: string; // مثلاً "8" يعني كل 8 ساعات

  @IsDateString()
  startDate: string; // امتى يبدأ ياخد الدوا
}

export class TakeMedicationDto {
  @IsMongoId()
  logId: mongoose.Types.ObjectId; // الـ MedicationLog ID
}