import { Test, TestingModule } from '@nestjs/testing';
import { ClientPortalController } from './client-portal.controller';

describe('ClientPortalController', () => {
  let instance: ClientPortalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientPortalController],
    }).compile();

    instance = module.get<ClientPortalController>(ClientPortalController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
