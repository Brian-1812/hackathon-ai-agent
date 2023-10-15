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
import { CreateDoctorDiseaseDto } from './dto/create-doctor-disease.dto';
import { WeaviateClassName } from './types';

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

  @MessagePattern('category_vstore')
  @UsePipes(new ValidationPipe())
  async createCategoriesStore(@Payload() data: CreateDoctorDiseaseDto) {
    console.log('data?.data', data?.data?.[0]);
    const docs = data.data.map((cat) => {
      return new Document({
        pageContent: `Title: ${cat.title}. Description: ${cat.description}`,
        metadata: {
          categoryId: cat.id?.toString(),
        },
      });
    });
    return await this.aiService.createStoreFromDocs(
      docs,
      WeaviateClassName.Doctor_disease,
    );
  }

  @MessagePattern('find_doctors')
  @UsePipes(new ValidationPipe())
  async findDoctors(@Payload() data: { disease: string }) {
    return await this.aiService.findDoctors(data.disease);
  }

  @Post('store')
  async createStore() {
    return await this.aiService.createStore();
  }

  @Post('store/create')
  async createStoreFromDocs(@Body() data: CreateStoreDto) {
    const docs = data.data.map((item) => {
      const doc = new Document({
        pageContent: `Disease: ${item.name}. Symptoms: ${item.simptoms.join(
          ',',
        )}`,
      });
      return doc;
    });
    return await this.aiService.createStoreFromDocs(docs);
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
    return await this.aiService.addDocsIntoStore(docs, data.name);
  }
}
