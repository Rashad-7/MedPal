
import {
  Controller, Get, Post, Query, Param, Body,
  UploadedFile, UseInterceptors, UsePipes, ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType, type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import { cloudMulterOptions } from 'src/common/multer/cloud.multer.options';
import mongoose from 'mongoose';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  
  @Auth([RoleType.USER, RoleType.ADMIN])
  @Get('history/:withUserId')
  async getHistory(
    @Param('withUserId') withUserId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @User() user?: UserDocument,
  ) {
    return this.chatService.getHistory(
      user!._id,
      new mongoose.Types.ObjectId(withUserId),
      page,
      limit,
    );
  }
@Auth([RoleType.USER, RoleType.ADMIN])
@Post('upload/:receiverId')
@UseInterceptors(FileInterceptor('file', cloudMulterOptions({ fileSize: 1024 * 1024 * 20 })))
async uploadFile(
  @Param('receiverId') receiverId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body('duration') duration: string,
  @User() user: UserDocument,
) {
  
  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    throw new BadRequestException('Invalid receiverId');
  }

  if (!file) {
    throw new BadRequestException('File is required');
  }

  return this.chatService.uploadAttachment(
    user,
    new mongoose.Types.ObjectId(receiverId),
    file,
    duration ? parseInt(duration) : undefined,
  );
}
}