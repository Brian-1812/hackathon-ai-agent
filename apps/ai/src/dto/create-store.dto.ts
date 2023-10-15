import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { WeaviateClassName } from '../types';

export class CreateStoreDto {
  @IsString()
  @IsOptional()
  name?: WeaviateClassName;

  @IsDefined()
  @IsArray()
  @IsNotEmpty()
  data: { name: string; simptoms: string[] }[];
}
