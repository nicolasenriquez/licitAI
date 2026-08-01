import { tokenPairState } from '@/auth/states/tokenPairState';
import { useMercadoPublicoApiCallLog } from '@/mercado-publico/hooks/useMercadoPublicoApiCallLog';
import { useMercadoPublicoApiQuotaUsage } from '@/mercado-publico/hooks/useMercadoPublicoApiQuotaUsage';
import { useMercadoPublicoCsvFileHealth } from '@/mercado-publico/hooks/useMercadoPublicoCsvFileHealth';
import { useMercadoPublicoJobRuns } from '@/mercado-publico/hooks/useMercadoPublicoJobRuns';
import { useMercadoPublicoPipelineHealth } from '@/mercado-publico/hooks/useMercadoPublicoPipelineHealth';
import { downloadMercadoPublicoRawCsvFile } from '@/mercado-publico/utils/downloadMercadoPublicoRawCsvFile';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type MercadoPublicoJobRunStatus } from '~/generated/graphql';
import {
  getMercadoPublicoStatusLabel,
  useMercadoPublicoDisplay,
} from '@/mercado-publico/utils/mercadoPublicoDisplay';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Fragment, useState } from 'react';
import { Tag } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type InvestigationView = 'api-calls' | 'job-runs';

const INVESTIGATION_LIMIT = 25;
const sensitiveParameterPattern =
  /authorization|cookie|password|secret|ticket|token/i;

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
  padding: ${themeCssVariables.spacing[4]};

  @media (prefers-reduced-motion: reduce) {
    &,
    & * {
      animation-duration: 0.01ms;
      animation-iteration-count: 1;
      scroll-behavior: auto;
      transition-duration: 0.01ms;
    }
  }
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledTableWrap = styled.div`
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 700px;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.medium};
    overflow-wrap: anywhere;
    padding: ${themeCssVariables.spacing[2]};
    text-align: left;
    vertical-align: top;
  }
`;

const StyledExpandableRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledRowToggle = styled.button`
  appearance: none;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-align: left;

  &:focus-visible {
    border-radius: ${themeCssVariables.border.radius.sm};
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledInvestigationControls = styled.div`
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledControl = styled.label`
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledSupportingText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
`;

const StyledQuotaList = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};

  > div {
    display: grid;
    gap: ${themeCssVariables.spacing[1]};
  }

  progress {
    max-width: 320px;
    width: 100%;
  }
`;

const StyledPagination = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledFeedback = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSkeleton = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: ${themeCssVariables.spacing[10]};
`;

const StyledSkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const toRedactedRequestParameters = (value: unknown): string => {
  const redact = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(redact);
    if (typeof item !== 'object' || item === null) return item;

    return Object.fromEntries(
      Object.entries(item).map(([key, nestedValue]) => [
        key,
        sensitiveParameterPattern.test(key)
          ? '[REDACTED]'
          : redact(nestedValue),
      ]),
    );
  };

  try {
    return JSON.stringify(redact(value));
  } catch {
    return t`No disponible`;
  }
};

