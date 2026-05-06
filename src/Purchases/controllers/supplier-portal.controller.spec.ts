import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPortalController } from './supplier-portal.controller';

describe('SupplierPortalController', () => {
  let instance: SupplierPortalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierPortalController],
    }).compile();

    instance = module.get<SupplierPortalController>(SupplierPortalController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
