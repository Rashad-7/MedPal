// import { UserRepositoryService } from './../../DB/repository/user.repository.service';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModel } from 'src/DB/model/User.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { PatientModel } from 'src/DB/model/patient.model';
@Module({
    imports:[UserModel,PatientModel],
controllers:[AuthController],
providers:[AuthService,PatientRepositoryService],
// exports:[UserRepositoryService,JwtService,TokenService,UserModel]
})
export class AuthModule {}
