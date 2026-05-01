import { Test, TestingModule } from '@nestjs/testing';
import { DisputeResolutionController } from './dispute-resolution.controller';
import { DisputeResolutionService, ResolutionAction } from '../services/dispute-resolution.service';

describe('DisputeResolutionController', () => {
  let controller: DisputeResolutionController;
  let service: DisputeResolutionService;

  const mockService = {
    getDisputeInfo: jest.fn(),
    resolveDispute: jest.fn(),
    getPendingResponses: jest.fn(),
    processSupplierResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputeResolutionController],
      providers: [
        {
          provide: DisputeResolutionService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DisputeResolutionController>(DisputeResolutionController);
    service = module.get<DisputeResolutionService>(DisputeResolutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDisputeInfo', () => {
    it('should return dispute info', async () => {
      const mockDisputeInfo = {
        invoice_id: 'invoice-1',
        invoice_number: 'INV-001',
        supplier_name: 'Supplier A',
        suggested_actions: [],
      };

      mockService.getDisputeInfo.mockResolvedValue(mockDisputeInfo);

      const result = await controller.getDisputeInfo('business-1', 'invoice-1');

      expect(result).toEqual(mockDisputeInfo);
      expect(mockService.getDisputeInfo).toHaveBeenCalledWith('business-1', 'invoice-1');
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute', async () => {
      const dto = {
        action: ResolutionAction.APPROVE_AS_IS,
        resolution_notes: 'Approved',
      };

      const mockResult = {
        success: true,
        message: 'Dispute resolved',
        invoice: {} as any,
      };

      mockService.resolveDispute.mockResolvedValue(mockResult);

      const result = await controller.resolveDispute('business-1', 'invoice-1', dto);

      expect(result).toEqual(mockResult);
      expect(mockService.resolveDispute).toHaveBeenCalledWith('business-1', 'invoice-1', dto);
    });
  });

  describe('getPendingResponses', () => {
    it('should return pending responses', async () => {
      const mockResponses = [
        {
          id: 'response-1',
          invoice_number: 'INV-001',
          supplier_name: 'Supplier A',
        },
      ];

      mockService.getPendingResponses.mockResolvedValue(mockResponses);

      const result = await controller.getPendingResponses('business-1');

      expect(result).toEqual(mockResponses);
      expect(mockService.getPendingResponses).toHaveBeenCalledWith('business-1');
    });
  });

  describe('processResponse', () => {
    it('should process supplier response', async () => {
      const dto = {
        action: 'accept' as const,
        admin_notes: 'Accepted',
      };

      const mockResult = {
        success: true,
        message: 'Response processed',
        invoice: {} as any,
      };

      mockService.processSupplierResponse.mockResolvedValue(mockResult);

      const result = await controller.processResponse('business-1', 'response-1', dto);

      expect(result).toEqual(mockResult);
      expect(mockService.processSupplierResponse).toHaveBeenCalledWith(
        'business-1',
        'response-1',
        dto
      );
    });
  });
});
