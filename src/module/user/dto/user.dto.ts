import { IsOptional, IsString, IsNumber, Min, Max, IsMongoId, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import mongoose, { Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import { RequestStatus } from 'src/DB/model/Req.model';

export class GetDoctorsDto {
  
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rate?: number;

  @IsOptional()
  @IsString()
  @Min(1)
  page?: string;

  @IsOptional()

  @IsString()
  @Min(1)
  limit?: string;
}
export class SendRequestDto {
  @IsMongoId()
  receiverId: mongoose.Types.ObjectId; 
}

 