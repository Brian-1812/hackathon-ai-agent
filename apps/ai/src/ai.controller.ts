import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { CreateQueryVectorDto } from './dto/create-query-vector.dto';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @MessagePattern('create_query_vector')
  @UsePipes(new ValidationPipe())
  async createQueryVector(@Payload() data: CreateQueryVectorDto) {
    return await this.aiService.vectorizeQuery(data.query);
  }

  @MessagePattern('answer_query')
  @UsePipes(new ValidationPipe())
  async answerQuery(@Payload() data: CreateQueryVectorDto) {
    return await this.aiService.answerQuery(data.query);
  }
}
