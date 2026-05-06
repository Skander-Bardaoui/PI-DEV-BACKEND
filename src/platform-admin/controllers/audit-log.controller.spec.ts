import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';

describe('AuditLogController', () => {
  let instance: AuditLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogController],
    }).compile();

    instance = module.get<AuditLogController>(AuditLogController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
