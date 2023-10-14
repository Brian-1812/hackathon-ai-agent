import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { CreateQueryVectorDto } from './dto/create-query-vector.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { Document } from 'langchain/document';

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

  @Post('store')
  async createStore() {
    return await this.aiService.createStore();
  }

  @Post('store/add')
  async addIntoVectorStore(@Body() data: CreateStoreDto) {
    const docs = data.data.map((item) => {
      const doc = new Document({
        pageContent: `Disease: ${item.name}. Symptoms: ${item.simptoms.join(
          ',',
        )}`,
      });
      return doc;
    });
    return await this.aiService.addDocsIntoStore(docs);
  }
}
