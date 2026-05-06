import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionManagementController } from './subscription-management.controller';

describe('SubscriptionManagementController', () => {
  let instance: SubscriptionManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionManagementController],
    }).compile();

    instance = module.get<SubscriptionManagementController>(SubscriptionManagementController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
