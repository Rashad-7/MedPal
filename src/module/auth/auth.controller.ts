import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  CompleteSignupDto,
  confirmEmailDto,
  ForgetPasswordDto,
  loginDto,
  RestPasswordDto,
  SignupDocDto,
  SignupDto,
} from './dto/auth.dto';
import { log } from 'console';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType, type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulterOptions } from 'src/common/multer/cloud.multer.options';
import { validationFile } from 'src/common/multer/local.multer.options';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(
    @Body(new ValidationPipe({ whitelist: true })) body: SignupDto,
  ): Promise<{ message: string }> {
    log('Signup body:', body);
    return this.authService.signup(body);
  }
  @UseInterceptors(
    FileInterceptor(
      'proofDocument',
      cloudMulterOptions({ validation: validationFile.file }),
    ),
  )
  @Post('signupDoc')
  async signupDoc(
    @Body(new ValidationPipe({ whitelist: true }))
    body: SignupDocDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string }> {
    return this.authService.signupDoc(body, file);
  }
  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ValidationPipe({ whitelist: true })) body: loginDto,
  ): Promise<{
    message: string;
    token: { accessToken: string; refreshToken: string };
  }> {
    // log('Signup body:', body);
    return this.authService.login(body);
  }
   @Post('loginDoc')
  @HttpCode(200)
  loginDoc(
    @Body(new ValidationPipe({ whitelist: true })) body: loginDto,
  ): Promise<{
    message: string;
    token: { accessToken: string; refreshToken: string };
  }> {
    return this.authService.loginDoc(body);
  }
  @Patch('confirmEmail')
  confirmEmail(@Body() body: confirmEmailDto): any {
    return this.authService.confirmEmail(body);
  }
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Auth([RoleType.USER])
  @Patch('completeSignup')
  completeSignup(
    @Body() body: CompleteSignupDto,
    @User() user: UserDocument,
  ): any {
    return this.authService.completeSignup(body, user);
  }
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Patch('forgetPassword')
  forgetPassord(
    @Body() body: ForgetPasswordDto,
  ): Promise<{ message: string; otp: number }> {
    return this.authService.forgetPassword(body);
  }
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Patch('restPassword')
  restPassord(@Body() body: RestPasswordDto): Promise<{ message: string }> {
    return this.authService.restPassword(body);
  }
}
