import { Test, TestingModule } from '@nestjs/testing';
import { SupplierAiInsightsService } from './supplier-ai-insights.service';

describe('SupplierAiInsightsService', () => {
  let instance: SupplierAiInsightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierAiInsightsService],
    }).compile();

    instance = module.get<SupplierAiInsightsService>(SupplierAiInsightsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
