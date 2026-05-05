import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { GoodsReceipt } from '../entities/goods-receipt.entity';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { POStatus } from '../enum/po-status.enum';
import { InvoiceStatus } from '../enum/invoice-status.enum';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let supplierRepo: Repository<Supplier>;
  let supplierPORepo: Repository<SupplierPO>;
  let invoiceRepo: Repository<PurchaseInvoice>;
  let goodsReceiptRepo: Repository<GoodsReceipt>;

  const mockSupplierRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockSupplierPORepo = {
    count: jest.fn(),
  };

  const mockInvoiceRepo = {
    count: jest.fn(),
  };

  const mockGoodsReceiptRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };

  const businessId = 'business-123';
  const supplierId = 'supplier-456';

  const mockSupplier: Partial<Supplier> = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepo,
        },
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: mockSupplierPORepo,
        },
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(GoodsReceipt),
          useValue: mockGoodsReceiptRepo,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    supplierRepo = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    supplierPORepo = module.get<Repository<SupplierPO>>(getRepositoryToken(SupplierPO));
    invoiceRepo = module.get<Repository<PurchaseInvoice>>(getRepositoryToken(PurchaseInvoice));
    goodsReceiptRepo = module.get<Repository<GoodsReceipt>>(getRepositoryToken(GoodsReceipt));

    jest.clearAllMocks();
    mockGoodsReceiptRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      mockSupplierRepo.findOne.mockResolvedValue(null);
      mockSupplierRepo.create.mockReturnValue(mockSupplier);
      mockSupplierRepo.save.mockResolvedValue(mockSupplier);

      const result = await service.create(businessId, createDto);

      expect(result).toEqual(mockSupplier);
      expect(mockSupplierRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          business_id: businessId,
          payment_terms: 30,
          is_active: true,
        }),
      );
      expect(mockSupplierRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if supplier with same name exists', async () => {
      const createDto: CreateSupplierDto = {
        name: 'Test Supplier',
        matricule_fiscal: '1234567A',
        email: 'supplier@test.com',
      };

      mockSupplierRepo.findOne.mockResolvedValue(mockSupplier);

      await expect(service.create(businessId, createDto)).rejects.toThrow(ConflictException);
    });

    it('should use custom payment_terms if provided', async () => {
      const createDto: CreateSupplierDto = {
        name: 'Test Supplier',
        matricule_fiscal: '1234567A',
        email: 'supplier@test.com',
        payment_terms: 60,
      };

      mockSupplierRepo.findOne.mockResolvedValue(null);
      mockSupplierRepo.create.mockReturnValue({ ...mockSupplier, payment_terms: 60 });
      mockSupplierRepo.save.mockResolvedValue({ ...mockSupplier, payment_terms: 60 });

      const result = await service.create(businessId, createDto);

      expect(result.payment_terms).toBe(60);
    });
  });

  describe('findAll', () => {
    it('should return paginated suppliers', async () => {
      const query = { page: 1, limit: 20 };
      const mockSuppliers = [mockSupplier];

      mockSupplierRepo.findAndCount.mockResolvedValue([mockSuppliers, 1]);

      const result = await service.findAll(businessId, query);

      expect(result).toEqual({
        data: mockSuppliers,
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      });
    });

    it('should filter by search term across multiple fields', async () => {
      const query = { search: 'test', page: 1, limit: 20 };

      mockSupplierRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, query);

      expect(mockSupplierRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ name: expect.anything() }),
            expect.objectContaining({ email: expect.anything() }),
            expect.objectContaining({ phone: expect.anything() }),
          ]),
        }),
      );
    });

    it('should filter by category', async () => {
      const query = { category: 'Electronics', page: 1, limit: 20 };

      mockSupplierRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, query);

      expect(mockSupplierRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ category: 'Electronics' }),
          ]),
        }),
      );
    });

    it('should filter by is_active status', async () => {
      const query = { is_active: true, page: 1, limit: 20 };

      mockSupplierRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, query);

      expect(mockSupplierRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ is_active: true }),
          ]),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      mockSupplierRepo.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findOne(businessId, supplierId);

      expect(result).toEqual(mockSupplier);
      expect(mockSupplierRepo.findOne).toHaveBeenCalledWith({
        where: { id: supplierId, business_id: businessId },
      });
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockSupplierRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(businessId, supplierId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const updateDto: UpdateSupplierDto = {
        email: 'newemail@test.com',
        phone: '+216 98 765 432',
      };

      mockSupplierRepo.findOne.mockResolvedValue(mockSupplier);
      mockSupplierRepo.save.mockResolvedValue({ ...mockSupplier, ...updateDto });

      const result = await service.update(businessId, supplierId, updateDto);

      expect(result.email).toBe('newemail@test.com');
      expect(mockSupplierRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateDto: UpdateSupplierDto = {
        name: 'Existing Supplier',
      };

      mockSupplierRepo.findOne
        .mockResolvedValueOnce(mockSupplier)
        .mockResolvedValueOnce({ ...mockSupplier, id: 'different-id', name: 'Existing Supplier' });

      await expect(service.update(businessId, supplierId, updateDto)).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same name', async () => {
      const updateDto: UpdateSupplierDto = {
        name: 'Test Supplier',
      };

      mockSupplierRepo.findOne.mockResolvedValue(mockSupplier);
      mockSupplierRepo.save.mockResolvedValue(mockSupplier);

      const result = await service.update(businessId, supplierId, updateDto);

      expect(result).toEqual(mockSupplier);
    });
  });

  describe('archive', () => {
    it('should archive a supplier with no active dependencies', async () => {
      mockSupplierRepo.findOne.mockResolvedValue(mockSupplier);
      mockSupplierPORepo.count.mockResolvedValue(0);
      mockInvoiceRepo.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockSupplierRepo.save.mockResolvedValue({ ...mockSupplier, is_active: false });

      const result = await service.archive(businessId, supplierId);

      expect(result.message).toContain('archivé avec succès');
      expect(mockSupplierRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });

    it('should throw ConflictException if supplier already archived', async () => {
      mockSupplierRepo.findOne.mockResolvedValue({ ...mockSupplier, is_active: false });

      await expect(service.archive(businessId, supplierId)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if active purchase orders exist', async () => {
      const activeSupplier = { ...mockSupplier, is_active: true };
      mockSupplierRepo.findOne.mockResolvedValue(activeSupplier);
      mockSupplierPORepo.count.mockResolvedValue(2);

      await expect(service.archive(businessId, supplierId)).rejects.toThrow(BadRequestException);
      await expect(service.archive(businessId, supplierId)).rejects.toThrow(/bon\(s\) de commande en cours/);
    });

    it('should throw BadRequestException if unpaid invoices exist', async () => {
      const activeSupplier = { ...mockSupplier, is_active: true };
      mockSupplierRepo.findOne.mockResolvedValue(activeSupplier);
      mockSupplierPORepo.count.mockResolvedValue(0);
      mockInvoiceRepo.count.mockResolvedValue(3);

      await expect(service.archive(businessId, supplierId)).rejects.toThrow(BadRequestException);
      await expect(service.archive(businessId, supplierId)).rejects.toThrow(/facture\(s\) impayée\(s\)/);
    });

    it('should throw BadRequestException if incomplete receipts exist', async () => {
      const activeSupplier = { ...mockSupplier, is_active: true };
      mockSupplierRepo.findOne.mockResolvedValue(activeSupplier);
      mockSupplierPORepo.count.mockResolvedValue(0);
      mockInvoiceRepo.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      await expect(service.archive(businessId, supplierId)).rejects.toThrow(BadRequestException);
      await expect(service.archive(businessId, supplierId)).rejects.toThrow(/bon\(s\) de réception incomplet\(s\)/);
    });
  });

  describe('restore', () => {
    it('should restore an archived supplier', async () => {
      const archivedSupplier = { ...mockSupplier, is_active: false };
      mockSupplierRepo.findOne.mockResolvedValue(archivedSupplier);
      mockSupplierRepo.save.mockResolvedValue({ ...archivedSupplier, is_active: true });

      const result = await service.restore(businessId, supplierId);

      expect(result.is_active).toBe(true);
      expect(mockSupplierRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
    });

    it('should throw ConflictException if supplier already active', async () => {
      const activeSupplier = { ...mockSupplier, is_active: true };
      mockSupplierRepo.findOne.mockResolvedValue(activeSupplier);

      await expect(service.restore(businessId, supplierId)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOneOrFail', () => {
    it('should return a supplier', async () => {
      mockSupplierRepo.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findOneOrFail(businessId, supplierId);

      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockSupplierRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneOrFail(businessId, supplierId)).rejects.toThrow(NotFoundException);
    });
  });
});
