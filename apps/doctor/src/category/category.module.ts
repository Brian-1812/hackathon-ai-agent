import {
  DatabaseModule,
  LoggerModule,
  MedicineCategory,
  Query,
  User,
} from '@app/common';
import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AI_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Query, MedicineCategory, User]),
    LoggerModule,
    ClientsModule.registerAsync([
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
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
