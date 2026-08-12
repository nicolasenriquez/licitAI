import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Temporal } from 'temporal-polyfill';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';
import { AppPath } from 'twenty-shared/types';

import { MercadoPublicoV2Nav } from '@/mercado-publico/components/MercadoPublicoV2Nav';
import {
  useMercadoPublicoV2UrlState,
  type MercadoPublicoV2Filters,
} from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

const MERCADO_PUBLICO_V2_BUYERS_QUERY = gql`
  query MercadoPublicoV2Buyers(
    $filter: MercadoPublicoV2OpportunityFilterInput
    $after: String
    $first: Int
  ) {
    mercadoPublicoV2 {
      buyers(filter: $filter, after: $after, first: $first) {
        edges {
          cursor
          node {
            buyerCode
            buyerName
            opportunityCount
            buyerCoverage
            amountCoverage
            availability
            completeness
            asOf
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

type Buyer = {
  buyerCode: string;
  buyerName: string | null;
  opportunityCount: number;
  buyerCoverage: number;
  amountCoverage: number;
  availability: string;
  completeness: string;
  asOf: string | null;
};

type MercadoPublicoV2BuyersQuery = {
  mercadoPublicoV2: {
    buyers: {
      edges: Array<{ cursor: string; node: Buyer }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
};

type MercadoPublicoV2BuyersQueryVariables = {
  filter?: MercadoPublicoV2Filters | null;
  after?: string | null;
  first?: number;
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

const StyledTableContainer = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  max-width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 680px;
  width: 100%;

  @media (max-width: 600px) {
    display: block;
    min-width: 0;

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

    tbody td:first-child {
      grid-column: 1 / -1;
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

const StyledBuyerLink = styled(Link)`
  color: ${themeCssVariables.font.color.primary};
  overflow-wrap: anywhere;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledSecondaryText = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-top: ${themeCssVariables.spacing[1]};
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

const StyledPagination = styled.nav`
  display: flex;
  justify-content: flex-end;
`;

const formatCoverage = (coverage: number): string =>
  `${Math.round(coverage * 100)}%`;

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

const formatDate = (value: string | null): string => {
  if (value === null) {
    return 'No informado por fuente';
  }

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

const getAvailabilityLabel = (
  availability: string,
  t: ReturnType<typeof useLingui>['t'],
): string => {
  if (availability === 'available') {
    return t`Disponible`;
  }

  if (availability === 'partial') {
    return t`Resultados parciales`;
  }

  return t`Datos no disponibles`;
};

export const MercadoPublicoV2BuyersPage = () => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useMercadoPublicoV2UrlState();
  const queryFilter = toQueryFilter(state);

  const { data, error, loading, refetch } = useQuery<
    MercadoPublicoV2BuyersQuery,
    MercadoPublicoV2BuyersQueryVariables
  >(MERCADO_PUBLICO_V2_BUYERS_QUERY, {
    variables: { filter: queryFilter, after: state.after, first: 50 },
  });

  const goToNextPage = useCallback(() => {
    const endCursor = data?.mercadoPublicoV2.buyers.pageInfo.endCursor;

    if (endCursor === null || endCursor === undefined) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set('after', endCursor);
    setSearchParams(next);
  }, [data, searchParams, setSearchParams]);

  const buildBuyerPath = useCallback(
    (buyerCode: string): string => {
      const next = new URLSearchParams(searchParams);
      next.set('buyer', buyerCode);
      next.delete('after');
      next.delete('proceso');

      return `${AppPath.MercadoPublico}?${next.toString()}`;
    },
    [searchParams],
  );

  const connection = data?.mercadoPublicoV2.buyers;

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeading>{t`Compradores`}</StyledHeading>
        <MercadoPublicoV2Nav />
      </StyledHeader>

      {loading && (
        <StyledStateMessage role="status" aria-live="polite">
          {t`Cargando compradores…`}
        </StyledStateMessage>
      )}

      {!loading && error && (
        <StyledStateMessage role="alert">
          <span>{t`No fue posible cargar los compradores.`}</span>
          <Button
            title={t`Reintentar compradores`}
            type="button"
            size="small"
            variant="secondary"
            onClick={() => void refetch()}
          />
        </StyledStateMessage>
      )}

      {!loading && !error && connection?.edges.length === 0 && (
        <StyledStateMessage role="status" aria-live="polite">
          {t`No hay compradores para la población filtrada.`}
        </StyledStateMessage>
      )}

      {!loading && !error && connection && connection.edges.length > 0 && (
        <>
          <StyledStateMessage role="status" aria-live="polite">
            {t`Cobertura de comprador y disponibilidad declaradas para la población filtrada.`}
          </StyledStateMessage>
          <StyledTableContainer>
            <StyledTable>
              <StyledTableCaption>
                {t`Compradores de la población filtrada`}
              </StyledTableCaption>
              <thead>
                <tr>
                  <StyledHeaderCell>{t`Comprador`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Oportunidades`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Cobertura de comprador`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Cobertura de monto`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Estado y frescura`}</StyledHeaderCell>
                </tr>
              </thead>
              <tbody>
                {connection.edges.map(({ node }) => (
                  <tr key={node.buyerCode}>
                    <StyledCell data-label={t`Comprador`}>
                      <StyledBuyerLink to={buildBuyerPath(node.buyerCode)}>
                        {node.buyerCode}
                      </StyledBuyerLink>
                      <StyledSecondaryText>
                        {node.buyerName ?? t`Nombre no informado por fuente`}
                      </StyledSecondaryText>
                    </StyledCell>
                    <StyledCell data-label={t`Oportunidades`}>
                      {node.opportunityCount}
                    </StyledCell>
                    <StyledCell data-label={t`Cobertura de comprador`}>
                      {formatCoverage(node.buyerCoverage)}
                    </StyledCell>
                    <StyledCell data-label={t`Cobertura de monto`}>
                      {formatCoverage(node.amountCoverage)}
                    </StyledCell>
                    <StyledCell data-label={t`Estado y frescura`}>
                      <div>{getAvailabilityLabel(node.availability, t)}</div>
                      <StyledSecondaryText>
                        {node.completeness === 'complete'
                          ? t`Completitud completa`
                          : t`Completitud parcial`}
                        {` · ${formatDate(node.asOf)}`}
                      </StyledSecondaryText>
                    </StyledCell>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledTableContainer>

          {connection.pageInfo.hasNextPage && (
            <StyledPagination aria-label={t`Paginación de compradores`}>
              <Button
                title={t`Siguiente`}
                type="button"
                size="small"
                variant="secondary"
                onClick={goToNextPage}
              />
            </StyledPagination>
          )}
        </>
      )}
    </StyledPage>
  );
};
