// src/module/chat/dto/chat.dto.ts
import { IsMongoId, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import mongoose from 'mongoose';

export class SendMessageDto {
  @IsMongoId()
  receiverId: mongoose.Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class GetHistoryDto {
  @IsMongoId()
  withUserId: mongoose.Types.ObjectId;

  @IsOptional()
  page?: string;

  @IsOptional()
  limit?: string;
}