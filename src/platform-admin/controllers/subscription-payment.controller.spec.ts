import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPaymentController } from './subscription-payment.controller';

describe('SubscriptionPaymentController', () => {
  let instance: SubscriptionPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionPaymentController],
    }).compile();

    instance = module.get<SubscriptionPaymentController>(SubscriptionPaymentController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
