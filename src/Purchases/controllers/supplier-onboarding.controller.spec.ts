import { Test, TestingModule } from '@nestjs/testing';
import { SupplierOnboardingController } from './supplier-onboarding.controller';

describe('SupplierOnboardingController', () => {
  let instance: SupplierOnboardingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierOnboardingController],
    }).compile();

    instance = module.get<SupplierOnboardingController>(SupplierOnboardingController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
