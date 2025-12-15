import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { CompleteSignup, confirmEmailDto, loginDto, SignupDto } from "./dto/auth.dto";
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


completeSignup(@Body() body:CompleteSignup):any{
    return this.authService.completeSignup(body)
}
}