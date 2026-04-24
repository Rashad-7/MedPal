// src/module/sos/sos.controller.ts
import { Body, Controller, Get, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { SOSService } from './sos.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType,type  UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import { CreateSOSDto } from './dto/sos.dto';

@Controller('sos')
export class SOSController {
  constructor(private readonly sosService: SOSService) {}

  // المريض يبعت SOS
  @Auth([RoleType.USER])
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createSOS(
    @Body() body: CreateSOSDto,
    @User() user: UserDocument,
  ) {
    return this.sosService.createSOS(user, body);
  }

  // الدكتور يشوف الـ SOS بتوعه
  @Auth([RoleType.ADMIN])
  @Get()
  async getDoctorSOS(@User() user: UserDocument) {
    return this.sosService.getDoctorSOS(user);
  }

  // الدكتور يعمل resolve
  @Auth([RoleType.ADMIN])
  @Patch(':sosId/resolve')
  async resolveSOS(
    @Param('sosId') sosId: string,
    @User() user: UserDocument,
  ) {
    return this.sosService.resolveSOS(sosId, user);
  }
}