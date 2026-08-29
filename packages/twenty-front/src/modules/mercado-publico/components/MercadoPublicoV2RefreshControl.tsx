import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { AppPath } from 'twenty-shared/types';
import { VisibilityHidden } from 'twenty-ui/accessibility';
import { Loader } from 'twenty-ui/feedback';
import { IconCheck, IconRefresh, IconX } from 'twenty-ui/icon';
import { Button, IconButton } from 'twenty-ui/input';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { getGraphqlErrorExtensionsFromError } from '~/utils/get-graphql-error-extensions-from-error.util';
import { isGraphqlErrorOfType } from '~/utils/is-graphql-error-of-type.util';

const REFRESH_STATUS_QUERY = gql`
  query MercadoPublicoV2RefreshControl {
    mercadoPublicoV2SyncControl {
      latestRun {
        safeStatus
        safeSummary
        recordsDiscovered
        recordsHydrated
        recordsDeferred
        recordsFailed
        recordsProjected
        startedAt
        updatedAt
        completionReason
      }
    }
  }
`;

const START_SYNC_MUTATION = gql`
  mutation MercadoPublicoV2Refresh($input: MercadoPublicoV2StartSyncInput!) {
    mercadoPublicoV2SyncControl {
      start(input: $input) {
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
] as const;

const REFRESH_STAGES = [
  'discovering',
  'hydrating',
  'projecting',
  'reconciling',
] as const;

const STAGE_INDEX = {
  discovering: 0,
  hydrating: 1,
  projecting: 2,
  reconciling: 3,
} as const;

const REFRESH_MODAL_ID = 'mercado-publico-v2-refresh-control';
const REFRESH_MODAL_CLOSE_TEST_ID = 'mercado-publico-v2-refresh-close';

type RefreshStage = (typeof REFRESH_STAGES)[number];
type RefreshStageState = 'completed' | 'current' | 'pending';

type LatestRun = {
  safeStatus: string;
  safeSummary?: string | null;
  recordsDiscovered: number;
  recordsHydrated: number;
  recordsDeferred: number;
  recordsFailed: number;
  recordsProjected: number;
  startedAt?: string | null;
  updatedAt?: string | null;
  completionReason?: string | null;
};

type RefreshStatusQuery = {
  mercadoPublicoV2SyncControl: {
    latestRun: LatestRun | null;
  };
};

type StartSyncMutation = {
  mercadoPublicoV2SyncControl: {
    start: { state: string };
  };
};

type StartSyncVariables = {
  input: {
    idempotencyKey: string;
    confirmed: boolean;
  };
};

const StyledTrigger = styled.div`
  display: flex;
`;

const StyledModalHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledModalTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  min-width: 0;
`;

const StyledPhase = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledPhaseTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.5;
  margin: 0;
`;

const StyledMonitoringCluster = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;

const StyledMonitoringEcg = styled.svg`
  display: block;
  flex: 0 0 auto;
  height: ${themeCssVariables.spacing[4]};
  width: ${themeCssVariables.spacing[14]};

  path {
    fill: none;
    opacity: 1;
    stroke: currentColor;
    stroke-dasharray: 72;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
  }

  &[data-animated='true'] path {
    animation: mercado-publico-ecg 1600ms ease-out infinite;
  }

  @keyframes mercado-publico-ecg {
    0% {
      opacity: 0.45;
      stroke-dashoffset: 72;
    }

    45%,
    75% {
      opacity: 1;
    }

    100% {
      opacity: 0.6;
      stroke-dashoffset: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-animated='true'] path {
      animation: none;
      opacity: 1;
      stroke-dashoffset: 0;
    }
  }
`;

const StyledMonitoringCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledMonitoringLabel = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledMonitoringMeta = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledProgressRail = styled.ol`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledStage = styled.li`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  position: relative;
  text-align: center;
`;

