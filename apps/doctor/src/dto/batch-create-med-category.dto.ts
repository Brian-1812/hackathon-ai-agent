import { IsArray, IsString, ValidateNested } from 'class-validator';

export class BatchCreateMedicineCategoriesDto {
  @IsArray()
  categories: MedicineCategoryDto[];
}

export class MedicineCategoryDto {
  @IsString()
  title: string;

  @IsString()
  description: string;
}
