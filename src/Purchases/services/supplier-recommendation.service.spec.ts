import { Test, TestingModule } from '@nestjs/testing';
import { SupplierRecommendationService } from './supplier-recommendation.service';

describe('SupplierRecommendationService', () => {
  let instance: SupplierRecommendationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierRecommendationService],
    }).compile();

    instance = module.get<SupplierRecommendationService>(SupplierRecommendationService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
