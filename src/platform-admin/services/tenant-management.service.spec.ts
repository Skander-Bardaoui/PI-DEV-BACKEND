import { Test, TestingModule } from '@nestjs/testing';
import { TenantManagementService } from './tenant-management.service';

describe('TenantManagementService', () => {
  let instance: TenantManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantManagementService],
    }).compile();

    instance = module.get<TenantManagementService>(TenantManagementService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
