import { DataSeedWorkspaceCommand } from 'src/database/commands/data-seed-dev-workspace.command';
import { type DevSeederService } from 'src/engine/workspace-manager/dev-seeder/services/dev-seeder.service';

describe('DataSeedWorkspaceCommand', () => {
  it('fails when workspace seeding fails', async () => {
    const seedError = new Error('seed failed');
    const devSeederService = {
      seedDev: jest.fn().mockRejectedValue(seedError),
    } as unknown as DevSeederService;
    const command = new DataSeedWorkspaceCommand(devSeederService);

    await expect(command.run([], { light: true })).rejects.toBe(seedError);
  });
});
