import { IsString } from 'class-validator';

export class FindDoctorDto {
  @IsString()
  disease: string;
}
