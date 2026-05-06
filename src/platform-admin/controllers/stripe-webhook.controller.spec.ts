import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookController } from './stripe-webhook.controller';

describe('StripeWebhookController', () => {
  let instance: StripeWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeWebhookController],
    }).compile();

    instance = module.get<StripeWebhookController>(StripeWebhookController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
