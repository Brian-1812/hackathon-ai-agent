import { Controller } from '@nestjs/common';
import { DoctorService } from './doctor.service';

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
