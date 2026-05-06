import { Test, TestingModule } from '@nestjs/testing';
import { PaymentSchedulesController } from './payment-schedules.controller';

describe('PaymentSchedulesController', () => {
  let instance: PaymentSchedulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentSchedulesController],
    }).compile();

    instance = module.get<PaymentSchedulesController>(PaymentSchedulesController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
