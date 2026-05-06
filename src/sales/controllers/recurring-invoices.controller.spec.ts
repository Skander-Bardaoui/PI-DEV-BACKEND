import { Test, TestingModule } from '@nestjs/testing';
import { RecurringInvoicesController } from './recurring-invoices.controller';

describe('RecurringInvoicesController', () => {
  let instance: RecurringInvoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringInvoicesController],
    }).compile();

    instance = module.get<RecurringInvoicesController>(RecurringInvoicesController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
