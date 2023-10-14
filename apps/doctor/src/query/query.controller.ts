import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateQueryDto } from '../dto/create-query.dto';
import { QueryService } from './query.service';
import { JwtAuthGuard } from '@app/common';

@Controller('doctor')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @UseGuards(JwtAuthGuard)
  @Post('query')
  async createUser(@Body() createQueryDto: CreateQueryDto) {
    const query = await this.queryService.createQuery(createQueryDto);
    console.log('query', query);
    return query;
  }
}
