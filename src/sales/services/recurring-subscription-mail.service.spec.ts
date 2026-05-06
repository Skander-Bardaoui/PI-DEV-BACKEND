import { Test, TestingModule } from '@nestjs/testing';
import { RecurringSubscriptionMailService } from './recurring-subscription-mail.service';

describe('RecurringSubscriptionMailService', () => {
  let instance: RecurringSubscriptionMailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringSubscriptionMailService],
    }).compile();

    instance = module.get<RecurringSubscriptionMailService>(RecurringSubscriptionMailService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
