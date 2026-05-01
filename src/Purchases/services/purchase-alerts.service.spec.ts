import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PurchaseAlertsService } from './purchase-alerts.service';
import { PurchaseAlert, AlertType } from '../entities/purchase-alert.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPayment } from '../../payments/entities/supplier-payment.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Business } from '../../businesses/entities/business.entity';
import { AlertStatus } from '../enum/alertStatus';
import { AlertSeverity } from '../enum/alertSeverity';

describe('PurchaseAlertsService', () => {
  let service: PurchaseAlertsService;
  let alertRepo: Repository<PurchaseAlert>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        GMAIL_USER: 'test@example.com',
        GMAIL_PASS: 'test-password',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseAlertsService,
        {
          provide: getRepositoryToken(PurchaseAlert),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPayment),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PurchaseAlertsService>(PurchaseAlertsService);
    alertRepo = module.get<Repository<PurchaseAlert>>(getRepositoryToken(PurchaseAlert));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all alerts for a business', async () => {
      const alerts = [
        {
          id: 'alert-1',
          business_id: 'business-1',
          type: AlertType.INVOICE_DUE_SOON,
          status: AlertStatus.UNREAD,
          created_at: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(alerts),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('business-1');

      expect(result).toBeDefined();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should filter by status if provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('business-1', AlertStatus.UNREAD);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread alerts', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('business-1');

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { business_id: 'business-1', status: AlertStatus.UNREAD },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.markAsRead('business-1', 'alert-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'alert-1', business_id: 'business-1' },
        { status: AlertStatus.READ }
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread alerts as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 3 });

      await service.markAllAsRead('business-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { business_id: 'business-1', status: AlertStatus.UNREAD },
        { status: AlertStatus.READ }
      );
    });
  });

  describe('resolve', () => {
    it('should resolve an alert', async () => {
      const alert = {
        id: 'alert-1',
        business_id: 'business-1',
        type: AlertType.INVOICE_DUE_SOON,
        entity_id: 'invoice-1',
        entity_label: 'INV-001',
      };

      mockRepository.findOne.mockResolvedValue(alert);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.resolve('business-1', 'alert-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'alert-1', business_id: 'business-1' },
        { status: AlertStatus.RESOLVED }
      );
    });

    it('should throw error if alert not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resolve('business-1', 'alert-1')
      ).rejects.toThrow('Alerte introuvable');
    });
  });

  describe('snooze', () => {
    it('should snooze an alert for specified hours', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.snooze('business-1', 'alert-1', 24);

      expect(mockRepository.update).toHaveBeenCalled();
      const updateCall = mockRepository.update.mock.calls[0];
      expect(updateCall[1].status).toBe(AlertStatus.SNOOZED);
      expect(updateCall[1].snoozed_until).toBeInstanceOf(Date);
    });
  });

  describe('triggerManualScan', () => {
    it('should trigger manual scan and return created count', async () => {
      mockRepository.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5); // Pas de nouvelles alertes créées

      // Mock runDailyAlerts pour ne rien faire
      jest.spyOn(service as any, 'runDailyAlerts').mockResolvedValue(undefined);

      const result = await service.triggerManualScan('business-1');

      expect(result.created).toBe(0);
    });
  });
});
