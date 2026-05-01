import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from '../services/suppliers.service';
import { SupplierRecommendationService } from '../services/supplier-recommendation.service';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let suppliersService: any;
  let recommendationService: any;

  beforeEach(async () => {
    suppliersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      restore: jest.fn(),
    };

    recommendationService = {
      recommendSuppliers: jest.fn(),
      calculatePriceCompetitiveness: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: suppliersService,
        },
        {
          provide: SupplierRecommendationService,
          useValue: recommendationService,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer un fournisseur', async () => {
      const businessId = 'business-1';
      const createDto = {
        name: 'Test Supplier',
        email: 'supplier@test.com',
        phone: '+21612345678',
        address: 'Test Address',
      };

      const mockSupplier = { id: 'supplier-1', ...createDto };
      suppliersService.create.mockResolvedValue(mockSupplier);

      const result = await controller.create(businessId, createDto as any);

      expect(result).toEqual(mockSupplier);
      expect(suppliersService.create).toHaveBeenCalledWith(businessId, createDto);
    });
  });

  describe('findAll', () => {
    it('devrait retourner tous les fournisseurs', async () => {
      const businessId = 'business-1';
      const query = { page: 1, limit: 20 };
      const mockSuppliers = [
        { id: 'supplier-1', name: 'Supplier 1' },
        { id: 'supplier-2', name: 'Supplier 2' },
      ];

      suppliersService.findAll.mockResolvedValue(mockSuppliers);

      const result = await controller.findAll(businessId, query as any);

      expect(result).toEqual(mockSuppliers);
      expect(suppliersService.findAll).toHaveBeenCalledWith(businessId, query);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un fournisseur par ID', async () => {
      const businessId = 'business-1';
      const supplierId = 'supplier-1';
      const mockSupplier = { id: supplierId, name: 'Test Supplier' };

      suppliersService.findOne.mockResolvedValue(mockSupplier);

      const result = await controller.findOne(businessId, supplierId);

      expect(result).toEqual(mockSupplier);
      expect(suppliersService.findOne).toHaveBeenCalledWith(businessId, supplierId);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un fournisseur', async () => {
      const businessId = 'business-1';
      const supplierId = 'supplier-1';
      const updateDto = { name: 'Updated Supplier' };
      const mockSupplier = { id: supplierId, ...updateDto };

      suppliersService.update.mockResolvedValue(mockSupplier);

      const result = await controller.update(businessId, supplierId, updateDto as any);

      expect(result).toEqual(mockSupplier);
      expect(suppliersService.update).toHaveBeenCalledWith(businessId, supplierId, updateDto);
    });
  });

  describe('archive', () => {
    it('devrait archiver un fournisseur', async () => {
      const businessId = 'business-1';
      const supplierId = 'supplier-1';
      const mockResult = { message: 'Supplier archived' };

      suppliersService.archive.mockResolvedValue(mockResult);

      const result = await controller.archive(businessId, supplierId);

      expect(result).toEqual(mockResult);
      expect(suppliersService.archive).toHaveBeenCalledWith(businessId, supplierId);
    });
  });

  describe('restore', () => {
    it('devrait restaurer un fournisseur archivé', async () => {
      const businessId = 'business-1';
      const supplierId = 'supplier-1';
      const mockSupplier = { id: supplierId, name: 'Restored Supplier', is_archived: false };

      suppliersService.restore.mockResolvedValue(mockSupplier);

      const result = await controller.restore(businessId, supplierId);

      expect(result).toEqual(mockSupplier);
      expect(suppliersService.restore).toHaveBeenCalledWith(businessId, supplierId);
    });
  });

  describe('getRecommendations', () => {
    it('devrait retourner des recommandations de fournisseurs', async () => {
      const businessId = 'business-1';
      const product = 'Farine';
      const category = 'Alimentation';

      const mockRecommendations = [
        { id: 'supplier-1', name: 'Supplier 1', score: 0.9 },
        { id: 'supplier-2', name: 'Supplier 2', score: 0.8 },
      ];

      const mockWithPrices = mockRecommendations.map(s => ({
        ...s,
        priceCompetitiveness: 'competitive',
      }));

      recommendationService.recommendSuppliers.mockResolvedValue(mockRecommendations);
      recommendationService.calculatePriceCompetitiveness.mockResolvedValue(mockWithPrices);

      const result = await controller.getRecommendations(businessId, product, category);

      expect(result).toEqual(mockWithPrices);
      expect(recommendationService.recommendSuppliers).toHaveBeenCalledWith(
        businessId,
        product,
        category,
      );
      expect(recommendationService.calculatePriceCompetitiveness).toHaveBeenCalledWith(
        mockRecommendations,
      );
    });
  });
});
