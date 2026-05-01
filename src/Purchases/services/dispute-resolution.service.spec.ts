import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DisputeResolutionService, DisputeCategory, ResolutionAction } from './dispute-resolution.service';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { DisputeResponse, DisputeResponseStatus } from '../entities/dispute-response.entity';
import { PurchaseMailService } from './purchase-mail.service';
import { InvoiceStatus } from '../enum/invoice-status.enum';

describe('DisputeResolutionService', () => {
  let service: DisputeResolutionService;
  let invoiceRepo: Repository<PurchaseInvoice>;
  let disputeResponseRepo: Repository<DisputeResponse>;
  let mailService: PurchaseMailService;

  const mockInvoiceRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockDisputeResponseRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockMailService = {
    sendDisputeClarificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeResolutionService,
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(DisputeResponse),
          useValue: mockDisputeResponseRepo,
        },
        {
          provide: PurchaseMailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<DisputeResolutionService>(DisputeResolutionService);
    invoiceRepo = module.get<Repository<PurchaseInvoice>>(getRepositoryToken(PurchaseInvoice));
    disputeResponseRepo = module.get<Repository<DisputeResponse>>(getRepositoryToken(DisputeResponse));
    mailService = module.get<PurchaseMailService>(PurchaseMailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDisputeInfo', () => {
    it('should throw NotFoundException if invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getDisputeInfo('business-1', 'invoice-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invoice is not disputed', async () => {
      const invoice = {
        id: 'invoice-1',
        status: InvoiceStatus.APPROVED,
      };
      mockInvoiceRepo.findOne.mockResolvedValue(invoice);

      await expect(
        service.getDisputeInfo('business-1', 'invoice-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should return dispute info for a disputed invoice', async () => {
      const invoice = {
        id: 'invoice-1',
        invoice_number: 'INV-001',
        status: InvoiceStatus.DISPUTED,
        dispute_reason: 'Prix incorrect',
        net_amount: 1000,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        supplier: {
          name: 'Supplier A',
          email: 'supplier@example.com',
        },
        supplier_po: {
          net_amount: 900,
        },
      };
      mockInvoiceRepo.findOne.mockResolvedValue(invoice);

      const result = await service.getDisputeInfo('business-1', 'invoice-1');

      expect(result).toBeDefined();
      expect(result.invoice_id).toBe('invoice-1');
      expect(result.invoice_number).toBe('INV-001');
      expect(result.supplier_name).toBe('Supplier A');
      expect(result.dispute_category).toBe(DisputeCategory.PRICE_DISCREPANCY);
      expect(result.invoiced_amount).toBe(1000);
      expect(result.expected_amount).toBe(900);
      expect(result.discrepancy).toBe(100);
      expect(result.suggested_actions).toBeDefined();
      expect(result.suggested_actions.length).toBeGreaterThan(0);
    });
  });

  describe('resolveDispute', () => {
    it('should throw NotFoundException if invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resolveDispute('business-1', 'invoice-1', {
          action: ResolutionAction.APPROVE_AS_IS,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should approve invoice as is', async () => {
      const invoice = {
        id: 'invoice-1',
        invoice_number: 'INV-001',
        status: InvoiceStatus.DISPUTED,
        dispute_reason: 'Test dispute',
        supplier: {},
      };
      mockInvoiceRepo.findOne.mockResolvedValue(invoice);
      mockInvoiceRepo.save.mockResolvedValue({
        ...invoice,
        status: InvoiceStatus.APPROVED,
      });

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.APPROVE_AS_IS,
        resolution_notes: 'Approved by admin',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('approuvée');
      expect(mockInvoiceRepo.save).toHaveBeenCalled();
    });

    it('should correct amounts and approve', async () => {
      const invoice = {
        id: 'invoice-1',
        invoice_number: 'INV-001',
        status: InvoiceStatus.DISPUTED,
        dispute_reason: 'Wrong amounts',
        subtotal_ht: 1000,
        tax_amount: 190,
        timbre_fiscal: 1,
        net_amount: 1191,
        supplier: {},
      };
      mockInvoiceRepo.findOne.mockResolvedValue(invoice);
      mockInvoiceRepo.save.mockResolvedValue({
        ...invoice,
        status: InvoiceStatus.APPROVED,
        subtotal_ht: 900,
      });

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.CORRECT_AMOUNTS,
        corrected_amounts: {
          subtotal_ht: 900,
        },
      });

      expect(result.success).toBe(true);
      expect(mockInvoiceRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if corrected_amounts missing for CORRECT_AMOUNTS action', async () => {
      const invoice = {
        id: 'invoice-1',
        status: InvoiceStatus.DISPUTED,
        supplier: {},
      };
      mockInvoiceRepo.findOne.mockResolvedValue(invoice);

      await expect(
        service.resolveDispute('business-1', 'invoice-1', {
          action: ResolutionAction.CORRECT_AMOUNTS,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invoice', async () => {
      const invoice = {
        id: 'invoice-1',
        invoice_number: 'INV-001',
        status: InvoiceStatus.DISPUTED,
        dispute_reason: 'Invalid',
        supplier: {},
      };
      mockInvoiceRepo.findOne.mockResolvedValue(invoice);
      mockInvoiceRepo.save.mockResolvedValue({
        ...invoice,
        status: InvoiceStatus.PENDING,
      });

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.REJECT_INVOICE,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('rejetée');
    });

    it('should send email when notify_supplier is true', async () => {
      const invoice = {
        id: 'invoice-1',
        invoice_number: 'INV-001',
        status: InvoiceStatus.DISPUTED,
        dispute_reason: 'Need clarification',
        net_amount: 1000,
        supplier: {
          name: 'Supplier A',
          email: 'supplier@example.com',
        },
        supplier_po: null,
      };
      mockInvoiceRepo.findOne.mockResolvedValue(invoice);
      mockInvoiceRepo.save.mockResolvedValue(invoice);
      mockMailService.sendDisputeClarificationEmail.mockResolvedValue(undefined);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.CONTACT_SUPPLIER,
        notify_supplier: true,
        resolution_notes: 'Please clarify',
      });

      expect(result.success).toBe(true);
      expect(mockMailService.sendDisputeClarificationEmail).toHaveBeenCalled();
    });
  });

  describe('getPendingResponses', () => {
    it('should return pending dispute responses', async () => {
      const responses = [
        {
          id: 'response-1',
          invoice: {
            invoice_number: 'INV-001',
            net_amount: 1000,
            supplier_po: { net_amount: 900 },
          },
          supplier: { name: 'Supplier A' },
          response_message: 'We will send credit note',
          proposed_solution: 'Credit note',
          proposed_amount: 900,
          created_at: new Date(),
        },
      ];
      mockDisputeResponseRepo.find.mockResolvedValue(responses);

      const result = await service.getPendingResponses('business-1');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].invoice_number).toBe('INV-001');
    });
  });

  describe('processSupplierResponse', () => {
    it('should throw NotFoundException if response not found', async () => {
      mockDisputeResponseRepo.findOne.mockResolvedValue(null);

      await expect(
        service.processSupplierResponse('business-1', 'response-1', {
          action: 'accept',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should accept supplier response and resolve dispute', async () => {
      const response = {
        id: 'response-1',
        status: DisputeResponseStatus.PENDING,
        proposed_amount: 900,
        invoice: {
          id: 'invoice-1',
          invoice_number: 'INV-001',
          status: InvoiceStatus.DISPUTED,
          dispute_reason: 'Price issue',
          net_amount: 1000,
        },
        supplier: {},
      };
      mockDisputeResponseRepo.findOne.mockResolvedValue(response);
      mockDisputeResponseRepo.save.mockResolvedValue({
        ...response,
        status: DisputeResponseStatus.ACCEPTED,
      });
      mockInvoiceRepo.save.mockResolvedValue({
        ...response.invoice,
        status: InvoiceStatus.APPROVED,
      });

      const result = await service.processSupplierResponse('business-1', 'response-1', {
        action: 'accept',
        admin_notes: 'Accepted',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('acceptée');
      expect(mockDisputeResponseRepo.save).toHaveBeenCalled();
      expect(mockInvoiceRepo.save).toHaveBeenCalled();
    });

    it('should reject supplier response', async () => {
      const response = {
        id: 'response-1',
        status: DisputeResponseStatus.PENDING,
        invoice: {
          id: 'invoice-1',
          invoice_number: 'INV-001',
          status: InvoiceStatus.DISPUTED,
        },
        supplier: {},
      };
      mockDisputeResponseRepo.findOne.mockResolvedValue(response);
      mockDisputeResponseRepo.save.mockResolvedValue({
        ...response,
        status: DisputeResponseStatus.REJECTED,
      });

      const result = await service.processSupplierResponse('business-1', 'response-1', {
        action: 'reject',
        admin_notes: 'Not acceptable',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('rejetée');
      expect(mockDisputeResponseRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if response already processed', async () => {
      const response = {
        id: 'response-1',
        status: DisputeResponseStatus.ACCEPTED,
        invoice: {},
        supplier: {},
      };
      mockDisputeResponseRepo.findOne.mockResolvedValue(response);

      await expect(
        service.processSupplierResponse('business-1', 'response-1', {
          action: 'accept',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
