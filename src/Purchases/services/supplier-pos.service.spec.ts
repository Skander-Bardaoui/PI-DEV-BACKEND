import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPOsService } from './supplier-pos.service';

describe('SupplierPOsService', () => {
  let instance: SupplierPOsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierPOsService],
    }).compile();

    instance = module.get<SupplierPOsService>(SupplierPOsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
