import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionManageService } from './subscription-manage.service';

describe('SubscriptionManageService', () => {
  let instance: SubscriptionManageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionManageService],
    }).compile();

    instance = module.get<SubscriptionManageService>(SubscriptionManageService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
