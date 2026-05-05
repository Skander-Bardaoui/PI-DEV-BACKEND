import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { BusinessMembersService } from './business-members.service';
import { BusinessMember } from '../entities/business-member.entity';
import { Business } from '../entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Role } from '../../users/enums/role.enum';
import { PermissionUtil } from '../utils/permission.util';

describe('BusinessMembersService', () => {
  let service: BusinessMembersService;
  let businessMemberRepo: Repository<BusinessMember>;
  let businessRepo: Repository<Business>;
  let userRepo: Repository<User>;
  let tenantRepo: Repository<Tenant>;

  const mockBusiness = {
    id: 'business-1',
    name: 'Test Business',
    tenant_id: 'tenant-1',
    created_at: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@test.com',
    role: Role.TEAM_MEMBER,
  };

  const mockOwner = {
    id: 'owner-1',
    email: 'owner@test.com',
    role: Role.BUSINESS_OWNER,
  };

  const mockTenant = {
    id: 'tenant-1',
    ownerId: 'owner-1',
  };

  const mockMember = {
    id: 'member-1',
    business_id: 'business-1',
    user_id: 'user-1',
    role: Role.TEAM_MEMBER,
    is_active: true,
    collaboration_permissions: { create_task: true },
    stock_permissions: { view_products: true },
    payment_permissions: { view_transactions: true },
    salary_permissions: { create_salary: false },
    sales_permissions: { create_quote: true },
    purchase_permissions: { create_goods_receipt: true },
    invited_by: 'owner-1',
    invited_at: new Date(),
    joined_at: new Date(),
    created_at: new Date(),
    user: mockUser,
    business: mockBusiness,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessMembersService,
        {
          provide: getRepositoryToken(BusinessMember),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BusinessMembersService>(BusinessMembersService);
    businessMemberRepo = module.get(getRepositoryToken(BusinessMember));
    businessRepo = module.get(getRepositoryToken(Business));
    userRepo = module.get(getRepositoryToken(User));
    tenantRepo = module.get(getRepositoryToken(Tenant));
  });

  describe('getUserBusinesses', () => {
    it('should return all businesses for PLATFORM_ADMIN', async () => {
      const adminUser = { ...mockUser, role: Role.PLATFORM_ADMIN };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(adminUser as any);
      jest.spyOn(businessRepo, 'find').mockResolvedValue([mockBusiness] as any);

      const result = await service.getUserBusinesses('admin-1');

      expect(result).toHaveLength(1);
      expect(businessRepo.find).toHaveBeenCalled();
    });

    it('should return tenant businesses for BUSINESS_OWNER', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockOwner as any);
      jest.spyOn(tenantRepo, 'findOne').mockResolvedValue(mockTenant as any);
      jest.spyOn(businessRepo, 'find').mockResolvedValue([mockBusiness] as any);

      const result = await service.getUserBusinesses('owner-1');

      expect(result).toHaveLength(1);
      expect(tenantRepo.findOne).toHaveBeenCalledWith({ where: { ownerId: 'owner-1' } });
    });

    it('should return member businesses for regular users', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(businessMemberRepo, 'find').mockResolvedValue([mockMember] as any);

      const result = await service.getUserBusinesses('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('business-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getUserBusinesses('invalid-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBusinessMembers', () => {
    it('should return all members of a business', async () => {
      jest.spyOn(businessMemberRepo, 'find').mockResolvedValue([mockMember] as any);

      const result = await service.getBusinessMembers('business-1');

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
      expect(businessMemberRepo.find).toHaveBeenCalledWith({
        where: { business_id: 'business-1' },
        relations: ['user'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('addMember', () => {
    it('should add a new member with default permissions', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(userRepo, 'findOne')
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockOwner as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(businessMemberRepo, 'create').mockReturnValue(mockMember as any);
      jest.spyOn(businessMemberRepo, 'save').mockResolvedValue(mockMember as any);

      const result = await service.addMember(
        'business-1',
        'user-1',
        Role.TEAM_MEMBER,
        'owner-1',
      );

      expect(result).toBeDefined();
      expect(businessMemberRepo.create).toHaveBeenCalled();
      expect(businessMemberRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if business not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.addMember('invalid-business', 'user-1', Role.TEAM_MEMBER, 'owner-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.addMember('business-1', 'invalid-user', Role.TEAM_MEMBER, 'owner-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user already a member', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(userRepo, 'findOne')
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockOwner as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(mockMember as any);

      await expect(
        service.addMember('business-1', 'user-1', Role.TEAM_MEMBER, 'owner-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid role', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(userRepo, 'findOne')
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockOwner as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.addMember('business-1', 'user-1', 'INVALID_ROLE' as Role, 'owner-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set full permissions for BUSINESS_OWNER role', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(userRepo, 'findOne')
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockOwner as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);
      
      const createSpy = jest.spyOn(businessMemberRepo, 'create').mockReturnValue(mockMember as any);
      jest.spyOn(businessMemberRepo, 'save').mockResolvedValue(mockMember as any);

      await service.addMember('business-1', 'user-1', Role.BUSINESS_OWNER, 'owner-1');

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: Role.BUSINESS_OWNER,
          salary_permissions: expect.objectContaining({
            create_salary: true,
            pay_salary: true,
          }),
        }),
      );
    });
  });

  describe('removeMember', () => {
    it('should remove a member from business', async () => {
      jest.spyOn(businessMemberRepo, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.removeMember('business-1', 'user-1');

      expect(businessMemberRepo.delete).toHaveBeenCalledWith({
        business_id: 'business-1',
        user_id: 'user-1',
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      jest.spyOn(businessMemberRepo, 'delete').mockResolvedValue({ affected: 0 } as any);

      await expect(service.removeMember('business-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(mockMember as any);
      jest.spyOn(businessMemberRepo, 'save').mockResolvedValue({
        ...mockMember,
        role: Role.BUSINESS_ADMIN,
      } as any);
      jest.spyOn(userRepo, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateMemberRole('business-1', 'user-1', Role.BUSINESS_ADMIN);

      expect(result.role).toBe(Role.BUSINESS_ADMIN);
      expect(userRepo.update).toHaveBeenCalledWith('user-1', { role: Role.BUSINESS_ADMIN });
    });

    it('should throw NotFoundException if business not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateMemberRole('invalid-business', 'user-1', Role.BUSINESS_ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if member not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateMemberRole('business-1', 'invalid-user', Role.BUSINESS_ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive member', async () => {
      const inactiveMember = { ...mockMember, is_active: false };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(inactiveMember as any);

      await expect(
        service.updateMemberRole('business-1', 'user-1', Role.BUSINESS_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set full permissions when promoting to BUSINESS_OWNER', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(mockMember as any);
      
      const saveSpy = jest.spyOn(businessMemberRepo, 'save').mockResolvedValue({
        ...mockMember,
        role: Role.BUSINESS_OWNER,
      } as any);
      jest.spyOn(userRepo, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.updateMemberRole('business-1', 'user-1', Role.BUSINESS_OWNER);

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: Role.BUSINESS_OWNER,
        }),
      );
    });

    it('should throw BadRequestException for invalid role', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(mockMember as any);

      await expect(
        service.updateMemberRole('business-1', 'user-1', 'INVALID_ROLE' as Role),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMemberPermissions', () => {
    it('should update collaboration permissions', async () => {
      // Use TEAM_MEMBER role (not BUSINESS_OWNER) since BUSINESS_OWNER permissions cannot be modified
      const memberCopy = { ...mockMember, role: Role.TEAM_MEMBER };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberCopy as any);
      jest.spyOn(businessMemberRepo, 'save').mockImplementation(async (entity: any) => {
        return { ...entity };
      });

      const result = await service.updateMemberPermissions(
        'business-1',
        'user-1',
        { create_task: false },
      );

      expect(result.collaboration_permissions.create_task).toBe(false);
    });

    it('should update stock permissions', async () => {
      const memberCopy = { ...mockMember, role: Role.TEAM_MEMBER };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberCopy as any);
      jest.spyOn(businessMemberRepo, 'save').mockImplementation(async (entity: any) => {
        return { ...entity };
      });

      const result = await service.updateMemberPermissions(
        'business-1',
        'user-1',
        undefined,
        { create_product: true },
      );

      expect(result.stock_permissions.create_product).toBe(true);
    });

    it('should update payment permissions', async () => {
      const memberCopy = { ...mockMember, role: Role.TEAM_MEMBER };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberCopy as any);
      jest.spyOn(businessMemberRepo, 'save').mockImplementation(async (entity: any) => {
        return { ...entity };
      });

      const result = await service.updateMemberPermissions(
        'business-1',
        'user-1',
        undefined,
        undefined,
        { create_payment: true },
      );

      expect(result.payment_permissions.create_payment).toBe(true);
    });

    it('should update salary permissions', async () => {
      const memberCopy = { ...mockMember, role: Role.TEAM_MEMBER };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberCopy as any);
      jest.spyOn(businessMemberRepo, 'save').mockImplementation(async (entity: any) => {
        return { ...entity };
      });

      const result = await service.updateMemberPermissions(
        'business-1',
        'user-1',
        undefined,
        undefined,
        undefined,
        { create_salary: true },
      );

      expect(result.salary_permissions.create_salary).toBe(true);
    });

    it('should update sales permissions', async () => {
      const memberCopy = { ...mockMember, role: Role.TEAM_MEMBER };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberCopy as any);
      jest.spyOn(businessMemberRepo, 'save').mockImplementation(async (entity: any) => {
        return { ...entity };
      });

      const result = await service.updateMemberPermissions(
        'business-1',
        'user-1',
        undefined,
        undefined,
        undefined,
        undefined,
        { create_invoice: true },
      );

      expect(result.sales_permissions.create_invoice).toBe(true);
    });

    it('should update purchase permissions', async () => {
      const memberCopy = { ...mockMember, role: Role.TEAM_MEMBER };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberCopy as any);
      jest.spyOn(businessMemberRepo, 'save').mockImplementation(async (entity: any) => {
        return { ...entity };
      });

      const result = await service.updateMemberPermissions(
        'business-1',
        'user-1',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { create_purchase_order: true },
      );

      expect(result.purchase_permissions.create_purchase_order).toBe(true);
    });

    it('should throw BadRequestException if no permissions provided', async () => {
      await expect(
        service.updateMemberPermissions('business-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if business not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateMemberPermissions('invalid-business', 'user-1', { create_task: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if member not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateMemberPermissions('business-1', 'invalid-user', { create_task: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive member', async () => {
      const inactiveMember = { ...mockMember, is_active: false };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(inactiveMember as any);

      await expect(
        service.updateMemberPermissions('business-1', 'user-1', { create_task: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for BUSINESS_OWNER', async () => {
      const ownerMember = { ...mockMember, role: Role.BUSINESS_OWNER };
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(ownerMember as any);

      await expect(
        service.updateMemberPermissions('business-1', 'user-1', { create_task: true }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('hasAccess', () => {
    it('should return true for PLATFORM_ADMIN', async () => {
      const adminUser = { ...mockUser, role: Role.PLATFORM_ADMIN };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(adminUser as any);

      const result = await service.hasAccess('admin-1', 'business-1');

      expect(result).toBe(true);
    });

    it('should return true for BUSINESS_OWNER of tenant', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockOwner as any);
      jest.spyOn(tenantRepo, 'findOne').mockResolvedValue(mockTenant as any);
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);

      const result = await service.hasAccess('owner-1', 'business-1');

      expect(result).toBe(true);
    });

    it('should return true for active member', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(mockMember as any);

      const result = await service.hasAccess('user-1', 'business-1');

      expect(result).toBe(true);
    });

    it('should return false for non-member', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);

      const result = await service.hasAccess('user-1', 'business-1');

      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      const result = await service.hasAccess('invalid-user', 'business-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserRoleInBusiness', () => {
    it('should return PLATFORM_ADMIN role', async () => {
      const adminUser = { ...mockUser, id: 'admin-1', role: Role.PLATFORM_ADMIN };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(adminUser as any);

      const result = await service.getUserRoleInBusiness('admin-1', 'business-1');

      expect(result).toBe(Role.PLATFORM_ADMIN);
    });

    it('should return BUSINESS_OWNER role', async () => {
      const ownerUser = { ...mockOwner };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(ownerUser as any);
      jest.spyOn(tenantRepo, 'findOne').mockResolvedValue(mockTenant as any);
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);

      const result = await service.getUserRoleInBusiness('owner-1', 'business-1');

      expect(result).toBe(Role.BUSINESS_OWNER);
    });

    it('should return member role', async () => {
      const regularUser = { ...mockUser, role: Role.TEAM_MEMBER };
      const regularMember = { ...mockMember, role: Role.TEAM_MEMBER };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(regularUser as any);
      jest.spyOn(tenantRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(regularMember as any);

      const result = await service.getUserRoleInBusiness('user-1', 'business-1');

      expect(result).toBe(Role.TEAM_MEMBER);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      const result = await service.getUserRoleInBusiness('invalid-user', 'business-1');

      expect(result).toBeNull();
    });
  });

  describe('validateUserCollaborationPermission', () => {
    it('should return true if user has permission', async () => {
      const regularUser = { ...mockUser, role: Role.TEAM_MEMBER };
      const memberWithPerm = { ...mockMember, collaboration_permissions: { create_task: true } };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(regularUser as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberWithPerm as any);

      const result = await service.validateUserCollaborationPermission(
        'user-1',
        'business-1',
        'create_task',
      );

      expect(result).toBe(true);
    });

    it('should return false if user lacks permission', async () => {
      const regularUser = { ...mockUser, role: Role.TEAM_MEMBER };
      const memberWithoutPerm = { ...mockMember, collaboration_permissions: { create_task: false } };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(regularUser as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberWithoutPerm as any);

      const result = await service.validateUserCollaborationPermission(
        'user-1',
        'business-1',
        'delete_task',
      );

      expect(result).toBe(false);
    });
  });

  describe('validateUserStockPermission', () => {
    it('should return true if user has permission', async () => {
      const regularUser = { ...mockUser, role: Role.TEAM_MEMBER };
      const memberWithPerm = { ...mockMember, stock_permissions: { view_products: true } };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(regularUser as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberWithPerm as any);

      const result = await service.validateUserStockPermission(
        'user-1',
        'business-1',
        'view_products',
      );

      expect(result).toBe(true);
    });
  });

  describe('validateUserPaymentPermission', () => {
    it('should return true if user has permission', async () => {
      const regularUser = { ...mockUser, role: Role.TEAM_MEMBER };
      const memberWithPerm = { ...mockMember, payment_permissions: { view_transactions: true } };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(regularUser as any);
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(memberWithPerm as any);

      const result = await service.validateUserPaymentPermission(
        'user-1',
        'business-1',
        'view_transactions',
      );

      expect(result).toBe(true);
    });
  });

  describe('seedExistingMembersWithDefaultPermissions', () => {
    it('should update members without permissions', async () => {
      const memberWithoutPerms = {
        ...mockMember,
        collaboration_permissions: null,
        stock_permissions: null,
      };
      jest.spyOn(businessMemberRepo, 'find').mockResolvedValue([memberWithoutPerms] as any);
      jest.spyOn(businessMemberRepo, 'save').mockResolvedValue(mockMember as any);

      const result = await service.seedExistingMembersWithDefaultPermissions();

      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it('should skip members with errors', async () => {
      const memberWithoutPerms = {
        ...mockMember,
        collaboration_permissions: null,
      };
      jest.spyOn(businessMemberRepo, 'find').mockResolvedValue([memberWithoutPerms] as any);
      jest.spyOn(businessMemberRepo, 'save').mockRejectedValue(new Error('Save failed'));

      const result = await service.seedExistingMembersWithDefaultPermissions();

      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });

  describe('getBusinessMemberDetails', () => {
    it('should return member details with permissions', async () => {
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(mockMember as any);

      const result = await service.getBusinessMemberDetails('business-1', 'user-1');

      expect(result).toBeDefined();
      expect(result?.user_id).toBe('user-1');
      expect(result?.collaboration_permissions).toBeDefined();
    });

    it('should return null if member not found', async () => {
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);

      const result = await service.getBusinessMemberDetails('business-1', 'invalid-user');

      expect(result).toBeNull();
    });
  });
});
