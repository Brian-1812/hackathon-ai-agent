import { LoggerModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        TCP_PORT: Joi.number().required(),
        HTTP_PORT: Joi.number().required(),
        COHERE_API_KEY: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        WEAVIATE_URL: Joi.string().required(),
        WEAVIATE_SCHEME: Joi.string().required(),
      }),
    }),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
