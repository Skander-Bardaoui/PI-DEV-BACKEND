import { Test, TestingModule } from '@nestjs/testing';
import { PublicPlansController } from './public-plans.controller';

describe('PublicPlansController', () => {
  let instance: PublicPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicPlansController],
    }).compile();

    instance = module.get<PublicPlansController>(PublicPlansController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
