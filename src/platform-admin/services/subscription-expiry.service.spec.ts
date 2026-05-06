import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionExpiryService } from './subscription-expiry.service';

describe('SubscriptionExpiryService', () => {
  let instance: SubscriptionExpiryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionExpiryService],
    }).compile();

    instance = module.get<SubscriptionExpiryService>(SubscriptionExpiryService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
