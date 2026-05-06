import { Test, TestingModule } from '@nestjs/testing';
import { SalesOcrController } from './sales-ocr.controller';

describe('SalesOcrController', () => {
  let instance: SalesOcrController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesOcrController],
    }).compile();

    instance = module.get<SalesOcrController>(SalesOcrController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
