// src/module/superadmin/superadmin.controller.ts
import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Query, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType } from 'src/DB/model/User.model';
import mongoose from 'mongoose';

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // Login
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() body: LoginDto) {
    return this.superAdminService.login(body.email, body.password);
  }

  // Dashboard
  @Auth([RoleType.SUPER_ADMIN])
  @Get('dashboard')
  async getDashboard() {
    return this.superAdminService.getDashboard();
  }

  // كل الدكاترة — ?isVerified=false للـ pending
  @Auth([RoleType.SUPER_ADMIN])
  @Get('doctors')
  async getDoctors(@Query('isVerified') isVerified?: string) {
    return this.superAdminService.getDoctors(isVerified);
  }

  // Verify دكتور
  @Auth([RoleType.SUPER_ADMIN])
  @Patch('doctors/:userId/verify')
  async verifyDoctor(@Param('userId') userId: string) {
    return this.superAdminService.verifyDoctor(userId);
  }

  // Reject دكتور
  @Auth([RoleType.SUPER_ADMIN])
  @Delete('doctors/:userId/reject')
  async rejectDoctor(@Param('userId') userId: mongoose.Types.ObjectId) {
    return this.superAdminService.rejectDoctor(userId);
  }

  // كل المرضى
  @Auth([RoleType.SUPER_ADMIN])
  @Get('patients')
  async getPatients() {
    return this.superAdminService.getPatients();
  }

  // Block يوزر
  @Auth([RoleType.SUPER_ADMIN])
  @Patch('users/:userId/block')
  async blockUser(@Param('userId') userId: string) {
    return this.superAdminService.toggleBlock(userId, true);
  }

  // Unblock يوزر
  @Auth([RoleType.SUPER_ADMIN])
  @Patch('users/:userId/unblock')
  async unblockUser(@Param('userId') userId: string) {
    return this.superAdminService.toggleBlock(userId, false);
  }

  // Delete يوزر
  @Auth([RoleType.SUPER_ADMIN])
  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: mongoose.Types.ObjectId) {
    return this.superAdminService.deleteUser(userId);
  }
  @Auth([RoleType.SUPER_ADMIN])
@Get('reports')
async getReports() {
  return this.superAdminService.getReportsPage();
}
}
