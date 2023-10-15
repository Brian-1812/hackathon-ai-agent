import { MedicineCategory, UserRole } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { MedicineCategoryDto } from '../dto/batch-create-med-category.dto';
import { CategoryRepository } from './category.repository';
import { AI_SERVICE } from '@app/common/constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    @Inject(AI_SERVICE) private aiService: ClientProxy,
  ) {}

  async batchCreate(categories: MedicineCategoryDto[]) {
    await this.categoryRepository.bulkInsert(MedicineCategory, categories);
    const cats = await this.categoryRepository.find({});
    return this.aiService.send('category_vstore', { data: cats }).pipe(
      map(
        async (response) => {
          console.log('RESPONSE FROM TCP', response);
        },
        () => true,
      ),
    );
  }

  async findDoctors(disease: string) {
    return this.aiService.send('find_doctors', { disease }).pipe(
      map(
        async (response: { categoryIds: number[] }) => {
          console.log('RESPONSE FROM TCP', response);
          const promises = response.categoryIds?.map(async (cat) => {
            const category = await this.categoryRepository.findOne(
              { id: cat },
              { users: true },
            );
            if (category) {
              console.log('category', category);
              return category.users
                .filter((u) => u.role === UserRole.DOCTOR)
                ?.slice(0, 2)
                ?.map((u) => ({ ...u, specialty: category.title }));
            }
            return undefined;
          });
          const doctors = (await Promise.all(promises)).filter((d) => !!d);
          return { doctors: doctors.flat() };
        },
        () => true,
      ),
    );
  }
}
