import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

describe('PatientController', () => {
  let patientController: PatientController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [PatientService],
    }).compile();

    patientController = app.get<PatientController>(PatientController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(patientController.getHello()).toBe('Hello World!');
    });
  });
});
