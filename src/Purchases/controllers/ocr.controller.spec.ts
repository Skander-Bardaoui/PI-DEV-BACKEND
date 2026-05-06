import { Test, TestingModule } from '@nestjs/testing';
import { OcrController } from './ocr.controller';

describe('OcrController', () => {
  let instance: OcrController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrController],
    }).compile();

    instance = module.get<OcrController>(OcrController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
