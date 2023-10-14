import { Injectable } from '@nestjs/common';

@Injectable()
export class PatientService {
  getHello(): string {
    return 'Hello World!';
  }
}
