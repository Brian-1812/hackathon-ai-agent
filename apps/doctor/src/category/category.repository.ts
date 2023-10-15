import { AbstractRepository, MedicineCategory, Query } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

export class CategoryRepository extends AbstractRepository<MedicineCategory> {
  protected readonly logger = new Logger(CategoryRepository.name);

  constructor(
    @InjectRepository(MedicineCategory)
    categoryRepository: Repository<MedicineCategory>,
    entityManager: EntityManager,
  ) {
    super(categoryRepository, entityManager);
  }
}
