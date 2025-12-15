import { Body, Controller, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import type { UserDocument } from 'src/DB/model/User.model';
import { UpdateProfileDto } from './dto/updateProfile.dto';

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Auth([RoleType.USER])
  @Patch('profile')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @User() user: UserDocument,
  ) {
    return this.patientService.updateProfile(user, body);
  }
}
