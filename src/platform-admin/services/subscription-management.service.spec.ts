import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionManagementService } from './subscription-management.service';

describe('SubscriptionManagementService', () => {
  let instance: SubscriptionManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionManagementService],
    }).compile();

    instance = module.get<SubscriptionManagementService>(SubscriptionManagementService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
