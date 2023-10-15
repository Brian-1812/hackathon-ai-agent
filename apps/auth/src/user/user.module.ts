import {
  DatabaseModule,
  LoggerModule,
  MedicineCategory,
  Query,
  User,
} from '@app/common';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([MedicineCategory, Query, User]),
    LoggerModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
