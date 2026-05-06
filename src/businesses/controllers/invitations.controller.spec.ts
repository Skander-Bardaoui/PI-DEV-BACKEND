import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsController } from './invitations.controller';

describe('InvitationsController', () => {
  let instance: InvitationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvitationsController],
    }).compile();

    instance = module.get<InvitationsController>(InvitationsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
