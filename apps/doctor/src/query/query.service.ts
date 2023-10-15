import { Query } from '@app/common';
import { AI_SERVICE } from '@app/common/constants/services';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs';
import { CreateQueryDto } from '../dto/create-query.dto';
import { QueryRepository } from './query.repository';

@Injectable()
export class QueryService {
  constructor(
    private readonly queryRepository: QueryRepository,
    @Inject(AI_SERVICE) private aiService: ClientProxy,
  ) {}

  async createQuery(queryDto: CreateQueryDto) {
    let query = `${queryDto.question}`;
    if (queryDto.tags?.length) {
      query += `\nTags: ${queryDto.tags.join(',')}`;
    }
    return this.aiService.send('answer_query', { query }).pipe(
      map(
        async (response: {
          diseases: { name: string; score: number }[];
          responseText: string;
        }) => {
          console.log('RESPONSE FROM TCP', response);
          const queryEntity = new Query({
            ...queryDto,
            response: response.responseText,
            tags: queryDto.tags.join(','),
          });
          await this.queryRepository.create(queryEntity);
          return {
            response: response.responseText,
            diseases: response.diseases.map((d) => ({
              ...d,
              score: (d.score * 100).toFixed(3),
            })),
          };
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
