import { gql } from '@apollo/client';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import {
  formatMercadoPublicoAvailability,
  formatMercadoPublicoFreshness,
} from '@/mercado-publico/utils/format-mercado-publico-data-status';
import {
  formatMercadoPublicoAmount,
  formatMercadoPublicoDate,
  formatMercadoPublicoRegion,
} from '@/mercado-publico/utils/format-mercado-publico-display';
import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { TabList } from '@/ui/layout/tab-list/components/TabList';
import { useComponentInstanceStateContext } from '@/ui/utilities/state/component-state/hooks/useComponentInstanceStateContext';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  MercadoPublicoV2HistoryDocument,
  type MercadoPublicoV2HistoryQuery,
  type MercadoPublicoV2HistoryQueryVariables,
} from '~/generated/graphql';

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
        amountClp
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
  amountClp: string | null;
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

const StyledHeaderSummary = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const StyledHistoryLink = styled(Link)`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  text-underline-offset: 2px;
`;

const StyledHistoryList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledHistoryItem = styled.li`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledDisclosure = styled.details`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  padding-top: ${themeCssVariables.spacing[3]};

  > summary {
    color: ${themeCssVariables.font.color.primary};
    cursor: pointer;
    font-size: ${themeCssVariables.font.size.md};
    font-weight: ${themeCssVariables.font.weight.medium};
    margin-bottom: ${themeCssVariables.spacing[3]};
  }

  > summary:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
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

const valueOrFallback = (value: string | number | null): string | number =>
  value === null ? 'No informado por fuente' : value;

const getDocumentType = (name: string | null | undefined): string => {
  const extension = name?.split('.').at(-1)?.toUpperCase();

  return extension && extension !== name?.toUpperCase() ? extension : 'Archivo';
};

const formatMercadoPublicoState = (
  state: string | null,
  t: ReturnType<typeof useLingui>['t'],
): string => {
  switch (state) {
    case 'publicada':
      return t({ message: 'Publicada' });
    case 'cerrada':
      return t({ message: 'Cerrada' });
    case 'desierta':
      return t({ message: 'Desierta' });
    case 'cancelada':
      return t({ message: 'Cancelada' });
    case 'proveedor_seleccionado':
      return t({ message: 'Proveedor seleccionado' });
    case 'oc_emitida':
      return t({ message: 'Orden de compra emitida' });
    default:
      return state ?? t({ message: 'No informado por fuente' });
  }
};

