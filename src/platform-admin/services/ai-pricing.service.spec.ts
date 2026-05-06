import { Test, TestingModule } from '@nestjs/testing';
import { AiPricingService } from './ai-pricing.service';

describe('AiPricingService', () => {
  let instance: AiPricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiPricingService],
    }).compile();

    instance = module.get<AiPricingService>(AiPricingService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
