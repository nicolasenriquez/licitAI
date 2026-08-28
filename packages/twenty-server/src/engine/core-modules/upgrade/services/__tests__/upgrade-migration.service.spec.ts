import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UpgradeMigrationService } from 'src/engine/core-modules/upgrade/services/upgrade-migration.service';
import { UpgradeMigrationEntity } from 'src/engine/core-modules/upgrade/upgrade-migration.entity';

describe('UpgradeMigrationService.markAsWorkspaceInitial', () => {
  let service: UpgradeMigrationService;
  let findOne: jest.Mock;
  let save: jest.Mock;
  let update: jest.Mock;

  beforeEach(async () => {
    findOne = jest.fn();
    save = jest.fn();
    update = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpgradeMigrationService,
        {
          provide: getRepositoryToken(UpgradeMigrationEntity),
          useValue: { findOne, save, update },
        },
      ],
    }).compile();

    service = moduleRef.get(UpgradeMigrationService);
  });

  const params = {
    name: '2.16.0_ExampleCommand_1792000000000',
    workspaceId: '20202020-1c25-4d02-bf25-6aeccf7ea419',
    executedByVersion: '0.0.0-e2e',
    status: 'completed' as const,
  };

  it('inserts an initial record when no attempt-1 row exists', async () => {
    findOne.mockResolvedValue(null);

    await service.markAsWorkspaceInitial(params);

    expect(save).toHaveBeenCalledWith({
      name: params.name,
      status: 'completed',
      isInitial: true,
      attempt: 1,
      executedByVersion: params.executedByVersion,
      workspaceId: params.workspaceId,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('is a no-op when an initial attempt-1 row already exists', async () => {
    findOne.mockResolvedValue({
      id: 'existing',
      isInitial: true,
    });

    await service.markAsWorkspaceInitial(params);

    expect(save).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('marks an existing non-initial attempt-1 row as initial instead of inserting a duplicate', async () => {
    findOne.mockResolvedValue({
      id: 'recorded-by-instance-command',
      isInitial: false,
    });

    await service.markAsWorkspaceInitial(params);

    expect(save).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      { id: 'recorded-by-instance-command' },
      { isInitial: true },
    );
  });
});
