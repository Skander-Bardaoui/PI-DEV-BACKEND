import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPOsController } from './supplier-pos.controller';
import { SupplierPOsService } from '../services/supplier-pos.service';
import { PoAiGeneratorService } from '../services/po-ai-generator.service';

describe('SupplierPOsController', () => {
  let controller: SupplierPOsController;
  let supplierPOsService: any;
  let aiGenerator: any;

  beforeEach(async () => {
    supplierPOsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      send: jest.fn(),
      confirm: jest.fn(),
      cancel: jest.fn(),
    };

    aiGenerator = {
      generateFromText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierPOsController],
      providers: [
        {
          provide: SupplierPOsService,
          useValue: supplierPOsService,
        },
        {
          provide: PoAiGeneratorService,
          useValue: aiGenerator,
        },
      ],
    }).compile();

    controller = module.get<SupplierPOsController>(SupplierPOsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('generateFromText', () => {
    it('devrait générer un BC à partir de texte', async () => {
      const businessId = 'business-1';
      const body = { text: 'Commander 500 kg de farine chez Imenn' };
      const mockGenerated = {
        supplier_id: 'supplier-1',
        items: [{ description: 'Farine', quantity: 500 }],
      };

      aiGenerator.generateFromText.mockResolvedValue(mockGenerated);

      const result = await controller.generateFromText(businessId, body);

      expect(result).toEqual(mockGenerated);
      expect(aiGenerator.generateFromText).toHaveBeenCalledWith(businessId, body.text);
    });
  });

  describe('create', () => {
    it('devrait créer un bon de commande', async () => {
      const businessId = 'business-1';
      const createDto = {
        supplier_id: 'supplier-1',
        delivery_date: '2026-05-15',
        items: [
          {
            description: 'Farine',
            quantity: 500,
            unit_price_ht: 10,
            tax_rate_value: 19,
          },
        ],
      };

      const mockPO = { id: 'po-1', po_number: 'PO-2026-0001', ...createDto };
      supplierPOsService.create.mockResolvedValue(mockPO);

      const result = await controller.create(businessId, createDto);

      expect(result).toEqual(mockPO);
      expect(supplierPOsService.create).toHaveBeenCalledWith(businessId, createDto);
    });
  });

  describe('findAll', () => {
    it('devrait retourner tous les bons de commande', async () => {
      const businessId = 'business-1';
      const query = { page: 1, limit: 20 };
      const mockPOs = [
        { id: 'po-1', po_number: 'PO-2026-0001' },
        { id: 'po-2', po_number: 'PO-2026-0002' },
      ];

      supplierPOsService.findAll.mockResolvedValue(mockPOs);

      const result = await controller.findAll(businessId, query);

      expect(result).toEqual(mockPOs);
      expect(supplierPOsService.findAll).toHaveBeenCalledWith(businessId, query);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un bon de commande par ID', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const mockPO = { id: poId, po_number: 'PO-2026-0001' };

      supplierPOsService.findOne.mockResolvedValue(mockPO);

      const result = await controller.findOne(businessId, poId);

      expect(result).toEqual(mockPO);
      expect(supplierPOsService.findOne).toHaveBeenCalledWith(businessId, poId);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un bon de commande', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const updateDto = { notes: 'Updated notes' };
      const mockPO = { id: poId, ...updateDto };

      supplierPOsService.update.mockResolvedValue(mockPO);

      const result = await controller.update(businessId, poId, updateDto as any);

      expect(result).toEqual(mockPO);
      expect(supplierPOsService.update).toHaveBeenCalledWith(businessId, poId, updateDto);
    });
  });

  describe('send', () => {
    it('devrait envoyer un bon de commande', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const mockPO = { id: poId, status: 'SENT' };

      supplierPOsService.send.mockResolvedValue(mockPO);

      const result = await controller.send(businessId, poId);

      expect(result).toEqual(mockPO);
      expect(supplierPOsService.send).toHaveBeenCalledWith(businessId, poId);
    });
  });

  describe('confirm', () => {
    it('devrait confirmer un bon de commande', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const mockPO = { id: poId, status: 'CONFIRMED' };

      supplierPOsService.confirm.mockResolvedValue(mockPO);

      const result = await controller.confirm(businessId, poId);

      expect(result).toEqual(mockPO);
      expect(supplierPOsService.confirm).toHaveBeenCalledWith(businessId, poId);
    });
  });

  describe('cancel', () => {
    it('devrait annuler un bon de commande', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const mockPO = { id: poId, status: 'CANCELLED' };

      supplierPOsService.cancel.mockResolvedValue(mockPO);

      const result = await controller.cancel(businessId, poId);

      expect(result).toEqual(mockPO);
      expect(supplierPOsService.cancel).toHaveBeenCalledWith(businessId, poId);
    });
  });
});
