import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from '../services/suppliers.service';
import { SupplierRecommendationService } from '../services/supplier-recommendation.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PurchasePermissionGuard } from '../guards/purchase-permission.guard';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;
  let recommendationService: SupplierRecommendationService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
  };

  const mockRecommendationService = {
    recommendSuppliers: jest.fn(),
    calculatePriceCompetitiveness: jest.fn(),
  };

  const businessId = 'business-123';
  const supplierId = 'supplier-456';

  const mockSupplier = {
    id: supplierId,
    business_id: businessId,
    name: 'Test Supplier',
    matricule_fiscal: '1234567A',
    email: 'supplier@test.com',
    phone: '+216 12 345 678',
    category: 'Electronics',
    payment_terms: 30,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Mock Guards
  const mockAuthGuard = { canActivate: jest.fn(() => true) };
  const mockRolesGuard = { canActivate: jest.fn(() => true) };
  const mockPurchasePermissionGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockService,
        },
        {
          provide: SupplierRecommendationService,
          useValue: mockRecommendationService,
        },
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue(mockAuthGuard)
    .overrideGuard(RolesGuard)
    .useValue(mockRolesGuard)
    .overrideGuard(PurchasePermissionGuard)
    .useValue(mockPurchasePermissionGuard)
    .compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
    recommendationService = module.get<SupplierRecommendationService>(SupplierRecommendationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
      const createDto: CreateSupplierDto = {
        name: 'Test Supplier',
        matricule_fiscal: '1234567A',
        email: 'supplier@test.com',
        phone: '+216 12 345 678',
        category: 'Electronics',
      };

      mockService.create.mockResolvedValue(mockSupplier);

      const result = await controller.create(businessId, createDto);

      expect(result).toEqual(mockSupplier);
      expect(service.create).toHaveBeenCalledWith(businessId, createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated suppliers', async () => {
      const query = { page: 1, limit: 20 };
      const mockResponse = {
        data: [mockSupplier],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      };

      mockService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(businessId, query);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });

    it('should filter by search term', async () => {
      const query = { search: 'test' };
      mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 });

      await controller.findAll(businessId, query);

      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });

    it('should filter by category', async () => {
      const query = { category: 'Electronics' };
      mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 });

      await controller.findAll(businessId, query);

      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });

    it('should filter by is_active status', async () => {
      const query = { is_active: true };
      mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 });

      await controller.findAll(businessId, query);

      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });
  });

  describe('findOne', () => {
    it('should return a single supplier', async () => {
      mockService.findOne.mockResolvedValue(mockSupplier);

      const result = await controller.findOne(businessId, supplierId);

      expect(result).toEqual(mockSupplier);
      expect(service.findOne).toHaveBeenCalledWith(businessId, supplierId);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const updateDto: UpdateSupplierDto = {
        email: 'newemail@test.com',
        phone: '+216 98 765 432',
      };

      const updatedSupplier = { ...mockSupplier, ...updateDto };
      mockService.update.mockResolvedValue(updatedSupplier);

      const result = await controller.update(businessId, supplierId, updateDto);

      expect(result).toEqual(updatedSupplier);
      expect(service.update).toHaveBeenCalledWith(businessId, supplierId, updateDto);
    });
  });

  describe('archive', () => {
    it('should archive a supplier', async () => {
      const mockResponse = { message: 'Fournisseur "Test Supplier" archivé avec succès.' };
      mockService.archive.mockResolvedValue(mockResponse);

      const result = await controller.archive(businessId, supplierId);

      expect(result).toEqual(mockResponse);
      expect(service.archive).toHaveBeenCalledWith(businessId, supplierId);
    });
  });

  describe('restore', () => {
    it('should restore an archived supplier', async () => {
      const restoredSupplier = { ...mockSupplier, is_active: true };
      mockService.restore.mockResolvedValue(restoredSupplier);

      const result = await controller.restore(businessId, supplierId);

      expect(result).toEqual(restoredSupplier);
      expect(service.restore).toHaveBeenCalledWith(businessId, supplierId);
    });
  });

  describe('getRecommendations', () => {
    it('should return supplier recommendations', async () => {
      const mockRecommendations = [
        {
          supplier: mockSupplier,
          score: 85,
          reasons: ['High quality', 'Good pricing'],
        },
      ];

      const mockWithPriceComparison = [
        {
          ...mockRecommendations[0],
          priceCompetitiveness: 'competitive',
        },
      ];

      mockRecommendationService.recommendSuppliers.mockResolvedValue(mockRecommendations);
      mockRecommendationService.calculatePriceCompetitiveness.mockResolvedValue(mockWithPriceComparison);

      const result = await controller.getRecommendations(businessId, 'Laptop', 'Electronics');

      expect(result).toEqual(mockWithPriceComparison);
      expect(recommendationService.recommendSuppliers).toHaveBeenCalledWith(
        businessId,
        'Laptop',
        'Electronics',
      );
      expect(recommendationService.calculatePriceCompetitiveness).toHaveBeenCalledWith(mockRecommendations);
    });

    it('should work without product and category filters', async () => {
      mockRecommendationService.recommendSuppliers.mockResolvedValue([]);
      mockRecommendationService.calculatePriceCompetitiveness.mockResolvedValue([]);

      await controller.getRecommendations(businessId);

      expect(recommendationService.recommendSuppliers).toHaveBeenCalledWith(
        businessId,
        undefined,
        undefined,
      );
    });
  });
});
