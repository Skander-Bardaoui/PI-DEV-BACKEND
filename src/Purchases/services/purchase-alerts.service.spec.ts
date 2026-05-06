import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseAlertsService } from './purchase-alerts.service';

describe('PurchaseAlertsService', () => {
  let instance: PurchaseAlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseAlertsService],
    }).compile();

    instance = module.get<PurchaseAlertsService>(PurchaseAlertsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
