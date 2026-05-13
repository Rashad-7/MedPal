import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, SetMetadata, UploadedFile, UploadedFiles, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../common/decorator/user.decorator';
import { RoleType, type UserDocument } from '../../DB/model/User.model';

import { Auth } from '../../common/decorator/auth.decorator';

import { WatchInterceptor } from '../../common/interceptors/watch.Req.interceptors';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { cloudMulterOptions, validationFile } from 'src/common/multer/cloud.multer.options';
import { ValidationPipe as NestValidationPipe } from '@nestjs/common';
import { UpdateProfileDto } from './udateProfile.dto';
import { GetDoctorsDto, SendRequestDto } from './dto/user.dto';
import mongoose from 'mongoose';
import { type PatientDocument } from 'src/DB/model/patient.model';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {
    
  }


@UseInterceptors(WatchInterceptor)
@Auth([RoleType.ADMIN,RoleType.USER])
@Get('profile')
async getProfile(
@Headers() headers:any
  ,
  @User()user:UserDocument
) {
  return this.userService.profile(user); 
}
@Auth([RoleType.USER, RoleType.ADMIN])
@Patch('image')
@UseInterceptors(FileInterceptor('image', cloudMulterOptions({ validation: validationFile.image })))
async updateProfileImage(
  @UploadedFile() file: Express.Multer.File,
  @User() user: UserDocument,
) {
  return this.userService.updateImage(file, user);
}
 @Auth([RoleType.USER, RoleType.ADMIN])
  @Patch('profile')
  @UsePipes(new NestValidationPipe({ whitelist: true, transform: true }))
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @User() user: UserDocument,
  ) {
    return this.userService.updateProfile(user, body);
  }
@Auth([RoleType.USER])
@Get("getDoctors")
async getDoctors(@Query() query:GetDoctorsDto ,@User() user: UserDocument){
return this.userService.getDoctors(query, user)
}
@Auth([RoleType.USER,RoleType.ADMIN])
@Patch("sendReq/:receiverId")
async sendReq(@Param() param:SendRequestDto,@User("_id")senderId:mongoose.Types.ObjectId){
return this.userService.sendRequest(senderId,param)
}





}
