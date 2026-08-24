import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Loader } from 'twenty-ui/feedback';
import { Button } from 'twenty-ui/input';
import { ModalContent, ModalHeader } from 'twenty-ui/surfaces';

import { MercadoPublicoV2Nav } from '@/mercado-publico/components/MercadoPublicoV2Nav';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { isGraphqlErrorOfType } from '~/utils/is-graphql-error-of-type.util';

const MERCADO_PUBLICO_V2_SYNC_CONTROL_LATEST_RUN_QUERY = gql`
  query MercadoPublicoV2SyncControlLatestRun {
    mercadoPublicoV2SyncControl {
      latestRun {
        safeStatus
        safeSummary
        canResume
        recordsDiscovered
        recordsHydrated
        recordsFailed
        recordsDeferred
        recordsProjected
        discoveryComplete
        completionReason
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
  mutation MercadoPublicoV2CancelSync(
    $input: MercadoPublicoV2CancelSyncInput!
  ) {
    mercadoPublicoV2SyncControl {
      cancel(input: $input) {
        state
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_RESUME_SYNC_MUTATION = gql`
  mutation MercadoPublicoV2ResumeSync(
    $input: MercadoPublicoV2ResumeSyncInput!
  ) {
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
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledStatusLine = styled.p`
  margin: 0;
`;

const StyledTimelineList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin: 0;
  padding-left: ${themeCssVariables.spacing[5]};
`;

const StyledDialogActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: flex-end;
`;

const StyledPageLimit = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
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
      safeStatus: string;
      safeSummary?: string | null;
      canResume: boolean;
      recordsDiscovered: number;
      recordsHydrated: number;
      recordsFailed: number;
      recordsDeferred: number;
      recordsProjected: number;
      discoveryComplete: boolean;
      completionReason?: string | null;
      startedAt?: string | null;
      updatedAt?: string | null;
      timeline: MercadoPublicoV2SyncTimelineEvent[];
    } | null;
  };
};

