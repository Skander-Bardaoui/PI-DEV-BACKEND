import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseAlertsController } from './purchase-alerts.controller';
import { PurchaseAlertsService } from '../services/purchase-alerts.service';

describe('PurchaseAlertsController', () => {
  let controller: PurchaseAlertsController;
  let service: PurchaseAlertsService;

  const mockService = {
    findAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    resolve: jest.fn(),
    snooze: jest.fn(),
    triggerManualScan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseAlertsController],
      providers: [
        {
          provide: PurchaseAlertsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseAlertsController>(PurchaseAlertsController);
    service = module.get<PurchaseAlertsService>(PurchaseAlertsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
