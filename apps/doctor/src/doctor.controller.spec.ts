import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

describe('DoctorController', () => {
  let doctorController: DoctorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [DoctorService],
    }).compile();

    doctorController = app.get<DoctorController>(DoctorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(doctorController.getHello()).toBe('Hello World!');
    });
  });
});
