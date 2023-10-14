import { UserRole } from '@app/common';
import { IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';

export enum UserRoleDto {
  'DOCTOR' = UserRole.DOCTOR,
  'PATIENT' = UserRole.PATIENT,
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  fName: string;

  @IsString()
  lName: string;

  @IsEnum(UserRoleDto)
  role: UserRole.DOCTOR | UserRole.PATIENT;
}
