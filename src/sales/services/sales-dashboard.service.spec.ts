import { Test, TestingModule } from '@nestjs/testing';
import { SalesDashboardService } from './sales-dashboard.service';

describe('SalesDashboardService', () => {
  let instance: SalesDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesDashboardService],
    }).compile();

    instance = module.get<SalesDashboardService>(SalesDashboardService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
