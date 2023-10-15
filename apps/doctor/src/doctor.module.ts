import { LoggerModule } from '@app/common';
import { AI_SERVICE, AUTH_SERVICE } from '@app/common/constants/services';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as Joi from 'joi';
import { CategoryModule } from './category/category.module';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { QueryModule } from './query/query.module';

@Module({
  imports: [
    LoggerModule,
    QueryModule,
    CategoryModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),

        AUTH_HOST: Joi.string().required(),
        AUTH_PORT: Joi.number().required(),
        AI_HOST: Joi.string().required(),
        AI_PORT: Joi.number().required(),

        MYSQL_HOST: Joi.string().required(),
        MYSQL_USER: Joi.string().required(),
        MYSQL_PASSWORD: Joi.string().required(),
        MYSQL_DB: Joi.string().required(),
        MYSQL_SYNC: Joi.string().required(),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AUTH_HOST'),
            port: configService.get('AUTH_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: AI_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AI_HOST'),
            port: configService.get('AI_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