const StyledConnector = styled.span`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  left: 50%;
  position: absolute;
  right: -50%;
  top: ${themeCssVariables.spacing[2]};

  &[data-completed='true'] {
    border-color: ${themeCssVariables.border.color.strong};
  }
`;

const StyledStageNode = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  height: ${themeCssVariables.spacing[4]};
  justify-content: center;
  position: relative;
  width: ${themeCssVariables.spacing[4]};
  z-index: 1;

  &[data-state='completed'] {
    border-color: ${themeCssVariables.border.color.strong};
  }

  &[data-state='current'] {
    background: ${themeCssVariables.color.blue};
    border-color: ${themeCssVariables.color.blue};
    color: ${themeCssVariables.font.color.inverted};
  }
`;

const StyledStageLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.35;
  overflow-wrap: anywhere;

  &[data-current='true'] {
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledMetrics = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding-top: ${themeCssVariables.spacing[4]};
  text-align: center;
`;

const StyledMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledMetricValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-variant-numeric: tabular-nums;
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledMetricLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledSecondaryInfo = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledError = styled.p`
  color: ${themeCssVariables.font.color.danger};
  margin: 0;
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  width: 100%;
`;

const MonitoringEcg = ({ animated = true }: { animated?: boolean }) => (
  <StyledMonitoringEcg
    aria-hidden="true"
    data-animated={animated}
    focusable="false"
    viewBox="0 0 56 18"
  >
    <path d="M1 9 H10 L14 9 L17 4 L21 14 L25 6 L29 9 H35 L38 9 L41 5 L45 12 L48 9 H55" />
  </StyledMonitoringEcg>
);

const RefreshProgressRail = ({
  status,
  labels,
  ariaLabel,
  completedLabel,
  currentLabel,
  pendingLabel,
}: {
  status: string;
  labels: readonly string[];
  ariaLabel: string;
  completedLabel: string;
  currentLabel: string;
  pendingLabel: string;
}) => {
  const currentIndex =
    status === 'succeeded'
      ? REFRESH_STAGES.length
      : status in STAGE_INDEX
        ? STAGE_INDEX[status as RefreshStage]
        : null;

  return (
    <StyledProgressRail aria-label={ariaLabel}>
      {REFRESH_STAGES.map((stage, index) => {
        const state: RefreshStageState =
          currentIndex === null
            ? 'pending'
            : index < currentIndex
              ? 'completed'
              : index === currentIndex
                ? 'current'
                : 'pending';
        const stateLabel =
          state === 'completed'
            ? completedLabel
            : state === 'current'
              ? currentLabel
              : pendingLabel;

        return (
          <StyledStage
            aria-current={state === 'current' ? 'step' : undefined}
            key={stage}
          >
            {index < REFRESH_STAGES.length - 1 && (
              <StyledConnector
                aria-hidden="true"
                data-completed={currentIndex !== null && index < currentIndex}
              />
            )}
            <StyledStageNode aria-hidden="true" data-state={state}>
              {state === 'completed' && <IconCheck size={12} />}
            </StyledStageNode>
            <StyledStageLabel data-current={state === 'current'}>
              {labels[index]}
              <VisibilityHidden>{` — ${stateLabel}`}</VisibilityHidden>
            </StyledStageLabel>
          </StyledStage>
        );
      })}
    </StyledProgressRail>
  );
};

const isActiveStatus = (status: string | undefined): boolean =>
  status !== undefined && ACTIVE_STATUSES.some((active) => active === status);

const isSyncOperatorPermissionError = (error: unknown): boolean => {
  if (isGraphqlErrorOfType(error, 'PERMISSION_DENIED')) {
    return true;
  }

  const userFriendlyMessage =
    getGraphqlErrorExtensionsFromError(error)?.userFriendlyMessage;

  return (
    typeof userFriendlyMessage === 'string' &&
    userFriendlyMessage.includes('explicit Mercado Publico V2 sync operator')
  );
};

