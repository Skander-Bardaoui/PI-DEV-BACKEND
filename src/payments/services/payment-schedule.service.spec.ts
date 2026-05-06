import { Test, TestingModule } from '@nestjs/testing';
import { PaymentScheduleService } from './payment-schedule.service';

describe('PaymentScheduleService', () => {
  let instance: PaymentScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentScheduleService],
    }).compile();

    instance = module.get<PaymentScheduleService>(PaymentScheduleService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
