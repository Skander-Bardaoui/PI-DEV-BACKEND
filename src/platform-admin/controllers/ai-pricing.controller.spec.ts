import { Test, TestingModule } from '@nestjs/testing';
import { AiPricingController } from './ai-pricing.controller';

describe('AiPricingController', () => {
  let instance: AiPricingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiPricingController],
    }).compile();

    instance = module.get<AiPricingController>(AiPricingController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
