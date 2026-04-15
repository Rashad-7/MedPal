import { CloudService } from './../../common/multer/cloud.service';
import { InternalServerErrorException, Patch, Body } from '@nestjs/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompleteSignupDto,
  confirmEmailDto,
  ForgetPasswordDto,
  loginDto,
  RestPasswordDto,
  SignupDocDto,
  SignupDto,
} from './dto/auth.dto';
import { RoleType, User, UserDocument } from 'src/DB/model/User.model';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { compareHush, generateHush } from 'src/common/security/hush.security';
import { sendEmail } from 'src/common/email/send.email';
import { verifyAccountTemplate } from 'src/common/email/template/verifyAccountTemplate';
import { TokenService, TokenType } from 'src/common/service/token.service';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { PatientDocument } from 'src/DB/model/patient.model';
import { DoctorDocument } from 'src/DB/model/doctor.model';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: TokenService,
    private readonly UserRepositoryService: UserRepositoryService<UserDocument>,
    private readonly PatientRepositoryService: PatientRepositoryService<PatientDocument>,
    private readonly doctorRepositoryService: DoctorRepositoryService<DoctorDocument>,
    private readonly CloudService: CloudService,
  ) {}
  async signup(body: SignupDto) {
    const { email, password, fullName, DOB, gender, phone, address ,role} = body;
    const otp = this.generateOTP();
    await this.UserRepositoryService.checkDuplicateEmail({ email });
    const user = await this.UserRepositoryService.create({
      fullName,
      email,
      password,
      gender,
      DOB,
      phone,
      role,
      address,
      isVerified:true,
      confirmEmailOTP: `${otp}`,
    });
    sendEmail({
      to: email,
      subject: 'Verify your account',
      html: verifyAccountTemplate(otp),
    });
    console.log(otp);

    return { message: 'Done', user, otp };
  }
  async signupDoc(body:SignupDocDto,file: Express.Multer.File) {
    const { email, password, fullName, DOB, gender, phone, address,role } = body;
    await this.UserRepositoryService.checkDuplicateEmail({ email });
    const user = await this.UserRepositoryService.create({
      fullName,
      email,
      password,
      gender,
      DOB,
      phone,
      address,
      role,
      isVerified:false
    });
   const {proofDocument,clinicLocation,licenseNumbers,specialization,qualification,experienceYears}=body;

const folderId = String(Math.floor(100000 + Math.random() * 900000));

const { secure_url, public_id } = await this.CloudService.uploadFile(file, {
  folder: `${process.env.APP_NAME}/users/${user._id}/profile/${folderId}`,
});

const doctor = await this.doctorRepositoryService.create({
  userId: user._id,
  clinicLocation,
  licenseNumbers,
  specialization,
  qualification,
  experienceYears,
  proofDocument: { secure_url, public_id },
});
   return { message: 'Done', user,doctor};
  }
  async forgetPassword(
    body: ForgetPasswordDto,
  ): Promise<{ message: string; otp: number }> {
    const { email } = body;
    const user = await this.UserRepositoryService.findOne({
      filter: { email, confirmEmail: { $exists: true } },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const otp = this.generateOTP();
    await this.UserRepositoryService.updateOne({
      filter: { _id: user._id },
      data: { forgetPasswordOtp: generateHush(`${otp}`) },
    });
    sendEmail({
      to: email,
      subject: 'Forget Password',
      html: verifyAccountTemplate(otp),
    });
    return { message: 'Done', otp };
  }
  async restPassword(body: RestPasswordDto): Promise<{ message: string }> {
    const { email, otp, password, confirmPassword } = body;
    const user = await this.UserRepositoryService.findOne({
      filter: { email, confirmEmail: { $exists: true } },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (!compareHush(otp, user.forgetPasswordOtp))
      throw new BadRequestException('Invalid OTP');
    user.password = password;

    await user.save();
    await this.UserRepositoryService.updateOne({
      filter: { _id: user._id },
      data: { $unset: { forgetPasswordOtp: 0 } },
    });

    return { message: 'Done' };
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

  async completeSignup(body: CompleteSignupDto,user:UserDocument) {
    if (!user) {
      throw new NotFoundException('user not found');
    }
      const existingPatient = await this.PatientRepositoryService.findOne({
    filter: { userId: user._id }
  });
  
  if (existingPatient) throw new BadRequestException('Profile already completed');
    const { chronicDiseases, allergies, bloodType,weight,height,note } = body;
    await this.PatientRepositoryService.create({
      chronicDiseases: chronicDiseases || [],
      allergies,
      bloodType,
      height,
      weight,
      note,
      userId: user._id,
    });
    return { message: 'Done' };
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
   async loginDoc(body: loginDto): Promise<{
    message: string;
    token: { accessToken: string; refreshToken: string };
  }> {
    const { email, password } = body;
    const user = await this.UserRepositoryService.findOne({
      filter: { email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role!=RoleType.ADMIN) {
      throw new BadRequestException("in-vaild account")
    }
    if (!user.isVerified) {
      throw new BadRequestException("Not Verified yet")
    }
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
