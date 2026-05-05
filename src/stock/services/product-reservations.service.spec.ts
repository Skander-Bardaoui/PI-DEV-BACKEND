import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductReservationsService } from './product-reservations.service';
import { Product } from '../entities/product.entity';

describe('ProductReservationsService', () => {
  let service: ProductReservationsService;
  let productRepo: Repository<Product>;

  const mockProduct = {
    id: 'product-1',
    business_id: 'business-1',
    name: 'Product A',
    sku: 'SKU001',
    quantity: 100,
    reserved_quantity: 0,
    min_quantity: 10,
    unit: 'pcs',
    cost: 50,
    price: 100,
    is_active: true,
    default_supplier_id: 'supplier-1',
    reserved_supplier_id: null,
    default_supplier: {
      id: 'supplier-1',
      name: 'Supplier A',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReservationsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductReservationsService>(ProductReservationsService);
    productRepo = module.get(getRepositoryToken(Product));
  });

  describe('createReservation', () => {
    it('should create reservation successfully', async () => {
      const product = { ...mockProduct };
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(product as any);
      jest.spyOn(productRepo, 'save').mockResolvedValue({
        ...product,
        reserved_quantity: 20,
        reserved_supplier_id: 'supplier-2',
      } as any);
      jest.spyOn(productRepo, 'query').mockResolvedValue([{ name: 'Supplier B' }]);

      const dto = {
        product_id: 'product-1',
        quantity: 20,
        supplier_id: 'supplier-2',
      };

      const result = await service.createReservation('business-1', dto);

      expect(result.reserved_quantity).toBe(20);
      expect(result.reserved_supplier_id).toBe('supplier-2');
      expect(result.reserved_supplier_name).toBe('Supplier B');
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(null);

      const dto = {
        product_id: 'product-1',
        quantity: 20,
      };

      await expect(service.createReservation('business-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default supplier if supplier_id not provided', async () => {
      const product = { ...mockProduct };
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(product as any);
      jest.spyOn(productRepo, 'save').mockResolvedValue({
        ...product,
        reserved_quantity: 15,
        reserved_supplier_id: 'supplier-1',
      } as any);
      jest.spyOn(productRepo, 'query').mockResolvedValue([{ name: 'Supplier A' }]);

      const dto = {
        product_id: 'product-1',
        quantity: 15,
      };

      const result = await service.createReservation('business-1', dto);

      expect(result.reserved_supplier_id).toBe('supplier-1');
    });
  });

  describe('getReservations', () => {
    it('should return all products with reservations', async () => {
      const products = [
        { ...mockProduct, reserved_quantity: 20, reserved_supplier_id: 'supplier-2' },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(products),
      };

      jest.spyOn(productRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(productRepo, 'query').mockResolvedValue([{ name: 'Supplier B' }]);

      const result = await service.getReservations('business-1');

      expect(result).toHaveLength(1);
      expect(result[0].reserved_quantity).toBe(20);
    });

    it('should handle products without reserved supplier', async () => {
      const products = [{ ...mockProduct, reserved_quantity: 10, reserved_supplier_id: null }];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(products),
      };

      jest.spyOn(productRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getReservations('business-1');

      expect(result[0].reserved_supplier_name).toBeNull();
    });
  });

  describe('clearReservation', () => {
    it('should clear reservation successfully', async () => {
      const product = { ...mockProduct, reserved_quantity: 20, reserved_supplier_id: 'supplier-2' };
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(product as any);
      jest.spyOn(productRepo, 'save').mockResolvedValue({
        ...product,
        reserved_quantity: 0,
        reserved_supplier_id: null,
      } as any);

      await service.clearReservation('business-1', 'product-1');

      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          reserved_quantity: 0,
          reserved_supplier_id: null,
        }),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(null);

      await expect(service.clearReservation('business-1', 'product-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateReservation', () => {
    it('should update reservation quantity', async () => {
      const product = { ...mockProduct };
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(product as any);
      jest.spyOn(productRepo, 'save').mockResolvedValue({
        ...product,
        reserved_quantity: 30,
      } as any);

      const result = await service.updateReservation('business-1', 'product-1', 30);

      expect(result.reserved_quantity).toBe(30);
    });

    it('should throw BadRequestException if quantity is negative', async () => {
      const product = { ...mockProduct };
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(product as any);

      await expect(service.updateReservation('business-1', 'product-1', -10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(null);

      await expect(service.updateReservation('business-1', 'product-1', 20)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
