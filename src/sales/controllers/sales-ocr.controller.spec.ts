import { Test, TestingModule } from '@nestjs/testing';
import { SalesOcrController } from './sales-ocr.controller';
import { SalesOcrService } from '../services/sales-ocr.service';

describe('SalesOcrController', () => {
  let controller: SalesOcrController;
  let service: SalesOcrService;

  const mockService = {
    extractFromFile: jest.fn(),
    extractAndEnrich: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesOcrController],
      providers: [
        {
          provide: SalesOcrService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SalesOcrController>(SalesOcrController);
    service = module.get<SalesOcrService>(SalesOcrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have service injected', () => {
    expect(service).toBeDefined();
  });
});
