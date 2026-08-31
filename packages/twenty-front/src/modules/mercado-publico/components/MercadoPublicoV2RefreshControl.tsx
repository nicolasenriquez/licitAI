import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
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
        canResume
        recordsDiscovered
        recordsHydrated
        recordsDeferred
        recordsFailed
        recordsProjected
        discoveryComplete
        startedAt
        updatedAt
        completionReason
        timeline {
          eventType
          at
          operatorName
        }
      }
    }
  }
`;

const START_SYNC_MUTATION = gql`
  mutation MercadoPublicoV2StartSync($input: MercadoPublicoV2StartSyncInput!) {
    mercadoPublicoV2SyncControl {
      start(input: $input) {
        state
      }
    }
  }
`;

const RESUME_SYNC_MUTATION = gql`
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
] as const;

const INCOMPLETE_STATUSES = [
  'partial',
  'partial_failed',
  'cancelled',
  'failed',
] as const;

const REFRESH_STAGES = [
  'discovery',
  'hydration',
  'update',
  'verification',
] as const;

const STAGE_INDEX = {
  queued: 0,
  discovering: 0,
  hydrating: 1,
  projecting: 2,
  reconciling: 3,
} as const;

const REFRESH_MODAL_ID = 'mercado-publico-v2-refresh-control';
const REFRESH_MODAL_CLOSE_TEST_ID = 'mercado-publico-v2-refresh-close';

type RefreshStage = (typeof REFRESH_STAGES)[number];
type RefreshStageState = 'completed' | 'current' | 'pending' | 'unverified';

type SyncTimelineEvent = {
  eventType: string;
  at: string;
  operatorName?: string | null;
};

