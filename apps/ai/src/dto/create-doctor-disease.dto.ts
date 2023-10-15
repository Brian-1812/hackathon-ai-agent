import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { WeaviateClassName } from '../types';

export class CreateDoctorDiseaseDto {
  @IsString()
  @IsOptional()
  name?: WeaviateClassName;

  @IsDefined()
  @IsArray()
  @IsNotEmpty()
  data: { title: string; description: string; id: number }[];
}
