// src/module/chat/chat.controller.ts
import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType, type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';

import mongoose from 'mongoose';
import { GetHistoryDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Auth([RoleType.USER, RoleType.ADMIN])
  @Get('history')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getHistory(
    @Query() query: GetHistoryDto,
    @User() user: UserDocument,
  ) {
    return this.chatService.getHistory(
      user._id,
      new mongoose.Types.ObjectId(query.withUserId),
      query.page,
      query.limit,
    );
  }
}