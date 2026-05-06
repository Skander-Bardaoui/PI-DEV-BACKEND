import { Test, TestingModule } from '@nestjs/testing';
import { RecurringInvoicesService } from './recurring-invoices.service';

describe('RecurringInvoicesService', () => {
  let instance: RecurringInvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringInvoicesService],
    }).compile();

    instance = module.get<RecurringInvoicesService>(RecurringInvoicesService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
