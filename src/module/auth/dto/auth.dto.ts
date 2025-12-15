import { Type } from 'class-transformer';
import { IsString, IsEmail, MinLength, IsNotEmpty, MaxLength, IsStrongPassword, Matches, IsEnum, IsOptional, IsArray, IsDate, IsIn, IsNumber, IsPositive } from 'class-validator';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { GenderType, RoleType } from 'src/DB/model/User.model';
import type { IChronicDiseases } from 'src/module/report/interface/chronicDiseases.interface';

@ValidatorConstraint({ name: 'matchPasswords', async: false })
export class IsMatchPasswordsConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args?: ValidationArguments): string {
    return `Password does not match ${args?.constraints[0]}`;
  }
}

export function IsMatchPassword(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsMatchPasswordsConstraint,
    });
  };
}

// ================= DTOs =================

export class ChronicDiseasesDto {
  @IsString()
  name: string;

  @Type(() => Date)
  @IsDate()
  diagnosisDate: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @IsIn(['stable', 'critical', 'under control'])
  status: 'stable' | 'critical' | 'under control';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

}

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsStrongPassword()
  password: string;

  @IsStrongPassword()
  @IsMatchPassword('password', { message: 'Password do not match confirm password' })
  confirmPassword: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  fullName: string;
  phone: string;
  address?: string;
  @IsDate()
   @Type(() => Date) 
  DOB: Date;
  @IsEnum(GenderType)
    gender: GenderType;
}
export class loginDto{
    @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsStrongPassword()
  password: string;
}
export class confirmEmailDto{
      @IsEmail()
  email: string;
    @Matches(/^\d{6}$/)
    @MinLength(6)
    @MaxLength(6)
    otp:string;
}
export class CompleteSignup{
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