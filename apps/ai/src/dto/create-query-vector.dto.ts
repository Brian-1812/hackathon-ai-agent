import { IsString } from 'class-validator';

export class CreateQueryVectorDto {
  @IsString()
  query: string;
}
