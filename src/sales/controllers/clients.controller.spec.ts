import { Test, TestingModule } from '@nestjs/testing';
import { SalesClientsController } from './clients.controller';
import { ClientsService } from '../services/clients.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SalesPermissionGuard } from '../guards/sales-permission.guard';

describe('ClientsController', () => {
  let controller: SalesClientsController;
  let service: ClientsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const businessId = 'business-123';
  const clientId = 'client-456';

  const mockClient = {
    id: clientId,
    business_id: businessId,
    name: 'Test Client',
    email: 'client@test.com',
    phone: '+216 12 345 678',
    address: '123 Test Street',
    tax_id: '1234567A',
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Mock Guards
  const mockAuthGuard = { canActivate: jest.fn(() => true) };
  const mockRolesGuard = { canActivate: jest.fn(() => true) };
  const mockSalesPermissionGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue(mockAuthGuard)
    .overrideGuard(RolesGuard)
    .useValue(mockRolesGuard)
    .overrideGuard(SalesPermissionGuard)
    .useValue(mockSalesPermissionGuard)
    .compile();

    controller = module.get<SalesClientsController>(SalesClientsController);
    service = module.get<ClientsService>(ClientsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        email: 'client@test.com',
        phone: '+216 12 345 678',
        address: '123 Test Street',
      };

      mockService.create.mockResolvedValue(mockClient);

      const result = await controller.create(businessId, createDto);

      expect(result).toEqual(mockClient);
      expect(service.create).toHaveBeenCalledWith(businessId, createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      const query = { page: 1, limit: 10 };
      const mockResponse = {
        clients: [mockClient],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(businessId, query);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });

    it('should filter by search term', async () => {
      const query = { search: 'test' };
      mockService.findAll.mockResolvedValue({ clients: [], total: 0, page: 1, limit: 10, totalPages: 0 });

      await controller.findAll(businessId, query);

      expect(service.findAll).toHaveBeenCalledWith(businessId, query);
    });
  });

  describe('findOne', () => {
    it('should return a single client', async () => {
      mockService.findOne.mockResolvedValue(mockClient);

      const result = await controller.findOne(businessId, clientId);

      expect(result).toEqual(mockClient);
      expect(service.findOne).toHaveBeenCalledWith(businessId, clientId);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const updateDto: UpdateClientDto = {
        phone: '+216 98 765 432',
        address: '456 New Street',
      };

      const updatedClient = { ...mockClient, ...updateDto };
      mockService.update.mockResolvedValue(updatedClient);

      const result = await controller.update(businessId, clientId, updateDto);

      expect(result).toEqual(updatedClient);
      expect(service.update).toHaveBeenCalledWith(businessId, clientId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(businessId, clientId);

      expect(service.remove).toHaveBeenCalledWith(businessId, clientId);
    });
  });
});
