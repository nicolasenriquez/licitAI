import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { Command, CommandRunner, Option } from 'nest-commander';

import { DataSource } from 'typeorm';

type MercadoPublicoSyncOperatorCommandOptions = {
  workspaceId: string;
  userWorkspaceId: string;
  assignedBy?: string;
  remove?: boolean;
};

@Command({
  name: 'mercado-publico:sync-operator',
  description:
    'Assign or remove an explicit Mercado Publico V2 sync operator for a workspace',
})
export class MercadoPublicoSyncOperatorCommand extends CommandRunner {
  private readonly logger = new Logger(MercadoPublicoSyncOperatorCommand.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {
    super();
  }

  async run(
    _passedParam: string[],
    options: MercadoPublicoSyncOperatorCommandOptions,
  ): Promise<void> {
    if (options.remove === true) {
      await this.coreDataSource.query(
        `
          DELETE FROM mp.sync_operator
          WHERE workspace_id = $1 AND user_workspace_id = $2
        `,
        [options.workspaceId, options.userWorkspaceId],
      );
      this.logger.log(
        `Removed Mercado Publico V2 sync operator ${options.userWorkspaceId} from workspace ${options.workspaceId}`,
      );

      return;
    }

    await this.coreDataSource.query(
      `
        INSERT INTO mp.sync_operator (
          workspace_id, user_workspace_id, assigned_by_user_workspace_id
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (workspace_id, user_workspace_id) DO UPDATE SET
          assigned_by_user_workspace_id = EXCLUDED.assigned_by_user_workspace_id,
          updated_at = now()
      `,
      [
        options.workspaceId,
        options.userWorkspaceId,
        options.assignedBy ?? null,
      ],
    );
    this.logger.log(
      `Assigned Mercado Publico V2 sync operator ${options.userWorkspaceId} to workspace ${options.workspaceId}`,
    );
  }

  @Option({
    flags: '-w, --workspace-id <workspace_id>',
    description: 'Workspace ID that owns the operator assignment',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '-u, --user-workspace-id <user_workspace_id>',
    description: 'Workspace member ID to assign or remove',
    required: true,
  })
  parseUserWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '-a, --assigned-by <user_workspace_id>',
    description: 'Optional workspace member ID that performed the assignment',
    required: false,
  })
  parseAssignedBy(value: string): string {
    return value;
  }

  @Option({
    flags: '-r, --remove',
    description: 'Remove the assignment instead of creating it',
  })
  parseRemove(): boolean {
    return true;
  }
}
