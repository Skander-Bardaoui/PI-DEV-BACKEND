import { Test, TestingModule } from '@nestjs/testing';
import { PaymentManagementController } from './payment-management.controller';

describe('PaymentManagementController', () => {
  let instance: PaymentManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentManagementController],
    }).compile();

    instance = module.get<PaymentManagementController>(PaymentManagementController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
