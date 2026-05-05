import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { InvoiceStatus } from '../enum/invoice-status.enum';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto, DisputeInvoiceDto, UpdatePaymentAmountDto } from '../dto/update-purchase-invoice.dto';

describe('PurchaseInvoicesService', () => {
  let service: PurchaseInvoicesService;
  let repository: Repository<PurchaseInvoice>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const businessId = 'business-123';
  const invoiceId = 'invoice-456';

  const mockInvoice: Partial<PurchaseInvoice> = {
    id: invoiceId,
    business_id: businessId,
    invoice_number: 'FACT-2026-0001',
    invoice_number_supplier: 'SUPP-001',
    supplier_id: 'supplier-789',
    invoice_date: new Date('2026-01-01'),
    due_date: new Date('2026-01-31'),
    subtotal_ht: 1000,
    tax_amount: 190,
    timbre_fiscal: 1.000,
    net_amount: 1191.000,
    paid_amount: 0,
    status: InvoiceStatus.PENDING,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseInvoicesService,
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PurchaseInvoicesService>(PurchaseInvoicesService);
    repository = module.get<Repository<PurchaseInvoice>>(getRepositoryToken(PurchaseInvoice));

    // Reset mocks
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a purchase invoice with auto-generated invoice number', async () => {
      const createDto: CreatePurchaseInvoiceDto = {
        supplier_id: 'supplier-789',
        invoice_number_supplier: 'SUPP-001',
        invoice_date: new Date('2026-01-01'),
        subtotal_ht: 1000,
        tax_amount: 190,
        items: [],
      };

      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockResolvedValue(mockInvoice);

      const result = await service.create(businessId, createDto);

      expect(result).toEqual(mockInvoice);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          business_id: businessId,
          status: InvoiceStatus.PENDING,
          paid_amount: 0,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should calculate net_amount correctly with timbre fiscal', async () => {
      const createDto: CreatePurchaseInvoiceDto = {
        supplier_id: 'supplier-789',
        invoice_number_supplier: 'SUPP-001',
        invoice_date: new Date('2026-01-01'),
        subtotal_ht: 1000,
        tax_amount: 190,
        timbre_fiscal: 1.000,
        items: [],
      };

      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockResolvedValue(mockInvoice);

      await service.create(businessId, createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          net_amount: 1191.000, // 1000 + 190 + 1
        }),
      );
    });

    it('should generate sequential invoice numbers', async () => {
      const createDto: CreatePurchaseInvoiceDto = {
        supplier_id: 'supplier-789',
        invoice_number_supplier: 'SUPP-001',
        invoice_date: new Date('2026-01-01'),
        subtotal_ht: 1000,
        tax_amount: 190,
        items: [],
      };

      const lastInvoice = {
        invoice_number: 'FACT-2026-0042',
      };

      mockQueryBuilder.getOne.mockResolvedValue(lastInvoice);
      mockRepository.create.mockReturnValue({ ...mockInvoice, invoice_number: 'FACT-2026-0043' });
      mockRepository.save.mockResolvedValue({ ...mockInvoice, invoice_number: 'FACT-2026-0043' });

      const result = await service.create(businessId, createDto);

      expect(result.invoice_number).toBe('FACT-2026-0043');
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const mockInvoices = [mockInvoice, { ...mockInvoice, id: 'invoice-457' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockInvoices, 2]);

      const result = await service.findAll(businessId, { page: 1, limit: 20 });

      expect(result).toEqual({
        data: mockInvoices,
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
      });
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockInvoice], 1]);

      await service.findAll(businessId, { status: 'PENDING' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inv.status IN (:...statuses)',
        { statuses: ['PENDING'] },
      );
    });

    it('should filter by supplier_id', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockInvoice], 1]);

      await service.findAll(businessId, { supplier_id: 'supplier-789' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inv.supplier_id = :supplier_id',
        { supplier_id: 'supplier-789' },
      );
    });

    it('should apply sorting with whitelist validation', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockInvoice], 1]);

      await service.findAll(businessId, { sort_field: 'invoice_date', sort_dir: 'desc' });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('inv.invoice_date', 'DESC');
    });
  });

  describe('findOne', () => {
    it('should return an invoice by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne(businessId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: invoiceId, business_id: businessId },
        relations: ['supplier', 'supplier_po'],
      });
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(businessId, invoiceId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a PENDING invoice', async () => {
      const updateDto: UpdatePurchaseInvoiceDto = {
        subtotal_ht: 1200,
        tax_amount: 228,
      };

      mockRepository.findOne.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue({ ...mockInvoice, ...updateDto, net_amount: 1429.000 });

      const result = await service.update(businessId, invoiceId, updateDto);

      expect(result.subtotal_ht).toBe(1200);
      expect(result.net_amount).toBe(1429.000);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if invoice is not PENDING', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.APPROVED });

      await expect(service.update(businessId, invoiceId, {})).rejects.toThrow(BadRequestException);
    });

    it('should recalculate net_amount when amounts change', async () => {
      const updateDto: UpdatePurchaseInvoiceDto = {
        subtotal_ht: 2000,
        tax_amount: 380,
      };

      mockRepository.findOne.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue({ ...mockInvoice, ...updateDto });

      await service.update(businessId, invoiceId, updateDto);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          net_amount: 2381.000, // 2000 + 380 + 1
        }),
      );
    });
  });

  describe('approve', () => {
    it('should approve a PENDING invoice', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.APPROVED });

      const result = await service.approve(businessId, invoiceId);

      expect(result.status).toBe(InvoiceStatus.APPROVED);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if invoice is not PENDING', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.PAID });

      await expect(service.approve(businessId, invoiceId)).rejects.toThrow(BadRequestException);
    });

    it('should recalculate net_amount on approval', async () => {
      const pendingInvoice = { ...mockInvoice, status: InvoiceStatus.PENDING };
      mockRepository.findOne.mockResolvedValue(pendingInvoice);
      mockRepository.save.mockResolvedValue({ ...pendingInvoice, status: InvoiceStatus.APPROVED });

      await service.approve(businessId, invoiceId);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          net_amount: expect.any(Number),
          status: InvoiceStatus.APPROVED,
        }),
      );
    });
  });

  describe('dispute', () => {
    it('should mark invoice as DISPUTED', async () => {
      const disputeDto: DisputeInvoiceDto = {
        dispute_reason: 'Incorrect amount',
      };

      mockRepository.findOne.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.DISPUTED,
        dispute_reason: disputeDto.dispute_reason,
      });

      const result = await service.dispute(businessId, invoiceId, disputeDto);

      expect(result.status).toBe(InvoiceStatus.DISPUTED);
      expect(result.dispute_reason).toBe('Incorrect amount');
    });

    it('should throw BadRequestException if invoice is PAID', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.PAID });

      await expect(service.dispute(businessId, invoiceId, { dispute_reason: 'Test' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a DISPUTED invoice', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.DISPUTED,
        dispute_reason: 'Test',
      });
      mockRepository.save.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.APPROVED,
        dispute_reason: null,
      });

      const result = await service.resolveDispute(businessId, invoiceId);

      expect(result.status).toBe(InvoiceStatus.APPROVED);
      expect(result.dispute_reason).toBeNull();
    });

    it('should throw BadRequestException if invoice is not DISPUTED', async () => {
      const approvedInvoice = { ...mockInvoice, status: InvoiceStatus.APPROVED };
      mockRepository.findOne.mockResolvedValue(approvedInvoice);

      await expect(service.resolveDispute(businessId, invoiceId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePayment', () => {
    it('should update payment amount and mark as PAID when fully paid', async () => {
      const paymentDto: UpdatePaymentAmountDto = {
        paid_amount: 1191.000,
      };

      mockRepository.findOne.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue({
        ...mockInvoice,
        paid_amount: 1191.000,
        status: InvoiceStatus.PAID,
      });

      const result = await service.updatePayment(businessId, invoiceId, paymentDto);

      expect(result.paid_amount).toBe(1191.000);
      expect(result.status).toBe(InvoiceStatus.PAID);
    });

    it('should mark as PARTIALLY_PAID when partially paid', async () => {
      const paymentDto: UpdatePaymentAmountDto = {
        paid_amount: 500,
      };

      mockRepository.findOne.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue({
        ...mockInvoice,
        paid_amount: 500,
        status: InvoiceStatus.PARTIALLY_PAID,
      });

      const result = await service.updatePayment(businessId, invoiceId, paymentDto);

      expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
    });

    it('should throw BadRequestException if paid_amount is negative', async () => {
      const paymentDto: UpdatePaymentAmountDto = {
        paid_amount: -100,
      };

      mockRepository.findOne.mockResolvedValue(mockInvoice);

      await expect(service.updatePayment(businessId, invoiceId, paymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if paid_amount exceeds net_amount', async () => {
      const paymentDto: UpdatePaymentAmountDto = {
        paid_amount: 2000, // Dépasse net_amount de 1191
      };

      const invoiceWithLowerAmount = { ...mockInvoice, net_amount: 1191.000 };
      mockRepository.findOne.mockResolvedValue(invoiceWithLowerAmount);

      await expect(service.updatePayment(businessId, invoiceId, paymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return to APPROVED status when paid_amount is 0', async () => {
      const paymentDto: UpdatePaymentAmountDto = {
        paid_amount: 0,
      };

      mockRepository.findOne.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PARTIALLY_PAID,
        paid_amount: 500,
      });
      mockRepository.save.mockResolvedValue({
        ...mockInvoice,
        paid_amount: 0,
        status: InvoiceStatus.APPROVED,
      });

      const result = await service.updatePayment(businessId, invoiceId, paymentDto);

      expect(result.status).toBe(InvoiceStatus.APPROVED);
      expect(result.paid_amount).toBe(0);
    });
  });

  describe('findByPO', () => {
    it('should return invoices for a specific purchase order', async () => {
      const poId = 'po-123';
      const mockInvoices = [mockInvoice];

      mockRepository.find.mockResolvedValue(mockInvoices);

      const result = await service.findByPO(businessId, poId);

      expect(result).toEqual(mockInvoices);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { business_id: businessId, supplier_po_id: poId },
        relations: ['supplier'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findApprovedOrPartial', () => {
    it('should return APPROVED and PARTIALLY_PAID invoices', async () => {
      const mockInvoices = [
        { ...mockInvoice, status: InvoiceStatus.APPROVED },
        { ...mockInvoice, id: 'invoice-457', status: InvoiceStatus.PARTIALLY_PAID },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockInvoices, 2]);

      const result = await service.findApprovedOrPartial(businessId, {});

      expect(result.data).toEqual(mockInvoices);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inv.status IN (:...statuses)',
        { statuses: [InvoiceStatus.APPROVED, InvoiceStatus.PARTIALLY_PAID] },
      );
    });

    it('should apply sorting and pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findApprovedOrPartial(businessId, {
        sort_field: 'due_date',
        sort_dir: 'asc',
        page: 2,
        limit: 10,
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('inv.due_date', 'ASC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('markOverdue', () => {
    it('should mark overdue invoices', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 3 });

      await service.markOverdue();

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ status: InvoiceStatus.OVERDUE });
    });
  });
});
