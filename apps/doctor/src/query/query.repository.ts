import { AbstractRepository, Query } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

export class QueryRepository extends AbstractRepository<Query> {
  protected readonly logger = new Logger(QueryRepository.name);

  constructor(
    @InjectRepository(Query) queryRepository: Repository<Query>,
    entityManager: EntityManager,
  ) {
    super(queryRepository, entityManager);
  }
}
