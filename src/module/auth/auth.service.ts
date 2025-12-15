import { Patch } from '@nestjs/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompleteSignup,
  confirmEmailDto,
  loginDto,
  SignupDto,
} from './dto/auth.dto';
import { RoleType, User, UserDocument } from 'src/DB/model/User.model';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { compareHush } from 'src/common/security/hush.security';
import { sendEmail } from 'src/common/email/send.email';
import { verifyAccountTemplate } from 'src/common/email/template/verifyAccountTemplate';
import { TokenService, TokenType } from 'src/common/service/token.service';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: TokenService,
    private readonly UserRepositoryService: UserRepositoryService<UserDocument>,
    private readonly PatientRepositoryService: PatientRepositoryService<PatientDocument>,

  ) {}
  async signup(body: SignupDto) {
    const { email, password, fullName, DOB,gender,phone } = body;
    const otp = this.generateOTP();
    await this.UserRepositoryService.checkDuplicateEmail({ email });
    const user = await this.UserRepositoryService.create({
      fullName,
      email,
      password,
      gender,
      DOB,
      phone,
      confirmEmailOTP: `${otp}`,
    });
    sendEmail({
      to: email,
      subject: 'Verify your account',
      html: verifyAccountTemplate(otp),
    });
    return { message: 'Done', user };
  }
  private generateOTP(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }
  async confirmEmail(body: confirmEmailDto) {
    const { email, otp } = body;
    const user = await this.UserRepositoryService.findOne({
      filter: { email, confirmEmail: { $exists: false } },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!compareHush(otp, user.confirmEmailOTP))
      throw new BadRequestException('Invalid OTP');
    await this.UserRepositoryService.updateOne({
      filter: { _id: user._id },
      data: { confirmEmail: new Date(), $unset: { confirmEmailOTP: 0 } },
    });
    return { message: 'Done' };
  }

  async completeSignup(body: CompleteSignup) {
    const user = await this.UserRepositoryService.findOne({
      filter: { confirmEmail: { $exists: true } },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }  
      const { chronicDiseases, allergies, bloodType}=body;
        await this.PatientRepositoryService.create({
  
            chronicDiseases: chronicDiseases || [], allergies, bloodType, userId: user._id
      });
    return {message:'Done'}
  }

  async login(body: loginDto): Promise<{
    message: string;
    token: { accessToken: string; refreshToken: string };
  }> {
    const { email, password } = body;
    const user = await this.UserRepositoryService.findOne({
      filter: { email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.confirmEmail)
      throw new BadRequestException('Please confirm your email');
    if (!compareHush(password, user.password))
      throw new BadRequestException('Invalid password or email');
    const accessToken = this.jwt.sign({
      payload: { id: user._id },
      role: user.role,
    });
    const refreshToken = this.jwt.sign({
      payload: { id: user._id },
      role: user.role,
      type: TokenType.REFRESH,
    });
    return {
      message: 'Login successful',
      token: { accessToken, refreshToken },
    };
  }
}
