import { Controller, Get, Headers, UseInterceptors } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType, type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}
  // UseInterceptors(WatchInterceptor)
  @Auth([RoleType.ADMIN])
  @Get('profile')
  async Profile(
    @User()user:UserDocument
  ) {
    return this.doctorService.profile(user); 
  }
}
