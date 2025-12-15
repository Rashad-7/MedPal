import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { GenderType } from "src/DB/model/User.model";

export class UpdateProfileDto { 
@IsOptional()
    @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  fullName?: string;
    @IsOptional()
    @IsString()
  phone?: string;
    @IsOptional()
    @IsString()
  address?: string;
    @IsOptional()
  @IsDate()
   @Type(() => Date) 
  DOB?: Date;
    @IsOptional()
  @IsEnum(GenderType)
    gender?: GenderType;
}