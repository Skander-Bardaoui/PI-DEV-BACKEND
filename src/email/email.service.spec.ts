import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let instance: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    instance = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
