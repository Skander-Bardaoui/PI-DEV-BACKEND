import { Test, TestingModule } from '@nestjs/testing';
import { OcrController } from './ocr.controller';
import { OcrService } from '../services/ocr.service';

describe('OcrController', () => {
  let controller: OcrController;
  let service: OcrService;

  const mockService = {
    extractFromFile: jest.fn(),
    extractAndEnrich: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrController],
      providers: [
        {
          provide: OcrService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OcrController>(OcrController);
    service = module.get<OcrService>(OcrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
