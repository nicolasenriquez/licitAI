import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Temporal } from 'temporal-polyfill';
import { AppPath, SidePanelPages } from 'twenty-shared/types';
import { MercadoPublicoV2ErrorCode } from 'twenty-shared/constants';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IconDotsVertical } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { Callout } from 'twenty-ui/feedback';
import { Link } from 'react-router-dom';

import {
  MercadoPublicoV2FilterBar,
  type MercadoPublicoV2FilterBarProps,
} from '@/mercado-publico/components/MercadoPublicoV2FilterBar';
import { MercadoPublicoV2AppliedFilters } from '@/mercado-publico/components/MercadoPublicoV2AppliedFilters';
import { MercadoPublicoV2PageShell } from '@/mercado-publico/components/MercadoPublicoV2PageShell';
import { MercadoPublicoV2RefreshControl } from '@/mercado-publico/components/MercadoPublicoV2RefreshControl';
import {
  formatMercadoPublicoAvailability,
  formatMercadoPublicoFreshnessSummary,
} from '@/mercado-publico/utils/format-mercado-publico-data-status';
import {
  formatMercadoPublicoAmount,
  formatMercadoPublicoDate,
  formatMercadoPublicoRegion,
  formatMercadoPublicoRelativeDate,
} from '@/mercado-publico/utils/format-mercado-publico-display';
import {
  useMercadoPublicoV2UrlState,
  type MercadoPublicoV2Filters,
  type MercadoPublicoV2Sort,
} from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';
import { useNavigateSidePanel } from '@/side-panel/hooks/useNavigateSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { logError } from '~/utils/logError';
import { isGraphqlErrorOfType } from '~/utils/is-graphql-error-of-type.util';
import {
  MercadoPublicoV2ActiveOpportunitiesDocument,
  type MercadoPublicoV2ActiveOpportunitiesQuery,
  type MercadoPublicoV2ActiveOpportunitiesQueryVariables,
  MercadoPublicoV2AnalyticsDocument,
  type MercadoPublicoV2AnalyticsQuery,
  type MercadoPublicoV2AnalyticsQueryVariables,
} from '~/generated/graphql';

type Opportunity =
  MercadoPublicoV2ActiveOpportunitiesQuery['mercadoPublicoV2']['opportunities']['edges'][number]['node'];

