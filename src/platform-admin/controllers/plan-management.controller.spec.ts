import { Test, TestingModule } from '@nestjs/testing';
import { PlanManagementController } from './plan-management.controller';

describe('PlanManagementController', () => {
  let instance: PlanManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanManagementController],
    }).compile();

    instance = module.get<PlanManagementController>(PlanManagementController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
