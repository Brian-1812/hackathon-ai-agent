import { DatabaseModule, LoggerModule, Query, User } from '@app/common';
import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { QueryRepository } from './query.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AI_SERVICE, AUTH_SERVICE } from '@app/common/constants/services';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([User, Query]),
    LoggerModule,
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
  controllers: [QueryController],
  providers: [QueryService, QueryRepository],
  exports: [QueryService],
})
export class QueryModule {}
