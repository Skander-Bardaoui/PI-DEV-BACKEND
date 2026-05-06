import { Test, TestingModule } from '@nestjs/testing';
import { OcrService } from './ocr.service';

describe('OcrService', () => {
  let instance: OcrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrService],
    }).compile();

    instance = module.get<OcrService>(OcrService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
