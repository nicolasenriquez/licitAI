import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { Temporal } from 'temporal-polyfill';
import { SidePanelPages } from 'twenty-shared/types';
import { MercadoPublicoV2ErrorCode } from 'twenty-shared/constants';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';
import { IconDotsVertical } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { Callout } from 'twenty-ui/feedback';

import {
  MercadoPublicoV2FilterBar,
  type MercadoPublicoV2FilterBarProps,
} from '@/mercado-publico/components/MercadoPublicoV2FilterBar';
import { MercadoPublicoV2AppliedFilters } from '@/mercado-publico/components/MercadoPublicoV2AppliedFilters';
import { MercadoPublicoV2Nav } from '@/mercado-publico/components/MercadoPublicoV2Nav';
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

const MERCADO_PUBLICO_V2_OPPORTUNITIES_QUERY = gql`
  query MercadoPublicoV2ActiveOpportunities(
    $filter: MercadoPublicoV2OpportunityFilterInput
    $after: String
    $sort: MercadoPublicoV2OpportunitySort
  ) {
    mercadoPublicoV2 {
      opportunities(first: 100, filter: $filter, after: $after, sort: $sort) {
        edges {
          cursor
          node {
            codigo
            title
            state
            buyerName
            region
            publishedAt
            closingAt
            amount
            amountClp
            currency
            documentCount
            llamado
            availability
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_ANALYTICS_QUERY = gql`
  query MercadoPublicoV2Analytics(
    $filter: MercadoPublicoV2OpportunityFilterInput
  ) {
    mercadoPublicoV2 {
      analytics(filter: $filter) {
        population
        calculatedAt
        asOf
        freshness
        completeness
        availability
        coverage {
          closingAt
          state
          region
          buyer
          amount
          currency
          documentCount
          llamado
        }
        stateBuckets {
          key
          count
        }
        regionBuckets {
          key
          count
        }
        currencyBuckets {
          key
          count
        }
        closingDateBuckets {
          key
          count
        }
        documentBuckets {
          key
          count
        }
        llamadoBuckets {
          key
          count
        }
      }
    }
  }
`;

type Opportunity = {
  codigo: string;
  title: string | null;
  state: string | null;
  buyerName: string | null;
  region: number | null;
  publishedAt: string | null;
  closingAt: string | null;
  amount: string | null;
  amountClp: string | null;
  currency: string | null;
  documentCount: number | null;
  llamado: number | null;
  availability: string;
};

type DataValueState =
  | 'known'
  | 'zero'
  | 'null'
  | 'unavailable'
  | 'not_applicable';

type MercadoPublicoV2ActiveQuery = {
  mercadoPublicoV2: {
    opportunities: {
      edges: Array<{ cursor: string; node: Opportunity }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      totalCount: number;
    };
  };
};

type MercadoPublicoV2ActiveQueryVariables = {
  filter?: MercadoPublicoV2Filters | null;
  after?: string | null;
  sort?: MercadoPublicoV2Sort;
};

type AnalyticsBucket = {
  key: string | null;
  count: number;
};

type MercadoPublicoV2Analytics = {
  population: number;
  calculatedAt: string;
  asOf: string | null;
  freshness: string;
  completeness: string;
  availability: string;
  coverage: {
    closingAt: number;
    state: number;
    region: number;
    buyer: number;
    amount: number;
    currency: number;
    documentCount: number;
    llamado: number;
  };
  stateBuckets: AnalyticsBucket[];
  regionBuckets: AnalyticsBucket[];
  currencyBuckets: AnalyticsBucket[];
  closingDateBuckets: AnalyticsBucket[];
  documentBuckets: AnalyticsBucket[];
  llamadoBuckets: AnalyticsBucket[];
};

type MercadoPublicoV2AnalyticsQuery = {
  mercadoPublicoV2: {
    analytics: MercadoPublicoV2Analytics;
  };
};

const StyledPage = styled.main`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[4]};
  }
