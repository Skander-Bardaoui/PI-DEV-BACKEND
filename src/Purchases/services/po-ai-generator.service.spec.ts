import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PoAiGeneratorService } from './po-ai-generator.service';
import { Supplier } from '../entities/supplier.entity';

describe('PoAiGeneratorService', () => {
  let service: PoAiGeneratorService;
  let supplierRepo: any;
  let configService: any;

  beforeEach(async () => {
    supplierRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    configService = {
      get: jest.fn((key, defaultValue) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoAiGeneratorService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: supplierRepo,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<PoAiGeneratorService>(PoAiGeneratorService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('generateFromText', () => {
    const businessId = 'business-1';
    const mockSupplier = {
      id: 'supplier-1',
      name: 'Imenn',
      business_id: businessId,
    };

    beforeEach(() => {
      supplierRepo.findOne.mockResolvedValue(mockSupplier);
      supplierRepo.find.mockResolvedValue([mockSupplier]);
    });

    it('devrait rejeter si le texte est vide', async () => {
      await expect(service.generateFromText(businessId, '')).rejects.toThrow(
        'Veuillez saisir une description',
      );
    });

    it('devrait rejeter si le texte est undefined', async () => {
      await expect(service.generateFromText(businessId, undefined)).rejects.toThrow(
        'Veuillez saisir une description',
      );
    });

    it('devrait rejeter si le texte est null', async () => {
      await expect(service.generateFromText(businessId, null as any)).rejects.toThrow(
        'Veuillez saisir une description',
      );
    });

    it('devrait rejeter si GEMINI_API_KEY n\'est pas configurée', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return '';
        return 'default-value';
      });
      
      await expect(
        service.generateFromText(businessId, 'Commander 500 kg de farine'),
      ).rejects.toThrow();
    }, 15000);

    it('devrait générer un BC à partir d\'un texte simple avec parsing manuel', async () => {
      const text = 'Commander 500 kg de farine chez Imenn pour le 15 avril à 20dt le kg';

      // Mock fetch pour simuler une erreur Gemini (fallback vers parsing manuel)
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service unavailable'),
      }) as any;

      const result = await service.generateFromText(businessId, text);

      expect(result).toBeDefined();
      expect(result.supplier_id).toBe(mockSupplier.id);
      expect(result.supplier_name).toBe(mockSupplier.name);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].description).toContain('Farine');
      expect(result.items[0].quantity).toBe(500);
      expect(result.confidence).toBeGreaterThan(0);
    }, 10000);

    it('devrait lever une exception si le fournisseur n\'existe pas', async () => {
      const text = 'Commander 500 kg de farine chez FournisseurInconnu';

      supplierRepo.findOne.mockResolvedValue(null);
      supplierRepo.find.mockResolvedValue([]);

      // Mock fetch pour parsing manuel
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service unavailable'),
      }) as any;

      await expect(service.generateFromText(businessId, text)).rejects.toThrow(
        NotFoundException,
      );
    }, 10000);

    it('devrait utiliser un prix par défaut si non spécifié', async () => {
      const text = 'Commander 500 kg de farine chez Imenn';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service unavailable'),
      }) as any;

      const result = await service.generateFromText(businessId, text);

      expect(result.items[0].unit_price_ht).toBeGreaterThan(0);
    }, 10000);

    it('devrait utiliser une date de livraison par défaut si non spécifiée', async () => {
      const text = 'Commander 500 kg de farine chez Imenn';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service unavailable'),
      }) as any;

      const result = await service.generateFromText(businessId, text);

      expect(result.delivery_date).toBeDefined();
      expect(result.delivery_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }, 10000);

    it('devrait parser correctement les prix en dinars', async () => {
      const text = 'Commander 500 kg de farine chez Imenn à 25dt le kg';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service unavailable'),
      }) as any;

      const result = await service.generateFromText(businessId, text);

      expect(result.items[0].unit_price_ht).toBe(25);
    }, 10000);

    it('devrait parser correctement les dates en français', async () => {
      const text = 'Commander 500 kg de farine chez Imenn pour le 15 avril';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service unavailable'),
      }) as any;

      const result = await service.generateFromText(businessId, text);

      expect(result.delivery_date).toMatch(/2026-04-15/);
    }, 10000);

    it('devrait gérer les réponses Gemini valides', async () => {
      const text = 'Commander 500 kg de farine chez Imenn';
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    productName: 'Farine',
                    quantity: 500,
                    unit: 'kg',
                    supplierName: 'Imenn',
                    deliveryDate: '2026-04-15',
                    estimatedPrice: 20,
                    notes: null,
                  }),
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockGeminiResponse),
      }) as any;

      const result = await service.generateFromText(businessId, text);

      expect(result).toBeDefined();
      expect(result.items[0].description).toContain('Farine');
      expect(result.items[0].quantity).toBe(500);
      expect(result.items[0].unit_price_ht).toBe(20);
    }, 10000);

    it('devrait retry en cas d\'erreur 503 de Gemini', async () => {
      const text = 'Commander 500 kg de farine chez Imenn';
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({
            ok: false,
            status: 503,
            text: jest.fn().mockResolvedValue('Service unavailable'),
          });
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        productName: 'Farine',
                        quantity: 500,
                        unit: 'kg',
                        supplierName: 'Imenn',
                        deliveryDate: '2026-04-15',
                        estimatedPrice: 20,
                        notes: null,
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        });
      }) as any;

      const result = await service.generateFromText(businessId, text);

      expect(result).toBeDefined();
      expect(callCount).toBeGreaterThan(1);
    }, 15000);
  });
});
