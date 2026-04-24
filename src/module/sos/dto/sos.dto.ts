// src/module/sos/dto/sos.dto.ts
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { SOSSeverity, SOSUpdateType } from 'src/DB/model/SOS.model';
import mongoose from 'mongoose';

export class CreateSOSDto {
  @IsMongoId()
  doctorId: mongoose.Types.ObjectId;

  @IsEnum(SOSUpdateType)
  updateType: SOSUpdateType;

  @IsEnum(SOSSeverity)
  severity: SOSSeverity;

  @IsString()
  @IsNotEmpty()
  details: string;
}