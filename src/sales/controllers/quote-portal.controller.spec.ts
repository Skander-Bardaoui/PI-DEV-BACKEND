import { Test, TestingModule } from '@nestjs/testing';
import { QuotePortalController } from './quote-portal.controller';
import { QuotePortalService } from '../services/quote-portal.service';

describe('QuotePortalController', () => {
  let controller: QuotePortalController;
  let service: QuotePortalService;

  const mockService = {
    validateToken: jest.fn(),
    getQuoteDetails: jest.fn(),
    acceptQuote: jest.fn(),
    rejectQuote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotePortalController],
      providers: [
        {
          provide: QuotePortalService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<QuotePortalController>(QuotePortalController);
    service = module.get<QuotePortalService>(QuotePortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
