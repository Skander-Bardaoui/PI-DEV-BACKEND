import { Test, TestingModule } from '@nestjs/testing';
import { PlanSeedService } from './plan-seed.service';

describe('PlanSeedService', () => {
  let instance: PlanSeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanSeedService],
    }).compile();

    instance = module.get<PlanSeedService>(PlanSeedService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
