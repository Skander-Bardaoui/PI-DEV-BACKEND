import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPortalService } from './supplier-portal.service';

describe('SupplierPortalService', () => {
  let instance: SupplierPortalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierPortalService],
    }).compile();

    instance = module.get<SupplierPortalService>(SupplierPortalService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
