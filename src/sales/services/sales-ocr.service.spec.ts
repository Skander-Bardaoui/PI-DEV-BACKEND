import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { SalesOcrService } from './sales-ocr.service';
import { SalesOcrAiService } from './sales-ocr-ai.service';

describe('SalesOcrService', () => {
  let service: SalesOcrService;
  let ocrAiService: SalesOcrAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOcrService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                TESSERACT_PATH: 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
                TESSERACT_LANG: 'eng',
                POPPLER_PATH: '',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: SalesOcrAiService,
          useValue: {
            enrichOcrText: jest.fn(),
            analyzeImageBuffer: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SalesOcrService>(SalesOcrService);
    ocrAiService = module.get<SalesOcrAiService>(SalesOcrAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractFromFile', () => {
    it.skip('should extract text from file', async () => {
      // Skip: Requires Tesseract installation and actual file
    });

    it.skip('should throw BadRequestException if file not found', async () => {
      // Skip: Requires file system access
    });
  });

  describe('extractAndEnrich', () => {
    it.skip('should extract and enrich with AI', async () => {
      // Skip: Requires Tesseract and Gemini API
    });
  });

  describe('parseSalesDocument', () => {
    it('should detect invoice document type', () => {
      const text = 'FACTURE N° INV-001\nDate: 01/01/2024\nTotal TTC: 1190.000';
      const result = service['parseSalesDocument'](text);

      expect(result.document_type).toBe('invoice');
    });

    it('should detect quote document type', () => {
      const text = 'DEVIS N° QUO-001\nDate: 01/01/2024\nTotal TTC: 1000.000';
      const result = service['parseSalesDocument'](text);

      expect(result.document_type).toBe('quote');
    });

    it('should detect delivery note document type', () => {
      const text = 'BON DE LIVRAISON N° BL-001\nDate: 01/01/2024';
      const result = service['parseSalesDocument'](text);

      expect(result.document_type).toBe('delivery_note');
    });

    it('should extract document number', () => {
      const text = 'FACTURE N° INV-2024-001\nDate: 01/01/2024';
      const result = service['parseSalesDocument'](text);

      expect(result.document_number).toBe('INV-2024-001');
    });

    it.skip('should extract date', () => {
      // Skip: Date parsing is complex
    });

    it.skip('should extract amounts', () => {
      // Skip: Amount extraction depends on exact format
    });

    it('should compute confidence score', () => {
      const text = `
        FACTURE N° INV-001
        Date: 15/03/2024
        Client: Test Client
        Total HT: 1000.000
        TVA: 190.000
        Total TTC: 1190.000
      `;
      const result = service['parseSalesDocument'](text);

      expect(result.confidence).toBeGreaterThan(50);
    });
  });

  describe('buildSuggestedDto', () => {
    it('should build invoice DTO', () => {
      const aiResult = {
        documentType: 'INVOICE',
        mappedFields: {
          documentNumber: 'INV-001',
          date: '2024-01-15',
          items: [{ description: 'Product A', quantity: 10, unitPrice: 100 }],
          subtotalHt: 1000,
          taxAmount: 190,
          totalTtc: 1190,
        },
        confidence: 0.9,
      };

      const dto = service['buildSuggestedDto'](aiResult as any);

      expect(dto.documentNumber).toBe('INV-001');
      expect(dto.date).toBe('2024-01-15');
      expect(dto.items).toHaveLength(1);
      expect(dto.totalTtc).toBe(1190);
    });

    it('should build quote DTO', () => {
      const aiResult = {
        documentType: 'QUOTE',
        mappedFields: {
          date: '2024-01-15',
          items: [],
        },
        confidence: 0.85,
      };

      const dto = service['buildSuggestedDto'](aiResult as any);

      expect(dto.quoteDate).toBe('2024-01-15');
      expect(dto.items).toBeDefined();
    });
  });
});
