import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';

describe('AuditLogsController', () => {
  let instance: AuditLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogsController],
    }).compile();

    instance = module.get<AuditLogsController>(AuditLogsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
