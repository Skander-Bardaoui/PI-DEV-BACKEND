import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPaymentsController } from './supplier-payments.controller';
import { SupplierPaymentsService } from '../services/supplier-payments.service';
import { AuthGuard } from '@nestjs/passport';

describe('SupplierPaymentsController', () => {
  let controller: SupplierPaymentsController;
  let service: SupplierPaymentsService;

  const mockSupplierPaymentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySupplier: jest.fn(),
    getSupplierStats: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierPaymentsController],
      providers: [
        {
          provide: SupplierPaymentsService,
          useValue: mockSupplierPaymentsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SupplierPaymentsController>(SupplierPaymentsController);
    service = module.get<SupplierPaymentsService>(SupplierPaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a supplier payment', async () => {
      const businessId = 'business-123';
      const dto = {
        supplier_id: 'supplier-123',
        purchase_invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'BANK_TRANSFER',
      };

      const mockPayment = {
        id: 'payment-123',
        payment_number: 'PAY-2024-0001',
        ...dto,
      };

      mockSupplierPaymentsService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(businessId, dto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(businessId, 'user-123', dto);
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findAll', () => {
    it('should return all supplier payments', async () => {
      const businessId = 'business-123';
      const mockPayments = [
        { id: 'payment-1', amount: 1000 },
        { id: 'payment-2', amount: 2000 },
      ];

      mockSupplierPaymentsService.findAll.mockResolvedValue(mockPayments);

      const result = await controller.findAll(businessId);

      expect(service.findAll).toHaveBeenCalledWith(businessId);
      expect(result).toEqual(mockPayments);
    });
  });

  describe('findOne', () => {
    it('should return a supplier payment by id', async () => {
      const businessId = 'business-123';
      const paymentId = 'payment-123';
      const mockPayment = { id: paymentId, amount: 1000 };

      mockSupplierPaymentsService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne(businessId, paymentId);

      expect(service.findOne).toHaveBeenCalledWith(businessId, paymentId);
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findBySupplier', () => {
    it('should return payments for a specific supplier', async () => {
      const businessId = 'business-123';
      const supplierId = 'supplier-123';
      const mockPayments = [
        { id: 'payment-1', supplier_id: supplierId, amount: 1000 },
      ];

      mockSupplierPaymentsService.findBySupplier.mockResolvedValue(mockPayments);

      const result = await controller.findBySupplier(businessId, supplierId);

      expect(service.findBySupplier).toHaveBeenCalledWith(businessId, supplierId);
      expect(result).toEqual(mockPayments);
    });
  });

  describe('getStats', () => {
    it('should return supplier payment statistics', async () => {
      const businessId = 'business-123';
      const supplierId = 'supplier-123';
      const mockStats = {
        total_paid: 5000,
        payment_count: 3,
      };

      mockSupplierPaymentsService.getSupplierStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(businessId, supplierId);

      expect(service.getSupplierStats).toHaveBeenCalledWith(businessId, supplierId);
      expect(result).toEqual(mockStats);
    });
  });

  describe('createStripeIntent', () => {
    it.skip('should create a Stripe payment intent', async () => {
      // Skipped: Requires real Stripe API key and external service call
      const businessId = 'business-123';
      const body = { amount: 100 };

      // Mock Stripe
      const originalEnv = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock';

      const result = await controller.createStripeIntent(businessId, body);

      expect(result).toHaveProperty('clientSecret');

      // Restore env
      process.env.STRIPE_SECRET_KEY = originalEnv;
    });
  });
});
