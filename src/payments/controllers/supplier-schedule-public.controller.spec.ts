import { Test, TestingModule } from '@nestjs/testing';
import { SupplierSchedulePublicController } from './supplier-schedule-public.controller';

describe('SupplierSchedulePublicController', () => {
  let instance: SupplierSchedulePublicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierSchedulePublicController],
    }).compile();

    instance = module.get<SupplierSchedulePublicController>(SupplierSchedulePublicController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
