import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user-dto';
import { UserService } from './user.service';
import { CurrentUser, User, UserRole } from '@app/common';
import { JWTAuthGuard } from '../guards/jwt-auth.guard';
import { faker } from '@faker-js/faker';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post()
  createFakeUsers() {
    const createUserDtos: CreateUserDto[] = [];

    for (let i = 0; i < 100; i++) {
      const email = faker.internet.email();
      const password = faker.internet.password();
      const phoneNumber = faker.phone.number();
      const fName = faker.person.firstName();
      const lName = faker.person.lastName();
      const role = UserRole.DOCTOR;

      const fakeUser: CreateUserDto = {
        email,
        password,
        phoneNumber,
        fName,
        lName,
        role,
      };

      createUserDtos.push(fakeUser);
    }

    return this.userService.createUsers(createUserDtos);
  }

  @Get()
  @UseGuards(JWTAuthGuard)
  async getUser(@CurrentUser() user: User) {
    return user;
  }
}
