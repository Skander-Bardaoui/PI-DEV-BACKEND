import { Test, TestingModule } from '@nestjs/testing';
import { TenantManagementController } from './tenant-management.controller';

describe('TenantManagementController', () => {
  let instance: TenantManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantManagementController],
    }).compile();

    instance = module.get<TenantManagementController>(TenantManagementController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
