import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDefined()
  @IsArray()
  @IsNotEmpty()
  data: { name: string; simptoms: string[] }[];
}
