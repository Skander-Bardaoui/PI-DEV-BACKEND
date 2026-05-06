import { Test, TestingModule } from '@nestjs/testing';
import { SupportTicketService } from './support-ticket.service';

describe('SupportTicketService', () => {
  let instance: SupportTicketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportTicketService],
    }).compile();

    instance = module.get<SupportTicketService>(SupportTicketService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
