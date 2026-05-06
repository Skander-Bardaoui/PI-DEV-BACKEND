import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let instance: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogService],
    }).compile();

    instance = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
