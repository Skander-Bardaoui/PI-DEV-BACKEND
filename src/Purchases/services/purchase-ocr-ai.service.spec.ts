import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PurchaseOcrAiService } from './purchase-ocr-ai.service';

describe('PurchaseOcrAiService', () => {
  let service: PurchaseOcrAiService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'GEMINI_API_KEY') return 'test-api-key';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOcrAiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PurchaseOcrAiService>(PurchaseOcrAiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enrichOcrText', () => {
    it('should return error if API key not configured', async () => {
      mockConfigService.get.mockReturnValueOnce('');

      const result = await service.enrichOcrText('Test text');

      expect(result.documentType).toBe('UNKNOWN');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    }, 15000);

    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API error'));

      const result = await service.enrichOcrText('Test text');

      expect(result.documentType).toBe('UNKNOWN');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});
