import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateQueryDto {
  @IsString()
  question: string;

  @IsArray()
  @IsOptional()
  tags: string[];
}
