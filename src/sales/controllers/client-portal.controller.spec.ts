import { Test, TestingModule } from '@nestjs/testing';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from '../services/client-portal.service';

describe('ClientPortalController', () => {
  let controller: ClientPortalController;
  let service: ClientPortalService;

  const mockService = {
    validateToken: jest.fn(),
    getClientInvoices: jest.fn(),
    getInvoiceDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientPortalController],
      providers: [
        {
          provide: ClientPortalService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ClientPortalController>(ClientPortalController);
    service = module.get<ClientPortalService>(ClientPortalService);
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
