import { Controller, Get, Headers, Param, Patch, Query, UseInterceptors } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType, type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import { UpdateRequestStatusDto } from './dto/doctor.dto';
import mongoose from 'mongoose';
import type { DoctorDocument } from 'src/DB/model/doctor.model';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}
  
  @Auth([RoleType.ADMIN])
  @Get('profile')
  async Profile(
    @User()user:UserDocument
  ) {
    return this.doctorService.profile(user); 
  }
    @Patch('request/:requestId/accept')
 @Auth([RoleType.ADMIN])
  async acceptRequest(
    @Param('requestId') requestId: mongoose.Types.ObjectId,
    @User() user: UserDocument,
  ): Promise<UpdateRequestStatusDto> {;
    return this.doctorService.acceptRequest(requestId, user);
  }
 
  @Patch('request/:requestId/reject')
  async rejectRequest(
    @Param('requestId') requestId: mongoose.Types.ObjectId,
  @User() user: UserDocument,
  ): Promise<UpdateRequestStatusDto> {
    return this.doctorService.rejectRequest(requestId, user);
  }
  @Auth([RoleType.ADMIN])
@Get('requests')
async getMyRequests(@User() user: UserDocument) {
  return this.doctorService.getMyRequests(user);
}
@Auth([RoleType.ADMIN])
@Get('patient/:patientUserId')
async getPatient(
  @Param('patientUserId') patientUserId: string,
  @User() user: UserDocument,
) {
  return this.doctorService.getPatient(patientUserId, user);
}
@Auth([RoleType.ADMIN])
@Get('patients')
async getMyPatients(@User() user: UserDocument) {
  return this.doctorService.getMyPatients(user);
}
@Auth([RoleType.ADMIN])
@Get('report')
getPatientsReport(
  @User() user: UserDocument,
  @Query('patientId') patientId?: mongoose.Types.ObjectId,
) {
  return this.doctorService.getPatientsReport(
    user,
    patientId ? new mongoose.Types.ObjectId(patientId) : undefined,
  );
}
}
