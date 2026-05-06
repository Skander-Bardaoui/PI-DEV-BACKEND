import { Test, TestingModule } from '@nestjs/testing';
import { SupplierScoringController } from './supplier-scoring.controller';

describe('SupplierScoringController', () => {
  let instance: SupplierScoringController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierScoringController],
    }).compile();

    instance = module.get<SupplierScoringController>(SupplierScoringController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
