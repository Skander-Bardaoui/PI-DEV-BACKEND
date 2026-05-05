import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from '../services/payments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByInvoice: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      business_id: 'business-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment', async () => {
      const dto = {
        invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        method: 'BANK_TRANSFER',
      };
      const mockPayment = { id: 'payment-123', ...dto };

      mockPaymentsService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(mockRequest, dto);

      expect(service.create).toHaveBeenCalledWith('business-123', 'user-123', dto);
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const mockPayments = [
        { id: 'payment-1', amount: 1000 },
        { id: 'payment-2', amount: 2000 },
      ];

      mockPaymentsService.findAll.mockResolvedValue(mockPayments);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('business-123');
      expect(result).toEqual(mockPayments);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const paymentId = 'payment-123';
      const mockPayment = { id: paymentId, amount: 1000 };

      mockPaymentsService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne(mockRequest, paymentId);

      expect(service.findOne).toHaveBeenCalledWith('business-123', paymentId);
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findByInvoice', () => {
    it('should return payments for a specific invoice', async () => {
      const invoiceId = 'invoice-123';
      const mockPayments = [
        { id: 'payment-1', invoice_id: invoiceId, amount: 1000 },
        { id: 'payment-2', invoice_id: invoiceId, amount: 500 },
      ];

      mockPaymentsService.findByInvoice.mockResolvedValue(mockPayments);

      const result = await controller.findByInvoice(mockRequest, invoiceId);

      expect(service.findByInvoice).toHaveBeenCalledWith('business-123', invoiceId);
      expect(result).toEqual(mockPayments);
    });
  });
});
