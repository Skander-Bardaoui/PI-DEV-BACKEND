import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { of, throwError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MlPredictionService } from './ml-prediction.service';
import { SupplierPO } from '../entities/supplier-po.entity';
import { SupplierPOItem } from '../entities/supplier-po-item.entity';
import { Product } from '../../stock/entities/product.entity';
import { MLRecommendationAction, MLRecommendationActionType } from '../entities/ml-recommendation-action.entity';

describe('MlPredictionService', () => {
  let service: MlPredictionService;
  let httpService: HttpService;
  let configService: ConfigService;
  let supplierPORepo: Repository<SupplierPO>;
  let supplierPOItemRepo: Repository<SupplierPOItem>;
  let productRepo: Repository<Product>;
  let mlActionRepo: Repository<MLRecommendationAction>;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:8000'),
  };

  const mockSupplierPORepo = {
    findOne: jest.fn(),
  };

  const mockSupplierPOItemRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockProductRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMLActionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MlPredictionService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: mockSupplierPORepo,
        },
        {
          provide: getRepositoryToken(SupplierPOItem),
          useValue: mockSupplierPOItemRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
        {
          provide: getRepositoryToken(MLRecommendationAction),
          useValue: mockMLActionRepo,
        },
      ],
    }).compile();

    service = module.get<MlPredictionService>(MlPredictionService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    supplierPORepo = module.get<Repository<SupplierPO>>(getRepositoryToken(SupplierPO));
    supplierPOItemRepo = module.get<Repository<SupplierPOItem>>(getRepositoryToken(SupplierPOItem));
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    mlActionRepo = module.get<Repository<MLRecommendationAction>>(getRepositoryToken(MLRecommendationAction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return health status from ML service', async () => {
      const healthResponse = {
        status: 'healthy',
        model_loaded: true,
        version: '1.0.0',
      };
      mockHttpService.get.mockReturnValue(of({ data: healthResponse }));

      const result = await service.checkHealth();

      expect(result).toEqual(healthResponse);
      expect(mockHttpService.get).toHaveBeenCalledWith('http://localhost:8000/api/v1/health');
    });

    it('should throw HttpException if ML service is unavailable', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Service unavailable'))
      );

      await expect(service.checkHealth()).rejects.toThrow(HttpException);
    });
  });

  describe('predictDemand', () => {
    it('should predict demand for a product', async () => {
      const request = {
        product_id: 'product-1',
        history: [
          {
            date: '2024-01-01',
            product_id: 'product-1',
            product_name: 'Product A',
            quantity: 10,
            price: 100,
            supplier: 'Supplier A',
          },
        ],
        prediction_days: 30,
      };
      const predictionResponse = {
        product_id: 'product-1',
        predicted_quantity: 15,
        confidence: 0.85,
        prediction_date: '2024-02-01',
      };
      mockHttpService.post.mockReturnValue(of({ data: predictionResponse }));

      const result = await service.predictDemand(request);

      expect(result).toEqual(predictionResponse);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/predict/demand',
        request
      );
    });

    it('should throw BadRequestException for insufficient data', async () => {
      const request = {
        product_id: 'product-1',
        history: [],
        prediction_days: 30,
      };
      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: {
            status: 400,
            data: { detail: 'Insufficient data' },
          },
        }))
      );

      await expect(service.predictDemand(request)).rejects.toThrow(HttpException);
    });
  });

  describe('predictBatch', () => {
    it('should predict demand for multiple products', async () => {
      const request = {
        products: [
          {
            product_id: 'product-1',
            history: [],
          },
          {
            product_id: 'product-2',
            history: [],
          },
        ],
        prediction_days: 30,
      };
      const batchResponse = {
        predictions: [],
        successful: 2,
        failed: 0,
      };
      mockHttpService.post.mockReturnValue(of({ data: batchResponse }));

      const result = await service.predictBatch(request);

      expect(result).toEqual(batchResponse);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/predict/batch',
        request
      );
    });
  });

  describe('getRecommendations', () => {
    it('should get purchase recommendations', async () => {
      const request = {
        products: [
          {
            product_id: 'product-1',
            history: [],
          },
        ],
        prediction_days: 30,
      };
      const recommendationsResponse = {
        recommendations: [],
        total_recommendations: 0,
        urgent_count: 0,
        total_estimated_value: 0,
        generated_at: '2024-01-01T00:00:00Z',
      };
      mockHttpService.post.mockReturnValue(of({ data: recommendationsResponse }));

      const result = await service.getRecommendations(request);

      expect(result).toEqual(recommendationsResponse);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/recommendations',
        request
      );
    });
  });

  describe('buildProductHistory', () => {
    it('should throw HttpException if product not found', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(
        service.buildProductHistory('product-1', 'business-1')
      ).rejects.toThrow(HttpException);
    });

    it('should build product history from database', async () => {
      const product = {
        id: 'product-1',
        name: 'Product A',
        category: 'Category A',
      };
      const poItems = [
        {
          quantity_ordered: 10,
          unit_price_ht: 100,
          supplier_po: {
            created_at: new Date('2024-01-01'),
            supplier: { name: 'Supplier A' },
          },
        },
      ];

      mockProductRepo.findOne.mockResolvedValue(product);
      
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(poItems),
      };
      mockSupplierPOItemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.buildProductHistory('product-1', 'business-1');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].product_id).toBe('product-1');
      expect(result[0].quantity).toBe(10);
    });

    it('should throw HttpException if no purchase history found', async () => {
      const product = {
        id: 'product-1',
        name: 'Product A',
      };
      mockProductRepo.findOne.mockResolvedValue(product);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSupplierPOItemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(
        service.buildProductHistory('product-1', 'business-1')
      ).rejects.toThrow(HttpException);
    });
  });

  describe('markAsProcessed', () => {
    it('should mark recommendation as processed', async () => {
      const action = {
        business_id: 'business-1',
        product_id: 'product-1',
        recommendation_date: new Date().toISOString().split('T')[0],
        action_type: MLRecommendationActionType.BC_CREATED,
        supplier_po_id: 'po-1',
        notes: 'BC créé automatiquement depuis une recommandation ML',
      };
      mockMLActionRepo.create.mockReturnValue(action);
      mockMLActionRepo.save.mockResolvedValue(action);

      await service.markAsProcessed('business-1', 'product-1', 'po-1');

      expect(mockMLActionRepo.create).toHaveBeenCalled();
      expect(mockMLActionRepo.save).toHaveBeenCalled();
    });
  });
});
