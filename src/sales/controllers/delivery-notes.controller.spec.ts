import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNotesController } from './delivery-notes.controller';
import { DeliveryNotesService } from '../services/delivery-notes.service';

describe('DeliveryNotesController', () => {
  let controller: DeliveryNotesController;
  let service: DeliveryNotesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryNotesController],
      providers: [
        {
          provide: DeliveryNotesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DeliveryNotesController>(DeliveryNotesController);
    service = module.get<DeliveryNotesService>(DeliveryNotesService);
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
