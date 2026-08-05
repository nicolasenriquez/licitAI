import { useMercadoPublicoCompraAgilAnalytics } from '@/mercado-publico/hooks/useMercadoPublicoCompraAgilAnalytics';
import { useMercadoPublicoDetectedProcesses } from '@/mercado-publico/hooks/useMercadoPublicoDetectedProcesses';
import { useOpenMercadoPublicoProcessInSidePanel } from '@/mercado-publico/hooks/useOpenMercadoPublicoProcessInSidePanel';
import { useMercadoPublicoDisplay } from '@/mercado-publico/utils/mercadoPublicoDisplay';
import { GraphWidgetBarChart } from '@/page-layout/widgets/graph/graph-widget-bar-chart/components/GraphWidgetBarChart';
import { GraphWidgetLineChart } from '@/page-layout/widgets/graph/graph-widget-line-chart/components/GraphWidgetLineChart';
import { PageLayoutComponentInstanceContext } from '@/page-layout/states/contexts/PageLayoutComponentInstanceContext';
import { WidgetComponentInstanceContext } from '@/page-layout/widgets/states/contexts/WidgetComponentInstanceContext';
import { useListenToSidePanelClosing } from '@/ui/layout/side-panel/hooks/useListenToSidePanelClosing';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type FormEvent, type ReactNode, useCallback, useState } from 'react';
import {
  MercadoPublicoCompraAgilCallStage,
  MercadoPublicoDetectedProcessSortDirection,
  MercadoPublicoDetectedProcessSortKey,
  MercadoPublicoDetectedProcessType,
} from '~/generated/graphql';
import { Button } from 'twenty-ui/input';
import { AnimatedExpandableContainer } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type CompraAgilFilterDraft = {
  amountMax: string;
  amountMin: string;
  buyerRut: string;
  callStage: '' | MercadoPublicoCompraAgilCallStage;
  closingFrom: string;
  closingTo: string;
  hasDocuments: '' | 'false' | 'true';
  regionName: string;
  search: string;
};

const EMPTY_FILTERS: CompraAgilFilterDraft = {
  amountMax: '',
  amountMin: '',
  buyerRut: '',
  callStage: '',
  closingFrom: '',
  closingTo: '',
  hasDocuments: '',
  regionName: '',
  search: '',
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
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

const StyledFilterForm = styled.form`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledControl = styled.label`
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const controlStyles = `
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  min-height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledInput = styled.input`
  ${controlStyles}
`;

const StyledSelect = styled.select`
  ${controlStyles}
`;

const StyledFilterActions = styled.div`
  align-items: end;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledKpiGrid = styled.section`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StyledKpi = styled.article`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledKpiLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledKpiValue = styled.strong`
  font-size: ${themeCssVariables.font.size.xl};
  overflow-wrap: anywhere;
`;

const StyledCoverage = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledChartGrid = styled.section`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledChartCard = styled.article`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledChartHeading = styled.h2`
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
`;

const StyledChart = styled.div`
  height: 240px;
  min-width: 0;
  width: 100%;
`;

const StyledDisclosureButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
  width: fit-content;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledTableWrap = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
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
  min-width: 760px;
  width: 100%;

  th {
    background: ${themeCssVariables.background.secondary};
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.medium};
    text-align: left;
  }

  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    padding: ${themeCssVariables.spacing[2]};
    vertical-align: middle;
  }
`;

const StyledSelectedRow = styled.tr<{ isSelected: boolean }>`
  background: ${({ isSelected }) =>
    isSelected ? themeCssVariables.accent.quaternary : 'transparent'};
`;

const StyledTitleButton = styled(Button)`
  justify-content: flex-start;
  max-width: 100%;
`;

const StyledState = styled.p`
  margin: 0;
`;

const StyledAlert = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSkeletonGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const StyledSkeleton = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.md};
  height: 160px;
`;

const StyledPagination = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const ChartCard = ({
  caption,
  children,
  testId,
  title,
}: {
  caption: string;
  children: ReactNode;
  testId: string;
  title: string;
}) => (
  <StyledChartCard data-testid={testId}>
    <StyledChartHeading>{title}</StyledChartHeading>
    <StyledCoverage>{caption}</StyledCoverage>
    <StyledChart>
      <PageLayoutComponentInstanceContext.Provider
        value={{ instanceId: 'mercado-publico-compra-agil' }}
      >
        <WidgetComponentInstanceContext.Provider value={{ instanceId: testId }}>
          {children}
        </WidgetComponentInstanceContext.Provider>
      </PageLayoutComponentInstanceContext.Provider>
    </StyledChart>
  </StyledChartCard>
);

