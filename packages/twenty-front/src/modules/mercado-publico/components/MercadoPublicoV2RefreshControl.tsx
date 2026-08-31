import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Loader } from 'twenty-ui/feedback';
import { IconCheck, IconRefresh, IconX } from 'twenty-ui/icon';
import { Button, IconButton } from 'twenty-ui/input';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
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

const CANCEL_SYNC_MUTATION = gql`
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
const CANCEL_CONFIRMATION_MODAL_ID =
  'mercado-publico-v2-refresh-cancel-confirmation';
const REFRESH_MODAL_CLOSE_TEST_ID = 'mercado-publico-v2-refresh-close';

type RefreshStage = (typeof REFRESH_STAGES)[number];
type RefreshStageState = 'completed' | 'current' | 'pending' | 'failed';
type HeartbeatMode = 'live' | 'frozen' | 'success' | 'hidden';

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

type StartSyncVariables = {
  input: {
    idempotencyKey: string;
    confirmed: boolean;
    maxPages?: number;
  };
};

type CancelSyncMutation = {
  mercadoPublicoV2SyncControl: {
    cancel: { state: string };
  };
};

type CancelSyncVariables = {
  input: {
    idempotencyKey: string;
    confirmed: boolean;
  };
};

type ResumeSyncMutation = {
  mercadoPublicoV2SyncControl: {
    resume: { state: string };
  };
};

type ResumeSyncVariables = {
  input: {
    idempotencyKey: string;
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
  align-items: flex-start;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;

const StyledMonitoringEcg = styled.svg`
  display: block;
  flex: 0 0 auto;
  height: 20px;
  margin-top: 2px;
  overflow: visible;
  width: 56px;

  .heartbeatBaseline {
    fill: none;
    opacity: 0.3;
    stroke: currentColor;
    stroke-width: 1;
  }

  .heartbeatSignal {
    fill: none;
    stroke: currentColor;
    stroke-dasharray: 22 50;
    stroke-dashoffset: 72;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
  }

  &[data-mode='live'] .heartbeatSignal {
    animation: refreshHeartbeatSweep 1800ms ease-out infinite;
  }

  &[data-mode='frozen'] .heartbeatSignal {
    opacity: 0.8;
    stroke-dashoffset: 0;
  }

  &[data-mode='success'] .heartbeatSignal {
    animation: refreshHeartbeatSweep 1800ms ease-out 1;
    animation-fill-mode: forwards;
  }

  @keyframes refreshHeartbeatSweep {
    0% {
      opacity: 0;
      stroke-dashoffset: 72;
    }

    12% {
      opacity: 1;
    }

    55% {
      opacity: 1;
      stroke-dashoffset: 0;
    }

    75%,
    100% {
      opacity: 0;
      stroke-dashoffset: -72;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .heartbeatSignal {
      animation: none;
      opacity: 0.8;
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
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(4, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
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

  &[data-state='current']::after {
    border: 1px solid ${themeCssVariables.color.blue};
    border-radius: ${themeCssVariables.border.radius.rounded};
    content: '';
    inset: -5px;
    opacity: 0.35;
    position: absolute;
    animation: refreshActiveStageRing 1800ms ease-out infinite;
  }

  &[data-state='failed'] {
    border-color: ${themeCssVariables.color.red};
    color: ${themeCssVariables.color.red};
    font-weight: ${themeCssVariables.font.weight.medium};
  }

  @keyframes refreshActiveStageRing {
    0%,
    100% {
      opacity: 0.2;
    }

    50% {
      opacity: 0.55;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-state='current']::after {
      animation: none;
      opacity: 0.35;
    }
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

  &[data-state='failed'] {
    color: ${themeCssVariables.color.red};
  }
`;

const StyledMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  display: grid;
  gap: ${themeCssVariables.spacing[5]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding-top: ${themeCssVariables.spacing[5]};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
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

const StyledSettingLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
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
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: max-content minmax(0, 1fr);
  min-width: 0;

  @media (max-width: 400px) {
    grid-template-columns: minmax(0, 1fr);
  }
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

const MonitoringEcg = ({ mode }: { mode: HeartbeatMode }) => {
  if (mode === 'hidden') {
    return null;
  }

  return (
    <StyledMonitoringEcg
      aria-hidden="true"
      data-mode={mode}
      focusable="false"
      height="20"
      viewBox="0 0 56 20"
      width="56"
    >
      <path className="heartbeatBaseline" d="M0 10H56" pathLength="72" />
      <path
        className="heartbeatSignal"
        d="M0 10H18L22 10L25 2L28 18L31 10H56"
        pathLength="72"
      />
    </StyledMonitoringEcg>
  );
};

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
    const failedIndex = discoveryComplete ? 2 : 0;

    return REFRESH_STAGES.map((_, index) =>
      index < failedIndex
        ? 'completed'
        : index === failedIndex
          ? 'failed'
          : 'pending',
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
  failedLabel,
  pendingLabel,
}: {
  status: string;
  discoveryComplete: boolean;
  stages: readonly { id: RefreshStage; label: string }[];
  ariaLabel: string;
  completedLabel: string;
  currentLabel: string;
  failedLabel: string;
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
              : state === 'failed'
                ? failedLabel
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
              {state === 'failed' ? '!' : null}
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
  command_created: msg`Actualización solicitada`,
  run_created: msg`Actualización iniciada`,
  reused: msg`Actualización reutilizada`,
  dispatched: msg`Actualización enviada`,
  dispatch_failed: msg`No se pudo enviar la actualización`,
  cancellation_requested: msg`Cancelación solicitada`,
  claimed: msg`Actualización tomada por el proceso`,
  heartbeat_recovery: msg`Actualización recuperada`,
};

const getTimelineEventLabel = (
  eventType: string,
  translate: (message: MessageDescriptor) => string,
): string =>
  translate(
    TIMELINE_EVENT_LABELS[eventType] ?? msg`Actividad de actualización`,
  );

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
  const { closeModal, openModal } = useModal();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccessHeartbeatVisible, setIsSuccessHeartbeatVisible] =
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
  const [cancelSync, { loading: isCancelling }] = useMutation<
    CancelSyncMutation,
    CancelSyncVariables
  >(CANCEL_SYNC_MUTATION, { client: apolloCoreClient });
  const [resumeSync, { loading: isResuming }] = useMutation<
    ResumeSyncMutation,
    ResumeSyncVariables
  >(RESUME_SYNC_MUTATION, { client: apolloCoreClient });

  const effectiveData = data ?? previousData;
  const latestRun = effectiveData?.mercadoPublicoV2SyncControl.latestRun;
  const isActive = isActiveStatus(latestRun?.safeStatus);
  const isSuccess = latestRun?.safeStatus === 'succeeded';
  const isIncomplete = isIncompleteStatus(latestRun?.safeStatus);
  const isUnavailable = error !== undefined;
  const isOperatorPermissionDenied = isSyncOperatorPermissionError(error);
  const isLive = isStarting || isActive;
  const heartbeatMode: HeartbeatMode = isUnavailable
    ? 'frozen'
    : isLive
      ? 'live'
      : isSuccess && isSuccessHeartbeatVisible
        ? 'success'
        : isIncomplete
          ? 'frozen'
          : 'hidden';

  useEffect(() => {
    if (isActive) {
      startPolling(3000);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isActive, startPolling, stopPolling]);

  useEffect(() => {
    if (!isSuccess || !isOpen) {
      setIsSuccessHeartbeatVisible(false);
      return;
    }

    setIsSuccessHeartbeatVisible(true);
    const successHeartbeatTimer = window.setTimeout(() => {
      setIsSuccessHeartbeatVisible(false);
    }, 1800);

    return () => window.clearTimeout(successHeartbeatTimer);
  }, [isOpen, isSuccess, latestRun?.updatedAt]);

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
            confirmed: true,
            idempotencyKey: crypto.randomUUID(),
            ...(maxPages === undefined ? {} : { maxPages }),
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

  const handleCancel = async () => {
    setActionError(null);

    try {
      await cancelSync({
        variables: {
          input: {
            confirmed: true,
            idempotencyKey: crypto.randomUUID(),
          },
        },
      });
      await refetch();
    } catch {
      setActionError(
        t`No se pudo cancelar la actualización. Conservamos el estado conocido.`,
      );
    }
  };

  const handleResume = async () => {
    if (latestRun?.canResume !== true) {
      return;
    }

    setActionError(null);

    try {
      await resumeSync({
        variables: { input: { idempotencyKey: crypto.randomUUID() } },
      });
      await refetch();
    } catch {
      setActionError(
        t`No se pudo reanudar la actualización. Conservamos el estado conocido.`,
      );
    }
  };

  const stageLabels = [
    { id: 'discovery' as const, label: t`Buscar cambios` },
    { id: 'hydration' as const, label: t`Descargar detalles` },
    { id: 'update' as const, label: t`Actualizar datos` },
    { id: 'verification' as const, label: t`Verificar` },
  ];

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

  const metrics: ReactNode = latestRun ? (
    <StyledMetrics data-testid="mercado-publico-v2-refresh-metrics">
      <StyledMetric>
        <StyledMetricValue>
          {formatMetric(latestRun.recordsDiscovered)}
        </StyledMetricValue>
        <StyledMetricLabel>{t`Descubiertos`}</StyledMetricLabel>
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
        <StyledMetricLabel>{t`Disponibles`}</StyledMetricLabel>
      </StyledMetric>
      <StyledMetric>
        <StyledMetricValue>
          {formatMetric(latestRun.recordsFailed)}
        </StyledMetricValue>
        <StyledMetricLabel>{t`Fallidos`}</StyledMetricLabel>
      </StyledMetric>
      <StyledMetric>
        <StyledMetricValue>
          {formatMetric(latestRun.recordsDeferred)}
        </StyledMetricValue>
        <StyledMetricLabel>{t`Diferidos`}</StyledMetricLabel>
      </StyledMetric>
    </StyledMetrics>
  ) : null;

  const timeline = latestRun?.timeline ?? [];

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

              <StyledMonitoringCluster
                aria-live="polite"
                data-testid="mercado-publico-v2-refresh-heartbeat"
              >
                <MonitoringEcg mode={heartbeatMode} />
                <StyledMonitoringCopy>
                  <StyledMonitoringLabel>
                    {isUnavailable
                      ? t`Estado temporalmente no disponible`
                      : isLive
                        ? t`Actualización en curso`
                        : isSuccess
                          ? t`Actualización completada`
                          : isIncomplete
                            ? t`Actualización incompleta`
                            : t`Lista para actualizar`}
                  </StyledMonitoringLabel>
                  <StyledMonitoringMeta>
                    {latestRun?.updatedAt
                      ? t`Último cambio: ${formatRunTime(latestRun.updatedAt)}`
                      : t`Último cambio: —`}
                  </StyledMonitoringMeta>
                </StyledMonitoringCopy>
              </StyledMonitoringCluster>

              {loading && effectiveData === undefined ? (
                <div aria-label={t`Cargando actualización…`} role="status">
                  <Loader />
                </div>
              ) : isUnavailable ? (
                <StyledPhase>
                  <StyledPhaseTitle>{t`Estado temporalmente no disponible`}</StyledPhaseTitle>
                  <StyledDescription>
                    {t`Conservamos la última información conocida. Puedes reintentar ahora.`}
                  </StyledDescription>
                </StyledPhase>
              ) : latestRun === null || latestRun === undefined ? (
                <StyledPhase>
                  <StyledPhaseTitle>{t`Obtén los últimos cambios disponibles`}</StyledPhaseTitle>
                  <StyledDescription>
                    {t`La actualización continuará en segundo plano aunque cierres esta ventana.`}
                  </StyledDescription>
                </StyledPhase>
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
                  <RefreshProgressRail
                    ariaLabel={t`Progreso de actualización`}
                    completedLabel={t`Completado`}
                    currentLabel={t`Procesando…`}
                    discoveryComplete={latestRun.discoveryComplete}
                    failedLabel={t`Detenido`}
                    pendingLabel={t`Pendiente`}
                    stages={stageLabels}
                    status={latestRun.safeStatus}
                  />
                  {metrics}
                  <StyledDescription>
                    {t`Puedes cerrar esta ventana. La actualización continuará en segundo plano.`}
                  </StyledDescription>
                </>
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
                    failedLabel={t`Detenido`}
                    pendingLabel={t`Pendiente`}
                    stages={stageLabels}
                    status={latestRun.safeStatus}
                  />
                  {metrics}
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
                    failedLabel={t`Detenido`}
                    pendingLabel={t`Pendiente`}
                    stages={stageLabels}
                    status={latestRun.safeStatus}
                  />
                  {metrics}
                </>
              )}

              {!loading && !isUnavailable && (
                <StyledWorkspace>
                  <StyledWorkspaceSection aria-labelledby="refresh-settings-title">
                    <StyledWorkspaceHeading id="refresh-settings-title">
                      {t`Configuración`}
                    </StyledWorkspaceHeading>
                    <StyledSettingLabel htmlFor="mercado-publico-v2-refresh-max-pages">
                      {t`Alcance de actualización`}
                      <StyledPageLimitSelect
                        data-testid="mercado-publico-v2-refresh-max-pages"
                        disabled={isLive}
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
                        <option value="">{t`Completa / sin límite`}</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                      </StyledPageLimitSelect>
                    </StyledSettingLabel>
                    <StyledSecondaryInfo>
                      {t`La actualización continúa aunque cierres esta ventana.`}
                    </StyledSecondaryInfo>
                  </StyledWorkspaceSection>

                  <StyledWorkspaceSection aria-labelledby="refresh-activity-title">
                    <StyledWorkspaceHeading id="refresh-activity-title">
                      {t`Actividad reciente`}
                    </StyledWorkspaceHeading>
                    {timeline.length > 0 ? (
                      <StyledTimelineList>
                        {timeline.map((event, index) => (
                          <StyledTimelineItem
                            key={`${event.eventType}-${event.at}-${index}`}
                          >
                            <StyledTimelineTime dateTime={event.at}>
                              {formatRunTime(event.at)}
                            </StyledTimelineTime>
                            <StyledTimelineCopy>
                              {getTimelineEventLabel(
                                event.eventType,
                                (message) => i18n._(message),
                              )}
                              {' · '}
                              {event.operatorName ?? t`Sistema`}
                            </StyledTimelineCopy>
                          </StyledTimelineItem>
                        ))}
                      </StyledTimelineList>
                    ) : (
                      <StyledSecondaryInfo>
                        {t`Sin actividad adicional`}
                      </StyledSecondaryInfo>
                    )}
                  </StyledWorkspaceSection>
                </StyledWorkspace>
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
              ) : isLive ? (
                <>
                  <Button
                    disabled={isCancelling}
                    isLoading={isCancelling}
                    onClick={() => openModal(CANCEL_CONFIRMATION_MODAL_ID)}
                    title={t`Cancelar proceso`}
                    type="button"
                    variant="secondary"
                  />
                  <Button
                    onClick={handleClose}
                    title={t`Cerrar`}
                    type="button"
                    variant="secondary"
                  />
                </>
              ) : isSuccess ? (
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
              ) : latestRun?.canResume === true ? (
                <>
                  <Button
                    dataTestId="mercado-publico-v2-refresh-resume"
                    disabled={isResuming}
                    isLoading={isResuming}
                    onClick={() => void handleResume()}
                    title={
                      isResuming ? t`Reanudando…` : t`Reanudar actualización`
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
                    onClick={() => void handleStart()}
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

      <ConfirmationModal
        confirmButtonText={t`Cancelar actualización`}
        loading={isCancelling}
        modalInstanceId={CANCEL_CONFIRMATION_MODAL_ID}
        onConfirmClick={() => {
          void handleCancel();
        }}
        subtitle={t`¿Confirmas cancelar la actualización activa? Se conservará la evidencia registrada.`}
        title={t`Cancelar actualización`}
      />
    </>
  );
};
