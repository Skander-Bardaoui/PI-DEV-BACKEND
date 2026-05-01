import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { Business } from './entities/business.entity';
import { BusinessSettings } from './entities/business-settings.entity';
import { TaxRate } from './entities/tax-rate.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

describe('BusinessesService', () => {
  let service: BusinessesService;
  let businessRepository: any;
  let settingsRepository: any;
  let taxRateRepository: any;
  let tenantRepository: any;

  beforeEach(async () => {
    businessRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => ({ ...data, id: 'business-1' })),
      update: jest.fn(),
      delete: jest.fn(),
    };

    settingsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    taxRateRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => ({ ...data, id: 'tax-1' })),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      })),
    };

    tenantRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: getRepositoryToken(Business),
          useValue: businessRepository,
        },
        {
          provide: getRepositoryToken(BusinessSettings),
          useValue: settingsRepository,
        },
        {
          provide: getRepositoryToken(TaxRate),
          useValue: taxRateRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: tenantRepository,
        },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('getMyBusinesses', () => {
    it('devrait retourner les businesses d\'un utilisateur', async () => {
      const userId = 'user-1';
      const mockTenant = { id: 'tenant-1', ownerId: userId };
      const mockBusinesses = [
        { id: 'business-1', name: 'Business 1', tenant_id: 'tenant-1' },
        { id: 'business-2', name: 'Business 2', tenant_id: 'tenant-1' },
      ];

      tenantRepository.findOne.mockResolvedValue(mockTenant);
      businessRepository.find.mockResolvedValue(mockBusinesses);

      const result = await service.getMyBusinesses(userId);

      expect(result).toEqual(mockBusinesses);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { ownerId: userId },
      });
    });

    it('devrait lever une exception si le tenant n\'existe pas', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getMyBusinesses('user-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('devrait créer un business avec succès', async () => {
      const createDto = {
        tenant_id: 'tenant-1',
        name: 'New Business',
        tax_id: '123456',
        currency: 'TND',
        address: 'Test Address',
        email: 'business@test.com',
      };

      settingsRepository.save.mockResolvedValue({ id: 'settings-1' });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id', 'business-1');
      expect(businessRepository.create).toHaveBeenCalledWith({
        ...createDto,
        currency: 'TND',
      });
      expect(businessRepository.save).toHaveBeenCalled();
      expect(settingsRepository.save).toHaveBeenCalled();
    });

    it('devrait utiliser TND comme devise par défaut', async () => {
      const createDto = {
        tenant_id: 'tenant-1',
        name: 'New Business',
        tax_id: '123456',
        address: 'Test Address',
        email: 'business@test.com',
      };

      await service.create(createDto as any);

      expect(businessRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'TND' }),
      );
    });
  });

  describe('findAll', () => {
    it('devrait retourner tous les businesses avec pagination', async () => {
      const mockBusinesses = [
        { id: 'business-1', name: 'Business 1' },
        { id: 'business-2', name: 'Business 2' },
      ];

      businessRepository.findAndCount.mockResolvedValue([mockBusinesses, 2]);

      const result = await service.findAll(1, 20);

      expect(result.businesses).toEqual(mockBusinesses);
      expect(result.total).toBe(2);
    });

    it('devrait filtrer par tenant_id si fourni', async () => {
      const mockBusinesses = [{ id: 'business-1', name: 'Business 1' }];

      businessRepository.findAndCount.mockResolvedValue([mockBusinesses, 1]);

      await service.findAll(1, 20, 'tenant-1');

      expect(businessRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenant_id: 'tenant-1' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('devrait retourner un business par ID', async () => {
      const mockBusiness = {
        id: 'business-1',
        name: 'Test Business',
        tenant: { id: 'tenant-1' },
      };

      businessRepository.findOne.mockResolvedValue(mockBusiness);

      const result = await service.findById('business-1');

      expect(result).toEqual(mockBusiness);
      expect(businessRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'business-1' },
        relations: ['tenant'],
      });
    });

    it('devrait lever une exception si le business n\'existe pas', async () => {
      businessRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('business-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un business', async () => {
      const updateDto = { name: 'Updated Business' };
      const mockBusiness = { id: 'business-1', ...updateDto };

      businessRepository.update.mockResolvedValue({ affected: 1 });
      businessRepository.findOne.mockResolvedValue(mockBusiness);

      const result = await service.update('business-1', updateDto);

      expect(result).toEqual(mockBusiness);
      expect(businessRepository.update).toHaveBeenCalledWith('business-1', updateDto);
    });
  });

  describe('delete', () => {
    it('devrait supprimer un business', async () => {
      businessRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete('business-1');

      expect(businessRepository.delete).toHaveBeenCalledWith('business-1');
    });

    it('devrait lever une exception si le business n\'existe pas', async () => {
      businessRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.delete('business-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSettings', () => {
    it('devrait retourner les paramètres d\'un business', async () => {
      const mockSettings = {
        id: 'settings-1',
        business_id: 'business-1',
        invoice_prefix: 'INV-',
      };

      settingsRepository.findOne.mockResolvedValue(mockSettings);

      const result = await service.getSettings('business-1');

      expect(result).toEqual(mockSettings);
    });

    it('devrait lever une exception si les paramètres n\'existent pas', async () => {
      settingsRepository.findOne.mockResolvedValue(null);

      await expect(service.getSettings('business-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('devrait mettre à jour les paramètres', async () => {
      const mockSettings = {
        id: 'settings-1',
        business_id: 'business-1',
        invoice_prefix: 'INV-',
      };

      const updateDto = { invoice_prefix: 'FACT-' };

      settingsRepository.findOne.mockResolvedValue(mockSettings);
      settingsRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateSettings('business-1', updateDto);

      expect(settingsRepository.update).toHaveBeenCalledWith(mockSettings.id, updateDto);
    });
  });

  describe('createTaxRate', () => {
    it('devrait créer un taux de taxe', async () => {
      const createDto = {
        name: 'TVA 19%',
        rate: 19,
        is_default: true,
      };

      const result = await service.createTaxRate('business-1', createDto);

      expect(result).toHaveProperty('id', 'tax-1');
      expect(taxRateRepository.save).toHaveBeenCalled();
    });

    it('devrait désactiver les autres taux par défaut si is_default est true', async () => {
      const createDto = {
        name: 'TVA 19%',
        rate: 19,
        is_default: true,
      };

      await service.createTaxRate('business-1', createDto);

      expect(taxRateRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getTaxRates', () => {
    it('devrait retourner tous les taux de taxe d\'un business', async () => {
      const mockTaxRates = [
        { id: 'tax-1', name: 'TVA 19%', rate: 19, is_default: true },
        { id: 'tax-2', name: 'TVA 7%', rate: 7, is_default: false },
      ];

      taxRateRepository.find.mockResolvedValue(mockTaxRates);

      const result = await service.getTaxRates('business-1');

      expect(result).toEqual(mockTaxRates);
    });
  });

  describe('getTaxRateById', () => {
    it('devrait retourner un taux de taxe par ID', async () => {
      const mockTaxRate = { id: 'tax-1', name: 'TVA 19%', rate: 19 };

      taxRateRepository.findOne.mockResolvedValue(mockTaxRate);

      const result = await service.getTaxRateById('business-1', 'tax-1');

      expect(result).toEqual(mockTaxRate);
    });

    it('devrait lever une exception si le taux n\'existe pas', async () => {
      taxRateRepository.findOne.mockResolvedValue(null);

      await expect(service.getTaxRateById('business-1', 'tax-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTaxRate', () => {
    it('devrait mettre à jour un taux de taxe', async () => {
      const updateDto = { rate: 20 };
      const mockTaxRate = { id: 'tax-1', name: 'TVA 20%', rate: 20 };

      taxRateRepository.update.mockResolvedValue({ affected: 1 });
      taxRateRepository.findOne.mockResolvedValue(mockTaxRate);

      const result = await service.updateTaxRate('business-1', 'tax-1', updateDto);

      expect(result).toEqual(mockTaxRate);
    });
  });

  describe('deleteTaxRate', () => {
    it('devrait supprimer un taux de taxe', async () => {
      taxRateRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteTaxRate('business-1', 'tax-1');

      expect(taxRateRepository.delete).toHaveBeenCalledWith({
        id: 'tax-1',
        business_id: 'business-1',
      });
    });

    it('devrait lever une exception si le taux n\'existe pas', async () => {
      taxRateRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteTaxRate('business-1', 'tax-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkAccess', () => {
    it('devrait retourner true si l\'utilisateur a accès', async () => {
      const mockBusiness = {
        id: 'business-1',
        tenant_id: 'tenant-1',
        tenant: { id: 'tenant-1' },
      };

      businessRepository.findOne.mockResolvedValue(mockBusiness);

      const result = await service.checkAccess('business-1', 'user-1', 'tenant-1');

      expect(result).toBe(true);
    });

    it('devrait retourner false si l\'utilisateur n\'a pas accès', async () => {
      const mockBusiness = {
        id: 'business-1',
        tenant_id: 'tenant-1',
        tenant: { id: 'tenant-1' },
      };

      businessRepository.findOne.mockResolvedValue(mockBusiness);

      const result = await service.checkAccess('business-1', 'user-1', 'tenant-2');

      expect(result).toBe(false);
    });
  });
});