const getAmountBandLabel = (band: string) => {
  switch (band) {
    case 'under_100k':
      return t`Menos de $100 mil`;
    case '100k_to_500k':
      return t`$100 mil–$500 mil`;
    case '500k_to_1m':
      return t`$500 mil–$1 millón`;
    case '1m_to_3m':
      return t`$1–$3 millones`;
    case 'over_3m':
      return t`Más de $3 millones`;
    default:
      return band;
  }
};

const hasPositiveCount = (data: Array<{ count: number }>) =>
  data.some(({ count }) => count > 0);

export const MercadoPublicoCompraAgilTab = () => {
  const { formatAmount, formatCount, formatDate } = useMercadoPublicoDisplay();
  const { openMercadoPublicoProcessInSidePanel } =
    useOpenMercadoPublicoProcessInSidePanel();
  const [draftFilters, setDraftFilters] =
    useState<CompraAgilFilterDraft>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<CompraAgilFilterDraft>(EMPTY_FILTERS);
  const [filterError, setFilterError] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(
    MercadoPublicoDetectedProcessSortKey.lastSeenAt,
  );
  const [sortDirection, setSortDirection] = useState(
    MercadoPublicoDetectedProcessSortDirection.desc,
  );
  const [isMoreAnalyticsOpen, setIsMoreAnalyticsOpen] = useState(false);
  const [selectedProcessCode, setSelectedProcessCode] = useState<string | null>(
    null,
  );
  const [originElement, setOriginElement] = useState<HTMLButtonElement | null>(
    null,
  );

  const businessFilters = {
    amountMax: filters.amountMax ? Number(filters.amountMax) : undefined,
    amountMin: filters.amountMin ? Number(filters.amountMin) : undefined,
    buyerRut: filters.buyerRut || undefined,
    callStages: filters.callStage ? [filters.callStage] : undefined,
    closingFrom: filters.closingFrom || undefined,
    closingTo: filters.closingTo || undefined,
    hasDocuments:
      filters.hasDocuments === '' ? undefined : filters.hasDocuments === 'true',
    regionName: filters.regionName || undefined,
    search: filters.search || undefined,
  };

  const {
    processes,
    isInitialLoading: isListLoading,
    isRefetching: isListRefetching,
    error: listError,
    refetch: refetchList,
  } = useMercadoPublicoDetectedProcesses({
    ...businessFilters,
    limit: 25,
    page,
    processTypes: [MercadoPublicoDetectedProcessType.compra_agil],
    sort: { key: sortKey, direction: sortDirection },
    states: [],
  });
  const {
    analytics,
    isInitialLoading: isAnalyticsLoading,
    isRefetching: isAnalyticsRefetching,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useMercadoPublicoCompraAgilAnalytics(businessFilters);

  const restoreOriginFocus = useCallback(() => {
    if (originElement?.isConnected && !originElement.closest('[hidden]')) {
      originElement.focus();
    }
    setOriginElement(null);
  }, [originElement]);

  useListenToSidePanelClosing(restoreOriginFocus);

  const updateDraftFilter = <Key extends keyof CompraAgilFilterDraft>(
    key: Key,
    value: CompraAgilFilterDraft[Key],
  ) => setDraftFilters((current) => ({ ...current, [key]: value }));

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      draftFilters.closingFrom &&
      draftFilters.closingTo &&
      draftFilters.closingFrom > draftFilters.closingTo
    ) {
      setFilterError(t`La fecha inicial debe ser anterior o igual a la final.`);
      return;
    }

    if (
      draftFilters.amountMin &&
      draftFilters.amountMax &&
      Number(draftFilters.amountMin) > Number(draftFilters.amountMax)
    ) {
      setFilterError(t`El monto mínimo debe ser menor o igual al máximo.`);
      return;
    }

    setFilterError('');
    setFilters({
      ...draftFilters,
      buyerRut: draftFilters.buyerRut.trim(),
      regionName: draftFilters.regionName.trim(),
      search: draftFilters.search.trim(),
    });
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFilterError('');
    setPage(1);
  };

  const population = analytics?.metadata.filteredPopulation ?? 0;
  const coverage = analytics?.metadata.coverage;
  const total = processes?.total;
  const limit = processes?.limit ?? 25;
  const currentPage = processes?.page ?? page;
  const firstItem = total ? (currentPage - 1) * limit + 1 : null;
  const lastItem =
    total === undefined ? null : Math.min(currentPage * limit, total);
  const hasFilters = Object.values(filters).some(Boolean);

  const closingData = analytics?.closingByDay ?? [];
  const regionData = analytics?.regions ?? [];
  const buyerData = analytics?.topBuyers ?? [];
  const amountData = analytics?.amountBands ?? [];
  const callStageData = analytics?.callStages ?? [];
  const documentData = analytics?.documentAvailability ?? [];

  return (
    <StyledContainer aria-busy={isListRefetching || isAnalyticsRefetching}>
      <StyledFilterForm onSubmit={applyFilters}>
        <StyledControl htmlFor="compra-agil-search">
          {t`Buscar oportunidad`}
          <StyledInput
            id="compra-agil-search"
            onChange={(event) =>
              updateDraftFilter('search', event.target.value)
            }
            placeholder={t`Código, título, institución o unidad`}
            value={draftFilters.search}
          />
        </StyledControl>
        <StyledControl htmlFor="compra-agil-region">
          {t`Región`}
          <StyledInput
            id="compra-agil-region"
            onChange={(event) =>
              updateDraftFilter('regionName', event.target.value)
            }
            value={draftFilters.regionName}
          />
        </StyledControl>
        <StyledControl htmlFor="compra-agil-closing-from">
          {t`Cierre desde`}
          <StyledInput
            id="compra-agil-closing-from"
            onChange={(event) =>
              updateDraftFilter('closingFrom', event.target.value)
            }
            type="date"
            value={draftFilters.closingFrom}
          />
        </StyledControl>
        <StyledControl htmlFor="compra-agil-closing-to">
          {t`Cierre hasta`}
          <StyledInput
            id="compra-agil-closing-to"
            onChange={(event) =>
              updateDraftFilter('closingTo', event.target.value)
            }
            type="date"
            value={draftFilters.closingTo}
          />
        </StyledControl>
        <StyledControl htmlFor="compra-agil-documents">
          {t`Antecedentes`}
          <StyledSelect
            id="compra-agil-documents"
            onChange={(event) =>
              updateDraftFilter(
                'hasDocuments',
                event.target.value as CompraAgilFilterDraft['hasDocuments'],
              )
            }
            value={draftFilters.hasDocuments}
          >
            <option value="">{t`Todos`}</option>
            <option value="true">{t`Con documentos`}</option>
            <option value="false">{t`Sin documentos`}</option>
          </StyledSelect>
        </StyledControl>
        <StyledControl htmlFor="compra-agil-call-stage">
          {t`Convocatoria`}
          <StyledSelect
            id="compra-agil-call-stage"
            onChange={(event) =>
              updateDraftFilter(
                'callStage',
                event.target.value as CompraAgilFilterDraft['callStage'],
              )
            }
            value={draftFilters.callStage}
          >
            <option value="">{t`Todas`}</option>
            <option value={MercadoPublicoCompraAgilCallStage.first_call}>
              {t`Primer llamado`}
            </option>
            <option value={MercadoPublicoCompraAgilCallStage.second_call}>
              {t`Segundo llamado`}
            </option>
          </StyledSelect>
        </StyledControl>
        <StyledControl htmlFor="compra-agil-amount-min">
          {t`Monto mínimo`}
          <StyledInput
            id="compra-agil-amount-min"
            min="0"
            onChange={(event) =>
              updateDraftFilter('amountMin', event.target.value)
            }
            type="number"
            value={draftFilters.amountMin}
          />
        </StyledControl>
        <StyledControl htmlFor="compra-agil-amount-max">
          {t`Monto máximo`}
          <StyledInput
            id="compra-agil-amount-max"
            min="0"
            onChange={(event) =>
              updateDraftFilter('amountMax', event.target.value)
            }
            type="number"
            value={draftFilters.amountMax}
          />
        </StyledControl>
        <StyledControl htmlFor="compra-agil-buyer-rut">
          {t`RUT de institución`}
          <StyledInput
            id="compra-agil-buyer-rut"
            onChange={(event) =>
              updateDraftFilter('buyerRut', event.target.value)
            }
            value={draftFilters.buyerRut}
          />
        </StyledControl>
        <StyledControl htmlFor="compra-agil-sort">
          {t`Orden`}
          <StyledSelect
            id="compra-agil-sort"
            onChange={(event) => {
              const [nextSortKey, nextSortDirection] =
                event.target.value.split(':');
              setSortKey(nextSortKey as MercadoPublicoDetectedProcessSortKey);
              setSortDirection(
                nextSortDirection as MercadoPublicoDetectedProcessSortDirection,
              );
              setPage(1);
            }}
            value={`${sortKey}:${sortDirection}`}
          >
            <option value="lastSeenAt:desc">{t`Más recientes`}</option>
            <option value="closingAt:asc">{t`Cierre más próximo`}</option>
            <option value="amountAvailableClp:desc">{t`Mayor monto`}</option>
            <option value="amountAvailableClp:asc">{t`Menor monto`}</option>
          </StyledSelect>
        </StyledControl>
        <StyledFilterActions>
          <Button
            size="small"
            title={t`Aplicar filtros`}
            type="submit"
            variant="primary"
          />
          <Button
            onClick={clearFilters}
            size="small"
            title={t`Limpiar filtros`}
            type="button"
            variant="secondary"
          />
        </StyledFilterActions>
      </StyledFilterForm>
      {filterError ? (
        <StyledState role="alert">{filterError}</StyledState>
      ) : null}
      {listError || analyticsError ? (
        <StyledAlert role="alert">
          <span>
            {processes || analytics
              ? t`No pudimos actualizar todos los resultados.`
              : t`No pudimos cargar las oportunidades.`}
          </span>
          <Button
            onClick={() => {
              refetchList();
              refetchAnalytics();
            }}
            size="small"
            title={t`Reintentar`}
            variant="secondary"
          />
        </StyledAlert>
      ) : null}
      {isListRefetching || isAnalyticsRefetching ? (
        <StyledState aria-live="polite">{t`Actualizando…`}</StyledState>
      ) : null}
      {(isListLoading && !processes) || (isAnalyticsLoading && !analytics) ? (
        <StyledSkeletonGrid aria-label={t`Cargando oportunidades`}>
          <StyledSkeleton />
          <StyledSkeleton />
          <StyledSkeleton />
          <StyledSkeleton />
        </StyledSkeletonGrid>
      ) : null}
      {analytics ? (
        <>
          <StyledKpiGrid aria-label={t`Resumen de Compra Ágil`}>
            <StyledKpi data-testid="compra-agil-kpi-total">
              <StyledKpiLabel>{t`Resultados`}</StyledKpiLabel>
              <StyledKpiValue>
                {formatCount(analytics.summary.totalFound)}
              </StyledKpiValue>
              <StyledCoverage>{t`Población filtrada completa`}</StyledCoverage>
            </StyledKpi>
            <StyledKpi data-testid="compra-agil-kpi-closing">
              <StyledKpiLabel>{t`Cierran en 24 horas`}</StyledKpiLabel>
              <StyledKpiValue>
                {formatCount(analytics.summary.closingNext24Hours)}
              </StyledKpiValue>
              <StyledCoverage>
                {t`${formatCount(coverage?.closingAt)} de ${formatCount(population)} resultados disponibles`}
              </StyledCoverage>
            </StyledKpi>
            <StyledKpi data-testid="compra-agil-kpi-amount">
              <StyledKpiLabel>{t`Monto disponible`}</StyledKpiLabel>
              <StyledKpiValue>
                {formatAmount(analytics.summary.knownAmountAvailableClp)}
              </StyledKpiValue>
              <StyledCoverage>
                {t`Informado en ${formatCount(coverage?.amountAvailableClp)} de ${formatCount(population)} resultados`}
              </StyledCoverage>
            </StyledKpi>
            <StyledKpi data-testid="compra-agil-kpi-documents">
              <StyledKpiLabel>{t`Con documentos`}</StyledKpiLabel>
              <StyledKpiValue>
                {formatCount(analytics.summary.positiveDocumentCount)}
              </StyledKpiValue>
              <StyledCoverage>
                {t`${formatCount(coverage?.documentCount)} de ${formatCount(population)} resultados disponibles`}
              </StyledCoverage>
            </StyledKpi>
          </StyledKpiGrid>
          <StyledChartGrid>
            <ChartCard
              caption={t`${formatCount(coverage?.closingAt)} de ${formatCount(population)} resultados disponibles`}
              testId="compra-agil-chart-closing"
              title={t`Cierres próximos`}
            >
              <GraphWidgetLineChart
                colorMode="automaticPalette"
                data={
                  hasPositiveCount(closingData)
                    ? [
                        {
                          key: 'closing',
                          label: t`Oportunidades`,
                          data: closingData.map((bucket) => ({
                            x: bucket.date,
                            y: bucket.count,
                          })),
                        },
                      ]
                    : []
                }
                displayType="number"
                enableArea
                id="compra-agil-closing-chart"
                showLegend={false}
              />
            </ChartCard>
            <ChartCard
              caption={t`${formatCount(coverage?.regionName)} de ${formatCount(population)} resultados disponibles`}
              testId="compra-agil-chart-regions"
              title={t`Regiones con más oportunidades`}
            >
              <GraphWidgetBarChart
                colorMode="automaticPalette"
                data={
                  hasPositiveCount(regionData)
                    ? regionData.map((bucket) => ({
                        region: bucket.regionName,
                        oportunidades: bucket.count,
                      }))
                    : []
                }
                displayType="number"
                id="compra-agil-regions-chart"
                indexBy="region"
                keys={['oportunidades']}
                showLegend={false}
                showValues
              />
            </ChartCard>
          </StyledChartGrid>
          <StyledDisclosureButton
            aria-controls="compra-agil-secondary-analytics"
            aria-expanded={isMoreAnalyticsOpen}
            data-testid="compra-agil-disclosure"
            onClick={() => setIsMoreAnalyticsOpen((isOpen) => !isOpen)}
            type="button"
          >
            {isMoreAnalyticsOpen
              ? t`Ocultar más análisis`
              : t`Ver más análisis`}
          </StyledDisclosureButton>
          <div id="compra-agil-secondary-analytics">
            <AnimatedExpandableContainer
              isExpanded={isMoreAnalyticsOpen}
              mode="fit-content"
            >
              <StyledChartGrid>
                <ChartCard
                  caption={t`${formatCount(coverage?.buyerIdentity)} de ${formatCount(population)} resultados disponibles`}
                  testId="compra-agil-chart-top-buyers"
                  title={t`Instituciones con más oportunidades`}
                >
                  <GraphWidgetBarChart
                    colorMode="automaticPalette"
                    data={
                      hasPositiveCount(buyerData)
                        ? buyerData.map((bucket) => ({
                            institucion: bucket.buyerName ?? bucket.buyerKey,
                            oportunidades: bucket.count,
                          }))
                        : []
                    }
                    displayType="number"
                    id="compra-agil-buyers-chart"
                    indexBy="institucion"
                    keys={['oportunidades']}
                    showLegend={false}
                    showValues
                  />
                </ChartCard>
                <ChartCard
                  caption={t`${formatCount(coverage?.amountAvailableClp)} de ${formatCount(population)} resultados con monto informado`}
                  testId="compra-agil-chart-amount-bands"
                  title={t`Rangos de monto disponible`}
                >
                  <GraphWidgetBarChart
                    colorMode="automaticPalette"
                    data={
                      hasPositiveCount(amountData)
                        ? amountData.map((bucket) => ({
                            rango: getAmountBandLabel(bucket.band),
                            oportunidades: bucket.count,
                          }))
                        : []
                    }
                    displayType="number"
                    id="compra-agil-amount-bands-chart"
                    indexBy="rango"
                    keys={['oportunidades']}
                    showLegend={false}
                    showValues
                  />
                </ChartCard>
                <ChartCard
                  caption={t`${formatCount(coverage?.callStage)} de ${formatCount(population)} resultados disponibles`}
                  testId="compra-agil-chart-call-stages"
                  title={t`Etapa de convocatoria`}
                >
                  <GraphWidgetBarChart
                    colorMode="automaticPalette"
                    data={
                      hasPositiveCount(callStageData)
                        ? callStageData.map((bucket) => ({
                            etapa:
                              bucket.callStage ===
                              MercadoPublicoCompraAgilCallStage.first_call
                                ? t`Primer llamado`
                                : t`Segundo llamado`,
                            oportunidades: bucket.count,
                          }))
                        : []
                    }
                    displayType="number"
                    id="compra-agil-call-stages-chart"
                    indexBy="etapa"
                    keys={['oportunidades']}
                    showLegend={false}
                    showValues
                  />
                </ChartCard>
                <ChartCard
                  caption={t`${formatCount(coverage?.documentCount)} de ${formatCount(population)} resultados disponibles`}
                  testId="compra-agil-chart-document-availability"
                  title={t`Disponibilidad de documentos`}
                >
                  <GraphWidgetBarChart
                    colorMode="automaticPalette"
                    data={
                      hasPositiveCount(documentData)
                        ? documentData.map((bucket) => ({
                            disponibilidad: bucket.hasDocuments
                              ? t`Con documentos`
                              : t`Sin documentos`,
                            oportunidades: bucket.count,
                          }))
                        : []
                    }
                    displayType="number"
                    id="compra-agil-documents-chart"
                    indexBy="disponibilidad"
                    keys={['oportunidades']}
                    showLegend={false}
                    showValues
                  />
                </ChartCard>
              </StyledChartGrid>
            </AnimatedExpandableContainer>
          </div>
        </>
      ) : null}
      {!isListLoading && !listError && processes?.items.length === 0 ? (
        <StyledState aria-live="polite">
          {hasFilters
            ? t`No encontramos oportunidades con estos filtros.`
            : t`Aún no hay oportunidades disponibles`}
        </StyledState>
      ) : null}
      {processes?.items.length ? (
        <StyledTableWrap
          aria-label={t`Resultados de Compra Ágil`}
          role="region"
          tabIndex={0}
        >
          <StyledTable>
            <thead>
              <tr>
                <th scope="col">{t`Oportunidad`}</th>
                <th scope="col">{t`Institución/región`}</th>
                <th scope="col">{t`Monto`}</th>
                <th scope="col">{t`Cierre`}</th>
                <th scope="col">{t`Antecedentes`}</th>
              </tr>
            </thead>
            <tbody>
              {processes.items.map((process) => {
                const processTitle = process.title ?? process.processCode;

                return (
                  <StyledSelectedRow
                    isSelected={selectedProcessCode === process.processCode}
                    key={process.processCode}
                  >
                    <td>
                      <StyledTitleButton
                        ariaLabel={t`Abrir detalle de ${processTitle}`}
                        data-testid={`process-row-${process.processCode}`}
                        onClick={(event) => {
                          setOriginElement(event.currentTarget);
                          setSelectedProcessCode(process.processCode);
                          openMercadoPublicoProcessInSidePanel({
                            processCode: process.processCode,
                            processTitle,
                            processType:
                              MercadoPublicoDetectedProcessType.compra_agil,
                          });
                        }}
                        size="small"
                        title={processTitle}
                        variant="tertiary"
                      />
                      <StyledCoverage>{process.processCode}</StyledCoverage>
                    </td>
                    <td>
                      <div>
                        {process.buyerName ??
                          process.purchaseUnitName ??
                          t`No informado`}
                      </div>
                      <StyledCoverage>
                        {process.regionName ?? t`Región no informada`}
                      </StyledCoverage>
                    </td>
                    <td>
                      {process.amountAvailableClp === null
                        ? t`No informado`
                        : formatAmount(process.amountAvailableClp)}
                    </td>
                    <td>
                      {process.closingAt
                        ? formatDate(process.closingAt)
                        : t`No informado`}
                    </td>
                    <td>
                      <div>
                        {process.documentCount === null
                          ? t`Documentos no informados`
                          : t`${formatCount(process.documentCount)} documentos`}
                      </div>
                      <StyledCoverage>
                        {process.offersReceivedCount === null
                          ? t`Ofertas no informadas`
                          : t`${formatCount(process.offersReceivedCount)} ofertas`}
                      </StyledCoverage>
                    </td>
                  </StyledSelectedRow>
                );
              })}
            </tbody>
          </StyledTable>
        </StyledTableWrap>
      ) : null}
      {processes ? (
        <StyledPagination>
          <span>
            {total
              ? t`${formatCount(firstItem)}–${formatCount(lastItem)} de ${formatCount(total)}`
              : t`Sin resultados`}
          </span>
          <div>
            <Button
              disabled={currentPage <= 1 || isListRefetching}
              onClick={() => setPage((current) => current - 1)}
              size="small"
              title={t`Anterior`}
              variant="secondary"
            />
            <span>
              {' '}
              {t`Página`} {formatCount(currentPage)}{' '}
            </span>
            <Button
              disabled={
                total === undefined ||
                currentPage * limit >= total ||
                isListRefetching
              }
              onClick={() => setPage((current) => current + 1)}
              size="small"
              title={t`Siguiente`}
              variant="secondary"
            />
          </div>
        </StyledPagination>
      ) : null}
    </StyledContainer>
  );
};
