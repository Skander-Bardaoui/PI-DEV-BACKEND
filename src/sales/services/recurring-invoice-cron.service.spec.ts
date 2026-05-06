import { Test, TestingModule } from '@nestjs/testing';
import { RecurringInvoiceCronService } from './recurring-invoice-cron.service';

describe('RecurringInvoiceCronService', () => {
  let instance: RecurringInvoiceCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringInvoiceCronService],
    }).compile();

    instance = module.get<RecurringInvoiceCronService>(RecurringInvoiceCronService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
