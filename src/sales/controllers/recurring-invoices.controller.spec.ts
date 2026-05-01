import { Test, TestingModule } from '@nestjs/testing';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from '../services/recurring-invoices.service';

describe('RecurringInvoicesController', () => {
  let controller: RecurringInvoicesController;
  let service: RecurringInvoicesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringInvoicesController],
      providers: [
        {
          provide: RecurringInvoicesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RecurringInvoicesController>(RecurringInvoicesController);
    service = module.get<RecurringInvoicesService>(RecurringInvoicesService);
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
