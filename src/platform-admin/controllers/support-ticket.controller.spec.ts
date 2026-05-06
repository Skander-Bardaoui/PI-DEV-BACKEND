import { Test, TestingModule } from '@nestjs/testing';
import { SupportTicketController } from './support-ticket.controller';

describe('SupportTicketController', () => {
  let instance: SupportTicketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportTicketController],
    }).compile();

    instance = module.get<SupportTicketController>(SupportTicketController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
