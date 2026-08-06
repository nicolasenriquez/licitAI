import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';

import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { useComponentInstanceStateContext } from '@/ui/utilities/state/component-state/hooks/useComponentInstanceStateContext';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const MERCADO_PUBLICO_V2_OPPORTUNITY_QUERY = gql`
  query MercadoPublicoV2Opportunity($codigo: String!) {
    mercadoPublicoV2 {
      opportunity(codigo: $codigo) {
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
        observationId
        normalizerVersion
        providerSchemaFingerprint
        availability
      }
    }
  }
`;

type OpportunityDetail = {
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
  observationId: string | null;
  normalizerVersion: string | null;
  providerSchemaFingerprint: string | null;
  availability: string;
};

type MercadoPublicoV2OpportunityQuery = {
  mercadoPublicoV2: { opportunity: OpportunityDetail | null };
};

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  margin: 0;
`;

const StyledCode = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDetailList = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(100px, 0.7fr) minmax(0, 1.3fr);
  margin: 0;
`;

const StyledLabel = styled.dt`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledValue = styled.dd`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
  overflow-wrap: anywhere;
`;

export const SidePanelMercadoPublicoV2OpportunityPage = () => {
  const { t } = useLingui();
  const context = useComponentInstanceStateContext(
    SidePanelPageComponentInstanceContext,
  );
  const codigo = context?.instanceId ?? '';
  const { data, error, loading } = useQuery<MercadoPublicoV2OpportunityQuery>(
    MERCADO_PUBLICO_V2_OPPORTUNITY_QUERY,
    { variables: { codigo }, skip: codigo.length === 0 },
  );
  const opportunity = data?.mercadoPublicoV2.opportunity;

  if (loading) return <StyledContent>{t`Cargando detalle…`}</StyledContent>;
  if (error || !opportunity) {
    return <StyledContent>{t`Detalle no disponible.`}</StyledContent>;
  }

  return (
    <StyledContent>
      <div>
        <StyledTitle>{opportunity.title ?? opportunity.codigo}</StyledTitle>
        <StyledCode>{opportunity.codigo}</StyledCode>
      </div>
      <StyledDetailList>
        <StyledLabel>{t`Estado`}</StyledLabel>
        <StyledValue>{opportunity.state ?? t`No disponible`}</StyledValue>
        <StyledLabel>{t`Comprador`}</StyledLabel>
        <StyledValue>{opportunity.buyerName ?? t`No disponible`}</StyledValue>
        <StyledLabel>{t`Región`}</StyledLabel>
        <StyledValue>{opportunity.region ?? t`No disponible`}</StyledValue>
        <StyledLabel>{t`Publicación`}</StyledLabel>
        <StyledValue>{opportunity.publishedAt ?? t`No disponible`}</StyledValue>
        <StyledLabel>{t`Cierre`}</StyledLabel>
        <StyledValue>{opportunity.closingAt ?? t`No disponible`}</StyledValue>
        <StyledLabel>{t`Monto`}</StyledLabel>
        <StyledValue>
          {opportunity.amount
            ? `${opportunity.currency ?? ''} ${opportunity.amount}`.trim()
            : t`No disponible`}
        </StyledValue>
        <StyledLabel>{t`Documentos`}</StyledLabel>
        <StyledValue>
          {opportunity.documentCount ?? t`No disponible`}
        </StyledValue>
        <StyledLabel>{t`Disponibilidad`}</StyledLabel>
        <StyledValue>{opportunity.availability}</StyledValue>
        <StyledLabel>{t`Evidencia`}</StyledLabel>
        <StyledValue>
          {opportunity.observationId ?? t`No disponible`}
        </StyledValue>
        <StyledLabel>{t`Normalizador`}</StyledLabel>
        <StyledValue>
          {opportunity.normalizerVersion ?? t`No disponible`}
        </StyledValue>
      </StyledDetailList>
    </StyledContent>
  );
};