type MercadoPublicoV2StartSyncMutation = {
  mercadoPublicoV2SyncControl: {
    start: {
      __typename?: 'MercadoPublicoV2SyncCommandResultDTO';
      state: string;
    };
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
  const [maxPages, setMaxPages] = useState<number | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);
  const apolloCoreClient = useApolloCoreClient();
  const { data, loading, error, refetch, startPolling, stopPolling } =
    useQuery<MercadoPublicoV2SyncControlLatestRunQuery>(
      MERCADO_PUBLICO_V2_SYNC_CONTROL_LATEST_RUN_QUERY,
      { client: apolloCoreClient },
    );
  const [startSync] = useMutation<
    MercadoPublicoV2StartSyncMutation,
    {
      input: {
        idempotencyKey: string;
        confirmed: boolean;
        maxPages?: number;
      };
    }
  >(MERCADO_PUBLICO_V2_START_SYNC_MUTATION, { client: apolloCoreClient });
  const [cancelSync] = useMutation<
    MercadoPublicoV2CancelSyncMutation,
    { input: { idempotencyKey: string; confirmed: boolean } }
  >(MERCADO_PUBLICO_V2_CANCEL_SYNC_MUTATION, { client: apolloCoreClient });
  const [resumeSync] = useMutation<
    MercadoPublicoV2ResumeSyncMutation,
    { input: { idempotencyKey: string } }
  >(MERCADO_PUBLICO_V2_RESUME_SYNC_MUTATION, { client: apolloCoreClient });

  const latestRun = data?.mercadoPublicoV2SyncControl.latestRun;
  const isActive =
    latestRun !== null &&
    latestRun !== undefined &&
    ACTIVE_STATUSES.includes(latestRun.safeStatus);
  const isResumable =
    latestRun !== null && latestRun !== undefined && latestRun.canResume;

  useEffect(() => {
    if (isActive) {
      startPolling(3000);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isActive, startPolling, stopPolling]);

  const runAction = async () => {
    if (pendingAction === null) {
      return;
    }

    const idempotencyKey = crypto.randomUUID();

    try {
      if (pendingAction === 'start') {
        await startSync({
          variables: {
            input: {
              idempotencyKey,
              confirmed: true,
              ...(maxPages === undefined ? {} : { maxPages }),
            },
          },
        });
      } else if (pendingAction === 'cancel') {
        await cancelSync({
          variables: { input: { idempotencyKey, confirmed: true } },
        });
      } else if (latestRun?.canResume === true) {
        await resumeSync({
          variables: { input: { idempotencyKey } },
        });
      }

      setPendingAction(null);
      setActionError(null);
      await refetch();
    } catch {
      setPendingAction(null);
      setActionError(
        t`La acción no se completó. Se conserva la última información. Reintenta cuando el servicio esté disponible.`,
      );
    }
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
      <h1>{t`Sincronización`}</h1>
      {loading && <Loader />}
      {actionError && (
        <StyledCard role="alert">
          <StyledStatusLine>{actionError}</StyledStatusLine>
        </StyledCard>
      )}
      {error !== undefined && (
        <StyledCard>
          <StyledStatusLine>
            {isGraphqlErrorOfType(error, 'FORBIDDEN') ||
            isGraphqlErrorOfType(error, 'PERMISSION_DENIED')
              ? t`Falta el rol de operador. Contacta a un administrador para solicitar acceso.`
              : t`No se pudo cargar el control de sincronización.`}
          </StyledStatusLine>
          {!isGraphqlErrorOfType(error, 'FORBIDDEN') &&
            !isGraphqlErrorOfType(error, 'PERMISSION_DENIED') && (
              <Button title={t`Reintentar`} onClick={() => void refetch()} />
            )}
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
                    {t`Ejecución: ${latestRun.safeStatus}`}
                  </StyledStatusLine>
                  <StyledStatusLine>
                    {t`Cobertura: ${latestRun.discoveryComplete ? 'Completa' : 'Parcial'}`}
                  </StyledStatusLine>
                  {latestRun.completionReason !== null &&
                    latestRun.completionReason !== undefined && (
                      <StyledStatusLine>
                        {t`Motivo: ${latestRun.completionReason}`}
                      </StyledStatusLine>
                    )}
                  {latestRun.safeSummary !== null &&
                    latestRun.safeSummary !== undefined && (
                      <StyledStatusLine>
                        {latestRun.safeSummary}
                      </StyledStatusLine>
                    )}
                  <StyledStatusLine>
                    {t`Iniciada: ${latestRun.startedAt !== null && latestRun.startedAt !== undefined ? new Date(latestRun.startedAt).toLocaleString() : '—'}`}
                  </StyledStatusLine>
                  <StyledStatusLine>
                    {t`Descubiertos: ${latestRun.recordsDiscovered} · Hidratados: ${latestRun.recordsHydrated} · Diferidos: ${latestRun.recordsDeferred} · Fallidos: ${latestRun.recordsFailed} · Proyectados: ${latestRun.recordsProjected}`}
                  </StyledStatusLine>
                </>
              )}
              <StyledPageLimit>
                {t`Páginas por ejecución`}
                <select
                  value={maxPages ?? ''}
                  onChange={(event) =>
                    setMaxPages(
                      event.target.value === ''
                        ? undefined
                        : Number(event.target.value),
                    )
                  }
                  disabled={isActive}
                >
                  <option value="">{t`Completa / sin límite`}</option>
                  <option value={1}>{t`1 página`}</option>
                  <option value={2}>{t`2 páginas`}</option>
                  <option value={10}>{t`10 páginas`}</option>
                  <option value={50}>{t`50 páginas`}</option>
                </select>
              </StyledPageLimit>
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
        <ModalStatefulWrapper
          modalInstanceId="mercado-publico-v2-sync-confirmation"
          isClosable
          onClose={() => setPendingAction(null)}
          renderInDocumentBody
          autoHeight
          narrowWidth
        >
          <ModalHeader>{confirmationTitle}</ModalHeader>
          <ModalContent>
            <p>{confirmationMessage}</p>
            <StyledDialogActions>
              <Button
                title={t`Cancelar`}
                onClick={() => setPendingAction(null)}
              />
              <Button
                title={t`Confirmar`}
                variant="primary"
                onClick={() => {
                  void runAction();
                }}
              />
            </StyledDialogActions>
          </ModalContent>
        </ModalStatefulWrapper>
      )}
    </StyledPage>
  );
};
