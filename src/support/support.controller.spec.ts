import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller';

describe('SupportController', () => {
  let instance: SupportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportController],
    }).compile();

    instance = module.get<SupportController>(SupportController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
