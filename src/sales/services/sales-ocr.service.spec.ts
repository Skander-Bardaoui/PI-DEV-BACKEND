import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SalesOcrService } from './sales-ocr.service';
import { SalesOcrAiService } from './sales-ocr-ai.service';

describe('SalesOcrService', () => {
  let service: SalesOcrService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        TESSERACT_PATH: 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
        TESSERACT_LANG: 'eng',
        POPPLER_PATH: '',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockSalesOcrAiService = {
    enrichOcrData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOcrService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SalesOcrAiService,
          useValue: mockSalesOcrAiService,
        },
      ],
    }).compile();

    service = module.get<SalesOcrService>(SalesOcrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
