import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPOsController } from './supplier-pos.controller';

describe('SupplierPOsController', () => {
  let instance: SupplierPOsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierPOsController],
    }).compile();

    instance = module.get<SupplierPOsController>(SupplierPOsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
