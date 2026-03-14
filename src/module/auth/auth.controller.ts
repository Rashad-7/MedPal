import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { CompleteSignupDto, confirmEmailDto, ForgetPasswordDto, loginDto, RestPasswordDto, SignupDto } from "./dto/auth.dto";
import { log } from "console";
import { Auth } from "src/common/decorator/auth.decorator";
import { RoleType } from "src/DB/model/User.model";
 

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')


    signup(@Body( new ValidationPipe({whitelist:true ,})) body: SignupDto): Promise<{ message: string; }> {
        log('Signup body:', body);
        return this.authService.signup(body);
    }
    @Post('login')
    @HttpCode(200)
       login(@Body( new ValidationPipe({whitelist:true ,})) body: loginDto): Promise<{ message: string,token:{accessToken:string,refreshToken:string} }> {
        // log('Signup body:', body);
        return this.authService.login(body);
    
} 
@Patch('confirmEmail')


confirmEmail(@Body() body:confirmEmailDto):any{
    return this.authService.confirmEmail(body)
}
@UsePipes(new ValidationPipe({ whitelist: true }))
@Auth([RoleType.USER])
@Patch('completeSignup')


completeSignup(@Body() body:CompleteSignupDto):any{
    return this.authService.completeSignup(body)
}
@UsePipes(new ValidationPipe({ whitelist: true }))
@Patch('forgetPassword')


forgetPassord(@Body() body:ForgetPasswordDto): Promise<{ message: string,otp:number}>{
    return this.authService.forgetPassword(body)
}
@UsePipes(new ValidationPipe({ whitelist: true }))
@Patch('restPassword')
restPassord(@Body() body:RestPasswordDto): Promise<{ message: string}>{
    return this.authService.restPassword(body)
}
}