type DataValueState =
  | 'known'
  | 'zero'
  | 'null'
  | 'unavailable'
  | 'not_applicable';

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledHeaderMeta = styled.span`
  align-items: center;
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledBuyerContext = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledContextLink = styled(Link)`
  color: ${themeCssVariables.font.color.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const StyledTableContainer = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  max-width: 100%;
  order: 1;
  overflow-x: auto;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 720px;
  table-layout: fixed;
  width: 100%;

  th:nth-child(1) {
    width: 52%;
  }

  th:nth-child(2) {
    width: 15%;
  }

  th:nth-child(3) {
    width: 20%;
  }

  th:nth-child(4) {
    width: 13%;
  }

  tbody tr:focus-within {
    background: ${themeCssVariables.background.transparent.light};
  }

  @media (max-width: 600px) {
    display: block;
    min-width: 0;
    table-layout: auto;

    thead {
      height: 1px;
      overflow: hidden;
      position: absolute;
      width: 1px;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    tbody {
      display: grid;
      gap: ${themeCssVariables.spacing[2]};
      padding: ${themeCssVariables.spacing[2]};
    }

    tbody tr {
      border: 1px solid ${themeCssVariables.border.color.light};
      border-radius: ${themeCssVariables.border.radius.sm};
      display: grid;
      gap: ${themeCssVariables.spacing[3]};
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: ${themeCssVariables.spacing[3]};
    }

    tbody td {
      border-top: 0;
      display: flex;
      flex-direction: column;
      gap: ${themeCssVariables.spacing[1]};
      min-width: 0;
      padding: 0;
    }

    tbody td::before {
      color: ${themeCssVariables.font.color.secondary};
      content: attr(data-label);
      font-size: ${themeCssVariables.font.size.xs};
      font-weight: ${themeCssVariables.font.weight.medium};
    }

    tbody td:nth-child(1) {
      grid-column: 1 / -1;
      order: 1;
    }

    tbody td:nth-child(2) {
      order: 2;
    }

    tbody td:nth-child(3) {
      order: 3;
    }

    tbody td:nth-child(4) {
      grid-column: 1 / -1;
      order: 4;
    }
  }
`;

const StyledHeaderCell = styled.th`
  background: ${themeCssVariables.background.secondary};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledTableCaption = styled.caption`
  clip: rect(0 0 0 0);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

const StyledCell = styled.td`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
  vertical-align: top;
`;

const StyledOpportunityButton = styled.button`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: -webkit-box;
  font: inherit;
  overflow: hidden;
  overflow-wrap: anywhere;
  padding: 0;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledOpportunityMeta = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledAvailability = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledSecondaryText = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-top: ${themeCssVariables.spacing[1]};
  overflow-wrap: anywhere;
`;

const StyledDataValue = styled.span`
  overflow-wrap: anywhere;

  &[data-value-state='zero'] {
    font-variant-numeric: tabular-nums;
  }
`;

const StyledDateValue = styled.time`
  display: inline-block;
`;

const StyledUrgency = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledProcessStatus = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  max-width: 100%;
  padding: 0 ${themeCssVariables.spacing[2]};

  &::before {
    background: var(--process-status-accent);
    border-radius: ${themeCssVariables.border.radius.rounded};
    content: '';
    flex-shrink: 0;
    height: ${themeCssVariables.spacing[1]};
    width: ${themeCssVariables.spacing[1]};
  }
`;

const StyledStateMessage = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  margin: 0;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledPagination = styled.nav`
  display: flex;
  justify-content: flex-end;
  order: 1;
`;

const StyledSkeletonCell = styled.td`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  padding: ${themeCssVariables.spacing[3]};

  &::after {
    background: ${themeCssVariables.background.secondary};
    border-radius: ${themeCssVariables.border.radius.sm};
    content: '';
    display: block;
    height: ${themeCssVariables.spacing[3]};
  }
`;

const FILTER_NOTICE_ID = 'mercado-publico-v2-filter-notice';
const SANTIAGO_TIME_ZONE = 'America/Santiago';

const toDateTime = (
  value: string | null,
  endOfDay: boolean,
): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  try {
    const boundaryDate = Temporal.PlainDate.from(value).add({
      days: endOfDay ? 1 : 0,
    });
    const boundaryInstant = boundaryDate
      .toZonedDateTime(SANTIAGO_TIME_ZONE)
      .toInstant();

    return (
      endOfDay ? boundaryInstant.subtract({ milliseconds: 1 }) : boundaryInstant
    ).toString();
  } catch {
    return value;
  }
};

const toQueryFilter = (
  filters: MercadoPublicoV2Filters,
): MercadoPublicoV2Filters | null => {
  const hasAnyFilter =
    filters.search.trim() !== '' ||
    filters.cohortStatus !== null ||
    filters.states.length > 0 ||
    filters.buyer.trim() !== '' ||
    filters.region !== null ||
    filters.closingAtFrom !== null ||
    filters.closingAtTo !== null ||
    filters.documentCountMin !== null ||
    filters.documentCountMax !== null ||
    filters.llamado !== null ||
    filters.amountMin !== null ||
    filters.amountMax !== null ||
    filters.currencies.length > 0;

  if (!hasAnyFilter) {
    return null;
  }

  return {
    search: filters.search.trim() === '' ? undefined : filters.search.trim(),
    cohortStatus: filters.cohortStatus ?? undefined,
    states: filters.states.length > 0 ? filters.states : undefined,
    buyer: filters.buyer.trim() === '' ? undefined : filters.buyer.trim(),
    region: filters.region ?? undefined,
    closingAtFrom: toDateTime(filters.closingAtFrom, false),
    closingAtTo: toDateTime(filters.closingAtTo, true),
    documentCountMin: filters.documentCountMin ?? undefined,
    documentCountMax: filters.documentCountMax ?? undefined,
    llamado: filters.llamado ?? undefined,
    amountMin: filters.amountMin ?? undefined,
    amountMax: filters.amountMax ?? undefined,
    currencies: filters.currencies.length > 0 ? filters.currencies : undefined,
  } as MercadoPublicoV2Filters;
};

const getDataValueState = (
  value: string | number | null | undefined,
  availability: string,
): DataValueState => {
  if (value === 0 || value === '0') {
    return 'zero';
  }

  if (value !== null && value !== undefined) {
    return 'known';
  }

  if (availability === 'unavailable') {
    return 'unavailable';
  }

  if (availability === 'not_applicable') {
    return 'not_applicable';
  }

  return 'null';
};

type DataValueProps = {
  value: string | number | null | undefined;
  availability: string;
  children?: ReactNode;
};

const DataValue = ({ value, availability, children }: DataValueProps) => {
  const { t } = useLingui();
  const state = getDataValueState(value, availability);
  const fallback =
    state === 'unavailable'
      ? t`Aún no disponible`
      : state === 'not_applicable'
        ? t`No aplica`
        : t`No informado por fuente`;

  return (
    <StyledDataValue data-value-state={state}>
      {value === null || value === undefined ? fallback : children}
    </StyledDataValue>
  );
};

type DateValueProps = {
  value: string | null | undefined;
  availability: string;
};

const ProcessStatus = ({ state }: { state: string }) => {
  const { t } = useLingui();

  let text = state;
  let accent = themeCssVariables.color.gray;

  switch (state) {
    case 'publicada':
      text = t`Publicada`;
      accent = themeCssVariables.color.green;
      break;
    case 'cerrada':
      text = t`Cerrada`;
      break;
    case 'desierta':
      text = t`Desierta`;
      accent = themeCssVariables.color.orange;
      break;
    case 'cancelada':
      text = t`Cancelada`;
      accent = themeCssVariables.color.red;
      break;
    case 'proveedor_seleccionado':
      text = t`Proveedor seleccionado`;
      accent = themeCssVariables.color.blue;
      break;
    case 'oc_emitida':
      text = t`Orden de compra emitida`;
      accent = themeCssVariables.color.turquoise;
      break;
  }

  return (
    <StyledProcessStatus
      aria-label={text}
      data-status-color={state}
      style={{ '--process-status-accent': accent } as CSSProperties}
    >
      {text}
    </StyledProcessStatus>
  );
};

const DateValue = ({ value, availability }: DateValueProps) => {
  const { t } = useLingui();

  if (value === null || value === undefined) {
    return <DataValue value={value} availability={availability} />;
  }

  const formatted = formatMercadoPublicoDate(value);
  const relative = formatMercadoPublicoRelativeDate(value);

  return (
    <div>
      <StyledUrgency>{relative}</StyledUrgency>
      <StyledDateValue
        aria-label={t`${formatted}; hora de Santiago; ISO ${value}`}
        dateTime={value}
        title={t`Hora de Santiago. ISO: ${value}`}
      >
        {formatted}
      </StyledDateValue>
    </div>
  );
};

export const MercadoPublicoV2ActivePage = () => {
  const { t } = useLingui();
  const { navigateSidePanel } = useNavigateSidePanel();
  const { closeSidePanelMenu } = useSidePanelMenu();
  const isSidePanelOpened = useAtomValue(isSidePanelOpenedState.atom);
  const {
    state,
    applyFilters,
    clearFilters,
    setSort,
    setAfter,
    setProceso,
    previousCursors,
  } = useMercadoPublicoV2UrlState();
  const [notice, setNotice] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [openingOpportunityCode, setOpeningOpportunityCode] = useState<
    string | null
  >(null);
  const [lastOpenedOpportunityCode, setLastOpenedOpportunityCode] = useState<
    string | null
  >(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const queryFilter = useMemo(() => toQueryFilter(state), [state]);
  const apolloCoreClient = useApolloCoreClient();

  const {
    data,
    error,
    loading,
    refetch: refetchOpportunities,
  } = useQuery<
    MercadoPublicoV2ActiveOpportunitiesQuery,
    MercadoPublicoV2ActiveOpportunitiesQueryVariables
  >(MercadoPublicoV2ActiveOpportunitiesDocument, {
    client: apolloCoreClient,
    variables: {
      filter: queryFilter,
      after: state.after,
      sort: state.sort,
    },
  });
  const { data: analyticsData } = useQuery<
    MercadoPublicoV2AnalyticsQuery,
    MercadoPublicoV2AnalyticsQueryVariables
  >(MercadoPublicoV2AnalyticsDocument, {
    client: apolloCoreClient,
    variables: { filter: queryFilter },
  });

  useEffect(() => {
    if (error === undefined) {
      return;
    }

    logError(error);

    if (isGraphqlErrorOfType(error, MercadoPublicoV2ErrorCode.INVALID_CURSOR)) {
      setNotice(t`Cursor inválido; se volvió a la primera página.`);
      setAfter(null);

      return;
    }

    if (isGraphqlErrorOfType(error, MercadoPublicoV2ErrorCode.INVALID_FILTER)) {
      setNotice(
        t`Los filtros ingresados no son válidos. Revisa que cada valor desde o mínimo no supere su valor hasta o máximo.`,
      );

      return;
    }

    setNotice('No fue posible cargar los procesos.');
  }, [error, setAfter, t]);

  useEffect(() => {
    if (state.proceso !== null && !isSidePanelOpened) {
      navigateSidePanel({
        page: SidePanelPages.MercadoPublicoV2Opportunity,
        pageId: state.proceso,
        pageTitle: t`Detalle del proceso`,
        pageIcon: IconDotsVertical,
        resetNavigationStack: true,
      });
    }
  }, [isSidePanelOpened, navigateSidePanel, state.proceso, t]);

  useEffect(() => {
    if (
      !isSidePanelOpened ||
      state.proceso !== null ||
      openingOpportunityCode !== null
    ) {
      return;
    }

    closeSidePanelMenu();
  }, [
    closeSidePanelMenu,
    isSidePanelOpened,
    openingOpportunityCode,
    state.proceso,
  ]);

  useEffect(() => {
    if (isSidePanelOpened && openingOpportunityCode === state.proceso) {
      setOpeningOpportunityCode(null);
    }
  }, [isSidePanelOpened, openingOpportunityCode, state.proceso]);

  useEffect(() => {
    if (
      !hasMounted ||
      isSidePanelOpened ||
      state.proceso === null ||
      openingOpportunityCode === state.proceso
    ) {
      return;
    }

    setProceso(null, true);
  }, [
    hasMounted,
    isSidePanelOpened,
    setProceso,
    openingOpportunityCode,
    state.proceso,
  ]);

  useEffect(() => {
    if (!isSidePanelOpened || !lastOpenedOpportunityCode) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return;
      }

      window.setTimeout(() => {
        const currentOpportunityButton = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            '[data-mercado-publico-opportunity-code]',
          ),
        ).find(
          (button) =>
            button.dataset.mercadoPublicoOpportunityCode ===
            lastOpenedOpportunityCode,
        );

        currentOpportunityButton?.focus();
      }, 1000);
    };

    document.addEventListener('keydown', handleEscape, true);

    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isSidePanelOpened, lastOpenedOpportunityCode]);

  const openOpportunity = useCallback(
    (opportunity: Opportunity) => {
      setLastOpenedOpportunityCode(opportunity.codigo);
      setOpeningOpportunityCode(opportunity.codigo);
      setProceso(opportunity.codigo);

      navigateSidePanel({
        page: SidePanelPages.MercadoPublicoV2Opportunity,
        pageId: opportunity.codigo,
        pageTitle: t`Detalle del proceso`,
        pageIcon: IconDotsVertical,
        resetNavigationStack: true,
      });
    },
    [navigateSidePanel, setProceso, t],
  );

  const handleApplyFilters: MercadoPublicoV2FilterBarProps['onApply'] =
    useCallback(
      (filters) => {
        setNotice(null);
        applyFilters(filters);
      },
      [applyFilters],
    );

  const handleClearFilters = useCallback(() => {
    setNotice(null);
    clearFilters();
  }, [clearFilters]);

  const handleSortChange = useCallback(
    (sort: MercadoPublicoV2Sort) => {
      setNotice(null);
      setSort(sort);
    },
    [setSort],
  );

  const opportunities = data?.mercadoPublicoV2.opportunities;
  const analytics = analyticsData?.mercadoPublicoV2.analytics;
  const tableLabel =
    state.cohortStatus === 'active' &&
    state.states.length === 1 &&
    state.states[0] === 'publicada'
      ? 'Procesos publicados'
      : state.cohortStatus === 'active' && state.states.length === 0
        ? 'Procesos en seguimiento'
        : 'Procesos filtrados';

  const goToNextPage = useCallback(() => {
    if (
      !opportunities?.pageInfo.hasNextPage ||
      !opportunities.pageInfo.endCursor
    ) {
      return;
    }

    setAfter(opportunities.pageInfo.endCursor, [
      ...previousCursors,
      state.after,
    ]);
  }, [opportunities, previousCursors, setAfter, state.after]);

  const goToPreviousPage = useCallback(() => {
    const previousCursor = previousCursors.at(-1);

    if (previousCursor === undefined) {
      return;
    }

    setAfter(previousCursor, previousCursors.slice(0, -1));
  }, [previousCursors, setAfter]);

  return (
    <MercadoPublicoV2PageShell
      title="Procesos"
      topBarRight={<MercadoPublicoV2RefreshControl />}
      tag={
        opportunities || analytics ? (
          <StyledHeaderMeta>
            {opportunities && (
              <StyledCount>{t`${opportunities.totalCount} procesos`}</StyledCount>
            )}
            {analytics && (
              <StyledCount>
                {formatMercadoPublicoFreshnessSummary(
                  analytics.freshness,
                  analytics.asOf,
                  t,
                )}
              </StyledCount>
            )}
          </StyledHeaderMeta>
        ) : undefined
      }
    >
      {state.buyer.trim() !== '' && (
        <StyledBuyerContext>
          <span>{t`Comprador filtrado: ${state.buyer.trim()}`}</span>
          <StyledContextLink to={AppPath.MercadoPublicoV2Buyers}>
            {t`Volver a Compradores`}
          </StyledContextLink>
        </StyledBuyerContext>
      )}
      <MercadoPublicoV2FilterBar
        filters={state}
        sort={state.sort}
        notice={notice}
        noticeId={FILTER_NOTICE_ID}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onSortChange={handleSortChange}
      />

      <MercadoPublicoV2AppliedFilters
        filters={state}
        onRemove={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {loading && (
        <StyledTableContainer
          role="status"
          aria-label="Cargando procesos…"
          aria-live="polite"
        >
          <StyledTable aria-hidden="true">
            <tbody>
              {[0, 1, 2, 3, 4].map((row) => (
                <tr key={row}>
                  {[0, 1, 2, 3].map((column) => (
                    <StyledSkeletonCell key={column} />
                  ))}
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </StyledTableContainer>
      )}
      {!loading && error && (
        <StyledStateMessage role="alert">
          <Callout
            variant="error"
            title="No fue posible cargar los procesos"
            description="Reintenta sin perder los filtros ni el orden actual."
            action={{
              label: 'Reintentar',
              onClick: () => void refetchOpportunities(),
            }}
          />
        </StyledStateMessage>
      )}
      {!loading && !error && opportunities?.edges.length === 0 && (
        <StyledStateMessage role="status" aria-live="polite">
          <Callout
            variant="neutral"
            title="No hay procesos disponibles"
            description="Ajusta los filtros o limpia la búsqueda para ampliar los resultados."
          />
        </StyledStateMessage>
      )}
      {!loading &&
        !error &&
        opportunities &&
        opportunities.edges.length > 0 && (
          <StyledTableContainer
            aria-label={tableLabel}
            role="region"
            tabIndex={0}
          >
            <StyledTable>
              <StyledTableCaption>
                Tabla de procesos. Cuatro columnas en escritorio; cada fila se
                apila en móvil.
              </StyledTableCaption>
              <thead>
                <tr>
                  <StyledHeaderCell scope="col">Oportunidad</StyledHeaderCell>
                  <StyledHeaderCell scope="col">Estado</StyledHeaderCell>
                  <StyledHeaderCell scope="col">Cierre</StyledHeaderCell>
                  <StyledHeaderCell scope="col">
                    Monto publicado
                  </StyledHeaderCell>
                </tr>
              </thead>
              <tbody>
                {opportunities.edges.map(({ node }) => (
                  <tr key={node.codigo}>
                    <StyledCell data-label="Oportunidad">
                      <StyledOpportunityButton
                        aria-label={t`Abrir ${node.title ?? node.codigo}`}
                        data-mercado-publico-opportunity-code={node.codigo}
                        onClick={() => openOpportunity(node)}
                        title={node.title ?? node.codigo}
                      >
                        {node.title ?? node.codigo}
                      </StyledOpportunityButton>
                      <StyledSecondaryText>{node.codigo}</StyledSecondaryText>
                      <StyledOpportunityMeta>
                        <DataValue
                          value={node.buyerName}
                          availability={node.availability}
                        >
                          {node.buyerName}
                        </DataValue>
                        <DataValue
                          value={node.region}
                          availability={node.availability}
                        >
                          {node.region === null || node.region === undefined
                            ? null
                            : formatMercadoPublicoRegion(node.region)}
                        </DataValue>
                        <DataValue
                          value={node.llamado}
                          availability={node.availability}
                        >
                          {node.llamado === null
                            ? null
                            : t`Llamado ${node.llamado}`}
                        </DataValue>
                        <StyledAvailability>
                          {formatMercadoPublicoAvailability(
                            node.availability,
                            t,
                          )}
                        </StyledAvailability>
                      </StyledOpportunityMeta>
                      {node.title === null && (
                        <StyledSecondaryText>
                          <DataValue
                            value={node.title}
                            availability={node.availability}
                          >
                            {node.title}
                          </DataValue>
                        </StyledSecondaryText>
                      )}
                    </StyledCell>
                    <StyledCell data-label="Estado">
                      <DataValue
                        value={node.state}
                        availability={node.availability}
                      >
                        {node.state && <ProcessStatus state={node.state} />}
                      </DataValue>
                    </StyledCell>
                    <StyledCell data-label="Cierre">
                      <DateValue
                        value={node.closingAt}
                        availability={node.availability}
                      />
                    </StyledCell>
                    <StyledCell data-label="Monto publicado">
                      <DataValue
                        value={node.amount}
                        availability={node.availability}
                      >
                        {formatMercadoPublicoAmount(node.amount, node.currency)}
                      </DataValue>
                    </StyledCell>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledTableContainer>
        )}
      {!loading && !error && opportunities?.edges.length ? (
        <StyledPagination aria-label="Paginación de procesos">
          <Button
            title={t`Anterior`}
            type="button"
            size="small"
            variant="secondary"
            disabled={previousCursors.length === 0}
            onClick={goToPreviousPage}
          />
          <Button
            title={t`Siguiente`}
            type="button"
            size="small"
            variant="secondary"
            disabled={!opportunities.pageInfo.hasNextPage}
            onClick={goToNextPage}
          />
        </StyledPagination>
      ) : null}
    </MercadoPublicoV2PageShell>
  );
};
