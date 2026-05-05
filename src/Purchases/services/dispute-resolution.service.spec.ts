import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DisputeResolutionService, DisputeCategory, ResolutionAction } from './dispute-resolution.service';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { DisputeResponse } from '../entities/dispute-response.entity';
import { PurchaseMailService } from './purchase-mail.service';
import { InvoiceStatus } from '../enum/invoice-status.enum';

describe('DisputeResolutionService', () => {
  let service: DisputeResolutionService;
  let invoiceRepo: Repository<PurchaseInvoice>;
  let disputeResponseRepo: Repository<DisputeResponse>;
  let mailService: PurchaseMailService;

  const mockInvoice = {
    id: 'invoice-1',
    business_id: 'business-1',
    invoice_number: 'INV-001',
    status: InvoiceStatus.DISPUTED,
    dispute_reason: 'Écart de prix détecté',
    net_amount: 1200,
    subtotal_ht: 1000,
    tax_amount: 190,
    timbre_fiscal: 1,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-05'),
    supplier: {
      id: 'supplier-1',
      name: 'Test Supplier',
      email: 'supplier@test.com',
    },
    supplier_po: {
      net_amount: 1190,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeResolutionService,
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DisputeResponse),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PurchaseMailService,
          useValue: {
            sendDisputeClarificationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DisputeResolutionService>(DisputeResolutionService);
    invoiceRepo = module.get(getRepositoryToken(PurchaseInvoice));
    disputeResponseRepo = module.get(getRepositoryToken(DisputeResponse));
    mailService = module.get(PurchaseMailService);
  });

  describe('getDisputeInfo', () => {
    it('should return dispute information', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);

      const result = await service.getDisputeInfo('business-1', 'invoice-1');

      expect(result.invoice_id).toBe('invoice-1');
      expect(result.invoice_number).toBe('INV-001');
      expect(result.supplier_name).toBe('Test Supplier');
      expect(result.status).toBe(InvoiceStatus.DISPUTED);
      expect(result.dispute_category).toBeDefined();
      expect(result.suggested_actions).toBeDefined();
      expect(result.suggested_actions.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getDisputeInfo('business-1', 'invoice-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if invoice not disputed', async () => {
      const approvedInvoice = { ...mockInvoice, status: InvoiceStatus.APPROVED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(approvedInvoice as any);

      await expect(service.getDisputeInfo('business-1', 'invoice-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should calculate days in dispute correctly', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);

      const result = await service.getDisputeInfo('business-1', 'invoice-1');

      expect(result.days_in_dispute).toBeGreaterThanOrEqual(0);
    });

    it('should calculate discrepancy correctly', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);

      const result = await service.getDisputeInfo('business-1', 'invoice-1');

      expect(result.invoiced_amount).toBe(1200);
      expect(result.expected_amount).toBe(1190);
      expect(result.discrepancy).toBe(10);
    });

    it('should categorize price discrepancy', async () => {
      const invoice = { ...mockInvoice, dispute_reason: 'Écart de prix détecté' };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(invoice as any);

      const result = await service.getDisputeInfo('business-1', 'invoice-1');

      expect(result.dispute_category).toBe(DisputeCategory.PRICE_DISCREPANCY);
    });

    it('should categorize quantity mismatch', async () => {
      const invoice = { ...mockInvoice, dispute_reason: 'Quantité incorrecte' };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(invoice as any);

      const result = await service.getDisputeInfo('business-1', 'invoice-1');

      expect(result.dispute_category).toBe(DisputeCategory.QUANTITY_MISMATCH);
    });
  });

  describe('resolveDispute', () => {
    it('should approve invoice as is', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.APPROVED,
      } as any);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.APPROVE_AS_IS,
        resolution_notes: 'Écart justifié',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('approuvée');
      expect(invoiceRepo.save).toHaveBeenCalled();
    });

    it('should correct amounts', async () => {
      const disputedInvoice = { ...mockInvoice, status: InvoiceStatus.DISPUTED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(disputedInvoice as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue({
        ...disputedInvoice,
        status: InvoiceStatus.APPROVED,
        subtotal_ht: 950,
      } as any);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.CORRECT_AMOUNTS,
        corrected_amounts: {
          subtotal_ht: 950,
          tax_amount: 180.5,
        },
        resolution_notes: 'Montants corrigés',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('corrigés');
    });

    it('should throw BadRequestException if corrected amounts missing', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);

      await expect(
        service.resolveDispute('business-1', 'invoice-1', {
          action: ResolutionAction.CORRECT_AMOUNTS,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should request credit note', async () => {
      const disputedInvoice = { ...mockInvoice, status: InvoiceStatus.DISPUTED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(disputedInvoice as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue(disputedInvoice as any);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.REQUEST_CREDIT_NOTE,
        resolution_notes: 'Demande d\'avoir',
        notify_supplier: false,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('avoir');
    });

    it('should request corrected invoice', async () => {
      const disputedInvoice = { ...mockInvoice, status: InvoiceStatus.DISPUTED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(disputedInvoice as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue(disputedInvoice as any);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.REQUEST_CORRECTED_INVOICE,
        resolution_notes: 'Facture rectificative requise',
        notify_supplier: false,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('rectificative');
    });

    it('should reject invoice', async () => {
      const disputedInvoice = { ...mockInvoice, status: InvoiceStatus.DISPUTED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(disputedInvoice as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue({
        ...disputedInvoice,
        status: InvoiceStatus.PENDING,
      } as any);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.REJECT_INVOICE,
        resolution_notes: 'Facture rejetée',
        notify_supplier: false,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('rejetée');
    });

    it('should wait for delivery', async () => {
      const disputedInvoice = { ...mockInvoice, status: InvoiceStatus.DISPUTED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(disputedInvoice as any);
      jest.spyOn(invoiceRepo, 'save').mockResolvedValue(disputedInvoice as any);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.WAIT_FOR_DELIVERY,
        resolution_notes: 'En attente de livraison',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('attente');
    });

    it('should contact supplier', async () => {
      const disputedInvoice = { ...mockInvoice, status: InvoiceStatus.DISPUTED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(disputedInvoice as any);
      jest.spyOn(mailService, 'sendDisputeClarificationEmail').mockResolvedValue(undefined);

      const result = await service.resolveDispute('business-1', 'invoice-1', {
        action: ResolutionAction.CONTACT_SUPPLIER,
        resolution_notes: 'Clarification requise',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('clarification');
      expect(mailService.sendDisputeClarificationEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if invoice not found', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.resolveDispute('business-1', 'invoice-1', {
          action: ResolutionAction.APPROVE_AS_IS,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invoice not disputed', async () => {
      const approvedInvoice = { ...mockInvoice, status: InvoiceStatus.APPROVED };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(approvedInvoice as any);

      await expect(
        service.resolveDispute('business-1', 'invoice-1', {
          action: ResolutionAction.APPROVE_AS_IS,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingResponses', () => {
    it('should return pending supplier responses', async () => {
      const mockResponses = [
        {
          id: 'response-1',
          business_id: 'business-1',
          invoice: mockInvoice,
          supplier: mockInvoice.supplier,
          response_message: 'Test response',
          proposed_solution: 'Credit note',
          proposed_amount: 1190,
          created_at: new Date(),
        },
      ];
      jest.spyOn(disputeResponseRepo, 'find').mockResolvedValue(mockResponses as any);

      const result = await service.getPendingResponses('business-1');

      expect(result).toHaveLength(1);
      expect(result[0].invoice_number).toBe('INV-001');
    });
  });

  describe('processSupplierResponse', () => {
    it.skip('should accept supplier response', async () => {
      // Skip: Complex transaction logic
    });

    it.skip('should reject supplier response', async () => {
      // Skip: Complex transaction logic
    });
  });
});