const DocumentsSection = ({
  connection,
  error,
  loading,
  nextPageLabel,
  onRetry,
  onNext,
  t,
}: {
  connection: RelationConnection | undefined;
  error: Error | undefined;
  loading: boolean;
  nextPageLabel: string;
  onRetry: () => void;
  onNext: () => void;
  t: ReturnType<typeof useLingui>['t'];
}) => {
  const nodes = connection?.edges.map(({ node }) => node) ?? [];
  const availability = connection?.availability;

  return (
    <StyledSection data-testid="relation-documents">
      <StyledHeading>{t({ message: 'Documentos' })}</StyledHeading>
      {loading && (
        <StyledStatus role="status">{t({ message: 'Cargando…' })}</StyledStatus>
      )}
      {error && (
        <>
          <StyledStatus>
            {t({ message: 'No fue posible cargar los documentos.' })}
          </StyledStatus>
          <StyledButton type="button" onClick={onRetry}>
            {t({ message: 'Reintentar documentos' })}
          </StyledButton>
        </>
      )}
      {!error && availability?.availability === 'unavailable' && (
        <StyledStatus>
          {t({ message: 'Documentos no disponibles desde la fuente.' })}
        </StyledStatus>
      )}
      {!error &&
        availability?.availability === 'available' &&
        nodes.length === 0 && (
          <StyledStatus>
            {t({ message: 'No hay documentos informados.' })}
          </StyledStatus>
        )}
      {nodes.length > 0 && (
        <StyledRelation>
          <StyledRelationList>
            {nodes.map((node) => {
              const documentName =
                node.name ?? node.id ?? t({ message: 'Documento' });

              return (
                <StyledRelationItem
                  key={`${node.ordinal}-${node.id ?? 'document'}`}
                  aria-label={`${documentName} · ${getDocumentType(node.name)} · ${t({ message: 'Localizador no informado' })}`}
                >
                  {documentName} · {getDocumentType(node.name)}
                  <StyledStatus>
                    {t({ message: 'Localizador no informado' })}
                  </StyledStatus>
                </StyledRelationItem>
              );
            })}
          </StyledRelationList>
          {availability?.totalCount !== null &&
            availability?.totalCount !== undefined && (
              <StyledStatus>
                {`${availability.totalCount} documentos · ${availability.sourceKind ?? 'fuente'}`}
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

const RelationSection = ({
  label,
  testId,
  connection,
  error,
  loading,
  nextPageLabel,
  onRetry,
  onNext,
  t,
}: {
  label: string;
  testId: string;
  connection: RelationConnection | undefined;
  error: Error | undefined;
  loading: boolean;
  nextPageLabel: string;
  onRetry: () => void;
  onNext: () => void;
  t: ReturnType<typeof useLingui>['t'];
}) => {
  const nodes = connection?.edges.map(({ node }) => node) ?? [];
  const availability = connection?.availability;

  if (availability?.availability === 'unavailable' && !error) {
    return null;
  }

  return (
    <StyledDisclosure data-testid={testId}>
      <summary>{label}</summary>
      {loading && (
        <StyledStatus role="status">{t({ message: 'Cargando…' })}</StyledStatus>
      )}
      {error && (
        <>
          <StyledStatus>
            {t({ message: 'No fue posible cargar esta relación.' })}
          </StyledStatus>
          <StyledButton type="button" onClick={onRetry}>
            {t({ message: 'Reintentar' })}
          </StyledButton>
        </>
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
                {testId === 'relation-documents' &&
                  ` · ${getDocumentType(node.name)}`}
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
    </StyledDisclosure>
  );
};

export const SidePanelMercadoPublicoV2OpportunityPage = () => {
  const { t } = useLingui();
  const apolloCoreClient = useApolloCoreClient();
  const location = useLocation();
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
  const [activeTab, setActiveTab] = useState('summary');
  const payloadButtonRef = useRef<HTMLButtonElement>(null);
  const { data, error, loading, refetch } = useQuery<DetailQuery>(
    MERCADO_PUBLICO_V2_OPPORTUNITY_QUERY,
    {
      client: apolloCoreClient,
      variables: { codigo },
      skip: codigo.length === 0,
    },
  );
  const historyQuery = useQuery<
    MercadoPublicoV2HistoryQuery,
    MercadoPublicoV2HistoryQueryVariables
  >(MercadoPublicoV2HistoryDocument, {
    client: apolloCoreClient,
    variables: { codigo, after: null, first: 10 },
    skip: codigo.length === 0 || activeTab !== 'summary',
  });
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
      client: apolloCoreClient,
      variables: { ...relationVariables, after: documentAfter },
      skip: codigo.length === 0 || activeTab !== 'documents',
    },
  );
  const items = useQuery<RelationQuery>(MERCADO_PUBLICO_V2_ITEMS_QUERY, {
    client: apolloCoreClient,
    variables: { ...relationVariables, after: itemAfter },
    skip: codigo.length === 0 || activeTab !== 'relations',
  });
  const offers = useQuery<RelationQuery>(MERCADO_PUBLICO_V2_OFFERS_QUERY, {
    client: apolloCoreClient,
    variables: { ...relationVariables, after: offerAfter },
    skip: codigo.length === 0 || activeTab !== 'relations',
  });
  const quotedProducts = useQuery<RelationQuery>(
    MERCADO_PUBLICO_V2_QUOTED_PRODUCTS_QUERY,
    {
      client: apolloCoreClient,
      variables: { ...relationVariables, after: quotedProductAfter },
      skip: codigo.length === 0 || activeTab !== 'relations',
    },
  );
  const [loadPayload, payloadQuery] = useLazyQuery<PayloadQuery>(
    MERCADO_PUBLICO_V2_RAW_PAYLOAD_QUERY,
    { client: apolloCoreClient },
  );

  useEffect(() => {
    setDocumentAfter(null);
    setItemAfter(null);
    setOfferAfter(null);
    setQuotedProductAfter(null);
    setPayloadVisible(false);
    setActiveTab('summary');
  }, [codigo]);

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

    if (
      payloadQuery.data?.mercadoPublicoV2.rawPayload?.codigo !== codigo &&
      !payloadQuery.loading
    ) {
      void loadPayload({ variables: { codigo } });
    }
  };

  if (loading)
    return (
      <StyledContent role="status" aria-live="polite">
        {t({ message: 'Cargando detalle…' })}
      </StyledContent>
    );
  if (error || !opportunity) {
    return (
      <StyledContent role="alert">
        <StyledStatus>{t({ message: 'Detalle no disponible.' })}</StyledStatus>
        <StyledButton type="button" onClick={() => void refetch()}>
          {t({ message: 'Reintentar' })}
        </StyledButton>
      </StyledContent>
    );
  }

  const payload = payloadQuery.data?.mercadoPublicoV2.rawPayload;
  const freshness = opportunity.detailFreshness
    ? formatMercadoPublicoFreshness(opportunity.detailFreshness.status, t)
    : null;

  return (
    <StyledContent>
      <div>
        <StyledTitle>{opportunity.title ?? opportunity.codigo}</StyledTitle>
        <StyledCode>{opportunity.codigo}</StyledCode>
      </div>

      <StyledHeaderSummary aria-label={t({ message: 'Resumen del proceso' })}>
        <StyledLabel>Estado</StyledLabel>
        <StyledValue>
          {formatMercadoPublicoState(opportunity.state, t)}
        </StyledValue>
        <StyledLabel>Cierre</StyledLabel>
        <StyledValue>
          {formatMercadoPublicoDate(opportunity.closingAt)}
        </StyledValue>
        <StyledLabel>Monto publicado</StyledLabel>
        <StyledValue>
          {formatMercadoPublicoAmount(
            opportunity.amount,
            opportunity.currency,
            opportunity.amountClp,
          )}
        </StyledValue>
        <StyledLabel>Comprador</StyledLabel>
        <StyledValue>{valueOrFallback(opportunity.buyerName)}</StyledValue>
        <StyledLabel>Región</StyledLabel>
        <StyledValue>
          {opportunity.region === null
            ? t({ message: 'No informado por fuente' })
            : formatMercadoPublicoRegion(opportunity.region)}
        </StyledValue>
        <StyledLabel>Código</StyledLabel>
        <StyledValue>{opportunity.codigo}</StyledValue>
      </StyledHeaderSummary>

      <TabList
        tabs={[
          { id: 'summary', title: 'Resumen' },
          { id: 'relations', title: 'Ítems' },
          { id: 'documents', title: 'Documentos' },
          { id: 'evidence', title: 'Trazabilidad' },
        ]}
        behaveAsLinks={false}
        componentInstanceId={`mercado-publico-v2-opportunity-tabs-${codigo}`}
        isInSidePanel
        onChangeTab={setActiveTab}
      />

      {activeTab === 'summary' && (
        <>
          <StyledSection>
            <StyledHeading>Resumen</StyledHeading>
            <StyledDetailList>
              <StyledLabel>Estado</StyledLabel>
              <StyledValue>{valueOrFallback(opportunity.state)}</StyledValue>
              <StyledLabel>Comprador</StyledLabel>
              <StyledValue>
                {valueOrFallback(opportunity.buyerName)}
              </StyledValue>
              <StyledLabel>Cierre</StyledLabel>
              <StyledValue>
                {formatMercadoPublicoDate(opportunity.closingAt)}
              </StyledValue>
              <StyledLabel>Monto publicado</StyledLabel>
              <StyledValue>
                {formatMercadoPublicoAmount(
                  opportunity.amount,
                  opportunity.currency,
                  opportunity.amountClp,
                )}
              </StyledValue>
              <StyledLabel>Región</StyledLabel>
              <StyledValue>
                {opportunity.region === null
                  ? t({ message: 'No informado por fuente' })
                  : formatMercadoPublicoRegion(opportunity.region)}
              </StyledValue>
              <StyledLabel>Llamado</StyledLabel>
              <StyledValue>{valueOrFallback(opportunity.llamado)}</StyledValue>
              <StyledLabel>Descripción</StyledLabel>
              <StyledValue>
                {valueOrFallback(opportunity.description)}
              </StyledValue>
            </StyledDetailList>
          </StyledSection>

          {(opportunity.deliveryAddress !== null ||
            opportunity.deliveryDays !== null ||
            opportunity.budgetType !== null ||
            opportunity.budgetEstimate !== null) && (
            <StyledDisclosure>
              <summary>Entrega y presupuesto</summary>
              <StyledDetailList>
                <StyledLabel>Entrega</StyledLabel>
                <StyledValue>
                  {opportunity.deliveryAddress === null
                    ? t({ message: 'No informado por fuente' })
                    : `${opportunity.deliveryAddress}${
                        opportunity.deliveryDays === null
                          ? ''
                          : ` · ${opportunity.deliveryDays} días`
                      }`}
                </StyledValue>
                <StyledLabel>Tipo de presupuesto</StyledLabel>
                <StyledValue>
                  {valueOrFallback(opportunity.budgetType)}
                </StyledValue>
                <StyledLabel>Presupuesto estimado</StyledLabel>
                <StyledValue>
                  {opportunity.budgetEstimate === null
                    ? t({ message: 'No informado por fuente' })
                    : `${opportunity.budgetCurrency ?? ''} ${opportunity.budgetEstimate}`.trim()}
                </StyledValue>
              </StyledDetailList>
            </StyledDisclosure>
          )}

          {(opportunity.cancelMotive !== null ||
            opportunity.desertedMotive !== null ||
            opportunity.selectionMotive !== null) && (
            <StyledDisclosure>
              <summary>Motivos y decisión</summary>
              <StyledDetailList>
                <StyledLabel>Motivo de cancelación</StyledLabel>
                <StyledValue>
                  {valueOrFallback(opportunity.cancelMotive)}
                </StyledValue>
                <StyledLabel>Motivo de desierta</StyledLabel>
                <StyledValue>
                  {valueOrFallback(opportunity.desertedMotive)}
                </StyledValue>
                <StyledLabel>Motivo de selección</StyledLabel>
                <StyledValue>
                  {valueOrFallback(opportunity.selectionMotive)}
                </StyledValue>
              </StyledDetailList>
            </StyledDisclosure>
          )}

          <StyledDisclosure>
            <summary>Ciclo de vida</summary>
            <StyledDetailList>
              <StyledLabel>Publicación</StyledLabel>
              <StyledValue>
                {formatMercadoPublicoDate(opportunity.publishedAt)}
              </StyledValue>
              <StyledLabel>Razón</StyledLabel>
              <StyledValue>
                {valueOrFallback(opportunity.lifecycleReason)}
              </StyledValue>
              <StyledLabel>Disponibilidad</StyledLabel>
              <StyledValue>
                {formatMercadoPublicoAvailability(opportunity.availability, t)}
              </StyledValue>
              {freshness && (
                <>
                  <StyledLabel>Frescura</StyledLabel>
                  <StyledValue>{freshness}</StyledValue>
                </>
              )}
            </StyledDetailList>
          </StyledDisclosure>

          <StyledSection>
            <StyledHeading>Historial del proceso</StyledHeading>
            {historyQuery.loading && (
              <StyledStatus role="status">
                {t({ message: 'Cargando historial…' })}
              </StyledStatus>
            )}
            {historyQuery.error && (
              <>
                <StyledStatus>
                  {t({ message: 'No fue posible cargar el historial.' })}
                </StyledStatus>
                <StyledButton
                  type="button"
                  onClick={() => void historyQuery.refetch()}
                >
                  {t({ message: 'Reintentar historial' })}
                </StyledButton>
              </>
            )}
            {!historyQuery.loading &&
              !historyQuery.error &&
              historyQuery.data?.mercadoPublicoV2.history.edges.length ===
                0 && (
                <StyledStatus>
                  {t({ message: 'No hay cambios semánticos registrados.' })}
                </StyledStatus>
              )}
            {!historyQuery.loading &&
              !historyQuery.error &&
              historyQuery.data?.mercadoPublicoV2.history.edges.length !==
                0 && (
                <StyledHistoryList>
                  {historyQuery.data?.mercadoPublicoV2.history.edges.map(
                    ({ node }) => (
                      <StyledHistoryItem key={node.id}>
                        <StyledValue>
                          {formatMercadoPublicoDate(node.createdAt)}
                        </StyledValue>
                        <StyledStatus>
                          {node.changedFields.length > 0
                            ? t`Cambios: ${node.changedFields.join(', ')}`
                            : t`Cambio registrado sin campos detallados`}
                        </StyledStatus>
                      </StyledHistoryItem>
                    ),
                  )}
                </StyledHistoryList>
              )}
            <StyledHistoryLink
              to={`${AppPath.MercadoPublicoV2History}?codigo=${encodeURIComponent(opportunity.codigo)}&returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
            >
              {t({ message: 'Abrir historial completo' })}
            </StyledHistoryLink>
          </StyledSection>
        </>
      )}

      {activeTab === 'documents' && (
        <DocumentsSection
          connection={documents.data?.mercadoPublicoV2.documents}
          error={documents.error}
          loading={documents.loading}
          nextPageLabel={t({ message: 'Siguiente página de documentos' })}
          onRetry={() => void documents.refetch()}
          onNext={() =>
            setDocumentAfter(
              documents.data?.mercadoPublicoV2.documents.pageInfo.endCursor ??
                null,
            )
          }
          t={t}
        />
      )}
      {activeTab === 'relations' && (
        <>
          <RelationSection
            label={t({ message: 'Ítems solicitados' })}
            testId="relation-items"
            connection={items.data?.mercadoPublicoV2.items}
            error={items.error}
            loading={items.loading}
            nextPageLabel={t({ message: 'Siguiente página de ítems' })}
            onRetry={() => void items.refetch()}
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
            loading={offers.loading}
            nextPageLabel={t({ message: 'Siguiente página de ofertas' })}
            onRetry={() => void offers.refetch()}
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
            loading={quotedProducts.loading}
            nextPageLabel={t({
              message: 'Siguiente página de productos cotizados',
            })}
            onRetry={() => void quotedProducts.refetch()}
            onNext={() =>
              setQuotedProductAfter(
                quotedProducts.data?.mercadoPublicoV2.quotedProducts.pageInfo
                  .endCursor ?? null,
              )
            }
            t={t}
          />
        </>
      )}

      {activeTab === 'evidence' && (
        <>
          <StyledDisclosure>
            <summary>Ver detalles técnicos</summary>
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
                {formatMercadoPublicoDate(
                  opportunity.provenance?.observedAt ?? null,
                )}
              </StyledValue>
              <StyledLabel>
                {t({ message: 'Disponibilidad técnica' })}
              </StyledLabel>
              <StyledValue>{opportunity.availability}</StyledValue>
              {opportunity.detailFreshness && (
                <>
                  <StyledLabel>
                    {t({ message: 'Frescura técnica' })}
                  </StyledLabel>
                  <StyledValue>
                    {opportunity.detailFreshness.status}
                  </StyledValue>
                </>
              )}
              {opportunity.detailFreshness?.lastError && (
                <>
                  <StyledLabel>{t({ message: 'Último error' })}</StyledLabel>
                  <StyledValue>
                    {opportunity.detailFreshness.lastError}
                  </StyledValue>
                </>
              )}
            </StyledDetailList>
          </StyledDisclosure>

          <StyledDisclosure>
            <summary>Payload técnico de fuente</summary>
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
            <StyledPayload
              data-testid="sanitized-payload"
              hidden={!payloadVisible}
            >
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
          </StyledDisclosure>
        </>
      )}
    </StyledContent>
  );
};
