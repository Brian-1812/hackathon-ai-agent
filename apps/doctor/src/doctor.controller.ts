import { CurrentUser, UserDto } from '@app/common';
import { JwtAuthGuard } from '@app/common';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateQueryDto } from './dto/create-query.dto';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // @UseGuards(JwtAuthGuard)
  // @Post('query')
  // answerQuery(
  //   @Body() createQueryDto: CreateQueryDto,
  //   @CurrentUser() user: UserDto,
  // ) {}
}