`;

const StyledHeader = styled.header`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledHeading = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  margin: 0;
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
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
  min-width: 860px;
  table-layout: fixed;
  width: 100%;

  th:nth-child(1) {
    width: 42%;
  }

  th:nth-child(2) {
    width: 22%;
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

    tbody td:nth-child(3) {
      order: 2;
    }

    tbody td:nth-child(4) {
      order: 3;
    }

    tbody td:nth-child(2) {
      grid-column: 1 / -1;
      order: 4;
    }

    tbody td:nth-child(5) {
      grid-column: 1 / -1;
      order: 5;
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
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font: inherit;
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  padding: 0;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

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

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledAnalytics = styled.details`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  order: 2;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledAnalyticsStatus = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
  overflow-wrap: anywhere;
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

const StyledAnalyticsHeading = styled.summary`
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledAnalyticsSection = styled.details`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  padding-top: ${themeCssVariables.spacing[3]};

  summary {
    color: ${themeCssVariables.font.color.primary};
    cursor: pointer;
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.medium};

    &:focus-visible {
      outline: 2px solid ${themeCssVariables.border.color.blue};
      outline-offset: 2px;
    }
  }
`;

const StyledBucketList = styled.ul`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  list-style: none;
  margin: ${themeCssVariables.spacing[3]} 0 0;
  padding: 0;
`;

const StyledBucket = styled.li`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
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
  if (value === null) {
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
    ...filters,
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

const formatDate = (value: string | null): string => {
  if (!value) return 'No informado por fuente';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
};

type DateValueProps = {
  value: string | null;
  availability: string;
};

const DateValue = ({ value, availability }: DateValueProps) => {
  const { t } = useLingui();

  if (value === null) {
    return <DataValue value={value} availability={availability} />;
  }

  const formatted = formatDate(value);

  return (
    <StyledDateValue
      aria-label={t`${formatted}; hora de Santiago; ISO ${value}`}
      dateTime={value}
      tabIndex={0}
      title={t`Hora de Santiago. ISO: ${value}`}
    >
      {formatted}
    </StyledDateValue>
  );
};

const formatAvailability = (
  availability: string,
  t: ReturnType<typeof useLingui>['t'],
): string => {
  if (availability === 'unavailable') {
    return t`Aún no disponible`;
  }

  if (availability === 'not_applicable') {
    return t`No aplica`;
  }

  return t`Disponible`;
};

const formatFreshness = (
  freshness: string,
  t: ReturnType<typeof useLingui>['t'],
): string | null => {
  if (freshness === 'healthy') return t`Al día`;
  if (freshness === 'stale') return t`Desactualizada`;
  if (freshness === 'degraded') return t`Degradada`;
  return null;
};

const AnalyticsBuckets = ({
  label,
  buckets,
}: {
  label: string;
  buckets: AnalyticsBucket[];
}) => (
  <StyledAnalyticsSection>
    <summary>{label}</summary>
    <StyledBucketList>
      {buckets.map((bucket) => (
        <StyledBucket key={`${label}-${bucket.key ?? 'unknown'}`}>
          <DataValue value={bucket.key} availability="available">
            {bucket.key}
          </DataValue>
          : {bucket.count}
        </StyledBucket>
      ))}
    </StyledBucketList>
  </StyledAnalyticsSection>
);

export const MercadoPublicoV2ActivePage = () => {
  const { t } = useLingui();
  const { navigateSidePanel } = useNavigateSidePanel();
  const { closeSidePanelMenu } = useSidePanelMenu();
  const isSidePanelOpened = useAtomValue(isSidePanelOpenedState.atom);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    state,
    applyFilters,
    clearFilters,
    setSort,
    setAfter,
    previousCursors,
  } = useMercadoPublicoV2UrlState();
  const [notice, setNotice] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [openingOpportunityCode, setOpeningOpportunityCode] = useState<
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
    MercadoPublicoV2ActiveQuery,
    MercadoPublicoV2ActiveQueryVariables
  >(MERCADO_PUBLICO_V2_OPPORTUNITIES_QUERY, {
    client: apolloCoreClient,
    variables: {
      filter: queryFilter,
      after: state.after,
      sort: state.sort,
    },
  });
  const {
    data: analyticsData,
    error: analyticsError,
    loading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery<
    MercadoPublicoV2AnalyticsQuery,
    Pick<MercadoPublicoV2ActiveQueryVariables, 'filter'>
  >(MERCADO_PUBLICO_V2_ANALYTICS_QUERY, {
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

    setNotice(t`No fue posible cargar las oportunidades.`);
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

    const next = new URLSearchParams(searchParams);

    next.delete('proceso');
    setSearchParams(next, { replace: true });
  }, [
    hasMounted,
    isSidePanelOpened,
    searchParams,
    setSearchParams,
    openingOpportunityCode,
    state.proceso,
  ]);

  const openOpportunity = useCallback(
    (opportunity: Opportunity) => {
      const next = new URLSearchParams(searchParams);

      setOpeningOpportunityCode(opportunity.codigo);
      next.set('proceso', opportunity.codigo);
      setSearchParams(next);

      navigateSidePanel({
        page: SidePanelPages.MercadoPublicoV2Opportunity,
        pageId: opportunity.codigo,
        pageTitle: t`Detalle del proceso`,
        pageIcon: IconDotsVertical,
        resetNavigationStack: true,
      });
    },
    [navigateSidePanel, searchParams, setSearchParams, t],
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
    <StyledPage>
      <StyledHeader>
        <StyledHeading>{t`Mercado Público`}</StyledHeading>
        <MercadoPublicoV2Nav />
        {opportunities && (
          <StyledCount>{t`${opportunities.totalCount} oportunidades`}</StyledCount>
        )}
      </StyledHeader>

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
          aria-label={t`Cargando oportunidades…`}
          aria-live="polite"
        >
          <StyledTable aria-hidden="true">
            <tbody>
              {[0, 1, 2, 3, 4].map((row) => (
                <tr key={row}>
                  {[0, 1, 2, 3, 4].map((column) => (
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
            title={t`No fue posible cargar las oportunidades`}
            description={t`Reintenta sin perder los filtros ni el orden actual.`}
            action={{
              label: t`Reintentar`,
              onClick: () => void refetchOpportunities(),
            }}
          />
        </StyledStateMessage>
      )}
      {!loading && !error && opportunities?.edges.length === 0 && (
        <StyledStateMessage role="status" aria-live="polite">
          <Callout
            variant="neutral"
            title={t`No hay oportunidades disponibles`}
            description={t`Ajusta los filtros o limpia la búsqueda para ampliar los resultados.`}
          />
        </StyledStateMessage>
      )}
      {!loading &&
        !error &&
        opportunities &&
        opportunities.edges.length > 0 && (
          <StyledTableContainer
            aria-label={t`Oportunidades activas`}
            role="region"
            tabIndex={0}
          >
            <StyledTable>
              <StyledTableCaption>
                {t`Oportunidades activas. Cinco columnas en escritorio; cada fila se apila en móvil.`}
              </StyledTableCaption>
              <thead>
                <tr>
                  <StyledHeaderCell scope="col">
                    {t`Oportunidad`}
                  </StyledHeaderCell>
                  <StyledHeaderCell scope="col">
                    {t`Comprador / región`}
                  </StyledHeaderCell>
                  <StyledHeaderCell scope="col">{t`Cierre`}</StyledHeaderCell>
                  <StyledHeaderCell scope="col">{t`Monto`}</StyledHeaderCell>
                  <StyledHeaderCell scope="col">
                    {t`Documentos`}
                  </StyledHeaderCell>
                </tr>
              </thead>
              <tbody>
                {opportunities.edges.map(({ node }) => (
                  <tr key={node.codigo}>
                    <StyledCell data-label={t`Oportunidad`}>
                      <StyledOpportunityButton
                        aria-label={t`Abrir ${node.title ?? node.codigo}`}
                        onClick={() => openOpportunity(node)}
                        title={node.title ?? node.codigo}
                      >
                        {node.title ?? node.codigo}
                      </StyledOpportunityButton>
                      <StyledSecondaryText>{node.codigo}</StyledSecondaryText>
                      <StyledOpportunityMeta>
                        <DataValue
                          value={node.state}
                          availability={node.availability}
                        >
                          {node.state}
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
                          {formatAvailability(node.availability, t)}
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
                    <StyledCell data-label={t`Comprador / región`}>
                      <DataValue
                        value={node.buyerName}
                        availability={node.availability}
                      >
                        {node.buyerName}
                      </DataValue>
                      <StyledSecondaryText>
                        <DataValue
                          value={node.region}
                          availability={node.availability}
                        >
                          {node.region === null
                            ? null
                            : t`Región ${node.region}`}
                        </DataValue>
                      </StyledSecondaryText>
                    </StyledCell>
                    <StyledCell data-label={t`Cierre`}>
                      <DateValue
                        value={node.closingAt}
                        availability={node.availability}
                      />
                    </StyledCell>
                    <StyledCell data-label={t`Monto`}>
                      <DataValue
                        value={node.amount}
                        availability={node.availability}
                      >
                        {node.currency
                          ? `${node.currency} ${node.amount}`
                          : node.amount}
                      </DataValue>
                      {node.amountClp !== null &&
                        node.currency !== null &&
                        node.currency !== 'CLP' && (
                          <StyledSecondaryText>
                            {t`≈ CLP ${node.amountClp}`}
                          </StyledSecondaryText>
                        )}
                    </StyledCell>
                    <StyledCell data-label={t`Documentos`}>
                      <div>
                        {t`Documentos`}:{' '}
                        <DataValue
                          value={node.documentCount}
                          availability={node.availability}
                        >
                          {node.documentCount === null
                            ? null
                            : t`${node.documentCount}`}
                        </DataValue>
                      </div>
                    </StyledCell>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledTableContainer>
        )}
      {!loading && !error && opportunities?.edges.length ? (
        <StyledPagination aria-label={t`Paginación de oportunidades`}>
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

      <StyledAnalytics
        aria-busy={analyticsLoading}
        aria-labelledby="mercado-publico-v2-analytics-heading"
      >
        <StyledAnalyticsHeading id="mercado-publico-v2-analytics-heading">
          {t`Calidad y procedencia`}
        </StyledAnalyticsHeading>
        {analyticsLoading && (
          <StyledAnalyticsStatus role="status">
            {t`Calculando analítica del universo completo…`}
          </StyledAnalyticsStatus>
        )}
        {!analyticsLoading && analyticsError && (
          <StyledStateMessage role="alert">
            <Callout
              variant="error"
              title={t`Analítica no disponible`}
              description={t`No se calcularon cifras desde la página visible.`}
              action={{
                label: t`Reintentar analítica`,
                onClick: () => void refetchAnalytics(),
              }}
            />
          </StyledStateMessage>
        )}
        {!analyticsLoading && !analyticsError && analytics && (
          <>
            <StyledAnalyticsStatus role="status">
              {analytics.availability === 'available'
                ? t`Resultados disponibles`
                : analytics.availability === 'partial'
                  ? t`Resultados parciales`
                  : t`Resultados no disponibles`}
              {` · ${analytics.population} oportunidades · `}
              {analytics.completeness === 'complete'
                ? t`completitud completa`
                : analytics.completeness === 'partial'
                  ? t`completitud parcial`
                  : t`sin datos completos`}
              {formatFreshness(analytics.freshness, t)
                ? ` · ${t`Frescura`}: ${formatFreshness(analytics.freshness, t)}`
                : ''}
              {` · ${t`Calculado`}: ${formatDate(analytics.calculatedAt)}`}
              {` · ${t`Actualizado`}: ${formatDate(analytics.asOf)}`}
            </StyledAnalyticsStatus>
            {analytics.availability !== 'unavailable' && (
              <>
                <StyledAnalyticsStatus>
                  {t`Cobertura conocida`}:{' '}
                  {t`cierre ${analytics.coverage.closingAt}/${analytics.population}`}
                  ,{' '}
                  {t`estado ${analytics.coverage.state}/${analytics.population}`}
                  ,{' '}
                  {t`región ${analytics.coverage.region}/${analytics.population}`}
                  ,{' '}
                  {t`monto ${analytics.coverage.amount}/${analytics.population}`}
                  ,{' '}
                  {t`documentos ${analytics.coverage.documentCount}/${analytics.population}`}
                </StyledAnalyticsStatus>
                <AnalyticsBuckets
                  label={t`Estados`}
                  buckets={analytics.stateBuckets}
                />
                <AnalyticsBuckets
                  label={t`Regiones`}
                  buckets={analytics.regionBuckets}
                />
                <AnalyticsBuckets
                  label={t`Fechas de cierre`}
                  buckets={analytics.closingDateBuckets}
                />
                <AnalyticsBuckets
                  label={t`Monedas`}
                  buckets={analytics.currencyBuckets}
                />
                <AnalyticsBuckets
                  label={t`Documentos`}
                  buckets={analytics.documentBuckets}
                />
                <AnalyticsBuckets
                  label={t`Llamados`}
                  buckets={analytics.llamadoBuckets}
                />
              </>
            )}
          </>
        )}
      </StyledAnalytics>
    </StyledPage>
  );
};
