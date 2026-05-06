import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseAlertsController } from './purchase-alerts.controller';

describe('PurchaseAlertsController', () => {
  let instance: PurchaseAlertsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseAlertsController],
    }).compile();

    instance = module.get<PurchaseAlertsController>(PurchaseAlertsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
