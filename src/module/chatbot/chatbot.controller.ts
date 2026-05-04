// src/module/chatbot/chatbot.controller.ts
import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatBotService } from 'src/module/chatbot/chatbot.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType, type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import { ChatBotDto } from './dto/chatbot.dto';

@Controller('chatbot')
export class ChatBotController {
  constructor(private readonly chatBotService: ChatBotService) {}

  @Auth([RoleType.USER])
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async chat(
    @Body() body: ChatBotDto,
    @User() user: UserDocument,
  ) {
    return this.chatBotService.chat(user, body.message);
  }
}