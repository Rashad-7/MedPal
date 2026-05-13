
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

  
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() body: LoginDto) {
    return this.superAdminService.login(body.email, body.password);
  }

  
  @Auth([RoleType.SUPER_ADMIN])
  @Get('dashboard')
  async getDashboard() {
    return this.superAdminService.getDashboard();
  }

  
  @Auth([RoleType.SUPER_ADMIN])
  @Get('doctors')
  async getDoctors(@Query('isVerified') isVerified?: string) {
    return this.superAdminService.getDoctors(isVerified);
  }

  
  @Auth([RoleType.SUPER_ADMIN])
  @Patch('doctors/:userId/verify')
  async verifyDoctor(@Param('userId') userId: mongoose.Types.ObjectId) {
    return this.superAdminService.verifyDoctor(userId);
  }

  
  @Auth([RoleType.SUPER_ADMIN])
  @Delete('doctors/:userId/reject')
  async rejectDoctor(@Param('userId') userId: mongoose.Types.ObjectId) {
    return this.superAdminService.rejectDoctor(userId);
  }

  
  @Auth([RoleType.SUPER_ADMIN])
  @Get('patients')
  async getPatients() {
    return this.superAdminService.getPatients();
  }

  
  @Auth([RoleType.SUPER_ADMIN])
  @Patch('users/:userId/block')
  async blockUser(@Param('userId') userId: string) {
    return this.superAdminService.toggleBlock(userId, true);
  }

  
  @Auth([RoleType.SUPER_ADMIN])
  @Patch('users/:userId/unblock')
  async unblockUser(@Param('userId') userId: string) {
    return this.superAdminService.toggleBlock(userId, false);
  }

  
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
