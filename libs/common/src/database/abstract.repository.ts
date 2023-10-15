import { Logger, NotFoundException } from '@nestjs/common';
import { AbstractEntity } from './abstract.entity';
import {
  EntityManager,
  EntityTarget,
  FindOptionsRelationByString,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class AbstractRepository<T extends AbstractEntity<T>> {
  protected abstract readonly logger: Logger;
  constructor(
    private readonly entityRepository: Repository<T>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(entity: Omit<T, 'id'>) {
    return this.entityManager.save(entity) as unknown as T;
  }

  async bulkInsert(
    target: EntityTarget<T>,
    entities: QueryDeepPartialEntity<ObjectLiteral extends T ? unknown : T>[],
  ) {
    return this.entityManager.insert(target, entities);
  }

  async findOne(
    where: FindOptionsWhere<T>,
    relations?: FindOptionsRelationByString | FindOptionsRelations<T>,
  ): Promise<T> {
    const entity = await this.entityRepository.findOne({ where, relations });

    if (!entity) {
      this.logger.warn('Entity not found with filter', where);
      throw new NotFoundException('Entity not found');
    }

    return entity;
  }

  async findOneAndUpdate(
    where: FindOptionsWhere<T>,
    entity: QueryDeepPartialEntity<T>,
  ) {
    const updateResult = await this.entityRepository.update(where, entity);
    if (!updateResult.affected) {
      this.logger.warn('Entity not found with filterQuery', where);
      throw new NotFoundException('Entity not found');
    }

    return this.findOne(where);
  }

  async find(
    where: FindOptionsWhere<T>,
    relations?: FindOptionsRelationByString | FindOptionsRelations<T>,
  ) {
    return this.entityRepository.find({ where, relations });
  }

  async findOneAndDelete(where: FindOptionsWhere<T>) {
    return this.entityRepository.delete(where);
  }
}
