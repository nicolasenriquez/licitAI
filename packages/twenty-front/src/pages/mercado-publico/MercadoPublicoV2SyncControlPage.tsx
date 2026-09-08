import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Loader } from 'twenty-ui/feedback';
import { Button } from 'twenty-ui/input';
import { ModalContent, ModalHeader } from 'twenty-ui/surfaces';

import { MercadoPublicoV2PageShell } from '@/mercado-publico/components/MercadoPublicoV2PageShell';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isGraphqlErrorOfType } from '~/utils/is-graphql-error-of-type.util';

const SYNC_CONFIRMATION_MODAL_INSTANCE_ID =
  'mercado-publico-v2-sync-confirmation';

const MERCADO_PUBLICO_V2_SYNC_CONTROL_LATEST_RUN_QUERY = gql`
  query MercadoPublicoV2SyncControlLatestRun {
    mercadoPublicoV2SyncControl {
      latestRun {
        mode
        scope
        safeStatus
        safeSummary
        canResume
        recordsDiscovered
        recordsHydrated
        recordsFailed
        recordsDeferred
        recordsRetryable
        recordsPermanentFailed
        recordsProjected
        nextRetryAt
        quotaResetAt
        canRetryFailedItems
        monitoringHealth
        dataFreshness
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

const MERCADO_PUBLICO_V2_RETRY_FAILED_SYNC_MUTATION = gql`
  mutation MercadoPublicoV2RetryFailedSync(
    $input: MercadoPublicoV2RetryFailedSyncInput!
  ) {
    mercadoPublicoV2SyncControl {
      retryFailed(input: $input) {
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
  min-width: 0;
  width: 100%;
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
  flex-wrap: wrap;
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

  return labels[eventType] ?? 'Actividad registrada';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    queued: 'En cola',
    discovering: 'Buscando cambios',
    hydrating: 'Descargando detalles',
    projecting: 'Actualizando datos',
    reconciling: 'Verificando',
    succeeded: 'Completada',
    partial_failed: 'Incompleta',
    failed: 'Fallida',
    dead_letter: 'Pendientes para revisión',
    cancelled: 'Cancelada',
  };

  return labels[status] ?? 'Estado no disponible';
};

type PendingAction = 'start' | 'cancel' | 'resume' | 'retryFailed' | null;

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
      mode: string;
      scope: string;
      safeStatus: string;
      safeSummary?: string | null;
      canResume: boolean;
      recordsDiscovered: number;
      recordsHydrated: number;
      recordsFailed: number;
      recordsDeferred: number;
      recordsRetryable: number;
      recordsPermanentFailed: number;
      recordsProjected: number;
      nextRetryAt?: string | null;
      quotaResetAt?: string | null;
      canRetryFailedItems: boolean;
      monitoringHealth: string;
      dataFreshness: string;
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

type MercadoPublicoV2RetryFailedSyncMutation = {
  mercadoPublicoV2SyncControl: {
    retryFailed: {
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
  const [mode, setMode] = useState<'incremental' | 'backfill'>('incremental');
  const [publishedFrom, setPublishedFrom] = useState('');
  const [publishedTo, setPublishedTo] = useState('');
  const [status, setStatus] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const { closeModal, openModal } = useModal();
  const apolloCoreClient = useApolloCoreClient();
  const {
    data,
    previousData,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery<MercadoPublicoV2SyncControlLatestRunQuery>(
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
        mode: 'incremental' | 'backfill';
        publishedFrom?: string;
        publishedTo?: string;
        status?: string;
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
  const [retryFailedSync] = useMutation<
    MercadoPublicoV2RetryFailedSyncMutation,
    { input: { idempotencyKey: string } }
  >(MERCADO_PUBLICO_V2_RETRY_FAILED_SYNC_MUTATION, {
    client: apolloCoreClient,
  });

  const effectiveData = data ?? previousData;
  const latestRun = effectiveData?.mercadoPublicoV2SyncControl.latestRun;
  const isStatusStale = error !== undefined && effectiveData !== undefined;
  const isActive =
    latestRun !== null &&
    latestRun !== undefined &&
    ACTIVE_STATUSES.includes(latestRun.safeStatus);
  const isResumable =
    latestRun !== null && latestRun !== undefined && latestRun.canResume;

  const focusControlAction = () => {
    const controlAction = document.querySelector<HTMLButtonElement>(
      'button[data-testid="mercado-publico-v2-sync-control-start"]:not([disabled]), button[data-testid="mercado-publico-v2-sync-control-cancel"]:not([disabled])',
    );

    controlAction?.focus();
  };

  const closeConfirmation = () => {
    closeModal(SYNC_CONFIRMATION_MODAL_INSTANCE_ID);
    setPendingAction(null);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(focusControlAction);
    });
  };

  const openConfirmation = (action: Exclude<PendingAction, null>) => {
    setPendingAction(action);
    openModal(SYNC_CONFIRMATION_MODAL_INSTANCE_ID);
  };

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
              mode,
              ...(publishedFrom === '' ? {} : { publishedFrom }),
              ...(publishedTo === '' ? {} : { publishedTo }),
              ...(status === '' ? {} : { status }),
              ...(maxPages === undefined ? {} : { maxPages }),
            },
          },
        });
      } else if (pendingAction === 'cancel') {
        await cancelSync({
          variables: { input: { idempotencyKey, confirmed: true } },
        });
      } else if (pendingAction === 'retryFailed') {
        await retryFailedSync({
          variables: { input: { idempotencyKey } },
        });
      } else if (latestRun?.canResume === true) {
        await resumeSync({
          variables: { input: { idempotencyKey } },
        });
      }

      closeConfirmation();
      setActionError(null);
      await refetch();
    } catch {
      closeConfirmation();
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
        : pendingAction === 'retryFailed'
          ? t`Reintentar pendientes`
          : t`Reanudar sincronización`;
  const confirmationMessage =
    pendingAction === 'start'
      ? mode === 'backfill'
        ? t`¿Confirmas consultar el histórico del ${publishedFrom || 'inicio'} al ${publishedTo || 'fin'}?`
        : t`¿Confirmas iniciar una actualización de cambios nuevos y actualizados?`
      : pendingAction === 'cancel'
        ? t`¿Confirmas cancelar la sincronización activa? Se conservará la evidencia registrada.`
        : pendingAction === 'retryFailed'
          ? t`¿Confirmas reintentar los registros pendientes?`
          : t`¿Confirmas reanudar la ejecución desde sus puntos de control?`;

  const isAccessDenied =
    isGraphqlErrorOfType(error, 'FORBIDDEN') ||
    isGraphqlErrorOfType(error, 'PERMISSION_DENIED') ||
    String(error).toLowerCase().includes('403') ||
    String(error).toLowerCase().includes('permission');

  return (
    <MercadoPublicoV2PageShell title="Mercado Público">
      <StyledPage>
        <h1>Centro de control</h1>
        {loading && (
          <div role="status" aria-label={t`Cargando sincronización…`}>
            <Loader />
          </div>
        )}
        {actionError && (
          <StyledCard role="alert">
            <StyledStatusLine>{actionError}</StyledStatusLine>
          </StyledCard>
        )}
        {error !== undefined && !isStatusStale && (
          <StyledCard role="alert">
            <StyledStatusLine>
              {isAccessDenied
                ? 'No tienes acceso al control de sincronización. Contacta a un administrador para que te asigne como operador.'
                : t`No se pudo cargar el control de sincronización.`}
            </StyledStatusLine>
            {!isAccessDenied && (
              <Button title={t`Reintentar`} onClick={() => void refetch()} />
            )}
          </StyledCard>
        )}
        {isStatusStale && (
          <StyledCard role="status">
            <StyledStatusLine>
              {t`No se pudo actualizar el monitoreo. Mostrando el último estado conocido.`}
            </StyledStatusLine>
            <Button title={t`Reconectar`} onClick={() => void refetch()} />
          </StyledCard>
        )}
        {(error === undefined || isStatusStale) && !loading && (
          <>
            <StyledSection>
              <h2>{t`Última ejecución`}</h2>
              <StyledCard>
                {latestRun === null || latestRun === undefined ? (
                  <StyledStatusLine>{t`No hay ejecuciones registradas.`}</StyledStatusLine>
                ) : (
                  <>
                    <StyledStatusLine>
                      {t`Estado: ${getStatusLabel(latestRun.safeStatus)}`}
                    </StyledStatusLine>
                    <StyledStatusLine>
                      {latestRun.mode === 'backfill'
                        ? t`Alcance: Histórico por fecha`
                        : t`Alcance: Cambios nuevos y actualizados`}
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
                      {t`Encontrados: ${latestRun.recordsDiscovered} · Detalles: ${latestRun.recordsHydrated} · Pendientes: ${latestRun.recordsRetryable} · Errores permanentes: ${latestRun.recordsPermanentFailed} · Preparados: ${latestRun.recordsProjected}`}
                    </StyledStatusLine>
                  </>
                )}
                <StyledPageLimit>
                  {t`Alcance`}
                  <select
                    value={mode}
                    onChange={(event) =>
                      setMode(event.target.value as 'incremental' | 'backfill')
                    }
                    disabled={isActive}
                  >
                    <option value="incremental">
                      {t`Cambios nuevos y actualizados`}
                    </option>
                    <option value="backfill">{t`Histórico por fecha`}</option>
                  </select>
                </StyledPageLimit>
                <StyledPageLimit>
                  {t`Fecha desde`}
                  <input
                    type="date"
                    value={publishedFrom}
                    onChange={(event) => setPublishedFrom(event.target.value)}
                    disabled={isActive}
                  />
                </StyledPageLimit>
                <StyledPageLimit>
                  {t`Fecha hasta`}
                  <input
                    type="date"
                    value={publishedTo}
                    onChange={(event) => setPublishedTo(event.target.value)}
                    disabled={isActive}
                  />
                </StyledPageLimit>
                <StyledPageLimit>
                  {t`Estado del proceso`}
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    disabled={isActive}
                  >
                    <option value="">{t`Todos los estados`}</option>
                    <option value="publicada">{t`Publicada`}</option>
                    <option value="cerrada">{t`Cerrada`}</option>
                    <option value="desierta">{t`Desierta`}</option>
                    <option value="cancelada">{t`Cancelada`}</option>
                    <option value="proveedor_seleccionado">
                      {t`Proveedor seleccionado`}
                    </option>
                    <option value="oc_emitida">{t`Orden emitida`}</option>
                  </select>
                </StyledPageLimit>
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
                    dataTestId="mercado-publico-v2-sync-control-start"
                    disabled={isActive}
                    onClick={() => openConfirmation('start')}
                  />
                  <Button
                    title={t`Cancelar`}
                    dataTestId="mercado-publico-v2-sync-control-cancel"
                    disabled={!isActive}
                    onClick={() => openConfirmation('cancel')}
                  />
                  <Button
                    title={t`Reanudar`}
                    disabled={!isResumable}
                    onClick={() => openConfirmation('resume')}
                  />
                  <Button
                    title={t`Reintentar pendientes`}
                    disabled={!latestRun?.canRetryFailedItems}
                    onClick={() => openConfirmation('retryFailed')}
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
            modalInstanceId={SYNC_CONFIRMATION_MODAL_INSTANCE_ID}
            isClosable
            onClose={closeConfirmation}
            renderInDocumentBody
            autoHeight
            narrowWidth
            ariaLabel={confirmationTitle}
            trapFocus
          >
            <ModalHeader>{confirmationTitle}</ModalHeader>
            <ModalContent>
              <p>{confirmationMessage}</p>
              <StyledDialogActions>
                <div
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      closeConfirmation();
                    }
                  }}
                >
                  <Button title={t`Cancelar`} onClick={closeConfirmation} />
                </div>
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
    </MercadoPublicoV2PageShell>
  );
};
