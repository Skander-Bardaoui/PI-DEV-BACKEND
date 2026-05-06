import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  let instance: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardController],
    }).compile();

    instance = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
