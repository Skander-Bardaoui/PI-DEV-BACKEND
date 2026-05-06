import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionManageController } from './subscription-manage.controller';

describe('SubscriptionManageController', () => {
  let instance: SubscriptionManageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionManageController],
    }).compile();

    instance = module.get<SubscriptionManageController>(SubscriptionManageController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
