import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceCronService } from './invoice-cron.service';

describe('InvoiceCronService', () => {
  let instance: InvoiceCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceCronService],
    }).compile();

    instance = module.get<InvoiceCronService>(InvoiceCronService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
