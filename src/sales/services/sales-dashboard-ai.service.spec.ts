import { Test, TestingModule } from '@nestjs/testing';
import { SalesDashboardAiService } from './sales-dashboard-ai.service';

describe('SalesDashboardAiService', () => {
  let instance: SalesDashboardAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesDashboardAiService],
    }).compile();

    instance = module.get<SalesDashboardAiService>(SalesDashboardAiService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
