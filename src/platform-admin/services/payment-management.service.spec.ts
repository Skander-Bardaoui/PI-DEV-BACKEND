import { Test, TestingModule } from '@nestjs/testing';
import { PaymentManagementService } from './payment-management.service';

describe('PaymentManagementService', () => {
  let instance: PaymentManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentManagementService],
    }).compile();

    instance = module.get<PaymentManagementService>(PaymentManagementService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
