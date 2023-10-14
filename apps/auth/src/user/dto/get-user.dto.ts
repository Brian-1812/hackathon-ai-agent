import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetUserDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