type LatestRun = {
  safeStatus: string;
  safeSummary?: string | null;
  canResume: boolean;
  recordsDiscovered: number;
  recordsHydrated: number;
  recordsDeferred: number;
  recordsFailed: number;
  recordsProjected: number;
  discoveryComplete: boolean;
  startedAt?: string | null;
  updatedAt?: string | null;
  completionReason?: string | null;
  timeline: SyncTimelineEvent[];
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

type ResumeSyncMutation = {
  mercadoPublicoV2SyncControl: {
    resume: { state: string };
  };
};

type StartSyncVariables = {
  input: {
    idempotencyKey: string;
    confirmed: boolean;
    maxPages?: number;
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

const StyledMonitoringIcon = styled(IconRefresh)`
  color: ${themeCssVariables.font.color.secondary};
  flex: 0 0 auto;

  &[data-active='true'] {
    animation: refreshMonitoringSpin 1800ms linear infinite;
  }

  @keyframes refreshMonitoringSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-active='true'] {
      animation: none;
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
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(4, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 400px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledStage = styled.li`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  position: relative;
  text-align: center;
`;

const StyledConnector = styled.span`
  background-color: ${themeCssVariables.border.color.light};
  height: 1px;
  left: 50%;
  position: absolute;
  right: -50%;
  top: ${themeCssVariables.spacing[2]};
  transform: scaleX(0);
  transform-origin: left;
  transition:
    transform 220ms cubic-bezier(0.25, 1, 0.5, 1),
    background-color 220ms cubic-bezier(0.25, 1, 0.5, 1);
  z-index: 0;

  &[data-completed='true'] {
    background-color: ${themeCssVariables.border.color.strong};
    transform: scaleX(1);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (max-width: 400px) {
    display: none;
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
    background: ${themeCssVariables.border.color.strong};
    border-color: ${themeCssVariables.border.color.strong};
    color: ${themeCssVariables.font.color.inverted};
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
  line-height: 1.25;
  max-width: 100%;
  overflow-wrap: anywhere;

  &[data-current='true'] {
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledStageState = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.25;
  max-width: 100%;
  overflow-wrap: anywhere;

  &[data-state='current'] {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
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
  overflow-wrap: anywhere;
`;

const StyledWorkspace = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  padding-top: ${themeCssVariables.spacing[5]};
`;

const StyledWorkspaceSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;

const StyledWorkspaceHeading = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.04em;
  margin: 0;
  text-transform: uppercase;
`;

const StyledSectionHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledDisclosureButton = styled.button`
  background: none;
  border: 0;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font: inherit;
  min-height: 40px;
  padding: ${themeCssVariables.spacing[1]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.strong};
    outline-offset: 2px;
  }
`;

const StyledSettingLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSettingHint = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledPageLimitSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  min-height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledTimelineList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledTimelineItem = styled.li`
  align-items: start;
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: max-content auto minmax(0, 1fr) minmax(0, 0.75fr);
  min-width: 0;

  @media (max-width: 400px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledTimelineMarker = styled.span`
  background: ${themeCssVariables.border.color.strong};
  border-radius: ${themeCssVariables.border.radius.rounded};
  height: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[1]};
  width: ${themeCssVariables.spacing[2]};
`;

const StyledTimelineTime = styled.time`
  color: ${themeCssVariables.font.color.primary};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  @media (max-width: 400px) {
    white-space: normal;
  }
`;

const StyledTimelineCopy = styled.span`
  overflow-wrap: anywhere;
`;

const StyledTimelineOperator = styled.span`
  overflow-wrap: anywhere;
  text-align: right;
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

const isStatusInList = <TStatus extends string>(
  status: string | undefined,
  statuses: readonly TStatus[],
): status is TStatus =>
  status !== undefined && statuses.some((candidate) => candidate === status);

const isActiveStatus = (status: string | undefined): boolean =>
  isStatusInList(status, ACTIVE_STATUSES);

const isIncompleteStatus = (status: string | undefined): boolean =>
  isStatusInList(status, INCOMPLETE_STATUSES);

const getStageStates = ({
  status,
  discoveryComplete,
}: {
  status: string;
  discoveryComplete: boolean;
}): RefreshStageState[] => {
  if (status === 'succeeded') {
    return REFRESH_STAGES.map(() => 'completed');
  }

  if (status in STAGE_INDEX) {
    const currentIndex = STAGE_INDEX[status as keyof typeof STAGE_INDEX];

    return REFRESH_STAGES.map((_, index) =>
      index < currentIndex
        ? 'completed'
        : index === currentIndex
          ? 'current'
          : 'pending',
    );
  }

  if (isIncompleteStatus(status)) {
    return REFRESH_STAGES.map((_, index) =>
      discoveryComplete && index === 0 ? 'completed' : 'unverified',
    );
  }

  return REFRESH_STAGES.map(() => 'pending');
};

const RefreshProgressRail = ({
  status,
  discoveryComplete,
  stages,
  ariaLabel,
  completedLabel,
  currentLabel,
  unverifiedLabel,
  pendingLabel,
}: {
  status: string;
  discoveryComplete: boolean;
  stages: readonly { id: RefreshStage; label: string }[];
  ariaLabel: string;
  completedLabel: string;
  currentLabel: string;
  unverifiedLabel: string;
  pendingLabel: string;
}) => {
  const stageStates = getStageStates({ status, discoveryComplete });

  return (
    <StyledProgressRail aria-label={ariaLabel}>
      {stages.map((stage, index) => {
        const state = stageStates[index];
        const stateLabel =
          state === 'completed'
            ? completedLabel
            : state === 'current'
              ? currentLabel
              : state === 'unverified'
                ? unverifiedLabel
                : pendingLabel;

        return (
          <StyledStage
            aria-current={state === 'current' ? 'step' : undefined}
            data-stage={stage.id}
            key={stage.id}
          >
            {index < stages.length - 1 && (
              <StyledConnector
                aria-hidden="true"
                data-completed={state === 'completed'}
              />
            )}
            <StyledStageNode aria-hidden="true" data-state={state}>
              {state === 'completed' ? <IconCheck size={12} /> : null}
            </StyledStageNode>
            <StyledStageLabel data-current={state === 'current'}>
              {stage.label}
            </StyledStageLabel>
            <StyledStageState data-state={state}>{stateLabel}</StyledStageState>
          </StyledStage>
        );
      })}
    </StyledProgressRail>
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

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    hourCycle: 'h23',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
};

const formatMetric = (value: number): string =>
  new Intl.NumberFormat('es-CL').format(value);

const TIMELINE_EVENT_LABELS: Record<string, MessageDescriptor> = {
  command_created: msg`Solicitud creada`,
  run_created: msg`Ejecución preparada`,
  reused: msg`Ejecución existente reutilizada`,
  dispatched: msg`Enviada a procesamiento`,
  dispatch_failed: msg`No se pudo iniciar el procesamiento`,
  cancellation_requested: msg`Cancelación solicitada`,
  claimed: msg`Procesamiento iniciado`,
  heartbeat_recovery: msg`Ejecución recuperada`,
};

const getTimelineEventLabel = (
  eventType: string,
  translate: (message: MessageDescriptor) => string,
): string =>
  translate(TIMELINE_EVENT_LABELS[eventType] ?? msg`Actividad registrada`);

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

export const MercadoPublicoV2RefreshControl = () => {
  const { i18n, t } = useLingui();
  const apolloCoreClient = useApolloCoreClient();
  const navigate = useNavigate();
  const { closeModal, openModal } = useModal();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [isStartConfirmationVisible, setIsStartConfirmationVisible] =
    useState(false);
  const [maxPages, setMaxPages] = useState<number | undefined>(undefined);
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
  const [resumeSync, { loading: isResuming }] = useMutation<
    ResumeSyncMutation,
    { input: { idempotencyKey: string } }
  >(RESUME_SYNC_MUTATION, { client: apolloCoreClient });
  const effectiveData = data ?? previousData;
  const latestRun = effectiveData?.mercadoPublicoV2SyncControl.latestRun;
  const isActive = isActiveStatus(latestRun?.safeStatus);
  const isSuccess = latestRun?.safeStatus === 'succeeded';
  const isIncomplete = isIncompleteStatus(latestRun?.safeStatus);
  const hasKnownStatus = effectiveData !== undefined;
  const isStatusUnavailable = error !== undefined && !hasKnownStatus;
  const isStatusStale = error !== undefined && hasKnownStatus;
  const isOperatorPermissionDenied = isSyncOperatorPermissionError(error);
  const isCommandPending = isStarting || isResuming;
  const isLive = isCommandPending || isActive;
  const displayedStatus =
    isCommandPending && !isActive ? 'queued' : latestRun?.safeStatus;

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
    setActionError(null);
    setIsStartConfirmationVisible(false);
    setIsOpen(true);
    openModal(REFRESH_MODAL_ID);
    void refetch().catch(() => undefined);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsActivityExpanded(false);
    setIsStartConfirmationVisible(false);
    closeModal(REFRESH_MODAL_ID);
    triggerRef.current?.querySelector('button')?.focus();
  };

  const handleRetry = () => {
    setActionError(null);
    void refetch().catch(() => undefined);
  };

  const handleStart = async () => {
    if (isStarting || isActive) {
      return;
    }

    setActionError(null);

    try {
      await startSync({
        variables: {
          input: {
            confirmed: true,
            idempotencyKey: crypto.randomUUID(),
            ...(maxPages === undefined ? {} : { maxPages }),
          },
        },
      });
    } catch {
      setActionError(
        t`No se pudo iniciar la actualización. Reintenta cuando el servicio esté disponible.`,
      );

      return;
    }

    void refetch().catch(() => undefined);
  };

  const handleResume = async () => {
    setActionError(null);

    try {
      await resumeSync({
        variables: { input: { idempotencyKey: crypto.randomUUID() } },
      });
      await refetch();
    } catch {
      setActionError(
        t`No se pudo reanudar la actualización. Reintenta cuando el servicio esté disponible.`,
      );
    }
  };

  const requestStart = () => {
    setActionError(null);
    setIsStartConfirmationVisible(true);
  };

  const stageLabels = [
    { id: 'discovery' as const, label: t`Buscar cambios` },
    { id: 'hydration' as const, label: t`Descargar detalles` },
    { id: 'update' as const, label: t`Actualizar datos` },
    { id: 'verification' as const, label: t`Verificar` },
  ];

  const phaseCopy =
    displayedStatus === 'queued'
      ? {
          title: t`Preparando actualización`,
          description: t`La actualización está esperando comenzar.`,
        }
      : displayedStatus === 'discovering'
        ? {
            title: t`Buscando cambios`,
            description: t`Consultando nuevos procesos y cambios disponibles en Mercado Público.`,
          }
        : displayedStatus === 'hydrating'
          ? {
              title: t`Descargando detalles`,
              description: t`Obteniendo la información completa de los procesos encontrados.`,
            }
          : displayedStatus === 'projecting'
            ? {
                title: t`Actualizando datos`,
                description: t`Preparando los procesos para mostrarlos en la aplicación.`,
              }
            : {
                title: t`Verificando actualización`,
                description: t`Comprobando que la actualización haya finalizado correctamente.`,
              };

  const metrics: ReactNode = latestRun ? (
    <StyledMetrics data-testid="mercado-publico-v2-refresh-metrics">
      <StyledMetric>
        <StyledMetricValue>
          {formatMetric(latestRun.recordsDiscovered)}
        </StyledMetricValue>
        <StyledMetricLabel>{t`Procesos encontrados`}</StyledMetricLabel>
      </StyledMetric>
      <StyledMetric>
        <StyledMetricValue>
          {formatMetric(latestRun.recordsHydrated)}
        </StyledMetricValue>
        <StyledMetricLabel>{t`Detalles descargados`}</StyledMetricLabel>
      </StyledMetric>
      <StyledMetric>
        <StyledMetricValue>
          {formatMetric(latestRun.recordsProjected)}
        </StyledMetricValue>
        <StyledMetricLabel>{t`Preparados para consulta`}</StyledMetricLabel>
      </StyledMetric>
    </StyledMetrics>
  ) : null;

  const timeline = latestRun?.timeline ?? [];
  const visibleEvents = isActivityExpanded ? timeline : timeline.slice(-4);
  const showConfiguration = !isLive && (latestRun === null || isSuccess);

  return (
    <>
      <StyledTrigger ref={triggerRef}>
        <Button
          Icon={isActive ? undefined : IconRefresh}
          onClick={handleOpen}
          size="small"
          title={isActive ? t`Actualizando…` : t`Actualizar datos`}
          type="button"
          variant="secondary"
        />
      </StyledTrigger>

      {isOpen && (
        <ModalStatefulWrapper
          ariaLabel={t`Actualizar Mercado Público`}
          autoHeight
          isClosable
          modalInstanceId={REFRESH_MODAL_ID}
          onClose={handleClose}
          renderInDocumentBody
          size="large"
          trapFocus
        >
          <ModalHeader>
            <StyledModalHeader>
              <StyledModalTitle>{t`Actualizar Mercado Público`}</StyledModalTitle>
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

              {isStatusStale && (
                <StyledError role="status">
                  {t`No se pudo actualizar el monitoreo. Mostrando el último estado conocido.`}
                </StyledError>
              )}

              {isStartConfirmationVisible && (
                <StyledPhase
                  aria-labelledby="mercado-publico-v2-refresh-confirmation-title"
                  role="group"
                >
                  <StyledPhaseTitle id="mercado-publico-v2-refresh-confirmation-title">
                    {t`Confirma esta actualización`}
                  </StyledPhaseTitle>
                  <StyledDescription>
                    {maxPages === undefined
                      ? t`Se consultarán todas las páginas de fuente disponibles.`
                      : t`Se consultarán hasta ${maxPages} páginas de fuente.`}
                  </StyledDescription>
                </StyledPhase>
              )}

              <StyledMonitoringCluster
                aria-live="polite"
                data-testid="mercado-publico-v2-refresh-status"
                role="status"
              >
                <StyledMonitoringIcon
                  aria-hidden="true"
                  data-active={isLive}
                  size={20}
                />
                <StyledMonitoringCopy>
                  <StyledMonitoringLabel>
                    {isStatusUnavailable
                      ? t`Estado temporalmente no disponible`
                      : isLive
                        ? phaseCopy.title
                        : isSuccess
                          ? t`Actualización completada`
                          : isIncomplete
                            ? t`Actualización incompleta`
                            : t`Lista para actualizar`}
                  </StyledMonitoringLabel>
                  <StyledMonitoringMeta>
                    {latestRun?.startedAt
                      ? t`Iniciada ${formatRunTime(latestRun.startedAt)} · Última actualización ${formatRunTime(latestRun.updatedAt)}`
                      : t`Última actualización —`}
                  </StyledMonitoringMeta>
                </StyledMonitoringCopy>
              </StyledMonitoringCluster>

              {loading && effectiveData === undefined ? (
                <div aria-label={t`Cargando actualización…`} role="status">
                  <Loader />
                </div>
              ) : isStatusUnavailable ? (
                <StyledPhase>
                  <StyledPhaseTitle>{t`Estado temporalmente no disponible`}</StyledPhaseTitle>
                  <StyledDescription>
                    {t`Conservamos la última información conocida. Puedes reintentar ahora.`}
                  </StyledDescription>
                </StyledPhase>
              ) : isLive ? (
                <>
                  <StyledPhase>
                    <StyledDescription>
                      {phaseCopy.description}
                    </StyledDescription>
                  </StyledPhase>
                  {displayedStatus && (
                    <RefreshProgressRail
                      ariaLabel={t`Progreso de actualización`}
                      completedLabel={t`Completado`}
                      currentLabel={t`Procesando…`}
                      discoveryComplete={latestRun?.discoveryComplete ?? false}
                      unverifiedLabel={t`No verificado`}
                      pendingLabel={t`Pendiente`}
                      stages={stageLabels}
                      status={displayedStatus}
                    />
                  )}
                  {metrics}
                  {latestRun && (
                    <StyledSecondaryInfo>
                      {t`${formatMetric(latestRun.recordsDeferred)} diferidos · ${formatMetric(latestRun.recordsFailed)} fallidos`}
                    </StyledSecondaryInfo>
                  )}
                </>
              ) : latestRun === null || latestRun === undefined ? (
                <StyledPhase>
                  <StyledPhaseTitle>{t`Obtén los últimos cambios disponibles`}</StyledPhaseTitle>
                  <StyledDescription>
                    {t`Configura el alcance de la próxima ejecución.`}
                  </StyledDescription>
                </StyledPhase>
              ) : isSuccess ? (
                <>
                  <StyledPhase>
                    <StyledPhaseTitle>{t`Actualización completada`}</StyledPhaseTitle>
                    <StyledDescription>
                      {t`Finalizada ${formatRunTime(latestRun.updatedAt)}`}
                    </StyledDescription>
                  </StyledPhase>
                  <RefreshProgressRail
                    ariaLabel={t`Progreso de actualización`}
                    completedLabel={t`Completado`}
                    currentLabel={t`Procesando…`}
                    discoveryComplete={latestRun.discoveryComplete}
                    unverifiedLabel={t`No verificado`}
                    pendingLabel={t`Pendiente`}
                    stages={stageLabels}
                    status={latestRun.safeStatus}
                  />
                  {metrics}
                  <StyledSecondaryInfo>
                    {t`${formatMetric(latestRun.recordsDeferred)} diferidos · ${formatMetric(latestRun.recordsFailed)} fallidos`}
                  </StyledSecondaryInfo>
                </>
              ) : (
                <>
                  <StyledPhase>
                    <StyledPhaseTitle>{t`Actualización incompleta`}</StyledPhaseTitle>
                    <StyledDescription>
                      {latestRun.safeSummary ??
                        t`La ejecución se detuvo antes de completar la actualización.`}
                    </StyledDescription>
                    <StyledMonitoringMeta>
                      {t`Último cambio: ${formatRunTime(latestRun.updatedAt)}`}
                    </StyledMonitoringMeta>
                  </StyledPhase>
                  <RefreshProgressRail
                    ariaLabel={t`Progreso de actualización`}
                    completedLabel={t`Completado`}
                    currentLabel={t`Procesando…`}
                    discoveryComplete={latestRun.discoveryComplete}
                    unverifiedLabel={t`No verificado`}
                    pendingLabel={t`Pendiente`}
                    stages={stageLabels}
                    status={latestRun.safeStatus}
                  />
                  {metrics}
                  <StyledSecondaryInfo>
                    {t`${formatMetric(latestRun.recordsDeferred)} diferidos · ${formatMetric(latestRun.recordsFailed)} fallidos`}
                  </StyledSecondaryInfo>
                </>
              )}

              {hasKnownStatus && !isStatusUnavailable && (
                <StyledWorkspace>
                  {showConfiguration && (
                    <StyledWorkspaceSection aria-labelledby="refresh-settings-title">
                      <StyledWorkspaceHeading id="refresh-settings-title">
                        {t`Configura esta actualización`}
                      </StyledWorkspaceHeading>
                      <StyledSettingLabel htmlFor="mercado-publico-v2-refresh-max-pages">
                        {t`Páginas de fuente por ejecución`}
                        <StyledPageLimitSelect
                          aria-describedby="mercado-publico-v2-refresh-page-limit-hint"
                          data-testid="mercado-publico-v2-refresh-max-pages"
                          id="mercado-publico-v2-refresh-max-pages"
                          onChange={(event) =>
                            setMaxPages(
                              event.target.value === ''
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          value={maxPages ?? ''}
                        >
                          <option value="">{t`Sin límite de páginas`}</option>
                          <option value={1}>{t`1 página`}</option>
                          <option value={2}>{t`2 páginas`}</option>
                          <option value={10}>{t`10 páginas`}</option>
                          <option value={50}>{t`50 páginas`}</option>
                        </StyledPageLimitSelect>
                      </StyledSettingLabel>
                      <StyledSettingHint id="mercado-publico-v2-refresh-page-limit-hint">
                        {maxPages === undefined
                          ? t`Sin límite de páginas configurado.`
                          : t`Límite de ${maxPages} páginas para esta ejecución.`}
                      </StyledSettingHint>
                    </StyledWorkspaceSection>
                  )}

                  {timeline.length > 0 && (
                    <StyledWorkspaceSection aria-labelledby="refresh-activity-title">
                      <StyledSectionHeader>
                        <StyledWorkspaceHeading id="refresh-activity-title">
                          {t`Actividad`}
                        </StyledWorkspaceHeading>
                        {timeline.length > 4 && (
                          <StyledDisclosureButton
                            aria-controls="mercado-publico-refresh-activity-list"
                            aria-expanded={isActivityExpanded}
                            onClick={() =>
                              setIsActivityExpanded((isExpanded) => !isExpanded)
                            }
                            type="button"
                          >
                            {isActivityExpanded
                              ? t`Mostrar menos`
                              : t`Mostrar toda`}
                          </StyledDisclosureButton>
                        )}
                      </StyledSectionHeader>
                      <StyledTimelineList id="mercado-publico-refresh-activity-list">
                        {visibleEvents.map((event, index) => (
                          <StyledTimelineItem
                            key={`${event.eventType}-${event.at}-${index}`}
                          >
                            <StyledTimelineTime dateTime={event.at}>
                              {formatRunTime(event.at)}
                            </StyledTimelineTime>
                            <StyledTimelineMarker aria-hidden="true" />
                            <StyledTimelineCopy>
                              {getTimelineEventLabel(
                                event.eventType,
                                (message) => i18n._(message),
                              )}
                            </StyledTimelineCopy>
                            <StyledTimelineOperator>
                              {event.operatorName ?? t`Sistema`}
                            </StyledTimelineOperator>
                          </StyledTimelineItem>
                        ))}
                      </StyledTimelineList>
                    </StyledWorkspaceSection>
                  )}
                  {latestRun && !isIncomplete && (
                    <Button
                      onClick={() => {
                        handleClose();
                        navigate(AppPath.MercadoPublicoV2SyncControl);
                      }}
                      title={t`Abrir centro de control`}
                      type="button"
                      variant="tertiary"
                    />
                  )}
                  {isLive && (
                    <StyledSecondaryInfo>
                      {t`La actualización continúa aunque cierres el modal.`}
                    </StyledSecondaryInfo>
                  )}
                </StyledWorkspace>
              )}
            </StyledBody>
          </ModalContent>

          <ModalFooter>
            <StyledActions>
              {isStartConfirmationVisible ? (
                <>
                  <Button
                    onClick={() => setIsStartConfirmationVisible(false)}
                    title={t`Cancelar`}
                    type="button"
                    variant="secondary"
                  />
                  <Button
                    dataTestId="mercado-publico-v2-refresh-confirm-start"
                    onClick={() => {
                      setIsStartConfirmationVisible(false);
                      void handleStart();
                    }}
                    title={t`Confirmar actualización`}
                    type="button"
                  />
                </>
              ) : isStatusUnavailable || isStatusStale ? (
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
              ) : isLive ? (
                <Button
                  onClick={handleClose}
                  title={t`Cerrar`}
                  type="button"
                  variant="secondary"
                />
              ) : isSuccess ? (
                <>
                  <Button
                    dataTestId="mercado-publico-v2-refresh-start"
                    disabled={isStarting}
                    isLoading={isStarting}
                    onClick={requestStart}
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
              ) : isIncomplete ? (
                <>
                  {latestRun?.canResume === true && (
                    <Button
                      dataTestId="mercado-publico-v2-refresh-resume"
                      disabled={isResuming}
                      isLoading={isResuming}
                      onClick={() => void handleResume()}
                      title={t`Reanudar actualización`}
                      type="button"
                    />
                  )}
                  <Button
                    onClick={() => {
                      handleClose();
                      navigate(AppPath.MercadoPublicoV2SyncControl);
                    }}
                    title={t`Abrir centro de control`}
                    type="button"
                    variant="tertiary"
                  />
                  <Button
                    onClick={handleClose}
                    title={t`Cerrar`}
                    type="button"
                    variant="secondary"
                  />
                </>
              ) : latestRun ? (
                <Button
                  onClick={handleClose}
                  title={t`Cerrar`}
                  type="button"
                  variant="secondary"
                />
              ) : (
                <>
                  <Button
                    onClick={handleClose}
                    title={t`Cerrar`}
                    type="button"
                    variant="secondary"
                  />
                  <Button
                    dataTestId="mercado-publico-v2-refresh-start"
                    disabled={isStarting}
                    isLoading={isStarting}
                    onClick={requestStart}
                    title={
                      isStarting ? t`Actualizando…` : t`Iniciar actualización`
                    }
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
