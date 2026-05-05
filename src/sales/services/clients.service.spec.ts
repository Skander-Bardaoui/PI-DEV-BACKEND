import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from '../entities/client.entity';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: Repository<Client>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const businessId = 'business-123';
  const clientId = 'client-456';

  const mockClient: Partial<Client> = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repository = module.get<Repository<Client>>(getRepositoryToken(Client));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        email: 'client@test.com',
        phone: '+216 12 345 678',
        address: '123 Test Street',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockClient);
      mockRepository.save.mockResolvedValue(mockClient);

      const result = await service.create(businessId, createDto);

      expect(result).toEqual(mockClient);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        business_id: businessId,
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if client with same email exists', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        email: 'client@test.com',
      };

      mockRepository.findOne.mockResolvedValue(mockClient);

      await expect(service.create(businessId, createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(businessId, createDto)).rejects.toThrow(/existe déjà/);
    });

    it('should create client without email', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        phone: '+216 12 345 678',
      };

      mockRepository.create.mockReturnValue({ ...mockClient, email: null });
      mockRepository.save.mockResolvedValue({ ...mockClient, email: null });

      const result = await service.create(businessId, createDto);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      const query = { page: 1, limit: 10 };
      const mockClients = [mockClient];

      mockRepository.findAndCount.mockResolvedValue([mockClients, 1]);

      const result = await service.findAll(businessId, query);

      expect(result).toEqual({
        clients: mockClients,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by search term', async () => {
      const query = { search: 'test', page: 1, limit: 10 };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            business_id: businessId,
            name: expect.anything(),
          }),
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const query = { page: 2, limit: 10 };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        }),
      );
    });

    it('should order by created_at DESC', async () => {
      const query = { page: 1, limit: 10 };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { created_at: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findOne(businessId, clientId);

      expect(result).toEqual(mockClient);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: clientId, business_id: businessId },
      });
    });

    it('should throw NotFoundException if client not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(businessId, clientId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const updateDto: UpdateClientDto = {
        phone: '+216 98 765 432',
        address: '456 New Street',
      };

      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.save.mockResolvedValue({ ...mockClient, ...updateDto });

      const result = await service.update(businessId, clientId, updateDto);

      expect(result.phone).toBe('+216 98 765 432');
      expect(result.address).toBe('456 New Street');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if new email already exists', async () => {
      const updateDto: UpdateClientDto = {
        email: 'existing@test.com',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce({ ...mockClient, id: 'different-id', email: 'existing@test.com' });

      await expect(service.update(businessId, clientId, updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should allow updating to same email', async () => {
      const updateDto: UpdateClientDto = {
        email: 'client@test.com',
      };

      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.save.mockResolvedValue(mockClient);

      const result = await service.update(businessId, clientId, updateDto);

      expect(result).toEqual(mockClient);
    });

    it('should allow updating without email change', async () => {
      const updateDto: UpdateClientDto = {
        name: 'Updated Client Name',
      };

      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.save.mockResolvedValue({ ...mockClient, name: 'Updated Client Name' });

      const result = await service.update(businessId, clientId, updateDto);

      expect(result.name).toBe('Updated Client Name');
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.remove.mockResolvedValue(mockClient);

      await service.remove(businessId, clientId);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockClient);
    });

    it('should throw BadRequestException if client has related documents', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.remove.mockRejectedValue({ code: '23503' });

      await expect(service.remove(businessId, clientId)).rejects.toThrow(BadRequestException);
      await expect(service.remove(businessId, clientId)).rejects.toThrow(/lié à des devis, commandes ou factures/);
    });

    it('should rethrow other errors', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.remove.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(businessId, clientId)).rejects.toThrow('Database error');
    });
  });
});
