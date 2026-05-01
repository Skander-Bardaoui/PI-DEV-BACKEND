import { Test, TestingModule } from '@nestjs/testing';
import { ThreeWayMatchingController } from './three-way-matching.controller';
import { ThreeWayMatchingService } from '../services/three-way-matching.service';
import { PurchaseMailService } from '../services/purchase-mail.service';

describe('ThreeWayMatchingController', () => {
  let controller: ThreeWayMatchingController;
  let threeWayMatchingService: any;
  let mailService: any;

  beforeEach(async () => {
    threeWayMatchingService = {
      matchInvoice: jest.fn(),
      matchAllPending: jest.fn(),
    };

    mailService = {
      sendInvoiceDiscrepancyEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThreeWayMatchingController],
      providers: [
        {
          provide: ThreeWayMatchingService,
          useValue: threeWayMatchingService,
        },
        {
          provide: PurchaseMailService,
          useValue: mailService,
        },
      ],
    }).compile();

    controller = module.get<ThreeWayMatchingController>(ThreeWayMatchingController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('matchInvoice', () => {
    it('devrait effectuer le rapprochement d\'une facture', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockResult = {
        invoice_id: invoiceId,
        status: 'OK',
        discrepancy_pct: 0,
        issues: [],
      };

      threeWayMatchingService.matchInvoice.mockResolvedValue(mockResult);

      const result = await controller.matchInvoice(businessId, invoiceId);

      expect(result).toEqual(mockResult);
      expect(threeWayMatchingService.matchInvoice).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        false,
        true,
      );
    });

    it('devrait effectuer le rapprochement avec auto=true', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockResult = {
        invoice_id: invoiceId,
        status: 'APPROVED',
        action_taken: 'approved',
      };

      threeWayMatchingService.matchInvoice.mockResolvedValue(mockResult);

      const result = await controller.matchInvoice(businessId, invoiceId, 'true');

      expect(result).toEqual(mockResult);
      expect(threeWayMatchingService.matchInvoice).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        true,
        true,
      );
    });

    it('devrait désactiver l\'IA si useAI=false', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';

      threeWayMatchingService.matchInvoice.mockResolvedValue({});

      await controller.matchInvoice(businessId, invoiceId, undefined, 'false');

      expect(threeWayMatchingService.matchInvoice).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        false,
        false,
      );
    });
  });

  describe('applyMatch', () => {
    it('devrait appliquer le rapprochement automatiquement', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockResult = {
        invoice_id: invoiceId,
        status: 'APPROVED',
        action_taken: 'approved',
      };

      threeWayMatchingService.matchInvoice.mockResolvedValue(mockResult);

      const result = await controller.applyMatch(businessId, invoiceId);

      expect(result).toEqual(mockResult);
      expect(threeWayMatchingService.matchInvoice).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        true,
        true,
      );
    });
  });

  describe('matchAllPending', () => {
    it('devrait effectuer le rapprochement de toutes les factures en attente', async () => {
      const businessId = 'business-1';
      const mockResults = [
        { invoice_id: 'invoice-1', status: 'OK' },
        { invoice_id: 'invoice-2', status: 'DISCREPANCY' },
      ];

      threeWayMatchingService.matchAllPending.mockResolvedValue(mockResults);

      const result = await controller.matchAllPending(businessId);

      expect(result).toEqual(mockResults);
      expect(threeWayMatchingService.matchAllPending).toHaveBeenCalledWith(
        businessId,
        false,
        true,
      );
    });

    it('devrait effectuer le rapprochement automatique de toutes les factures', async () => {
      const businessId = 'business-1';
      const mockResults = [
        { invoice_id: 'invoice-1', status: 'APPROVED', action_taken: 'approved' },
        { invoice_id: 'invoice-2', status: 'DISPUTED', action_taken: 'disputed' },
      ];

      threeWayMatchingService.matchAllPending.mockResolvedValue(mockResults);

      const result = await controller.matchAllPending(businessId, 'true');

      expect(result).toEqual(mockResults);
      expect(threeWayMatchingService.matchAllPending).toHaveBeenCalledWith(
        businessId,
        true,
        true,
      );
    });
  });

  describe('contactSupplier', () => {
    it('devrait envoyer un email au fournisseur', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockMatchResult = {
        invoice_id: invoiceId,
        supplier_email: 'supplier@test.com',
        supplier_name: 'Test Supplier',
        invoice_number: 'INV-001',
        invoiced_total: 1000,
        received_total: 950,
        total_discrepancy: 50,
        discrepancy_pct: 5,
        issues: ['Quantité différente'],
      };

      threeWayMatchingService.matchInvoice.mockResolvedValue(mockMatchResult);
      mailService.sendInvoiceDiscrepancyEmail.mockResolvedValue(undefined);

      const result = await controller.contactSupplier(businessId, invoiceId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Email envoyé');
      expect(mailService.sendInvoiceDiscrepancyEmail).toHaveBeenCalled();
    });

    it('devrait retourner une erreur si le fournisseur n\'a pas d\'email', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockMatchResult = {
        invoice_id: invoiceId,
        supplier_email: null,
        supplier_name: 'Test Supplier',
      };

      threeWayMatchingService.matchInvoice.mockResolvedValue(mockMatchResult);

      const result = await controller.contactSupplier(businessId, invoiceId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('n\'a pas d\'email');
      expect(mailService.sendInvoiceDiscrepancyEmail).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d\'envoi d\'email', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockMatchResult = {
        invoice_id: invoiceId,
        supplier_email: 'supplier@test.com',
        supplier_name: 'Test Supplier',
        invoice_number: 'INV-001',
        invoiced_total: 1000,
        received_total: 950,
        total_discrepancy: 50,
        discrepancy_pct: 5,
        issues: [],
      };

      threeWayMatchingService.matchInvoice.mockResolvedValue(mockMatchResult);
      mailService.sendInvoiceDiscrepancyEmail.mockRejectedValue(new Error('Email error'));

      const result = await controller.contactSupplier(businessId, invoiceId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erreur lors de l\'envoi');
    });
  });
});
