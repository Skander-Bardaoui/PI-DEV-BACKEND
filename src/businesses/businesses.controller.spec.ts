import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessMembersService } from './services/business-members.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Business } from './entities/business.entity';
import { BusinessMember } from './entities/business-member.entity';
import { Role } from '../users/enums/role.enum';

describe('BusinessesController', () => {
  let controller: BusinessesController;
  let businessesService: any;
  let businessMembersService: any;
  let tenantsRepository: any;

  beforeEach(async () => {
    businessesService = {
      getMyBusinesses: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      createTaxRate: jest.fn(),
      getTaxRates: jest.fn(),
      updateTaxRate: jest.fn(),
      deleteTaxRate: jest.fn(),
    };

    businessMembersService = {
      getUserBusinesses: jest.fn(),
      addMember: jest.fn(),
      getBusinessMembers: jest.fn(),
      removeMember: jest.fn(),
      updateMemberRole: jest.fn(),
      updateMemberPermissions: jest.fn(),
      getBusinessMemberDetails: jest.fn(),
      seedExistingMembersWithDefaultPermissions: jest.fn(),
    };

    tenantsRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        {
          provide: BusinessesService,
          useValue: businessesService,
        },
        {
          provide: BusinessMembersService,
          useValue: businessMembersService,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: tenantsRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(BusinessMember),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn(), getAllAndOverride: jest.fn() },
        },
      ],
    })
      .overrideGuard(require('@nestjs/passport').AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BusinessesController>(BusinessesController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyBusinesses', () => {
    it('devrait retourner les businesses de l\'utilisateur', async () => {
      const mockReq = {
        user: { id: 'user-1', role: Role.BUSINESS_OWNER },
      };

      const mockBusinesses = [
        { id: 'business-1', name: 'Business 1' },
        { id: 'business-2', name: 'Business 2' },
      ];

      businessMembersService.getUserBusinesses.mockResolvedValue(mockBusinesses);

      const result = await controller.getMyBusinesses(mockReq);

      expect(result).toEqual(mockBusinesses);
      expect(businessMembersService.getUserBusinesses).toHaveBeenCalledWith('user-1');
    });
  });

  describe('create', () => {
    it('devrait créer un business pour un BUSINESS_OWNER', async () => {
      const createDto = {
        name: 'New Business',
        tax_id: '123456',
        currency: 'TND',
        address: 'Test Address',
        email: 'business@test.com',
      };

      const mockReq = {
        user: { id: 'user-1', role: Role.BUSINESS_OWNER },
      };

      const mockTenant = {
        id: 'tenant-1',
        ownerId: 'user-1',
        logoUrl: 'logo.png',
      };

      const mockBusiness = {
        id: 'business-1',
        ...createDto,
        tenant_id: 'tenant-1',
      };

      tenantsRepository.findOne.mockResolvedValue(mockTenant);
      businessesService.create.mockResolvedValue(mockBusiness);
      businessMembersService.addMember.mockResolvedValue({});

      const result = await controller.create(createDto, mockReq);

      expect(result).toEqual(mockBusiness);
      expect(businessesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          tenant_id: 'tenant-1',
        }),
      );
      expect(businessMembersService.addMember).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('devrait retourner tous les businesses avec pagination', async () => {
      const query = { page: 1, limit: 20 };
      const mockReq = { user: { id: 'user-1' } };

      const mockResult = {
        businesses: [{ id: 'business-1', name: 'Business 1' }],
        total: 1,
      };

      businessesService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query, mockReq);

      expect(result).toHaveProperty('businesses');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 20);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un business par ID', async () => {
      const mockBusiness = { id: 'business-1', name: 'Test Business' };

      businessesService.findById.mockResolvedValue(mockBusiness);

      const result = await controller.findOne('business-1');

      expect(result).toEqual(mockBusiness);
      expect(businessesService.findById).toHaveBeenCalledWith('business-1');
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un business', async () => {
      const updateDto = { name: 'Updated Business' };
      const mockBusiness = { id: 'business-1', ...updateDto };

      businessesService.update.mockResolvedValue(mockBusiness);

      const result = await controller.update('business-1', updateDto);

      expect(result).toEqual(mockBusiness);
      expect(businessesService.update).toHaveBeenCalledWith('business-1', updateDto);
    });
  });

  describe('delete', () => {
    it('devrait supprimer un business', async () => {
      businessesService.delete.mockResolvedValue(undefined);

      const result = await controller.delete('business-1');

      expect(result).toEqual({ message: 'Business deleted successfully' });
      expect(businessesService.delete).toHaveBeenCalledWith('business-1');
    });
  });

  describe('getSettings', () => {
    it('devrait retourner les paramètres d\'un business', async () => {
      const mockSettings = {
        id: 'settings-1',
        business_id: 'business-1',
        invoice_prefix: 'INV-',
      };

      businessesService.getSettings.mockResolvedValue(mockSettings);

      const result = await controller.getSettings('business-1');

      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateSettings', () => {
    it('devrait mettre à jour les paramètres', async () => {
      const updateDto = { invoice_prefix: 'FACT-' };
      const mockSettings = {
        id: 'settings-1',
        business_id: 'business-1',
        ...updateDto,
      };

      businessesService.updateSettings.mockResolvedValue(mockSettings);

      const result = await controller.updateSettings('business-1', updateDto);

      expect(result).toEqual(mockSettings);
    });
  });

  describe('createTaxRate', () => {
    it('devrait créer un taux de taxe', async () => {
      const createDto = {
        name: 'TVA 19%',
        rate: 19,
        is_default: true,
      };

      const mockTaxRate = { id: 'tax-1', ...createDto };

      businessesService.createTaxRate.mockResolvedValue(mockTaxRate);

      const result = await controller.createTaxRate('business-1', createDto);

      expect(result).toEqual(mockTaxRate);
    });
  });

  describe('getTaxRates', () => {
    it('devrait retourner tous les taux de taxe', async () => {
      const mockTaxRates = [
        { id: 'tax-1', name: 'TVA 19%', rate: 19 },
        { id: 'tax-2', name: 'TVA 7%', rate: 7 },
      ];

      businessesService.getTaxRates.mockResolvedValue(mockTaxRates);

      const result = await controller.getTaxRates('business-1');

      expect(result).toEqual(mockTaxRates);
    });
  });

  describe('updateTaxRate', () => {
    it('devrait mettre à jour un taux de taxe', async () => {
      const updateDto = { rate: 20 };
      const mockTaxRate = { id: 'tax-1', name: 'TVA 20%', rate: 20 };

      businessesService.updateTaxRate.mockResolvedValue(mockTaxRate);

      const result = await controller.updateTaxRate('business-1', 'tax-1', updateDto);

      expect(result).toEqual(mockTaxRate);
    });
  });

  describe('deleteTaxRate', () => {
    it('devrait supprimer un taux de taxe', async () => {
      businessesService.deleteTaxRate.mockResolvedValue(undefined);

      const result = await controller.deleteTaxRate('business-1', 'tax-1');

      expect(result).toEqual({ message: 'Tax rate deleted successfully' });
    });
  });

  describe('getMembers', () => {
    it('devrait retourner les membres d\'un business', async () => {
      const mockMembers = [
        { id: 'member-1', user_id: 'user-1', role: Role.BUSINESS_OWNER },
        { id: 'member-2', user_id: 'user-2', role: Role.TEAM_MEMBER },
      ];

      businessMembersService.getBusinessMembers.mockResolvedValue(mockMembers);

      const result = await controller.getMembers('business-1');

      expect(result).toEqual(mockMembers);
    });
  });

  describe('addMember', () => {
    it('devrait ajouter un membre à un business', async () => {
      const body = { userId: 'user-2', role: Role.TEAM_MEMBER };
      const mockReq = { user: { id: 'user-1' } };

      const mockMember = {
        id: 'member-1',
        user_id: 'user-2',
        role: Role.TEAM_MEMBER,
      };

      businessMembersService.addMember.mockResolvedValue(mockMember);

      const result = await controller.addMember('business-1', body, mockReq);

      expect(result).toEqual(mockMember);
      expect(businessMembersService.addMember).toHaveBeenCalledWith(
        'business-1',
        'user-2',
        Role.TEAM_MEMBER,
        'user-1',
      );
    });
  });

  describe('removeMember', () => {
    it('devrait retirer un membre d\'un business', async () => {
      businessMembersService.removeMember.mockResolvedValue(undefined);

      const result = await controller.removeMember('business-1', 'user-2');

      expect(result).toEqual({ message: 'Member removed successfully' });
      expect(businessMembersService.removeMember).toHaveBeenCalledWith('business-1', 'user-2');
    });
  });

  describe('updateMemberRole', () => {
    it('devrait mettre à jour le rôle d\'un membre', async () => {
      const body = { role: Role.BUSINESS_ADMIN };
      const mockMember = {
        id: 'member-1',
        user_id: 'user-2',
        role: Role.BUSINESS_ADMIN,
      };

      businessMembersService.updateMemberRole.mockResolvedValue(mockMember);

      const result = await controller.updateMemberRole('business-1', 'user-2', body);

      expect(result).toEqual(mockMember);
    });
  });

  describe('seedMemberPermissions', () => {
    it('devrait initialiser les permissions des membres existants', async () => {
      const mockResult = { message: 'Permissions seeded successfully' };

      businessMembersService.seedExistingMembersWithDefaultPermissions.mockResolvedValue(
        mockResult,
      );

      const result = await controller.seedMemberPermissions();

      expect(result).toEqual(mockResult);
    });
  });
});
