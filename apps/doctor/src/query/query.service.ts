import { Inject, Injectable } from '@nestjs/common';
import { CreateQueryDto } from '../dto/create-query.dto';
import { QueryRepository } from './query.repository';
import { Query } from '@app/common';
import { AI_SERVICE } from '@app/common/constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs';

@Injectable()
export class QueryService {
  constructor(
    private readonly queryRepository: QueryRepository,
    @Inject(AI_SERVICE) private aiService: ClientProxy,
  ) {}

  async createQuery(queryDto: CreateQueryDto) {
    const query = `${queryDto.question}\n Tags: ${queryDto.tags.join(',')}`;
    return this.aiService.send('answer_query', { query }).pipe(
      map(
        async (response) => {
          console.log('RESPONSE FROM TCP', response);
          const queryEntity = new Query({
            ...queryDto,
            response,
            tags: queryDto.tags.join(','),
          });
          return this.queryRepository.create(queryEntity);
        },
        () => true,
      ),
    );
  }

  async getQueries(userId: number) {
    return this.queryRepository.find({});
  }

  async getSingleQuery(queryId: number) {
    return this.queryRepository.findOne({ id: queryId });
  }
}
