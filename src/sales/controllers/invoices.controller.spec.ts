import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from '../services/invoices.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { InvoiceStatus, InvoiceType } from '../entities/invoice.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SalesPermissionGuard } from '../guards/sales-permission.guard';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: InvoicesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    send: jest.fn(),
    sendByEmail: jest.fn(),
    generateEmailDraft: jest.fn(),
    sendPaymentReminder: jest.fn(),
    markPartiallyPaid: jest.fn(),
    markPaid: jest.fn(),
    markOverdue: jest.fn(),
    cancel: jest.fn(),
    delete: jest.fn(),
  };

  const businessId = 'business-123';
  const invoiceId = 'invoice-456';
  const clientId = 'client-789';

  const mockInvoice = {
    id: invoiceId,
    business_id: businessId,
    client_id: clientId,
    invoice_number: 'FAC-2026-0001',
    type: InvoiceType.NORMAL,
    status: InvoiceStatus.DRAFT,
    date: new Date('2026-01-01'),
    due_date: new Date('2026-01-31'),
    subtotal_ht: 1000,
    tax_amount: 190,
    timbre_fiscal: 1.000,
    total_ttc: 1190,
    net_amount: 1191.000,
    paid_amount: 0,
    items: [],
  };

  // Mock Guards
  const mockAuthGuard = { canActivate: jest.fn(() => true) };
  const mockRolesGuard = { canActivate: jest.fn(() => true) };
  const mockSalesPermissionGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue(mockAuthGuard)
    .overrideGuard(RolesGuard)
    .useValue(mockRolesGuard)
    .overrideGuard(SalesPermissionGuard)
    .useValue(mockSalesPermissionGuard)
    .compile();

    controller = module.get<InvoicesController>(InvoicesController);
    service = module.get<InvoicesService>(InvoicesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an invoice', async () => {
      const createDto: CreateInvoiceDto = {
        client_id: clientId,
        date: new Date('2026-01-01'),
        due_date: new Date('2026-01-31'),
        items: [
          {
            description: 'Test Product',
            quantity: 10,
            unit_price: 100,
            tax_rate_value: 19,
          },
        ],
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
      const query = { status: 'DRAFT,SENT' };
      mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 });

      await controller.findAll(businessId, query);

      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });

    it('should filter by client_id', async () => {
      const query = { client_id: clientId };
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

  describe('update', () => {
    it('should update an invoice', async () => {
      const updateDto: UpdateInvoiceDto = {
        notes: 'Updated notes',
      };

      const updatedInvoice = { ...mockInvoice, notes: 'Updated notes' };
      mockService.update.mockResolvedValue(updatedInvoice);

      const result = await controller.update(businessId, invoiceId, updateDto);

      expect(result).toEqual(updatedInvoice);
      expect(service.update).toHaveBeenCalledWith(businessId, invoiceId, updateDto);
    });
  });

  describe('send', () => {
    it('should send an invoice', async () => {
      const sentInvoice = { ...mockInvoice, status: InvoiceStatus.SENT };
      mockService.send.mockResolvedValue(sentInvoice);

      const result = await controller.send(businessId, invoiceId);

      expect(result).toEqual(sentInvoice);
      expect(service.send).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('sendByEmail', () => {
    it('should send invoice by email', async () => {
      const body = {
        email: 'client@test.com',
        subject: 'Your Invoice',
        body: 'Please find attached...',
      };

      const sentInvoice = { ...mockInvoice, status: InvoiceStatus.SENT };
      mockService.sendByEmail.mockResolvedValue(sentInvoice);

      const result = await controller.sendByEmail(businessId, invoiceId, body);

      expect(result).toEqual(sentInvoice);
      expect(service.sendByEmail).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        body.email,
        body.subject,
        body.body,
      );
    });

    it('should send without custom email', async () => {
      const body = {};
      mockService.sendByEmail.mockResolvedValue(mockInvoice);

      await controller.sendByEmail(businessId, invoiceId, body);

      expect(service.sendByEmail).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('generateEmailDraft', () => {
    it('should generate email draft in French', async () => {
      const body = { language: 'fr' as const, isReminder: false };
      const mockDraft = {
        subject: 'Facture FAC-2026-0001',
        body: 'Bonjour...',
      };

      mockService.generateEmailDraft.mockResolvedValue(mockDraft);

      const result = await controller.generateEmailDraft(businessId, invoiceId, body);

      expect(result).toEqual(mockDraft);
      expect(service.generateEmailDraft).toHaveBeenCalledWith(businessId, invoiceId, 'fr', false);
    });

    it('should generate reminder email draft', async () => {
      const body = { language: 'fr' as const, isReminder: true };
      const mockDraft = {
        subject: 'Rappel - Facture FAC-2026-0001',
        body: 'Rappel...',
      };

      mockService.generateEmailDraft.mockResolvedValue(mockDraft);

      await controller.generateEmailDraft(businessId, invoiceId, body);

      expect(service.generateEmailDraft).toHaveBeenCalledWith(businessId, invoiceId, 'fr', true);
    });

    it('should use default language if not provided', async () => {
      const body = {};
      mockService.generateEmailDraft.mockResolvedValue({ subject: '', body: '' });

      await controller.generateEmailDraft(businessId, invoiceId, body);

      expect(service.generateEmailDraft).toHaveBeenCalledWith(businessId, invoiceId, 'fr', false);
    });
  });

  describe('sendPaymentReminder', () => {
    it('should send payment reminder', async () => {
      const body = { email: 'client@test.com' };
      mockService.sendPaymentReminder.mockResolvedValue(undefined);

      const result = await controller.sendPaymentReminder(businessId, invoiceId, body);

      expect(result).toEqual({
        success: true,
        message: 'Rappel de paiement envoyé avec succès',
      });
      expect(service.sendPaymentReminder).toHaveBeenCalledWith(businessId, invoiceId, body.email);
    });

    it('should send reminder without custom email', async () => {
      const body = {};
      mockService.sendPaymentReminder.mockResolvedValue(undefined);

      await controller.sendPaymentReminder(businessId, invoiceId, body);

      expect(service.sendPaymentReminder).toHaveBeenCalledWith(businessId, invoiceId, undefined);
    });
  });

  describe('markPartiallyPaid', () => {
    it('should mark invoice as partially paid', async () => {
      const partiallyPaidInvoice = { ...mockInvoice, status: InvoiceStatus.PARTIALLY_PAID };
      mockService.markPartiallyPaid.mockResolvedValue(partiallyPaidInvoice);

      const result = await controller.markPartiallyPaid(businessId, invoiceId);

      expect(result).toEqual(partiallyPaidInvoice);
      expect(service.markPartiallyPaid).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('markPaid', () => {
    it('should mark invoice as paid', async () => {
      const paidInvoice = { ...mockInvoice, status: InvoiceStatus.PAID };
      mockService.markPaid.mockResolvedValue(paidInvoice);

      const result = await controller.markPaid(businessId, invoiceId);

      expect(result).toEqual(paidInvoice);
      expect(service.markPaid).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('markOverdue', () => {
    it('should mark invoice as overdue', async () => {
      const overdueInvoice = { ...mockInvoice, status: InvoiceStatus.OVERDUE };
      mockService.markOverdue.mockResolvedValue(overdueInvoice);

      const result = await controller.markOverdue(businessId, invoiceId);

      expect(result).toEqual(overdueInvoice);
      expect(service.markOverdue).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('cancel', () => {
    it('should cancel an invoice', async () => {
      const cancelledInvoice = { ...mockInvoice, status: InvoiceStatus.CANCELLED };
      mockService.cancel.mockResolvedValue(cancelledInvoice);

      const result = await controller.cancel(businessId, invoiceId);

      expect(result).toEqual(cancelledInvoice);
      expect(service.cancel).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('delete', () => {
    it('should delete an invoice', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.delete(businessId, invoiceId);

      expect(service.delete).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });
});