export const MercadoPublicoControlCenterTab = () => {
  const tokenPair = useAtomStateValue(tokenPairState);
  const { enqueueErrorSnackBar } = useSnackBar();
  const { formatCount, formatDate, formatDuration } =
    useMercadoPublicoDisplay();
  const [investigationView, setInvestigationView] =
    useState<InvestigationView>('job-runs');
  const [jobRunsOffset, setJobRunsOffset] = useState(0);
  const [apiCallLogOffset, setApiCallLogOffset] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [jobName, setJobName] = useState('');
  const [jobStatus, setJobStatus] = useState<MercadoPublicoJobRunStatus | ''>(
    '',
  );
  const [apiSource, setApiSource] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiHttpStatus, setApiHttpStatus] = useState('');
  const pipelineHealth = useMercadoPublicoPipelineHealth();
  const apiQuotaUsage = useMercadoPublicoApiQuotaUsage();
  const csvFileHealth = useMercadoPublicoCsvFileHealth();
  const isJobRuns = investigationView === 'job-runs';
  const jobRuns = useMercadoPublicoJobRuns(
    {
      limit: INVESTIGATION_LIMIT,
      offset: jobRunsOffset,
      jobName: jobName.trim() || undefined,
      statuses: jobStatus === '' ? undefined : [jobStatus],
    },
    { skip: !isJobRuns },
  );
  const apiCallLog = useMercadoPublicoApiCallLog(
    {
      endpoint: apiEndpoint || undefined,
      httpStatus: apiHttpStatus ? Number(apiHttpStatus) : undefined,
      limit: INVESTIGATION_LIMIT,
      offset: apiCallLogOffset,
      source: apiSource || undefined,
    },
    { skip: isJobRuns },
  );
  const activeLog = isJobRuns ? jobRuns.jobRuns : apiCallLog.callLog;
  const activeLoading = isJobRuns ? jobRuns.loading : apiCallLog.loading;
  const activeError = isJobRuns ? jobRuns.error : apiCallLog.error;
  const refetchActiveLog = isJobRuns ? jobRuns.refetch : apiCallLog.refetch;

  const handleDownloadRawCsvFile = async (rawCsvFileId: string) => {
    const accessToken = tokenPair?.accessOrWorkspaceAgnosticToken?.token;

    if (!accessToken) {
      enqueueErrorSnackBar({
        message: t`No se pudo descargar el archivo CSV`,
      });

      return;
    }

    try {
      await downloadMercadoPublicoRawCsvFile(rawCsvFileId, accessToken);
    } catch {
      enqueueErrorSnackBar({
        message: t`No se pudo descargar el archivo CSV`,
      });
    }
  };

  const pipelineJobs = pipelineHealth.pipelineHealth?.jobs
    ? [...pipelineHealth.pipelineHealth.jobs].sort((leftJob, rightJob) => {
        const getPriority = (job: typeof leftJob) => {
          const status = job.latestStatus?.toLowerCase();
          const freshness = job.freshness?.toLowerCase();

          if (
            ['partial', 'failed', 'param_error', 'retryable_failed'].includes(
              status ?? '',
            ) ||
            ['degraded', 'stale'].includes(freshness ?? '')
          ) {
            return 0;
          }

          if (status === 'success' || status === 'completed') {
            return 2;
          }

          return 1;
        };

        return getPriority(leftJob) - getPriority(rightJob);
      })
    : undefined;

  const toggleExpandedRow = (rowId: string) => {
    setExpandedRowId((currentRowId) => (currentRowId === rowId ? null : rowId));
  };

  const selectInvestigationView = (view: InvestigationView) => {
    setInvestigationView(view);
    setExpandedRowId(null);
  };

  return (
    <StyledContainer>
      <StyledSection aria-labelledby="mercado-publico-diagnostico">
        <h2 id="mercado-publico-diagnostico">{t`Diagnóstico`}</h2>
        {pipelineHealth.error ? (
          <StyledFeedback role="alert">
            <span>
              {pipelineHealth.pipelineHealth
                ? t`No pudimos actualizar esta sección.`
                : t`No pudimos cargar esta sección.`}
            </span>
            <Button
              onClick={() => pipelineHealth.refetch()}
              size="small"
              title={t`Reintentar`}
              variant="secondary"
            />
          </StyledFeedback>
        ) : null}
        {pipelineHealth.isInitialLoading && !pipelineHealth.pipelineHealth ? (
          <StyledSkeletonList aria-hidden="true">
            <StyledSkeleton />
            <StyledSkeleton />
          </StyledSkeletonList>
        ) : null}
        {pipelineHealth.pipelineHealth ? (
          <StyledTableWrap
            aria-label={t`Salud del pipeline`}
            aria-busy={pipelineHealth.loading}
            role="region"
            tabIndex={0}
          >
            <StyledTable>
              <thead>
                <tr>
                  <th>{t`Job`}</th>
                  <th>{t`Estado`}</th>
                  <th>{t`Último éxito`}</th>
                  <th>{t`Último fallo`}</th>
                  <th>{t`Lag`}</th>
                  <th>{t`Fallos`}</th>
                </tr>
              </thead>
              <tbody>
                {pipelineJobs?.map((job) => (
                  <tr key={job.jobName}>
                    <td>{job.jobName}</td>
                    <td>
                      <Tag
                        color="gray"
                        text={getMercadoPublicoStatusLabel(job.latestStatus)}
                      />
                    </td>
                    <td>{formatDate(job.lastSuccessAt)}</td>
                    <td>{formatDate(job.lastFailureAt)}</td>
                    <td>{formatDuration(job.lagSinceLastSuccessMs)}</td>
                    <td>{formatCount(job.failureCount)}</td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledTableWrap>
        ) : null}
        {!pipelineHealth.isInitialLoading &&
        !pipelineHealth.error &&
        pipelineHealth.pipelineHealth?.jobs?.length === 0 ? (
          <p aria-live="polite">{t`Aún no hay ejecuciones registradas. Los datos aparecerán después de la primera ingesta por CLI.`}</p>
        ) : null}
        <h3>{t`Cuota API`}</h3>
        {apiQuotaUsage.error ? (
          <StyledFeedback role="alert">
            <span>
              {apiQuotaUsage.apiQuotaUsage
                ? t`No pudimos actualizar esta sección.`
                : t`No pudimos cargar esta sección.`}
            </span>
            <Button
              onClick={() => apiQuotaUsage.refetch()}
              size="small"
              title={t`Reintentar`}
              variant="secondary"
            />
          </StyledFeedback>
        ) : null}
        {apiQuotaUsage.isInitialLoading && !apiQuotaUsage.apiQuotaUsage ? (
          <StyledSkeletonList aria-hidden="true">
            <StyledSkeleton />
          </StyledSkeletonList>
        ) : null}
        <StyledQuotaList aria-busy={apiQuotaUsage.loading}>
          {apiQuotaUsage.apiQuotaUsage?.sources?.map((source) => (
            <div key={source.source}>
              <strong>{source.source}</strong> {formatCount(source.used)} /{' '}
              {formatCount(source.dailyLimit)}
              {source.dailyLimit > 0 ? (
                <progress
                  aria-label={t`Uso de cuota de ${source.source}`}
                  max={source.dailyLimit}
                  value={Math.min(source.used, source.dailyLimit)}
                />
              ) : null}
              <span>
                {' '}
                {t`Restante`}:{' '}
                {formatCount(Math.max(0, source.dailyLimit - source.used))} ·{' '}
                {source.resetAt
                  ? t`Reinicio: ${formatDate(source.resetAt)}`
                  : t`No configurado`}{' '}
                ·{' '}
                {source.last429At
                  ? t`Último 429: ${formatDate(source.last429At)}`
                  : t`Sin errores 429`}
              </span>
            </div>
          ))}
          {apiQuotaUsage.apiQuotaUsage?.sources?.length ? (
            <StyledSupportingText>
              {t`Restante = máximo entre 0 y límite diario menos uso. Cada fuente conserva su propio límite.`}
            </StyledSupportingText>
          ) : null}
        </StyledQuotaList>
        {!apiQuotaUsage.isInitialLoading &&
        !apiQuotaUsage.error &&
        apiQuotaUsage.apiQuotaUsage?.sources?.length === 0 ? (
          <p aria-live="polite">{t`No configurado`}</p>
        ) : null}
      </StyledSection>

      <StyledSection aria-labelledby="mercado-publico-investigacion">
        <h2 id="mercado-publico-investigacion">{t`Investigación`}</h2>
        <StyledSupportingText>
          {t`Resultados paginados. El origen informa si hay más resultados, no un total global.`}
        </StyledSupportingText>
        <div>
          <Button
            ariaLabel={t`Ejecuciones`}
            onClick={() => selectInvestigationView('job-runs')}
            size="small"
            title={t`Ejecuciones`}
            variant={isJobRuns ? 'primary' : 'secondary'}
          />
          <Button
            ariaLabel={t`Llamadas API`}
            onClick={() => selectInvestigationView('api-calls')}
            size="small"
            title={t`Llamadas API`}
            variant={!isJobRuns ? 'primary' : 'secondary'}
          />
        </div>
        {isJobRuns ? (
          <StyledInvestigationControls>
            <StyledControl htmlFor="mercado-publico-job-name">
              {t`Trabajo`}
              <StyledInput
                id="mercado-publico-job-name"
                onChange={(event) => {
                  setJobName(event.target.value);
                  setJobRunsOffset(0);
                }}
                value={jobName}
              />
            </StyledControl>
            <StyledControl htmlFor="mercado-publico-job-status">
              {t`Estado`}
              <StyledSelect
                id="mercado-publico-job-status"
                onChange={(event) => {
                  setJobStatus(
                    event.target.value as MercadoPublicoJobRunStatus | '',
                  );
                  setJobRunsOffset(0);
                }}
                value={jobStatus}
              >
                <option value="">{t`Todos`}</option>
                <option value="success">{t`Correcta`}</option>
                <option value="partial">{t`Parcial`}</option>
                <option value="failed">{t`Fallida`}</option>
                <option value="soft_miss">{t`Sin resultados`}</option>
                <option value="param_error">{t`Parámetros inválidos`}</option>
                <option value="retryable_failed">{t`Reintentable`}</option>
                <option value="skipped">{t`Omitida`}</option>
              </StyledSelect>
            </StyledControl>
          </StyledInvestigationControls>
        ) : (
          <StyledInvestigationControls>
            <StyledControl htmlFor="mercado-publico-api-source">
              {t`Fuente`}
              <StyledInput
                id="mercado-publico-api-source"
                onChange={(event) => {
                  setApiSource(event.target.value);
                  setApiCallLogOffset(0);
                }}
                value={apiSource}
              />
            </StyledControl>
            <StyledControl htmlFor="mercado-publico-api-endpoint">
              {t`Endpoint`}
              <StyledInput
                id="mercado-publico-api-endpoint"
                onChange={(event) => {
                  setApiEndpoint(event.target.value);
                  setApiCallLogOffset(0);
                }}
                value={apiEndpoint}
              />
            </StyledControl>
            <StyledControl htmlFor="mercado-publico-api-http-status">
              {t`HTTP`}
              <StyledInput
                id="mercado-publico-api-http-status"
                min="100"
                max="599"
                onChange={(event) => {
                  setApiHttpStatus(event.target.value);
                  setApiCallLogOffset(0);
                }}
                type="number"
                value={apiHttpStatus}
              />
            </StyledControl>
          </StyledInvestigationControls>
        )}
        {activeError ? (
          <StyledFeedback role="alert">
            <span>
              {activeLog
                ? t`No pudimos actualizar esta sección.`
                : t`No pudimos cargar esta sección.`}
            </span>
            <Button
              onClick={() => refetchActiveLog()}
              size="small"
              title={t`Reintentar`}
              variant="secondary"
            />
          </StyledFeedback>
        ) : null}
        {activeLoading && !activeLog ? (
          <StyledSkeletonList aria-hidden="true">
            <StyledSkeleton />
            <StyledSkeleton />
          </StyledSkeletonList>
        ) : null}
        {activeLog ? (
          <StyledTableWrap
            aria-label={isJobRuns ? t`Ejecuciones` : t`Llamadas API`}
            aria-busy={activeLoading}
            role="region"
            tabIndex={0}
          >
            {isJobRuns ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>{t`Job`}</th>
                    <th>{t`Estado`}</th>
                    <th>{t`Inicio`}</th>
                    <th>{t`Fin`}</th>
                    <th>{t`Obtenidos`}</th>
                    <th>{t`Error`}</th>
                  </tr>
                </thead>
                <tbody>
                  {jobRuns.jobRuns?.items?.map((run) => (
                    <Fragment key={run.id}>
                      <StyledExpandableRow
                        onClick={() => toggleExpandedRow(run.id)}
                      >
                        <td>
                          <StyledRowToggle
                            aria-controls={`${run.id}-details`}
                            aria-expanded={expandedRowId === run.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpandedRow(run.id);
                            }}
                            type="button"
                          >
                            {run.jobName}
                          </StyledRowToggle>
                        </td>
                        <td>
                          <Tag
                            color="gray"
                            text={getMercadoPublicoStatusLabel(run.status)}
                          />
                        </td>
                        <td>{formatDate(run.startedAt)}</td>
                        <td>{formatDate(run.finishedAt)}</td>
                        <td>{formatCount(run.recordsFetched)}</td>
                        <td>{run.errorSummary ?? t`No informado`}</td>
                      </StyledExpandableRow>
                      <tr
                        hidden={expandedRowId !== run.id}
                        id={`${run.id}-details`}
                      >
                        <td colSpan={6}>
                          {t`Ejecución`}: {run.jobRunId} · {t`Canonizados`}:{' '}
                          {formatCount(run.recordsCanonicalized)} ·{' '}
                          {t`Fallidos`}: {formatCount(run.recordsFailed)} ·{' '}
                          {run.rawCsvFileId ? (
                            <Button
                              ariaLabel={t`Descargar CSV`}
                              onClick={() =>
                                void handleDownloadRawCsvFile(run.rawCsvFileId!)
                              }
                              size="small"
                              title={t`Descargar CSV`}
                              variant="secondary"
                            />
                          ) : (
                            t`Sin archivo CSV`
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>{t`Fuente`}</th>
                    <th>{t`Endpoint`}</th>
                    <th>{t`HTTP`}</th>
                    <th>{t`Fecha`}</th>
                    <th>{t`Registros`}</th>
                  </tr>
                </thead>
                <tbody>
                  {apiCallLog.callLog?.items?.map((call) => (
                    <Fragment key={call.id}>
                      <StyledExpandableRow
                        onClick={() => toggleExpandedRow(call.id)}
                      >
                        <td>
                          <StyledRowToggle
                            aria-controls={`${call.id}-details`}
                            aria-expanded={expandedRowId === call.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpandedRow(call.id);
                            }}
                            type="button"
                          >
                            {call.source}
                          </StyledRowToggle>
                        </td>
                        <td>{call.endpoint}</td>
                        <td>{formatCount(call.httpStatus)}</td>
                        <td>{formatDate(call.fetchedAt)}</td>
                        <td>{formatCount(call.recordsFetched)}</td>
                      </StyledExpandableRow>
                      <tr
                        hidden={expandedRowId !== call.id}
                        id={`${call.id}-details`}
                      >
                        <td colSpan={5}>
                          {t`Parámetros`}:{' '}
                          {toRedactedRequestParameters(call.requestParams)} ·{' '}
                          {call.errorSummary ?? t`Sin error`}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </StyledTable>
            )}
          </StyledTableWrap>
        ) : null}
        {!activeLoading && !activeError && activeLog?.items?.length === 0 ? (
          <p aria-live="polite">
            {isJobRuns
              ? t`Aún no hay ejecuciones registradas. Los datos aparecerán después de la primera ingesta por CLI.`
              : t`Sin resultados.`}
          </p>
        ) : null}
        <StyledPagination>
          <Button
            disabled={
              (isJobRuns ? jobRunsOffset : apiCallLogOffset) === 0 ||
              activeLoading
            }
            onClick={() =>
              isJobRuns
                ? setJobRunsOffset((currentOffset) =>
                    Math.max(0, currentOffset - INVESTIGATION_LIMIT),
                  )
                : setApiCallLogOffset((currentOffset) =>
                    Math.max(0, currentOffset - INVESTIGATION_LIMIT),
                  )
            }
            size="small"
            title={t`Anterior`}
            variant="secondary"
          />
          <span>
            {t`Página`}{' '}
            {formatCount(
              Math.floor(
                (isJobRuns ? jobRunsOffset : apiCallLogOffset) /
                  INVESTIGATION_LIMIT,
              ) + 1,
            )}{' '}
            · {t`Sin total global`}
          </span>
          <Button
            disabled={!activeLog?.hasMore || activeLoading}
            onClick={() =>
              isJobRuns
                ? setJobRunsOffset(
                    (currentOffset) => currentOffset + INVESTIGATION_LIMIT,
                  )
                : setApiCallLogOffset(
                    (currentOffset) => currentOffset + INVESTIGATION_LIMIT,
                  )
            }
            size="small"
            title={t`Siguiente`}
            variant="secondary"
          />
        </StyledPagination>
      </StyledSection>

      <StyledSection aria-labelledby="mercado-publico-integridad">
        <h2 id="mercado-publico-integridad">{t`Integridad de fuentes`}</h2>
        {csvFileHealth.error ? (
          <StyledFeedback role="alert">
            <span>
              {csvFileHealth.csvFileHealth
                ? t`No pudimos actualizar esta sección.`
                : t`No pudimos cargar esta sección.`}
            </span>
            <Button
              onClick={() => csvFileHealth.refetch()}
              size="small"
              title={t`Reintentar`}
              variant="secondary"
            />
          </StyledFeedback>
        ) : null}
        {csvFileHealth.isInitialLoading && !csvFileHealth.csvFileHealth ? (
          <StyledSkeletonList aria-hidden="true">
            <StyledSkeleton />
            <StyledSkeleton />
          </StyledSkeletonList>
        ) : null}
        {csvFileHealth.csvFileHealth ? (
          <StyledTableWrap
            aria-label={t`Salud de archivos CSV`}
            aria-busy={csvFileHealth.loading}
            role="region"
            tabIndex={0}
          >
            <StyledTable>
              <thead>
                <tr>
                  <th>{t`Dataset`}</th>
                  <th>{t`Archivo`}</th>
                  <th>{t`Filas`}</th>
                  <th>{t`Parseadas`}</th>
                  <th>{t`Errores`}</th>
                  <th>{t`Carga`}</th>
                </tr>
              </thead>
              <tbody>
                {csvFileHealth.csvFileHealth?.files?.map((file) => (
                  <tr key={`${file.sourceDataset}-${file.sourceFileName}`}>
                    <td>{file.sourceDataset}</td>
                    <td>{file.sourceFileName}</td>
                    <td>{formatCount(file.rowCount)}</td>
                    <td>{formatCount(file.parseSuccessCount)}</td>
                    <td>{formatCount(file.parseErrorCount)}</td>
                    <td>{formatDate(file.lastLoadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledTableWrap>
        ) : null}
        {!csvFileHealth.isInitialLoading &&
        !csvFileHealth.error &&
        csvFileHealth.csvFileHealth?.files?.length === 0 ? (
          <p aria-live="polite">{t`Sin información`}</p>
        ) : null}
      </StyledSection>
    </StyledContainer>
  );
};
