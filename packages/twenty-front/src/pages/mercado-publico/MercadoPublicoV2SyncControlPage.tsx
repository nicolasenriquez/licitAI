import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Loader } from 'twenty-ui/feedback';
import { Button } from 'twenty-ui/input';

import { MercadoPublicoV2Nav } from '@/mercado-publico/components/MercadoPublicoV2Nav';

const MERCADO_PUBLICO_V2_SYNC_CONTROL_LATEST_RUN_QUERY = gql`
  query MercadoPublicoV2SyncControlLatestRun {
    mercadoPublicoV2SyncControl {
      latestRun {
        syncRunId
        safeStatus
        startedAt
        updatedAt
        timeline {
          eventType
          at
          operatorName
        }
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_START_SYNC_MUTATION = gql`
  mutation MercadoPublicoV2StartSync($input: MercadoPublicoV2StartSyncInput!) {
    mercadoPublicoV2SyncControl {
      start(input: $input) {
        state
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_CANCEL_SYNC_MUTATION = gql`
  mutation MercadoPublicoV2CancelSync($input: MercadoPublicoV2CancelSyncInput!) {
    mercadoPublicoV2SyncControl {
      cancel(input: $input) {
        state
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_RESUME_SYNC_MUTATION = gql`
  mutation MercadoPublicoV2ResumeSync($input: MercadoPublicoV2ResumeSyncInput!) {
    mercadoPublicoV2SyncControl {
      resume(input: $input) {
        state
      }
    }
  }
`;

const ACTIVE_STATUSES = [
  'queued',
  'discovering',
  'hydrating',
  'projecting',
  'reconciling',
];

const RESUMABLE_STATUSES = ['partial_failed', 'cancelled'];

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  max-width: 720px;
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledCard = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledStatusLine = styled.p`
  margin: 0;
`;

const StyledTimelineList = styled.ol`
  margin: 0;
  padding-left: ${themeCssVariables.spacing[5]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledDialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const StyledDialog = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[5]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 320px;
`;

const StyledDialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${themeCssVariables.spacing[3]};
`;

const getEventLabel = (eventType: string): string => {
  const labels: Record<string, string> = {
    command_created: 'Comando creado',
    run_created: 'Ejecución creada',
    reused: 'Reutilizada',
    dispatched: 'Despachado',
    dispatch_failed: 'Fallo de despacho',
    cancellation_requested: 'Cancelación solicitada',
    claimed: 'Reclamado por worker',
    heartbeat_recovery: 'Recuperación por latido',
  };

  return labels[eventType] ?? eventType;
};

type PendingAction = 'start' | 'cancel' | 'resume' | null;

type MercadoPublicoV2SyncTimelineEvent = {
  __typename?: 'MercadoPublicoV2SyncTimelineEventDTO';
  eventType: string;
  at: string;
  operatorName?: string | null;
};

type MercadoPublicoV2SyncControlLatestRunQuery = {
  mercadoPublicoV2SyncControl: {
    latestRun: {
      __typename?: 'MercadoPublicoV2LatestRunDTO';
      syncRunId?: string | null;
      safeStatus: string;
      startedAt?: string | null;
      updatedAt?: string | null;
      timeline: MercadoPublicoV2SyncTimelineEvent[];
    } | null;
  };
};

type MercadoPublicoV2StartSyncMutation = {
  mercadoPublicoV2SyncControl: {
    start: { __typename?: 'MercadoPublicoV2SyncCommandResultDTO'; state: string };
  };
};

type MercadoPublicoV2CancelSyncMutation = {
  mercadoPublicoV2SyncControl: {
    cancel: {
      __typename?: 'MercadoPublicoV2SyncCommandResultDTO';
      state: string;
    };
  };
};

type MercadoPublicoV2ResumeSyncMutation = {
  mercadoPublicoV2SyncControl: {
    resume: {
      __typename?: 'MercadoPublicoV2SyncCommandResultDTO';
      state: string;
    };
  };
};

export const MercadoPublicoV2SyncControlPage = () => {
  const { t } = useLingui();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const { data, loading, error, refetch } =
    useQuery<MercadoPublicoV2SyncControlLatestRunQuery>(
      MERCADO_PUBLICO_V2_SYNC_CONTROL_LATEST_RUN_QUERY,
    );
  const [startSync] = useMutation<
    MercadoPublicoV2StartSyncMutation,
    { input: { idempotencyKey: string; confirmed: boolean } }
  >(MERCADO_PUBLICO_V2_START_SYNC_MUTATION);
  const [cancelSync] = useMutation<
    MercadoPublicoV2CancelSyncMutation,
    { input: { idempotencyKey: string; confirmed: boolean } }
  >(MERCADO_PUBLICO_V2_CANCEL_SYNC_MUTATION);
  const [resumeSync] = useMutation<
    MercadoPublicoV2ResumeSyncMutation,
    { input: { idempotencyKey: string; syncRunId: string } }
  >(MERCADO_PUBLICO_V2_RESUME_SYNC_MUTATION);

  const latestRun = data?.mercadoPublicoV2SyncControl.latestRun;
  const isActive =
    latestRun !== null &&
    latestRun !== undefined &&
    ACTIVE_STATUSES.includes(latestRun.safeStatus);
  const isResumable =
    latestRun !== null &&
    latestRun !== undefined &&
    RESUMABLE_STATUSES.includes(latestRun.safeStatus) &&
    latestRun.syncRunId !== null;

  const runAction = async () => {
    if (pendingAction === null) {
      return;
    }

    const idempotencyKey = crypto.randomUUID();

    if (pendingAction === 'start') {
      await startSync({
        variables: { input: { idempotencyKey, confirmed: true } },
      });
    } else if (pendingAction === 'cancel') {
      await cancelSync({
        variables: { input: { idempotencyKey, confirmed: true } },
      });
    } else if (latestRun?.syncRunId !== null && latestRun?.syncRunId !== undefined) {
      await resumeSync({
        variables: {
          input: { idempotencyKey, syncRunId: latestRun.syncRunId },
        },
      });
    }

    setPendingAction(null);
    await refetch();
  };

  const confirmationTitle =
    pendingAction === 'start'
      ? t`Iniciar sincronización`
      : pendingAction === 'cancel'
        ? t`Cancelar sincronización`
        : t`Reanudar sincronización`;
  const confirmationMessage =
    pendingAction === 'start'
      ? t`¿Confirmas iniciar una sincronización global incremental?`
      : pendingAction === 'cancel'
        ? t`¿Confirmas cancelar la sincronización activa? Se conservará la evidencia registrada.`
        : t`¿Confirmas reanudar la ejecución desde sus puntos de control?`;

  return (
    <StyledPage>
      <MercadoPublicoV2Nav />
      <h1>{t`Centro de control`}</h1>
      {loading && <Loader />}
      {error !== undefined && (
        <StyledCard>
          <StyledStatusLine>
            {t`No tienes acceso al control de sincronización. Contacta a un administrador para que te asigne como operador.`}
          </StyledStatusLine>
        </StyledCard>
      )}
      {error === undefined && !loading && (
        <>
          <StyledSection>
            <h2>{t`Última ejecución`}</h2>
            <StyledCard>
              {latestRun === null || latestRun === undefined ? (
                <StyledStatusLine>{t`No hay ejecuciones registradas.`}</StyledStatusLine>
              ) : (
                <>
                  <StyledStatusLine>
                    {t`Estado: ${latestRun.safeStatus}`}
                  </StyledStatusLine>
                  <StyledStatusLine>
                    {t`Iniciada: ${latestRun.startedAt !== null && latestRun.startedAt !== undefined ? new Date(latestRun.startedAt).toLocaleString() : '—'}`}
                  </StyledStatusLine>
                </>
              )}
              <StyledDialogActions>
                <Button
                  title={t`Iniciar`}
                  disabled={isActive}
                  onClick={() => setPendingAction('start')}
                />
                <Button
                  title={t`Cancelar`}
                  disabled={!isActive}
                  onClick={() => setPendingAction('cancel')}
                />
                <Button
                  title={t`Reanudar`}
                  disabled={!isResumable}
                  onClick={() => setPendingAction('resume')}
                />
              </StyledDialogActions>
            </StyledCard>
          </StyledSection>
          <StyledSection>
            <h2>{t`Línea de tiempo`}</h2>
            {latestRun !== null &&
            latestRun !== undefined &&
            latestRun.timeline.length > 0 ? (
              <StyledTimelineList>
                {latestRun.timeline.map((event, index) => (
                  <li key={`${event.eventType}-${event.at}-${index}`}>
                    {new Date(event.at).toLocaleString()} —{' '}
                    {getEventLabel(event.eventType)} —{' '}
                    {event.operatorName ?? t`Sistema`}
                  </li>
                ))}
              </StyledTimelineList>
            ) : (
              <StyledStatusLine>
                {t`No hay eventos registrados.`}
              </StyledStatusLine>
            )}
          </StyledSection>
        </>
      )}
      {pendingAction !== null && (
        <StyledDialogOverlay>
          <StyledDialog role="dialog" aria-modal="true">
            <h2>{confirmationTitle}</h2>
            <p>{confirmationMessage}</p>
            <StyledDialogActions>
              <Button title={t`Cancelar`} onClick={() => setPendingAction(null)} />
              <Button
                title={t`Confirmar`}
                variant="primary"
                onClick={() => {
                  void runAction();
                }}
              />
            </StyledDialogActions>
          </StyledDialog>
        </StyledDialogOverlay>
      )}
    </StyledPage>
  );
};
