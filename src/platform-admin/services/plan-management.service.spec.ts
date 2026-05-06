import { Test, TestingModule } from '@nestjs/testing';
import { PlanManagementService } from './plan-management.service';

describe('PlanManagementService', () => {
  let instance: PlanManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanManagementService],
    }).compile();

    instance = module.get<PlanManagementService>(PlanManagementService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
