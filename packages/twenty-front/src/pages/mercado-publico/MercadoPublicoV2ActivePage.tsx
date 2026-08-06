import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';

import { useNavigateSidePanel } from '@/side-panel/hooks/useNavigateSidePanel';
import { SidePanelPages } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IconDotsVertical } from 'twenty-ui/icon';

const MERCADO_PUBLICO_V2_OPPORTUNITIES_QUERY = gql`
  query MercadoPublicoV2ActiveOpportunities {
    mercadoPublicoV2 {
      opportunities(first: 50) {
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
  documentCount: number;
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

const StyledEmptyState = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
  padding: ${themeCssVariables.spacing[5]};
`;

const formatDate = (value: string | null): string => {
  if (!value) return 'No disponible';

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
  }).format(new Date(value));
};

const formatAmount = (opportunity: Opportunity): string => {
  if (!opportunity.amount) return 'No disponible';

  return opportunity.currency
    ? `${opportunity.currency} ${opportunity.amount}`
    : opportunity.amount;
};

export const MercadoPublicoV2ActivePage = () => {
  const { t } = useLingui();
  const { navigateSidePanel } = useNavigateSidePanel();
  const { data, error, loading } = useQuery<MercadoPublicoV2ActiveQuery>(
    MERCADO_PUBLICO_V2_OPPORTUNITIES_QUERY,
  );

  const openOpportunity = useCallback(
    (opportunity: Opportunity) => {
      navigateSidePanel({
        page: SidePanelPages.MercadoPublicoV2Opportunity,
        pageId: opportunity.codigo,
        pageTitle: t`Detalle de oportunidad`,
        pageIcon: IconDotsVertical,
        resetNavigationStack: true,
      });
    },
    [navigateSidePanel, t],
  );

  const opportunities = data?.mercadoPublicoV2.opportunities;

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeading>{t`Activas`}</StyledHeading>
        {opportunities && (
          <StyledCount>{t`${opportunities.totalCount} oportunidades`}</StyledCount>
        )}
      </StyledHeader>

      {loading && (
        <StyledEmptyState>{t`Cargando oportunidades…`}</StyledEmptyState>
      )}
      {error && (
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
                      {node.documentCount} {t`documentos`}
                      <StyledSecondaryText>{t`Ofertas: no disponible`}</StyledSecondaryText>
                    </StyledCell>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledTableContainer>
        )}
    </StyledPage>
  );
};
