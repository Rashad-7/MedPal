// src/module/medication/medication.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MedicationService } from './medication.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType,type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import { AddMedicationDto } from './dto/medication.dto';
import { cloudMulterOptions } from 'src/common/multer/cloud.multer.options';

@Controller('medication')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  // ============ إضافة دوا بالاسم أو الصورة ============
  @Auth([RoleType.USER])
  @Post('add')
  @UseInterceptors(FileInterceptor('image', cloudMulterOptions({})))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addMedication(
    @Body() body: AddMedicationDto,
    @User() user: UserDocument,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.medicationService.addMedication(user, body, file);
  }

  // ============ تسجيل إن المريض اخد الدوا ============
  @Auth([RoleType.USER])
  @Post('take/:logId')
  async takeMedication(
    @Param('logId') logId: string,
    @User() user: UserDocument,
  ) {
    return this.medicationService.takeMedication(user, logId);
  }

  // ============ تقرير الأدوية ============
  @Auth([RoleType.USER])
  @Get('report')
  async getMedicationReport(@User() user: UserDocument) {
    return this.medicationService.getMedicationReport(user);
  }

  // ============ بيانات الأدوية للـ AI ============
  @Auth([RoleType.USER])
  @Get('context')
  async getMedicinesContext(@User() user: UserDocument) {
    return this.medicationService.getPatientMedicinesContext(user._id);
  }
}