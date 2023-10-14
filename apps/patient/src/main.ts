import { NestFactory } from '@nestjs/core';
import { PatientModule } from './patient.module';

async function bootstrap() {
  const app = await NestFactory.create(PatientModule);
  app.enableCors({
    origin: '*',
  });
  await app.listen(4000);
}
bootstrap();
