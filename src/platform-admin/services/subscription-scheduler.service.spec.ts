import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';

describe('SubscriptionSchedulerService', () => {
  let instance: SubscriptionSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionSchedulerService],
    }).compile();

    instance = module.get<SubscriptionSchedulerService>(SubscriptionSchedulerService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
