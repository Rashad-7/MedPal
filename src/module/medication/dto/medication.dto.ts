import {
  IsString, IsNotEmpty, IsEnum, IsOptional,
  IsNumber, IsArray, IsDateString, Min,
} from 'class-validator';
import { RepeatType } from 'src/DB/model/Medication.model';
import { Type } from 'class-transformer';

export class AddMedicationDto {
  @IsString()
  @IsNotEmpty()
  medicationName: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dosage?: string; // "500mg"

  @IsEnum(RepeatType)
  repeat: RepeatType; // daily | weekly | monthly | every_x_hours

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  repeatEveryHours?: number; 

  @IsString()
  @IsNotEmpty()
  reminderTime: string; // "08:00"

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sideEffects?: string[];
  @IsOptional()
  @IsString()
  warningLevel: string;

  @IsOptional()
  @IsString()
  activeIngredient?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contraindications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interactions?: string[];

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsDateString()
  startDate: string;
}