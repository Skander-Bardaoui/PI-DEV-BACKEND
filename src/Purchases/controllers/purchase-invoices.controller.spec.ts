import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { PurchaseInvoicesService } from '../services/purchase-invoices.service';

describe('PurchaseInvoicesController', () => {
  let controller: PurchaseInvoicesController;
  let purchaseInvoicesService: any;

  beforeEach(async () => {
    purchaseInvoicesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findApprovedOrPartial: jest.fn(),
      findByPO: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      approve: jest.fn(),
      dispute: jest.fn(),
      resolveDispute: jest.fn(),
      updatePayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseInvoicesController],
      providers: [
        {
          provide: PurchaseInvoicesService,
          useValue: purchaseInvoicesService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseInvoicesController>(PurchaseInvoicesController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer une facture d\'achat', async () => {
      const businessId = 'business-1';
      const createDto = {
        supplier_id: 'supplier-1',
        invoice_number_supplier: 'INV-001',
        invoice_date: '2026-05-01',
        due_date: '2026-06-01',
        net_amount: 1000,
        tax_amount: 190,
        total_amount: 1190,
      };

      const mockInvoice = { id: 'invoice-1', ...createDto };
      purchaseInvoicesService.create.mockResolvedValue(mockInvoice);

      const result = await controller.create(businessId, createDto as any);

      expect(result).toEqual(mockInvoice);
      expect(purchaseInvoicesService.create).toHaveBeenCalledWith(businessId, createDto);
    });
  });

  describe('findAll', () => {
    it('devrait retourner toutes les factures', async () => {
      const businessId = 'business-1';
      const query = { page: 1, limit: 20 };
      const mockInvoices = [
        { id: 'invoice-1', invoice_number_supplier: 'INV-001' },
        { id: 'invoice-2', invoice_number_supplier: 'INV-002' },
      ];

      purchaseInvoicesService.findAll.mockResolvedValue(mockInvoices);

      const result = await controller.findAll(businessId, query as any);

      expect(result).toEqual(mockInvoices);
      expect(purchaseInvoicesService.findAll).toHaveBeenCalledWith(businessId, query);
    });
  });

  describe('findApprovedOrPartial', () => {
    it('devrait retourner les factures approuvées ou partiellement payées', async () => {
      const businessId = 'business-1';
      const query = {};
      const mockInvoices = [
        { id: 'invoice-1', status: 'APPROVED' },
        { id: 'invoice-2', status: 'PARTIALLY_PAID' },
      ];

      purchaseInvoicesService.findApprovedOrPartial.mockResolvedValue(mockInvoices);

      const result = await controller.findApprovedOrPartial(businessId, query);

      expect(result).toEqual(mockInvoices);
      expect(purchaseInvoicesService.findApprovedOrPartial).toHaveBeenCalledWith(
        businessId,
        query,
      );
    });
  });

  describe('findByPO', () => {
    it('devrait retourner les factures d\'un bon de commande', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const mockInvoices = [
        { id: 'invoice-1', supplier_po_id: poId },
        { id: 'invoice-2', supplier_po_id: poId },
      ];

      purchaseInvoicesService.findByPO.mockResolvedValue(mockInvoices);

      const result = await controller.findByPO(businessId, poId);

      expect(result).toEqual(mockInvoices);
      expect(purchaseInvoicesService.findByPO).toHaveBeenCalledWith(businessId, poId);
    });
  });

  describe('findOne', () => {
    it('devrait retourner une facture par ID', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockInvoice = {
        id: invoiceId,
        invoice_number_supplier: 'INV-001',
      };

      purchaseInvoicesService.findOne.mockResolvedValue(mockInvoice);

      const result = await controller.findOne(businessId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(purchaseInvoicesService.findOne).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une facture', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const updateDto = { notes: 'Updated notes' };
      const mockInvoice = { id: invoiceId, ...updateDto };

      purchaseInvoicesService.update.mockResolvedValue(mockInvoice);

      const result = await controller.update(businessId, invoiceId, updateDto as any);

      expect(result).toEqual(mockInvoice);
      expect(purchaseInvoicesService.update).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        updateDto,
      );
    });
  });

  describe('approve', () => {
    it('devrait approuver une facture', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockInvoice = { id: invoiceId, status: 'APPROVED' };

      purchaseInvoicesService.approve.mockResolvedValue(mockInvoice);

      const result = await controller.approve(businessId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(purchaseInvoicesService.approve).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('dispute', () => {
    it('devrait créer un litige sur une facture', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const disputeDto = {
        dispute_reason: 'Prix incorrect',
        dispute_notes: 'Le prix ne correspond pas au bon de commande',
      };

      const mockInvoice = { id: invoiceId, status: 'DISPUTED', ...disputeDto };
      purchaseInvoicesService.dispute.mockResolvedValue(mockInvoice);

      const result = await controller.dispute(businessId, invoiceId, disputeDto as any);

      expect(result).toEqual(mockInvoice);
      expect(purchaseInvoicesService.dispute).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        disputeDto,
      );
    });
  });

  describe('resolveDispute', () => {
    it('devrait résoudre un litige', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const mockInvoice = { id: invoiceId, status: 'APPROVED' };

      purchaseInvoicesService.resolveDispute.mockResolvedValue(mockInvoice);

      const result = await controller.resolveDispute(businessId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(purchaseInvoicesService.resolveDispute).toHaveBeenCalledWith(businessId, invoiceId);
    });
  });

  describe('updatePayment', () => {
    it('devrait mettre à jour le montant payé', async () => {
      const businessId = 'business-1';
      const invoiceId = 'invoice-1';
      const paymentDto = { amount_paid: 500 };
      const mockInvoice = { id: invoiceId, amount_paid: 500 };

      purchaseInvoicesService.updatePayment.mockResolvedValue(mockInvoice);

      const result = await controller.updatePayment(businessId, invoiceId, paymentDto as any);

      expect(result).toEqual(mockInvoice);
      expect(purchaseInvoicesService.updatePayment).toHaveBeenCalledWith(
        businessId,
        invoiceId,
        paymentDto,
      );
    });
  });
});
