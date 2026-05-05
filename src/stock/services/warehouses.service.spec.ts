import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from '../entities/warehouse.entity';
import { Product } from '../entities/product.entity';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let warehouseRepo: Repository<Warehouse>;
  let productRepo: Repository<Product>;

  const mockWarehouse = {
    id: 'warehouse-1',
    business_id: 'business-1',
    code: 'WH001',
    name: 'Main Warehouse',
    location: 'Tunis',
    is_active: true,
  };

  const mockProduct = {
    id: 'product-1',
    business_id: 'business-1',
    warehouse_id: 'warehouse-1',
    name: 'Product A',
    sku: 'SKU001',
    quantity: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
    warehouseRepo = module.get(getRepositoryToken(Warehouse));
    productRepo = module.get(getRepositoryToken(Product));
  });

  describe('findAll', () => {
    it('should return all warehouses for business', async () => {
      jest.spyOn(warehouseRepo, 'find').mockResolvedValue([mockWarehouse] as any);

      const result = await service.findAll('business-1');

      expect(result).toEqual([mockWarehouse]);
      expect(warehouseRepo.find).toHaveBeenCalledWith({
        where: { business_id: 'business-1' },
        order: { name: 'ASC' },
      });
    });

    it('should filter by is_active when provided', async () => {
      jest.spyOn(warehouseRepo, 'find').mockResolvedValue([mockWarehouse] as any);

      await service.findAll('business-1', true);

      expect(warehouseRepo.find).toHaveBeenCalledWith({
        where: { business_id: 'business-1', is_active: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return warehouse by id', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(mockWarehouse as any);

      const result = await service.findOne('business-1', 'warehouse-1');

      expect(result).toEqual(mockWarehouse);
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('business-1', 'warehouse-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create warehouse successfully', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(warehouseRepo, 'create').mockReturnValue(mockWarehouse as any);
      jest.spyOn(warehouseRepo, 'save').mockResolvedValue(mockWarehouse as any);

      const dto = {
        code: 'WH001',
        name: 'Main Warehouse',
        location: 'Tunis',
        is_active: true,
      };

      const result = await service.create('business-1', dto);

      expect(result).toEqual(mockWarehouse);
      expect(warehouseRepo.create).toHaveBeenCalledWith({
        ...dto,
        business_id: 'business-1',
      });
    });

    it('should throw BadRequestException if code already exists', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(mockWarehouse as any);

      const dto = {
        code: 'WH001',
        name: 'Another Warehouse',
        location: 'Sfax',
        is_active: true,
      };

      await expect(service.create('business-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update warehouse successfully', async () => {
      const updated = { ...mockWarehouse, name: 'Updated Warehouse' };
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(mockWarehouse as any);
      jest.spyOn(warehouseRepo, 'save').mockResolvedValue(updated as any);

      const dto = { name: 'Updated Warehouse' };
      const result = await service.update('business-1', 'warehouse-1', dto);

      expect(result.name).toBe('Updated Warehouse');
    });

    it('should throw BadRequestException if new code already exists', async () => {
      const existing = { ...mockWarehouse, id: 'warehouse-2' };
      jest.spyOn(warehouseRepo, 'findOne')
        .mockResolvedValueOnce(mockWarehouse as any)
        .mockResolvedValueOnce(existing as any);

      const dto = { code: 'WH002' };

      await expect(service.update('business-1', 'warehouse-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow updating same code', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(mockWarehouse as any);
      jest.spyOn(warehouseRepo, 'save').mockResolvedValue(mockWarehouse as any);

      const dto = { code: 'WH001', name: 'Updated Name' };
      const result = await service.update('business-1', 'warehouse-1', dto);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove warehouse successfully', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(mockWarehouse as any);
      jest.spyOn(warehouseRepo, 'remove').mockResolvedValue(mockWarehouse as any);

      await service.remove('business-1', 'warehouse-1');

      expect(warehouseRepo.remove).toHaveBeenCalledWith(mockWarehouse);
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(null);

      await expect(service.remove('business-1', 'warehouse-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWarehouseStock', () => {
    it('should return products in warehouse', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(mockWarehouse as any);
      jest.spyOn(productRepo, 'find').mockResolvedValue([mockProduct] as any);

      const result = await service.getWarehouseStock('business-1', 'warehouse-1');

      expect(result).toEqual([mockProduct]);
      expect(productRepo.find).toHaveBeenCalledWith({
        where: {
          business_id: 'business-1',
          warehouse_id: 'warehouse-1',
        },
        relations: ['category'],
        order: { name: 'ASC' },
      });
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      jest.spyOn(warehouseRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getWarehouseStock('business-1', 'warehouse-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
