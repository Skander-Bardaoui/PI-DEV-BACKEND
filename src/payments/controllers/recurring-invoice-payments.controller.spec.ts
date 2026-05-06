import { Test, TestingModule } from '@nestjs/testing';
import { RecurringInvoicePaymentsController } from './recurring-invoice-payments.controller';

describe('RecurringInvoicePaymentsController', () => {
  let instance: RecurringInvoicePaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringInvoicePaymentsController],
    }).compile();

    instance = module.get<RecurringInvoicePaymentsController>(RecurringInvoicePaymentsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
