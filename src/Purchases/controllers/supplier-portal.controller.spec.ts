import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPortalController } from './supplier-portal.controller';
import { SupplierPortalService } from '../services/supplier-portal.service';

describe('SupplierPortalController', () => {
  let controller: SupplierPortalController;
  let service: SupplierPortalService;

  const mockService = {
    validateToken: jest.fn(),
    getSupplierPOs: jest.fn(),
    confirmPO: jest.fn(),
    submitDispute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierPortalController],
      providers: [
        {
          provide: SupplierPortalService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SupplierPortalController>(SupplierPortalController);
    service = module.get<SupplierPortalService>(SupplierPortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
