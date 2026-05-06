import { Test, TestingModule } from '@nestjs/testing';
import { SalesDashboardController } from './sales-dashboard.controller';

describe('SalesDashboardController', () => {
  let instance: SalesDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesDashboardController],
    }).compile();

    instance = module.get<SalesDashboardController>(SalesDashboardController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
