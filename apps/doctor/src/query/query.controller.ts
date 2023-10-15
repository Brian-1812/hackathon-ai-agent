import { Body, Controller, Post } from '@nestjs/common';
import { CreateQueryDto } from '../dto/create-query.dto';
import { QueryService } from './query.service';

@Controller('doctor')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  // @UseGuards(JwtAuthGuard)
  @Post('query')
  async createUser(@Body() createQueryDto: CreateQueryDto) {
    const query = await this.queryService.createQuery(createQueryDto);
    return query;
  }
}
