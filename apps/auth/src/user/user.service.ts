import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user-dto';
import { GetUserDto } from './dto/get-user.dto';
import { User } from '@app/common';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(user: CreateUserDto) {
    await this.validateCreateUserDto(user);
    const userEntity = new User({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    });
    return this.userRepository.create(userEntity);
  }

  private async validateCreateUserDto(user: CreateUserDto) {
    try {
      await this.userRepository.findOne({
        email: user.email,
      });
    } catch (error) {
      return;
    }
    throw new UnprocessableEntityException('Email already exists');
  }

  async verifyUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ email });
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    return user;
  }

  async getUser(getUserDto: GetUserDto) {
    return this.userRepository.findOne(getUserDto);
  }
}
