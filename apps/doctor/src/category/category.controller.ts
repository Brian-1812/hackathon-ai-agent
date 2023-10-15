import { Body, Controller, Post } from '@nestjs/common';
import { BatchCreateMedicineCategoriesDto } from '../dto/batch-create-med-category.dto';
import { CategoryService } from './category.service';
import { FindDoctorDto } from '../dto/find-doctor.dto';

@Controller('doctor')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('categories/batch')
  async batchCreate(@Body() batchCreateDto: BatchCreateMedicineCategoriesDto) {
    return await this.categoryService.batchCreate(batchCreateDto.categories);
  }

  @Post('disease')
  async findDoctorsWithDisease(@Body() body: FindDoctorDto) {
    return await this.categoryService.findDoctors(body.disease);
  }
}
