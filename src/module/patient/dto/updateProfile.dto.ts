import { IChronicDiseases } from './../../report/interface/chronicDiseases.interface';
import { Type } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { GenderType } from "src/DB/model/User.model";
import { ChronicDiseasesDto } from 'src/module/auth/dto/auth.dto';

export class UpdateProfileDto { 

@IsOptional()
@IsString()
  bloodType?:string
@IsOptional()
@IsString()
allergies?:string
@IsOptional()
@IsArray()
@Type(() => ChronicDiseasesDto) 
chronicDiseases?:IChronicDiseases[]
}