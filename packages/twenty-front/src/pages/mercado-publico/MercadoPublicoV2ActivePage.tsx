import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SidePanelPages } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IconDotsVertical } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

import {
  MercadoPublicoV2FilterBar,
  type MercadoPublicoV2FilterBarProps,
} from '@/mercado-publico/components/MercadoPublicoV2FilterBar';
import {
  useMercadoPublicoV2UrlState,
  type MercadoPublicoV2Filters,
  type MercadoPublicoV2Sort,
} from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';
import { useNavigateSidePanel } from '@/side-panel/hooks/useNavigateSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';

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
  currency: string | null;
  documentCount: number | null;
  llamado: number | null;
  availability: string;
};

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

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledHeader = styled.header`
  align-items: baseline;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledHeading = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  margin: 0;
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledTableContainer = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow-x: auto;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 760px;
  width: 100%;
`;

const StyledHeaderCell = styled.th`
  background: ${themeCssVariables.background.secondary};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
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
  padding: 0;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const StyledSecondaryText = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledAnalytics = styled.section`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledAnalyticsStatus = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledAnalyticsHeading = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
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

const StyledEmptyState = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledPagination = styled.nav`
  display: flex;
  justify-content: flex-end;
`;

const FILTER_NOTICE_ID = 'mercado-publico-v2-filter-notice';

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

  return `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
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

const formatDate = (value: string | null): string => {
  if (!value) return 'No disponible';

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeZone: 'America/Santiago',
  }).format(new Date(value));
};

const formatAmount = (opportunity: Opportunity): string => {
  if (!opportunity.amount) return 'No disponible';

  return opportunity.currency
    ? `${opportunity.currency} ${opportunity.amount}`
    : opportunity.amount;
};

const formatAnalyticsDate = (value: string | null): string => {
  if (!value) return 'No disponible';

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(new Date(value));
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
          {bucket.key ?? 'No informado'}: {bucket.count}
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
    setSearchInput,
    applyFilters,
    clearFilters,
    setSort,
    setAfter,
  } = useMercadoPublicoV2UrlState();
  const [notice, setNotice] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const queryFilter = useMemo(() => toQueryFilter(state), [state]);

  const { data, error, loading } = useQuery<
    MercadoPublicoV2ActiveQuery,
    MercadoPublicoV2ActiveQueryVariables
  >(MERCADO_PUBLICO_V2_OPPORTUNITIES_QUERY, {
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
  } = useQuery<
    MercadoPublicoV2AnalyticsQuery,
    Pick<MercadoPublicoV2ActiveQueryVariables, 'filter'>
  >(MERCADO_PUBLICO_V2_ANALYTICS_QUERY, {
    variables: { filter: queryFilter },
  });

  useEffect(() => {
    if (error === undefined) {
      return;
    }

    if (error.message.includes('Mercado Publico V2 cursor is invalid')) {
      setNotice(t`Cursor inválido; se volvió a la primera página.`);
      setAfter(null);

      return;
    }

    if (error.message.includes('Mercado Publico V2 filter:')) {
      setNotice(
        t`Los filtros ingresados no son válidos; revisa los rangos (desde/hasta o mínimo/máximo).`,
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
        pageTitle: t`Detalle de oportunidad`,
        pageIcon: IconDotsVertical,
        resetNavigationStack: true,
      });
    }
  }, [isSidePanelOpened, navigateSidePanel, state.proceso, t]);

  useEffect(() => {
    if (!isSidePanelOpened || state.proceso !== null) {
      return;
    }

    closeSidePanelMenu();
  }, [closeSidePanelMenu, isSidePanelOpened, state.proceso]);

  useEffect(() => {
    if (!hasMounted || isSidePanelOpened || state.proceso === null) {
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
    state.proceso,
  ]);

  const openOpportunity = useCallback(
    (opportunity: Opportunity) => {
      const next = new URLSearchParams(searchParams);

      next.set('proceso', opportunity.codigo);
      setSearchParams(next);

      navigateSidePanel({
        page: SidePanelPages.MercadoPublicoV2Opportunity,
        pageId: opportunity.codigo,
        pageTitle: t`Detalle de oportunidad`,
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

    setAfter(opportunities.pageInfo.endCursor);
  }, [opportunities, setAfter]);

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeading>{t`Activas`}</StyledHeading>
        {opportunities && (
          <StyledCount>{t`${opportunities.totalCount} oportunidades`}</StyledCount>
        )}
      </StyledHeader>

      <MercadoPublicoV2FilterBar
        filters={state}
        sort={state.sort}
        notice={notice}
        noticeId={FILTER_NOTICE_ID}
        onSearchChange={setSearchInput}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onSortChange={handleSortChange}
      />

      <StyledAnalytics aria-labelledby="mercado-publico-v2-analytics-heading">
        <StyledAnalyticsHeading id="mercado-publico-v2-analytics-heading">
          {t`Resumen del universo filtrado`}
        </StyledAnalyticsHeading>
        {analyticsLoading && (
          <StyledAnalyticsStatus role="status">
            {t`Calculando analítica del universo completo…`}
          </StyledAnalyticsStatus>
        )}
        {!analyticsLoading && analyticsError && (
          <StyledAnalyticsStatus role="status">
            {t`Analítica no disponible. No se calcularon cifras desde la página visible.`}
          </StyledAnalyticsStatus>
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
              {` · ${t`Frescura`}: ${analytics.freshness}`}
              {` · ${t`Calculado`}: ${formatAnalyticsDate(analytics.calculatedAt)}`}
              {` · ${t`Actualizado`}: ${formatAnalyticsDate(analytics.asOf)}`}
            </StyledAnalyticsStatus>
            <StyledAnalyticsStatus>
              {t`Cobertura conocida`}:{' '}
              {t`cierre ${analytics.coverage.closingAt}/${analytics.population}`}
              , {t`estado ${analytics.coverage.state}/${analytics.population}`},{' '}
              {t`región ${analytics.coverage.region}/${analytics.population}`},{' '}
              {t`monto ${analytics.coverage.amount}/${analytics.population}`},{' '}
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
      </StyledAnalytics>

      {loading && (
        <StyledEmptyState>{t`Cargando oportunidades…`}</StyledEmptyState>
      )}
      {!loading && error && (
        <StyledEmptyState>{t`No fue posible cargar las oportunidades.`}</StyledEmptyState>
      )}
      {!loading && !error && opportunities?.edges.length === 0 && (
        <StyledEmptyState>{t`No hay oportunidades disponibles.`}</StyledEmptyState>
      )}
      {!loading &&
        !error &&
        opportunities &&
        opportunities.edges.length > 0 && (
          <StyledTableContainer>
            <StyledTable>
              <thead>
                <tr>
                  <StyledHeaderCell>{t`Oportunidad`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Comprador / región`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Cierre`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Monto`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Documentos / ofertas`}</StyledHeaderCell>
                </tr>
              </thead>
              <tbody>
                {opportunities.edges.map(({ node }) => (
                  <tr key={node.codigo}>
                    <StyledCell>
                      <StyledOpportunityButton
                        aria-label={t`Abrir ${node.title ?? node.codigo}`}
                        onClick={() => openOpportunity(node)}
                      >
                        {node.title ?? node.codigo}
                      </StyledOpportunityButton>
                      <StyledSecondaryText>{node.codigo}</StyledSecondaryText>
                    </StyledCell>
                    <StyledCell>
                      {node.buyerName ?? 'No disponible'}
                      <StyledSecondaryText>
                        {node.region === null
                          ? t`Región no disponible`
                          : t`Región ${node.region}`}
                      </StyledSecondaryText>
                    </StyledCell>
                    <StyledCell>{formatDate(node.closingAt)}</StyledCell>
                    <StyledCell>{formatAmount(node)}</StyledCell>
                    <StyledCell>
                      {node.documentCount === null
                        ? t`No disponible`
                        : t`${node.documentCount} documentos`}
                      <StyledSecondaryText>{t`Ofertas: no disponible`}</StyledSecondaryText>
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
            title={t`Siguiente`}
            type="button"
            size="small"
            variant="secondary"
            disabled={!opportunities.pageInfo.hasNextPage}
            onClick={goToNextPage}
          />
        </StyledPagination>
      ) : null}
    </StyledPage>
  );
};
