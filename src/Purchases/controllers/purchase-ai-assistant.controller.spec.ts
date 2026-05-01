import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseAiAssistantController } from './purchase-ai-assistant.controller';
import { PurchaseAiAssistantService } from '../services/purchase-ai-assistant.service';

describe('PurchaseAiAssistantController', () => {
  let controller: PurchaseAiAssistantController;
  let service: PurchaseAiAssistantService;

  const mockService = {
    chat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseAiAssistantController],
      providers: [
        {
          provide: PurchaseAiAssistantService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseAiAssistantController>(PurchaseAiAssistantController);
    service = module.get<PurchaseAiAssistantService>(PurchaseAiAssistantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
