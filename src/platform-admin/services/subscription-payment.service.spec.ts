import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPaymentService } from './subscription-payment.service';

describe('SubscriptionPaymentService', () => {
  let instance: SubscriptionPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionPaymentService],
    }).compile();

    instance = module.get<SubscriptionPaymentService>(SubscriptionPaymentService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
