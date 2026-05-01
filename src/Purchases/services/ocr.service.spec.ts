import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { PurchaseOcrAiService } from './purchase-ocr-ai.service';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('child_process');

describe('OcrService', () => {
  let service: OcrService;
  let configService: ConfigService;
  let ocrAiService: PurchaseOcrAiService;

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

  const mockOcrAiService = {
    enrichOcrText: jest.fn(),
    analyzeImageBuffer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PurchaseOcrAiService,
          useValue: mockOcrAiService,
        },
      ],
    }).compile();

    service = module.get<OcrService>(OcrService);
    configService = module.get<ConfigService>(ConfigService);
    ocrAiService = module.get<PurchaseOcrAiService>(PurchaseOcrAiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractFromFile', () => {
    it('should throw BadRequestException if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.extractFromFile('/path/to/nonexistent.pdf')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('extractAndEnrich', () => {
    it('should throw BadRequestException if no text extracted', async () => {
      const buffer = Buffer.from('test');
      const mimeType = 'image/png';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      // Mock runTesseract to return empty text
      jest.spyOn(service as any, 'runTesseract').mockResolvedValue('');

      await expect(
        service.extractAndEnrich(buffer, mimeType)
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully extract and enrich with AI', async () => {
      const buffer = Buffer.from('test');
      const mimeType = 'image/png';
      const rawText = 'FACTURE N° 12345\nDate: 01/01/2024\nTotal TTC: 1000.000 TND';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      jest.spyOn(service as any, 'runTesseract').mockResolvedValue(rawText);
      
      const aiEnrichment = {
        documentType: 'PURCHASE_INVOICE',
        mappedFields: {
          invoiceNumber: '12345',
          invoiceDate: '2024-01-01',
          totalTtc: 1000,
        },
        confidence: 0.9,
      };

      mockOcrAiService.enrichOcrText.mockResolvedValue(aiEnrichment);
      mockOcrAiService.analyzeImageBuffer.mockResolvedValue(aiEnrichment);

      const result = await service.extractAndEnrich(buffer, mimeType);

      expect(result).toBeDefined();
      expect(result.document_type).toBe('purchase_invoice');
      expect(result.ai_enrichment).toEqual(aiEnrichment);
      expect(result.vision_enrichment).toEqual(aiEnrichment);
      expect(mockOcrAiService.enrichOcrText).toHaveBeenCalledWith(rawText);
      expect(mockOcrAiService.analyzeImageBuffer).toHaveBeenCalledWith(buffer, mimeType);
    });
  });

  describe('parsePurchaseDocument', () => {
    it('should detect purchase invoice document type', () => {
      const text = 'FACTURE N° 12345\nDate: 01/01/2024';
      const result = (service as any).parsePurchaseDocument(text);

      expect(result.document_type).toBe('purchase_invoice');
    });

    it('should detect purchase order document type', () => {
      const text = 'BON DE COMMANDE N° 12345\nDate: 01/01/2024';
      const result = (service as any).parsePurchaseDocument(text);

      expect(result.document_type).toBe('purchase_order');
    });

    it('should extract invoice number', () => {
      const text = 'FACTURE N° INV-2024-001\nDate: 01/01/2024';
      const result = (service as any).parsePurchaseDocument(text);

      expect(result.invoice_number).toBe('INV-2024-001');
    });

    it('should extract date', () => {
      const text = 'FACTURE N° 12345\nDate: 15/03/2024';
      const result = (service as any).parsePurchaseDocument(text);

      expect(result.invoice_date).toBe('2024-03-15');
    });

    it('should extract amounts', () => {
      const text = `
        FACTURE N° 12345
        Total HT: 1000.000
        Total TVA: 190.000
        Timbre Fiscal: 1.000
        Total TTC: 1191.000
      `;
      const result = (service as any).parsePurchaseDocument(text);

      expect(result.subtotal_ht).toBe(1000);
      expect(result.tax_amount).toBe(190);
      expect(result.timbre_fiscal).toBe(1);
      expect(result.total_ttc).toBe(1191);
    });

    it('should compute confidence score', () => {
      const text = `
        FACTURE N° 12345
        Date: 15/03/2024
        Fournisseur: ABC Company
        Total HT: 1000.000
        Total TVA: 190.000
        Total TTC: 1191.000
      `;
      const result = (service as any).parsePurchaseDocument(text);

      expect(result.confidence).toBeGreaterThan(50);
    });
  });

  describe('buildSuggestedDto', () => {
    it('should build purchase invoice DTO', () => {
      const aiResult = {
        documentType: 'PURCHASE_INVOICE',
        mappedFields: {
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-01',
          items: [],
          subtotalHt: 1000,
          taxAmount: 190,
          totalTtc: 1191,
        },
        confidence: 0.9,
      };

      const dto = (service as any).buildSuggestedDto(aiResult);

      expect(dto.invoiceNumberSupplier).toBe('INV-001');
      expect(dto.invoiceDate).toBe('2024-01-01');
      expect(dto.subtotalHt).toBe(1000);
      expect(dto.taxAmount).toBe(190);
      expect(dto.netAmount).toBe(1191);
    });

    it('should build purchase order DTO', () => {
      const aiResult = {
        documentType: 'PURCHASE_ORDER',
        mappedFields: {
          invoiceDate: '2024-01-01',
          dueDate: '2024-02-01',
          items: [],
        },
        confidence: 0.9,
      };

      const dto = (service as any).buildSuggestedDto(aiResult);

      expect(dto.orderDate).toBe('2024-01-01');
      expect(dto.expectedDelivery).toBe('2024-02-01');
    });
  });
});
