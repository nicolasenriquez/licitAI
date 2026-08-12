import { gql } from '@apollo/client';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';

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
        llamado
        observationId
        normalizerVersion
        providerSchemaFingerprint
        availability
        description
        deliveryAddress
        deliveryDays
        cancellationAt
        callDescription
        callFirstClosingAt
        callSecondClosingAt
        budgetType
        budgetEstimate
        budgetCurrency
        cancelMotive
        desertedMotive
        selectionMotive
        totalOffers
        totalDemands
        finePenalty
        lifecycleReason
        detailFreshness {
          status
          lastError
          asOf
        }
        provenance {
          observationId
          normalizerVersion
          providerSchemaFingerprint
          snapshotKind
          source
          endpoint
          observedAt
          providerChangedAt
        }
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_DOCUMENTS_QUERY = gql`
  query MercadoPublicoV2Documents(
    $codigo: String!
    $observationId: String
    $after: String
    $first: Int
  ) {
    mercadoPublicoV2 {
      documents(
        codigo: $codigo
        observationId: $observationId
        after: $after
        first: $first
      ) {
        edges {
          cursor
          node {
            id
            name
            ordinal
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        availability {
          availability
          totalCount
          sourceKind
          asOf
        }
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_ITEMS_QUERY = gql`
  query MercadoPublicoV2Items(
    $codigo: String!
    $observationId: String
    $after: String
    $first: Int
  ) {
    mercadoPublicoV2 {
      items(
        codigo: $codigo
        observationId: $observationId
        after: $after
        first: $first
      ) {
        edges {
          cursor
          node {
            providerKey
            productCode
            name
            description
            quantity
            unit
            ordinal
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        availability {
          availability
          totalCount
          sourceKind
          asOf
        }
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_OFFERS_QUERY = gql`
  query MercadoPublicoV2Offers(
    $codigo: String!
    $observationId: String
    $after: String
    $first: Int
  ) {
    mercadoPublicoV2 {
      offers(
        codigo: $codigo
        observationId: $observationId
        after: $after
        first: $first
      ) {
        edges {
          cursor
          node {
            id
            providerId
            providerName
            providerRut
            totalAmount
            ordinal
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        availability {
          availability
          totalCount
          sourceKind
          asOf
        }
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_QUOTED_PRODUCTS_QUERY = gql`
  query MercadoPublicoV2QuotedProducts(
    $codigo: String!
    $observationId: String
    $after: String
    $first: Int
  ) {
    mercadoPublicoV2 {
      quotedProducts(
        codigo: $codigo
        observationId: $observationId
        after: $after
        first: $first
      ) {
        edges {
          cursor
          node {
            productCode
            name
            description
            quantity
            unitPrice
            totalAmount
            providerId
            providerName
            ordinal
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        availability {
          availability
          totalCount
          sourceKind
          asOf
        }
      }
    }
  }
`;

const MERCADO_PUBLICO_V2_RAW_PAYLOAD_QUERY = gql`
  query MercadoPublicoV2RawPayload($codigo: String!) {
    mercadoPublicoV2 {
      rawPayload(codigo: $codigo) {
        codigo
        observationId
        payload
        sourcePayloadChecksum
        sanitizedPayloadChecksum
        redacted
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
  llamado: number | null;
  observationId: string | null;
  normalizerVersion: string | null;
  providerSchemaFingerprint: string | null;
  availability: string;
  description: string | null;
  deliveryAddress: string | null;
  deliveryDays: number | null;
  cancellationAt: string | null;
  callDescription: string | null;
  callFirstClosingAt: string | null;
  callSecondClosingAt: string | null;
  budgetType: string | null;
  budgetEstimate: string | null;
  budgetCurrency: string | null;
  cancelMotive: string | null;
  desertedMotive: string | null;
  selectionMotive: string | null;
  totalOffers: number | null;
  totalDemands: number | null;
  finePenalty: string | null;
  lifecycleReason: string | null;
  detailFreshness: {
    status: string;
    lastError: string | null;
    asOf: string | null;
  } | null;
  provenance: {
    observationId: string | null;
    normalizerVersion: string | null;
    providerSchemaFingerprint: string | null;
    snapshotKind: string | null;
    source: string | null;
    endpoint: string | null;
    observedAt: string | null;
    providerChangedAt: string | null;
  } | null;
};

type DetailQuery = {
  mercadoPublicoV2: { opportunity: OpportunityDetail | null };
};

type RelationNode = {
  id?: string | null;
  name?: string | null;
  productCode?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: string | null;
  totalAmount?: string | null;
  providerId?: string | null;
  providerName?: string | null;
  providerRut?: string | null;
  ordinal: number;
};

type RelationConnection = {
  edges: Array<{ cursor: string; node: RelationNode }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  availability: {
    availability: string;
    totalCount: number | null;
    sourceKind: string | null;
    asOf: string | null;
  };
};

type RelationQuery = { mercadoPublicoV2: Record<string, RelationConnection> };

type SanitizedPayload = {
  codigo: string;
  observationId: string;
  payload: unknown;
  sourcePayloadChecksum: string;
  sanitizedPayloadChecksum: string;
  redacted: boolean;
};

type PayloadQuery = {
  mercadoPublicoV2: { rawPayload: SanitizedPayload | null };
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
  overflow-wrap: anywhere;
`;

const StyledCode = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledHistoryLink = styled(Link)`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  text-underline-offset: 2px;
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledHeading = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
`;

const StyledDetailList = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(120px, 0.7fr) minmax(0, 1.3fr);
  margin: 0;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
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

const StyledStatus = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledRelation = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledRelationItem = styled.li`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow-wrap: anywhere;
`;

const StyledRelationList = styled.ul`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledPayload = styled.pre`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
  max-height: 320px;
  overflow: auto;
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[3]};
  white-space: pre-wrap;
`;

const StyledButton = styled.button`
  align-self: flex-start;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font: inherit;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const formatDate = (value: string | null): string => {
  if (!value) return 'No informado por fuente';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
};

const valueOrFallback = (value: string | number | null): string | number =>
  value === null ? 'No informado por fuente' : value;

const RelationSection = ({
  label,
  testId,
  connection,
  error,
  nextPageLabel,
  onNext,
  t,
}: {
  label: string;
  testId: string;
  connection: RelationConnection | undefined;
  error: Error | undefined;
  nextPageLabel: string;
  onNext: () => void;
  t: ReturnType<typeof useLingui>['t'];
}) => {
  const nodes = connection?.edges.map(({ node }) => node) ?? [];
  const availability = connection?.availability;

  return (
    <StyledSection data-testid={testId}>
      <StyledHeading>{label}</StyledHeading>
      {error && (
        <StyledStatus>
          {t({ message: 'No fue posible cargar esta relación.' })}
        </StyledStatus>
      )}
      {availability?.availability === 'unavailable' && (
        <StyledStatus>
          {t({ message: 'Relación aún no disponible.' })}
        </StyledStatus>
      )}
      {availability?.availability === 'available' && nodes.length === 0 && (
        <StyledStatus>
          {t({ message: 'No hay elementos informados.' })}
        </StyledStatus>
      )}
      {nodes.length > 0 && (
        <StyledRelation>
          <StyledRelationList>
            {nodes.map((node) => (
              <StyledRelationItem
                key={`${node.ordinal}-${node.id ?? node.productCode ?? 'item'}`}
              >
                {node.name ??
                  node.productCode ??
                  node.id ??
                  t({ message: 'Elemento' })}
                {node.providerName ? ` · ${node.providerName}` : ''}
                {node.quantity !== null && node.quantity !== undefined
                  ? ` · ${node.quantity}`
                  : ''}
              </StyledRelationItem>
            ))}
          </StyledRelationList>
          {availability?.totalCount !== null &&
            availability?.totalCount !== undefined && (
              <StyledStatus>
                {`${availability.totalCount} elementos · ${availability.sourceKind ?? 'fuente'}`}
              </StyledStatus>
            )}
        </StyledRelation>
      )}
      {connection?.pageInfo.hasNextPage && (
        <StyledButton type="button" onClick={onNext}>
          {nextPageLabel}
        </StyledButton>
      )}
    </StyledSection>
  );
};

export const SidePanelMercadoPublicoV2OpportunityPage = () => {
  const { t } = useLingui();
  const context = useComponentInstanceStateContext(
    SidePanelPageComponentInstanceContext,
  );
  const codigo = context?.instanceId ?? '';
  const [documentAfter, setDocumentAfter] = useState<string | null>(null);
  const [itemAfter, setItemAfter] = useState<string | null>(null);
  const [offerAfter, setOfferAfter] = useState<string | null>(null);
  const [quotedProductAfter, setQuotedProductAfter] = useState<string | null>(
    null,
  );
  const [payloadVisible, setPayloadVisible] = useState(false);
  const payloadButtonRef = useRef<HTMLButtonElement>(null);
  const { data, error, loading } = useQuery<DetailQuery>(
    MERCADO_PUBLICO_V2_OPPORTUNITY_QUERY,
    { variables: { codigo }, skip: codigo.length === 0 },
  );
  const opportunity = data?.mercadoPublicoV2.opportunity;
  const observationId = opportunity?.observationId ?? undefined;
  const relationVariables = {
    codigo,
    observationId,
    first: 25,
  };
  const documents = useQuery<RelationQuery>(
    MERCADO_PUBLICO_V2_DOCUMENTS_QUERY,
    {
      variables: { ...relationVariables, after: documentAfter },
      skip: codigo.length === 0,
    },
  );
  const items = useQuery<RelationQuery>(MERCADO_PUBLICO_V2_ITEMS_QUERY, {
    variables: { ...relationVariables, after: itemAfter },
    skip: codigo.length === 0,
  });
  const offers = useQuery<RelationQuery>(MERCADO_PUBLICO_V2_OFFERS_QUERY, {
    variables: { ...relationVariables, after: offerAfter },
    skip: codigo.length === 0,
  });
  const quotedProducts = useQuery<RelationQuery>(
    MERCADO_PUBLICO_V2_QUOTED_PRODUCTS_QUERY,
    {
      variables: { ...relationVariables, after: quotedProductAfter },
      skip: codigo.length === 0,
    },
  );
  const [loadPayload, payloadQuery] = useLazyQuery<PayloadQuery>(
    MERCADO_PUBLICO_V2_RAW_PAYLOAD_QUERY,
  );

  useEffect(() => {
    if (!payloadVisible) return;

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopPropagation();
      setPayloadVisible(false);
      payloadButtonRef.current?.focus();
    };

    document.addEventListener('keydown', handleEscape, true);

    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [payloadVisible]);

  const togglePayload = (): void => {
    if (payloadVisible) {
      setPayloadVisible(false);
      payloadButtonRef.current?.focus();

      return;
    }

    setPayloadVisible(true);

    if (!payloadQuery.data && !payloadQuery.loading) {
      void loadPayload({ variables: { codigo } });
    }
  };

  if (loading)
    return <StyledContent>{t({ message: 'Cargando detalle…' })}</StyledContent>;
  if (error || !opportunity) {
    return (
      <StyledContent>{t({ message: 'Detalle no disponible.' })}</StyledContent>
    );
  }

  const payload = payloadQuery.data?.mercadoPublicoV2.rawPayload;

  return (
    <StyledContent>
      <div>
        <StyledTitle>{opportunity.title ?? opportunity.codigo}</StyledTitle>
        <StyledCode>{opportunity.codigo}</StyledCode>
      </div>

      <StyledHistoryLink
        to={`${AppPath.MercadoPublicoV2History}?codigo=${encodeURIComponent(opportunity.codigo)}`}
      >
        {t({ message: 'Ver historial' })}
      </StyledHistoryLink>

      <StyledSection>
        <StyledHeading>{t({ message: 'Identidad y estado' })}</StyledHeading>
        <StyledDetailList>
          <StyledLabel>{t({ message: 'Estado' })}</StyledLabel>
          <StyledValue>{valueOrFallback(opportunity.state)}</StyledValue>
          <StyledLabel>{t({ message: 'Llamado' })}</StyledLabel>
          <StyledValue>{valueOrFallback(opportunity.llamado)}</StyledValue>
          <StyledLabel>{t({ message: 'Comprador' })}</StyledLabel>
          <StyledValue>{valueOrFallback(opportunity.buyerName)}</StyledValue>
          <StyledLabel>{t({ message: 'Región' })}</StyledLabel>
          <StyledValue>{valueOrFallback(opportunity.region)}</StyledValue>
        </StyledDetailList>
      </StyledSection>

      <StyledSection>
        <StyledHeading>{t({ message: 'Fechas y monto' })}</StyledHeading>
        <StyledDetailList>
          <StyledLabel>{t({ message: 'Publicación' })}</StyledLabel>
          <StyledValue>{formatDate(opportunity.publishedAt)}</StyledValue>
          <StyledLabel>{t({ message: 'Cierre' })}</StyledLabel>
          <StyledValue>{formatDate(opportunity.closingAt)}</StyledValue>
          <StyledLabel>{t({ message: 'Monto' })}</StyledLabel>
          <StyledValue>
            {opportunity.amount === null
              ? t({ message: 'No informado por fuente' })
              : `${opportunity.currency ?? ''} ${opportunity.amount}`.trim()}
          </StyledValue>
        </StyledDetailList>
      </StyledSection>

      <StyledSection>
        <StyledHeading>{t({ message: 'Necesidad' })}</StyledHeading>
        <StyledDetailList>
          <StyledLabel>{t({ message: 'Descripción' })}</StyledLabel>
          <StyledValue>{valueOrFallback(opportunity.description)}</StyledValue>
          <StyledLabel>{t({ message: 'Entrega' })}</StyledLabel>
          <StyledValue>
            {opportunity.deliveryAddress === null
              ? t({ message: 'No informado por fuente' })
              : `${opportunity.deliveryAddress}${
                  opportunity.deliveryDays === null
                    ? ''
                    : ` · ${opportunity.deliveryDays} días`
                }`}
          </StyledValue>
          <StyledLabel>{t({ message: 'Tipo de presupuesto' })}</StyledLabel>
          <StyledValue>{valueOrFallback(opportunity.budgetType)}</StyledValue>
          <StyledLabel>{t({ message: 'Presupuesto estimado' })}</StyledLabel>
          <StyledValue>
            {opportunity.budgetEstimate === null
              ? t({ message: 'No informado por fuente' })
              : `${opportunity.budgetCurrency ?? ''} ${opportunity.budgetEstimate}`.trim()}
          </StyledValue>
        </StyledDetailList>
      </StyledSection>

      <StyledSection>
        <StyledHeading>
          {t({ message: 'Motivos de cancelación' })}
        </StyledHeading>
        <StyledDetailList>
          <StyledLabel>{t({ message: 'Motivo de cancelación' })}</StyledLabel>
          <StyledValue>{valueOrFallback(opportunity.cancelMotive)}</StyledValue>
          <StyledLabel>{t({ message: 'Motivo de desierta' })}</StyledLabel>
          <StyledValue>
            {valueOrFallback(opportunity.desertedMotive)}
          </StyledValue>
          <StyledLabel>{t({ message: 'Motivo de selección' })}</StyledLabel>
          <StyledValue>
            {valueOrFallback(opportunity.selectionMotive)}
          </StyledValue>
        </StyledDetailList>
      </StyledSection>

      <StyledSection>
        <StyledHeading>{t({ message: 'Ciclo de vida' })}</StyledHeading>
        <StyledDetailList>
          <StyledLabel>{t({ message: 'Razón' })}</StyledLabel>
          <StyledValue>
            {valueOrFallback(opportunity.lifecycleReason)}
          </StyledValue>
          <StyledLabel>{t({ message: 'Disponibilidad' })}</StyledLabel>
          <StyledValue>{opportunity.availability}</StyledValue>
          <StyledLabel>{t({ message: 'Frescura' })}</StyledLabel>
          <StyledValue>
            {opportunity.detailFreshness?.status ??
              t({ message: 'No disponible' })}
            {opportunity.detailFreshness?.lastError
              ? ` · ${opportunity.detailFreshness.lastError}`
              : ''}
          </StyledValue>
        </StyledDetailList>
      </StyledSection>

      <RelationSection
        label={t({ message: 'Documentos' })}
        testId="relation-documents"
        connection={documents.data?.mercadoPublicoV2.documents}
        error={documents.error}
        nextPageLabel={t({ message: 'Siguiente página de documentos' })}
        onNext={() =>
          setDocumentAfter(
            documents.data?.mercadoPublicoV2.documents.pageInfo.endCursor ??
              null,
          )
        }
        t={t}
      />
      <RelationSection
        label={t({ message: 'Ítems solicitados' })}
        testId="relation-items"
        connection={items.data?.mercadoPublicoV2.items}
        error={items.error}
        nextPageLabel={t({ message: 'Siguiente página de ítems' })}
        onNext={() =>
          setItemAfter(
            items.data?.mercadoPublicoV2.items.pageInfo.endCursor ?? null,
          )
        }
        t={t}
      />
      <RelationSection
        label={t({ message: 'Ofertas' })}
        testId="relation-offers"
        connection={offers.data?.mercadoPublicoV2.offers}
        error={offers.error}
        nextPageLabel={t({ message: 'Siguiente página de ofertas' })}
        onNext={() =>
          setOfferAfter(
            offers.data?.mercadoPublicoV2.offers.pageInfo.endCursor ?? null,
          )
        }
        t={t}
      />
      <RelationSection
        label={t({ message: 'Productos cotizados' })}
        testId="relation-quoted-products"
        connection={quotedProducts.data?.mercadoPublicoV2.quotedProducts}
        error={quotedProducts.error}
        nextPageLabel={t({
          message: 'Siguiente página de productos cotizados',
        })}
        onNext={() =>
          setQuotedProductAfter(
            quotedProducts.data?.mercadoPublicoV2.quotedProducts.pageInfo
              .endCursor ?? null,
          )
        }
        t={t}
      />

      <StyledSection>
        <StyledHeading>{t({ message: 'Procedencia' })}</StyledHeading>
        <StyledDetailList>
          <StyledLabel>{t({ message: 'Observación' })}</StyledLabel>
          <StyledValue>
            {opportunity.provenance?.observationId ??
              opportunity.observationId ??
              t({ message: 'No disponible' })}
          </StyledValue>
          <StyledLabel>{t({ message: 'Normalizador' })}</StyledLabel>
          <StyledValue>
            {opportunity.provenance?.normalizerVersion ??
              opportunity.normalizerVersion ??
              t({ message: 'No disponible' })}
          </StyledValue>
          <StyledLabel>{t({ message: 'Snapshot' })}</StyledLabel>
          <StyledValue>
            {opportunity.provenance?.snapshotKind ??
              t({ message: 'No disponible' })}
          </StyledValue>
          <StyledLabel>{t({ message: 'Observado' })}</StyledLabel>
          <StyledValue>
            {formatDate(opportunity.provenance?.observedAt ?? null)}
          </StyledValue>
        </StyledDetailList>
      </StyledSection>

      <StyledSection>
        <StyledHeading>{t({ message: 'Payload de fuente' })}</StyledHeading>
        <StyledButton
          ref={payloadButtonRef}
          type="button"
          aria-expanded={payloadVisible}
          onClick={togglePayload}
        >
          {payloadVisible
            ? t({ message: 'Ocultar JSON sanitizado' })
            : t({ message: 'Ver JSON sanitizado' })}
        </StyledButton>
        <StyledPayload data-testid="sanitized-payload" hidden={!payloadVisible}>
          {payloadQuery.loading
            ? t({ message: 'Cargando payload…' })
            : payloadQuery.error
              ? t({ message: 'Payload no disponible.' })
              : JSON.stringify(payload?.payload ?? null, null, 2)}
        </StyledPayload>
        {payloadVisible && payload && (
          <StyledStatus>
            {payload.redacted
              ? t({ message: 'Contenido sanitizado antes de exponerlo.' })
              : t({ message: 'La fuente no requirió redacción.' })}
          </StyledStatus>
        )}
      </StyledSection>
    </StyledContent>
  );
};