const formatRunTime = (value: string | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const today = new Date();
  const options: Intl.DateTimeFormatOptions =
    date.toDateString() === today.toDateString()
      ? { hour: '2-digit', minute: '2-digit' }
      : {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        };

  return new Intl.DateTimeFormat(undefined, options).format(date);
};

export const MercadoPublicoV2RefreshControl = () => {
  const { t } = useLingui();
  const apolloCoreClient = useApolloCoreClient();
  const { closeModal, openModal } = useModal();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data,
    previousData,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery<RefreshStatusQuery>(REFRESH_STATUS_QUERY, {
    client: apolloCoreClient,
  });

  const [startSync, { loading: isStarting }] = useMutation<
    StartSyncMutation,
    StartSyncVariables
  >(START_SYNC_MUTATION, { client: apolloCoreClient });

  const effectiveData = data ?? previousData;
  const latestRun = effectiveData?.mercadoPublicoV2SyncControl.latestRun;
  const isActive = isActiveStatus(latestRun?.safeStatus);
  const isUnavailable = error !== undefined;
  const isOperatorPermissionDenied = isSyncOperatorPermissionError(error);

  useEffect(() => {
    if (isActive) {
      startPolling(3000);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isActive, startPolling, stopPolling]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      document
        .querySelector<HTMLButtonElement>(
          `[data-testid="${REFRESH_MODAL_CLOSE_TEST_ID}"]`,
        )
        ?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  if (isOperatorPermissionDenied || (loading && effectiveData === undefined)) {
    return null;
  }

  const handleOpen = () => {
    setIsOpen(true);
    openModal(REFRESH_MODAL_ID);
    void refetch().catch(() => undefined);
  };

  const handleClose = () => {
    setIsOpen(false);
    closeModal(REFRESH_MODAL_ID);
    triggerRef.current?.querySelector('button')?.focus();
  };

  const handleRetry = () => {
    setActionError(null);
    void refetch().catch(() => undefined);
  };

  const handleStart = async () => {
    setActionError(null);

    try {
      await startSync({
        variables: {
          input: {
            idempotencyKey: crypto.randomUUID(),
            confirmed: true,
          },
        },
      });
      await refetch();
    } catch {
      setActionError(
        t`No se pudo iniciar la actualización. Reintenta cuando el servicio esté disponible.`,
      );
    }
  };

  const stageLabels = [
    t`Buscar cambios`,
    t`Descargar detalles`,
    t`Actualizar datos`,
    t`Verificar`,
  ] as const;

  const phaseCopy =
    latestRun?.safeStatus === 'queued'
      ? {
          title: t`Preparando actualización`,
          description: t`La actualización está esperando comenzar.`,
        }
      : latestRun?.safeStatus === 'discovering'
        ? {
            title: t`Buscando cambios`,
            description: t`Consultando nuevos procesos y cambios disponibles en Mercado Público.`,
          }
        : latestRun?.safeStatus === 'hydrating'
          ? {
              title: t`Descargando detalles`,
              description: t`Obteniendo la información completa de los procesos encontrados.`,
            }
          : latestRun?.safeStatus === 'projecting'
            ? {
                title: t`Actualizando datos`,
                description: t`Preparando los procesos para mostrarlos en la aplicación.`,
              }
            : {
                title: t`Verificando actualización`,
                description: t`Comprobando que la actualización haya finalizado correctamente.`,
              };

  const metrics = latestRun && (
    <>
      <StyledMetrics>
        <StyledMetric>
          <StyledMetricValue>{latestRun.recordsDiscovered}</StyledMetricValue>
          <StyledMetricLabel>{t`Descubiertos`}</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue>{latestRun.recordsHydrated}</StyledMetricValue>
          <StyledMetricLabel>{t`Hidratados`}</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue>{latestRun.recordsProjected}</StyledMetricValue>
          <StyledMetricLabel>{t`Disponibles`}</StyledMetricLabel>
        </StyledMetric>
      </StyledMetrics>
      <StyledSecondaryInfo>
        {t`${latestRun.recordsDeferred} diferidos · ${latestRun.recordsFailed} fallidos`}
      </StyledSecondaryInfo>
    </>
  );

  return (
    <>
      <StyledTrigger ref={triggerRef}>
        <Button
          Icon={isActive ? undefined : IconRefresh}
          onClick={handleOpen}
          size="small"
          title={isActive ? t`● Actualizando…` : t`Actualizar datos`}
          type="button"
          variant="secondary"
        />
      </StyledTrigger>

      {isOpen && (
        <ModalStatefulWrapper
          autoHeight
          isClosable
          modalInstanceId={REFRESH_MODAL_ID}
          narrowWidth
          onClose={handleClose}
          renderInDocumentBody
        >
          <ModalHeader>
            <StyledModalHeader>
              <StyledModalTitle>
                {isActive
                  ? t`Actualizando Mercado Público`
                  : t`Actualizar Mercado Público`}
              </StyledModalTitle>
              <IconButton
                Icon={IconX}
                ariaLabel={t`Cerrar`}
                dataTestId={REFRESH_MODAL_CLOSE_TEST_ID}
                onClick={handleClose}
                size="small"
                variant="tertiary"
              />
            </StyledModalHeader>
          </ModalHeader>

          <ModalContent>
            <StyledBody>
              {actionError && (
                <StyledError role="alert">{actionError}</StyledError>
              )}

              {loading && effectiveData === undefined ? (
                <div aria-label={t`Cargando actualización…`} role="status">
                  <Loader />
                </div>
              ) : isUnavailable ? (
                <>
                  <StyledPhase>
                    <StyledPhaseTitle>{t`Estado temporalmente no disponible`}</StyledPhaseTitle>
                    <StyledDescription>
                      {t`Conservamos la última información conocida. Puedes reintentar ahora.`}
                    </StyledDescription>
                  </StyledPhase>
                  {latestRun && isActive && (
                    <StyledMonitoringCluster>
                      <MonitoringEcg animated={false} />
                      <StyledMonitoringCopy>
                        <StyledMonitoringLabel>
                          {t`Estado temporalmente no disponible`}
                        </StyledMonitoringLabel>
                        <StyledMonitoringMeta>
                          {t`Último cambio conocido ${formatRunTime(latestRun.updatedAt)}`}
                        </StyledMonitoringMeta>
                      </StyledMonitoringCopy>
                    </StyledMonitoringCluster>
                  )}
                </>
              ) : latestRun === null || latestRun === undefined ? (
                <>
                  <StyledPhase>
                    <StyledPhaseTitle>{t`Obtén los últimos cambios disponibles`}</StyledPhaseTitle>
                    <StyledDescription>
                      {t`Consulta los cambios recientes publicados en Mercado Público.`}
                    </StyledDescription>
                  </StyledPhase>
                  <StyledDescription>
                    {t`La actualización continuará en segundo plano aunque cierres esta ventana.`}
                  </StyledDescription>
                </>
              ) : isActive ? (
                <>
                  <StyledPhase>
                    <StyledPhaseTitle aria-live="polite" role="status">
                      {phaseCopy.title}
                    </StyledPhaseTitle>
                    <StyledDescription>
                      {phaseCopy.description}
                    </StyledDescription>
                  </StyledPhase>
                  <StyledMonitoringCluster>
                    <MonitoringEcg />
                    <StyledMonitoringCopy>
                      <StyledMonitoringLabel>{t`Monitoreando`}</StyledMonitoringLabel>
                      <StyledMonitoringMeta>
                        {t`Iniciada ${formatRunTime(latestRun.startedAt)} · Último cambio ${formatRunTime(latestRun.updatedAt)}`}
                      </StyledMonitoringMeta>
                    </StyledMonitoringCopy>
                  </StyledMonitoringCluster>
                  <RefreshProgressRail
                    ariaLabel={t`Progreso de actualización`}
                    completedLabel={t`Completado`}
                    currentLabel={t`En curso`}
                    labels={stageLabels}
                    pendingLabel={t`Pendiente`}
                    status={latestRun.safeStatus}
                  />
                  {metrics}
                  <StyledDescription>
                    {t`Puedes cerrar esta ventana. La actualización continuará en segundo plano.`}
                  </StyledDescription>
                </>
              ) : latestRun.safeStatus === 'succeeded' ? (
                <>
                  <StyledPhase>
                    <StyledPhaseTitle>{t`✓ Actualización completada`}</StyledPhaseTitle>
                    <StyledDescription>
                      {t`Finalizada ${formatRunTime(latestRun.updatedAt)}`}
                    </StyledDescription>
                  </StyledPhase>
                  <RefreshProgressRail
                    ariaLabel={t`Progreso de actualización`}
                    completedLabel={t`Completado`}
                    currentLabel={t`En curso`}
                    labels={stageLabels}
                    pendingLabel={t`Pendiente`}
                    status={latestRun.safeStatus}
                  />
                  {metrics}
                </>
              ) : (
                <>
                  <StyledPhase>
                    <StyledPhaseTitle>{t`⚠ Actualización incompleta`}</StyledPhaseTitle>
                    <StyledDescription>
                      {latestRun.safeSummary ??
                        t`La actualización no se completó.`}
                    </StyledDescription>
                    <StyledMonitoringMeta>
                      {t`Último cambio ${formatRunTime(latestRun.updatedAt)}`}
                    </StyledMonitoringMeta>
                  </StyledPhase>
                  {metrics}
                </>
              )}
            </StyledBody>
          </ModalContent>

          <ModalFooter>
            <StyledActions>
              {isUnavailable ? (
                <>
                  <Button
                    onClick={handleRetry}
                    title={t`Reintentar`}
                    type="button"
                  />
                  <Button
                    onClick={handleClose}
                    title={t`Cerrar`}
                    type="button"
                    variant="secondary"
                  />
                </>
              ) : isActive ? (
                <>
                  <Button
                    onClick={handleClose}
                    title={t`Ver centro de control`}
                    to={AppPath.MercadoPublicoV2SyncControl}
                    variant="tertiary"
                  />
                  <Button
                    onClick={handleClose}
                    title={t`Cerrar`}
                    type="button"
                    variant="secondary"
                  />
                </>
              ) : latestRun?.safeStatus === 'succeeded' ? (
                <>
                  <Button
                    dataTestId="mercado-publico-v2-refresh-start"
                    disabled={isStarting}
                    isLoading={isStarting}
                    onClick={() => void handleStart()}
                    title={
                      isStarting ? t`Actualizando…` : t`Actualizar de nuevo`
                    }
                    type="button"
                  />
                  <Button
                    onClick={handleClose}
                    title={t`Cerrar`}
                    type="button"
                    variant="secondary"
                  />
                </>
              ) : latestRun ? (
                <>
                  <Button
                    onClick={handleClose}
                    title={t`Ver centro de control`}
                    to={AppPath.MercadoPublicoV2SyncControl}
                  />
                  <Button
                    onClick={handleClose}
                    title={t`Cerrar`}
                    type="button"
                    variant="secondary"
                  />
                </>
              ) : (
                <>
                  <Button
                    onClick={handleClose}
                    title={t`Cancelar`}
                    type="button"
                    variant="secondary"
                  />
                  <Button
                    dataTestId="mercado-publico-v2-refresh-start"
                    disabled={isStarting}
                    isLoading={isStarting}
                    onClick={() => void handleStart()}
                    title={isStarting ? t`Actualizando…` : t`Actualizar`}
                    type="button"
                  />
                </>
              )}
            </StyledActions>
          </ModalFooter>
        </ModalStatefulWrapper>
      )}
    </>
  );
};
