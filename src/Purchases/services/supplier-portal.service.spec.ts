import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupplierPortalService } from './supplier-portal.service';
import { SupplierPO } from '../entities/supplier-po.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPayment } from '../../payments/entities/supplier-payment.entity';
import { DisputeResponse } from '../entities/dispute-response.entity';
import { PurchaseMailService } from './purchase-mail.service';
import { POStatus } from '../enum/po-status.enum';
import { InvoiceStatus } from '../enum/invoice-status.enum';

describe('SupplierPortalService', () => {
  let service: SupplierPortalService;
  let poRepo: any;
  let invoiceRepo: any;
  let paymentRepo: any;
  let supplierRepo: any;
  let disputeResponseRepo: any;
  let jwtService: any;
  let configService: any;
  let mailService: any;

  beforeEach(async () => {
    poRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    invoiceRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    paymentRepo = {
      find: jest.fn(),
    };

    supplierRepo = {
      findOne: jest.fn(),
    };

    disputeResponseRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key, defaultValue) => defaultValue),
    };

    mailService = {
      sendPOConfirmedToOwner: jest.fn().mockResolvedValue(undefined),
      sendPORefusedToOwner: jest.fn().mockResolvedValue(undefined),
      sendDisputeResponseToOwner: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierPortalService,
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: poRepo,
        },
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: invoiceRepo,
        },
        {
          provide: getRepositoryToken(SupplierPayment),
          useValue: paymentRepo,
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: supplierRepo,
        },
        {
          provide: getRepositoryToken(DisputeResponse),
          useValue: disputeResponseRepo,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: PurchaseMailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<SupplierPortalService>(SupplierPortalService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('generatePortalToken', () => {
    it('devrait générer un token JWT valide', async () => {
      const businessId = 'business-1';
      const supplierId = 'supplier-1';
      const supplierPoId = 'po-1';
      const mockToken = 'mock-jwt-token';

      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.generatePortalToken(businessId, supplierId, supplierPoId);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          business_id: businessId,
          supplier_id: supplierId,
          supplier_po_id: supplierPoId,
          type: 'supplier_portal',
        },
        expect.objectContaining({
          secret: expect.any(String),
          expiresIn: '72h',
        }),
      );
    });

    it('devrait générer un token sans supplier_po_id si non fourni', async () => {
      const businessId = 'business-1';
      const supplierId = 'supplier-1';
      const mockToken = 'mock-jwt-token';

      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.generatePortalToken(businessId, supplierId);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier_po_id: null,
        }),
        expect.any(Object),
      );
    });
  });

  describe('validateToken', () => {
    it('devrait valider un token valide', async () => {
      const token = 'valid-token';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        supplier_po_id: 'po-1',
        type: 'supplier_portal',
      };

      jwtService.verify.mockReturnValue(payload);

      const result = await service.validateToken(token);

      expect(result).toEqual({
        business_id: payload.business_id,
        supplier_id: payload.supplier_id,
        supplier_po_id: payload.supplier_po_id,
      });
    });

    it('devrait rejeter un token expiré', async () => {
      const token = 'expired-token';

      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.validateToken(token)).rejects.toThrow(UnauthorizedException);
    });

    it('devrait rejeter un token avec un type invalide', async () => {
      const token = 'invalid-type-token';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        type: 'invalid_type',
      };

      jwtService.verify.mockReturnValue(payload);

      await expect(service.validateToken(token)).rejects.toThrow('Token invalide');
    });
  });

  describe('getPortalData', () => {
    it('devrait retourner les données complètes du portail', async () => {
      const token = 'valid-token';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        supplier_po_id: 'po-1',
        type: 'supplier_portal',
      };

      const mockSupplier = { id: 'supplier-1', name: 'Test Supplier' };
      const mockPO = { id: 'po-1', po_number: 'PO-001', items: [] };
      const mockPOs = [mockPO];
      const mockInvoices = [{ id: 'inv-1', net_amount: 1000 }];
      const mockPayments = [{ id: 'pay-1', amount: 500 }];

      jwtService.verify.mockReturnValue(payload);
      supplierRepo.findOne.mockResolvedValue(mockSupplier);
      poRepo.findOne.mockResolvedValue(mockPO);
      poRepo.find.mockResolvedValue(mockPOs);
      invoiceRepo.find.mockResolvedValue(mockInvoices);
      paymentRepo.find.mockResolvedValue(mockPayments);

      const result = await service.getPortalData(token);

      expect(result).toHaveProperty('supplier');
      expect(result).toHaveProperty('current_po');
      expect(result).toHaveProperty('pos');
      expect(result).toHaveProperty('invoices');
      expect(result).toHaveProperty('payments');
      expect(result).toHaveProperty('stats');
      expect(result.stats.total_facture).toBe(1000);
      expect(result.stats.total_paye).toBe(500);
      expect(result.stats.total_du).toBe(500);
    });

    it('devrait lever une exception si le fournisseur n\'existe pas', async () => {
      const token = 'valid-token';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-999',
        supplier_po_id: null,
        type: 'supplier_portal',
      };

      jwtService.verify.mockReturnValue(payload);
      supplierRepo.findOne.mockResolvedValue(null);

      await expect(service.getPortalData(token)).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmPO', () => {
    it('devrait confirmer un BC avec succès', async () => {
      const token = 'valid-token';
      const poId = 'po-1';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        type: 'supplier_portal',
      };

      const mockPO = {
        id: poId,
        po_number: 'PO-001',
        status: POStatus.SENT,
        supplier: { id: 'supplier-1', name: 'Test Supplier' },
        items: [],
      };

      jwtService.verify.mockReturnValue(payload);
      poRepo.findOne.mockResolvedValue(mockPO);
      poRepo.save.mockResolvedValue({ ...mockPO, status: POStatus.CONFIRMED });

      const result = await service.confirmPO(token, poId);

      expect(result.status).toBe(POStatus.CONFIRMED);
      expect(poRepo.save).toHaveBeenCalled();
      expect(mailService.sendPOConfirmedToOwner).toHaveBeenCalledWith(expect.objectContaining({
        status: POStatus.CONFIRMED,
      }));
    });

    it('devrait rejeter si le BC n\'est pas en statut SENT', async () => {
      const token = 'valid-token';
      const poId = 'po-1';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        type: 'supplier_portal',
      };

      const mockPO = {
        id: poId,
        status: POStatus.CONFIRMED,
      };

      jwtService.verify.mockReturnValue(payload);
      poRepo.findOne.mockResolvedValue(mockPO);

      await expect(service.confirmPO(token, poId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refusePO', () => {
    it('devrait refuser un BC avec succès', async () => {
      const token = 'valid-token';
      const poId = 'po-1';
      const reason = 'Prix trop élevé';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        type: 'supplier_portal',
      };

      const mockPO = {
        id: poId,
        po_number: 'PO-001',
        status: POStatus.SENT,
        supplier: { id: 'supplier-1', name: 'Test Supplier' },
        items: [],
      };

      jwtService.verify.mockReturnValue(payload);
      poRepo.findOne.mockResolvedValue(mockPO);
      poRepo.save.mockResolvedValue({ ...mockPO, status: POStatus.CANCELLED });

      const result = await service.refusePO(token, poId, reason);

      expect(result.status).toBe(POStatus.CANCELLED);
      expect(poRepo.save).toHaveBeenCalled();
      expect(mailService.sendPORefusedToOwner).toHaveBeenCalledWith(
        expect.objectContaining({ status: POStatus.CANCELLED }),
        reason,
      );
    });
  });

  describe('respondToDispute', () => {
    it('devrait créer une réponse à un litige', async () => {
      const token = 'valid-token';
      const invoiceId = 'inv-1';
      const responseMessage = 'Nous acceptons la réclamation';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        type: 'supplier_portal',
      };

      const mockInvoice = {
        id: invoiceId,
        invoice_number_supplier: 'INV-001',
        status: InvoiceStatus.DISPUTED,
        supplier: { id: 'supplier-1', name: 'Test Supplier' },
      };

      const mockResponse = {
        id: 'response-1',
        invoice_id: invoiceId,
        response_message: responseMessage,
      };

      jwtService.verify.mockReturnValue(payload);
      invoiceRepo.findOne.mockResolvedValue(mockInvoice);
      disputeResponseRepo.create.mockReturnValue(mockResponse);
      disputeResponseRepo.save.mockResolvedValue(mockResponse);

      const result = await service.respondToDispute(token, invoiceId, responseMessage);

      expect(result).toEqual(mockResponse);
      expect(disputeResponseRepo.save).toHaveBeenCalled();
      expect(mailService.sendDisputeResponseToOwner).toHaveBeenCalled();
    });

    it('devrait rejeter si la facture n\'est pas en litige', async () => {
      const token = 'valid-token';
      const invoiceId = 'inv-1';
      const responseMessage = 'Test';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        type: 'supplier_portal',
      };

      const mockInvoice = {
        id: invoiceId,
        status: InvoiceStatus.PAID,
      };

      jwtService.verify.mockReturnValue(payload);
      invoiceRepo.findOne.mockResolvedValue(mockInvoice);

      await expect(
        service.respondToDispute(token, invoiceId, responseMessage),
      ).rejects.toThrow('n\'est pas en litige');
    });
  });

  describe('getDisputedInvoices', () => {
    it('devrait retourner les factures en litige', async () => {
      const token = 'valid-token';
      const payload = {
        business_id: 'business-1',
        supplier_id: 'supplier-1',
        type: 'supplier_portal',
      };

      const mockInvoices = [
        { id: 'inv-1', status: InvoiceStatus.DISPUTED },
        { id: 'inv-2', status: InvoiceStatus.DISPUTED },
      ];

      const mockResponses = [
        { id: 'response-1', invoice_id: 'inv-1' },
      ];

      jwtService.verify.mockReturnValue(payload);
      invoiceRepo.find.mockResolvedValue(mockInvoices);
      disputeResponseRepo.find.mockResolvedValue(mockResponses);

      const result = await service.getDisputedInvoices(token);

      expect(result.disputed_invoices).toEqual(mockInvoices);
      expect(result.responses).toEqual(mockResponses);
    });
  });
});
