import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { FraudDetectionService, FraudResult } from './fraud-detection.service';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudDetectionService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:8000'),
          },
        },
      ],
    }).compile();

    service = module.get<FraudDetectionService>(FraudDetectionService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('evaluate', () => {
    it('should return fraud result from ML service', async () => {
      const mockFraudResult: FraudResult = {
        fraud_score: 0.85,
        is_fraud: true,
        confidence: 'high',
        action: 'block',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of({ data: mockFraudResult } as any));

      const result = await service.evaluate({
        amount: 5000,
        type: 'DECAISSEMENT',
        transaction_date: new Date('2024-01-15T14:30:00'),
      });

      expect(result).toEqual(mockFraudResult);
      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/predict/fraud',
        expect.objectContaining({
          amount: 5000,
          transaction_type: 'DECAISSEMENT',
          hour: 14,
          is_weekend: 0,
          is_night: 0,
        }),
        { timeout: 3000 },
      );
    });

    it('should detect weekend transactions', async () => {
      const mockFraudResult: FraudResult = {
        fraud_score: 0.3,
        is_fraud: false,
        confidence: 'low',
        action: 'allow',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of({ data: mockFraudResult } as any));

      // Sunday = 0
      await service.evaluate({
        amount: 1000,
        transaction_date: new Date('2024-01-14T10:00:00'), // Sunday
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          is_weekend: 1,
        }),
        expect.any(Object),
      );
    });

    it('should detect night transactions', async () => {
      const mockFraudResult: FraudResult = {
        fraud_score: 0.5,
        is_fraud: false,
        confidence: 'medium',
        action: 'flag',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of({ data: mockFraudResult } as any));

      // 23:00 is night time
      await service.evaluate({
        amount: 2000,
        transaction_date: new Date('2024-01-15T23:30:00'),
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          is_night: 1,
        }),
        expect.any(Object),
      );
    });

    it('should use current date if transaction_date not provided', async () => {
      const mockFraudResult: FraudResult = {
        fraud_score: 0.1,
        is_fraud: false,
        confidence: 'low',
        action: 'allow',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of({ data: mockFraudResult } as any));

      const result = await service.evaluate({ amount: 500 });

      expect(result).toEqual(mockFraudResult);
      expect(httpService.post).toHaveBeenCalled();
    });

    it('should return safe default if ML service fails', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      const result = await service.evaluate({ amount: 1000 });

      expect(result).toEqual({
        fraud_score: 0,
        is_fraud: false,
        confidence: 'low',
        action: 'allow',
      });
    });

    it('should return safe default if ML service times out', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(
        throwError(() => new Error('Timeout')),
      );

      const result = await service.evaluate({ amount: 3000 });

      expect(result.action).toBe('allow');
      expect(result.is_fraud).toBe(false);
    });

    it('should flag high-risk transactions', async () => {
      const mockFraudResult: FraudResult = {
        fraud_score: 0.65,
        is_fraud: false,
        confidence: 'medium',
        action: 'flag',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of({ data: mockFraudResult } as any));

      const result = await service.evaluate({ amount: 10000 });

      expect(result.action).toBe('flag');
      expect(result.confidence).toBe('medium');
    });
  });
});
