import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { PurchaseInvoicesService } from '../services/purchase-invoices.service';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto, DisputeInvoiceDto, UpdatePaymentAmountDto } from '../dto/update-purchase-invoice.dto';
import { InvoiceStatus } from '../enum/invoice-status.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PurchasePermissionGuard } from '../guards/purchase-permission.guard';

describe('PurchaseInvoicesController', () => {
  let controller: PurchaseInvoicesController;
  let service: PurchaseInvoicesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPO: jest.fn(),
    update: jest.fn(),
    approve: jest.fn(),
    dispute: jest.fn(),
    resolveDispute: jest.fn(),
    updatePayment: jest.fn(),
    findApprovedOrPartial: jest.fn(),
  };

  const businessId = 'business-123';
  const invoiceId = 'invoice-456';

  const mockInvoice = {
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

  // Mock Guards
  const mockAuthGuard = { canActivate: jest.fn(() => true) };
  const mockRolesGuard = { canActivate: jest.fn(() => true) };
  const mockPurchasePermissionGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseInvoicesController],
      providers: [
        {
          provide: PurchaseInvoicesService,
          useValue: mockService,
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

    controller = module.get<PurchaseInvoicesController>(PurchaseInvoicesController);
    service = module.get<PurchaseInvoicesService>(PurchaseInvoicesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a purchase invoice', async () => {
      const createDto: CreatePurchaseInvoiceDto = {
        supplier_id: 'supplier-789',
        invoice_number_supplier: 'SUPP-001',
        invoice_date: new Date('2026-01-01'),
        subtotal_ht: 1000,
        tax_amount: 190,
        items: [],
      };

      mockService.create.mockResolvedValue(mockInvoice);

      const result = await controller.create(businessId, createDto);

      expect(result).toEqual(mockInvoice);
      expect(service.create).toHaveBeenCalledWith(businessId, createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const query = { page: 1, limit: 20 };
      const mockResponse = {
        data: [mockInvoice],
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

    it('should filter by status', async () => {
      const query = { status: 'PENDING,APPROVED' };
      mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 });

      await controller.findAll(businessId, query);

      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });

    it('should filter by supplier_id', async () => {
      const query = { supplier_id: 'supplier-789' };
      mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 });

      await controller.findAll(businessId, query);

      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });
  });

  describe('findOne', () => {
    it('should return a single invoice', async () => {
      mockService.findOne.mockResolvedValue(mockInvoice);

      const result = await controller.findOne(businessId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(service.findOne).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('findByPO', () => {
    it('should return invoices for a purchase order', async () => {
      const poId = 'po-123';
      const mockInvoices = [mockInvoice];

      mockService.findByPO.mockResolvedValue(mockInvoices);

      const result = await controller.findByPO(businessId, poId);

      expect(result).toEqual(mockInvoices);
      expect(service.findByPO).toHaveBeenCalledWith(businessId, poId);
    });
  });

  describe('update', () => {
    it('should update an invoice', async () => {
      const updateDto: UpdatePurchaseInvoiceDto = {
        subtotal_ht: 1200,
        tax_amount: 228,
      };

      const updatedInvoice = { ...mockInvoice, ...updateDto };
      mockService.update.mockResolvedValue(updatedInvoice);

      const result = await controller.update(businessId, invoiceId, updateDto);

      expect(result).toEqual(updatedInvoice);
      expect(service.update).toHaveBeenCalledWith(businessId, invoiceId, updateDto);
    });
  });

  describe('approve', () => {
    it('should approve an invoice', async () => {
      const approvedInvoice = { ...mockInvoice, status: InvoiceStatus.APPROVED };
      mockService.approve.mockResolvedValue(approvedInvoice);

      const result = await controller.approve(businessId, invoiceId);

      expect(result).toEqual(approvedInvoice);
      expect(service.approve).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('dispute', () => {
    it('should mark invoice as disputed', async () => {
      const disputeDto: DisputeInvoiceDto = {
        dispute_reason: 'Incorrect amount',
      };

      const disputedInvoice = {
        ...mockInvoice,
        status: InvoiceStatus.DISPUTED,
        dispute_reason: disputeDto.dispute_reason,
      };
      mockService.dispute.mockResolvedValue(disputedInvoice);

      const result = await controller.dispute(businessId, invoiceId, disputeDto);

      expect(result).toEqual(disputedInvoice);
      expect(service.dispute).toHaveBeenCalledWith(businessId, invoiceId, disputeDto);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a disputed invoice', async () => {
      const resolvedInvoice = {
        ...mockInvoice,
        status: InvoiceStatus.APPROVED,
        dispute_reason: null,
      };
      mockService.resolveDispute.mockResolvedValue(resolvedInvoice);

      const result = await controller.resolveDispute(businessId, invoiceId);

      expect(result).toEqual(resolvedInvoice);
      expect(service.resolveDispute).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('updatePayment', () => {
    it('should update payment amount', async () => {
      const paymentDto: UpdatePaymentAmountDto = {
        paid_amount: 1191.000,
      };

      const paidInvoice = {
        ...mockInvoice,
        paid_amount: 1191.000,
        status: InvoiceStatus.PAID,
      };
      mockService.updatePayment.mockResolvedValue(paidInvoice);

      const result = await controller.updatePayment(businessId, invoiceId, paymentDto);

      expect(result).toEqual(paidInvoice);
      expect(service.updatePayment).toHaveBeenCalledWith(businessId, invoiceId, paymentDto);
    });

    it('should handle partial payment', async () => {
      const paymentDto: UpdatePaymentAmountDto = {
        paid_amount: 500,
      };

      const partiallyPaidInvoice = {
        ...mockInvoice,
        paid_amount: 500,
        status: InvoiceStatus.PARTIALLY_PAID,
      };
      mockService.updatePayment.mockResolvedValue(partiallyPaidInvoice);

      const result = await controller.updatePayment(businessId, invoiceId, paymentDto);

      expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(service.updatePayment).toHaveBeenCalledWith(businessId, invoiceId, paymentDto);
    });
  });

  describe('findApprovedOrPartial', () => {
    it('should return approved or partially paid invoices', async () => {
      const query = { page: 1, limit: 20 };
      const mockResponse = {
        data: [
          { ...mockInvoice, status: InvoiceStatus.APPROVED },
          { ...mockInvoice, id: 'invoice-457', status: InvoiceStatus.PARTIALLY_PAID },
        ],
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
      };

      mockService.findApprovedOrPartial.mockResolvedValue(mockResponse);

      const result = await controller.findApprovedOrPartial(businessId, query);

      expect(result).toEqual(mockResponse);
      expect(service.findApprovedOrPartial).toHaveBeenCalledWith(businessId, query);
    });
  });
});
