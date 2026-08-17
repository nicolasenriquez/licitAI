import { type QueryRunner } from 'typeorm';

import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { USER_WORKSPACE_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/core/utils/seed-user-workspaces.util';

type SeedMercadoPublicoSyncOperatorsArgs = {
  queryRunner: QueryRunner;
  workspaceId: string;
};

export const seedMercadoPublicoSyncOperators = async ({
  queryRunner,
  workspaceId,
}: SeedMercadoPublicoSyncOperatorsArgs) => {
  if (workspaceId !== SEED_APPLE_WORKSPACE_ID) {
    return;
  }

  await queryRunner.manager.query(
    `
      INSERT INTO mp.sync_operator (
        workspace_id,
        user_workspace_id,
        assigned_by_user_workspace_id
      )
      VALUES ($1, $2, $2)
      ON CONFLICT (workspace_id, user_workspace_id) DO NOTHING
    `,
    [SEED_APPLE_WORKSPACE_ID, USER_WORKSPACE_DATA_SEED_IDS.TIM],
  );
};
