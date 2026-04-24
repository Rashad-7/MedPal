// src/module/sos/dto/sos.dto.ts
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { SOSUpdateType } from 'src/DB/model/SOS.model';
import mongoose from 'mongoose';

export class CreateSOSDto {
  @IsMongoId()
  doctorId: mongoose.Types.ObjectId;

  @IsEnum(SOSUpdateType)
  updateType: SOSUpdateType;

  @IsString()
  @IsNotEmpty()
  details: string;
}