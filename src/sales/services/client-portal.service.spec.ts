import { Test, TestingModule } from '@nestjs/testing';
import { ClientPortalService } from './client-portal.service';

describe('ClientPortalService', () => {
  let instance: ClientPortalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientPortalService],
    }).compile();

    instance = module.get<ClientPortalService>(ClientPortalService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
