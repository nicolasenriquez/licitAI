import { useMercadoPublicoCompraAgilAnalytics } from '@/mercado-publico/hooks/useMercadoPublicoCompraAgilAnalytics';
import { useMercadoPublicoDetectedProcesses } from '@/mercado-publico/hooks/useMercadoPublicoDetectedProcesses';
import { useOpenMercadoPublicoProcessInSidePanel } from '@/mercado-publico/hooks/useOpenMercadoPublicoProcessInSidePanel';
import { useMercadoPublicoDisplay } from '@/mercado-publico/utils/mercadoPublicoDisplay';
import { PageLayoutComponentInstanceContext } from '@/page-layout/states/contexts/PageLayoutComponentInstanceContext';
import { GraphWidgetBarChart } from '@/page-layout/widgets/graph/graph-widget-bar-chart/components/GraphWidgetBarChart';
import { type BarChartSlice } from '@/page-layout/widgets/graph/graph-widget-bar-chart/types/BarChartSlice';
import { GraphWidgetLineChart } from '@/page-layout/widgets/graph/graph-widget-line-chart/components/GraphWidgetLineChart';
import { WidgetComponentInstanceContext } from '@/page-layout/widgets/states/contexts/WidgetComponentInstanceContext';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  type GetMercadoPublicoDetectedProcessesQuery,
  MercadoPublicoCompraAgilCallStage,
  MercadoPublicoDetectedProcessSortDirection,
  MercadoPublicoDetectedProcessSortKey,
  MercadoPublicoDetectedProcessType,
} from '~/generated/graphql';
import { Button } from 'twenty-ui/input';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type MercadoPublicoPrototypeVariant =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G';

type Opportunity =
  GetMercadoPublicoDetectedProcessesQuery['mercadoPublicoDetectedProcesses']['items'][number];
type Analytics = ReturnType<
  typeof useMercadoPublicoCompraAgilAnalytics
>['analytics'];
type Decision = 'discarded' | 'participate';

const PAGE_SIZE = 50;

const VARIANTS: Array<{
  id: MercadoPublicoPrototypeVariant;
  name: string;
  purpose: string;
}> = [
  {
    id: 'A',
    name: t`Explorador denso`,
    purpose: t`Barrido rápido y ordenable`,
  },
  {
    id: 'B',
    name: t`Bandeja Compra Ágil`,
    purpose: t`Llamados y urgencia`,
  },
  {
    id: 'C',
    name: t`Radar de señales`,
    purpose: t`Descubrimiento guiado por evidencia`,
  },
  {
    id: 'D',
    name: t`Calendario operativo`,
    purpose: t`Planificar cierres`,
  },
  {
    id: 'E',
    name: t`Inteligencia de mercado`,
    purpose: t`Leer demanda y concentración`,
  },
  {
    id: 'F',
    name: t`Inteligencia de compradores`,
    purpose: t`Seguir instituciones activas`,
  },
  {
    id: 'G',
    name: t`Mesa de decisión`,
    purpose: t`Investigar y decidir una oportunidad`,
  },
];

const StyledPrototype = styled.main`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  overflow-x: clip;
  padding: ${themeCssVariables.spacing[4]};

  @media (prefers-reduced-motion: reduce) {
    &,
    & * {
      animation-duration: 0.01ms !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

const StyledHeader = styled.header`
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: ${themeCssVariables.font.size.xxl};
    letter-spacing: -0.02em;
  }

  p {
    color: ${themeCssVariables.font.color.secondary};
    margin-top: ${themeCssVariables.spacing[1]};
  }
`;

const StyledVariantMark = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  text-align: right;

  strong {
    color: ${themeCssVariables.font.color.primary};
    display: block;
    font-size: ${themeCssVariables.font.size.md};
  }
`;

const controlStyles = `
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  min-height: 36px;
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledFilterBar = styled.form`
  align-items: end;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(240px, 2fr) repeat(4, minmax(130px, 1fr));
  padding: ${themeCssVariables.spacing[3]};

  @media (max-width: 880px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledControl = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledInput = styled.input`
  ${controlStyles}
`;

const StyledSelect = styled.select`
  ${controlStyles}
`;

const StyledMetrics = styled.section`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledMetric = styled.div`
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};

  &:not(:last-child) {
    border-right: 1px solid ${themeCssVariables.border.color.light};
  }

  span {
    color: ${themeCssVariables.font.color.secondary};
    display: block;
    font-size: ${themeCssVariables.font.size.sm};
  }

  strong {
    display: block;
    font-size: ${themeCssVariables.font.size.xl};
    margin-top: ${themeCssVariables.spacing[1]};
    overflow-wrap: anywhere;
  }

  @media (max-width: 720px) {
    &:nth-child(2) {
      border-right: 0;
    }

    &:nth-child(-n + 2) {
      border-bottom: 1px solid ${themeCssVariables.border.color.light};
    }
  }
`;

const StyledState = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};

  p {
    margin: 0 0 ${themeCssVariables.spacing[2]};
  }
`;

const StyledButton = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  min-height: 32px;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledPrimaryButton = styled(StyledButton)`
  background: ${themeCssVariables.accent.primary};
  border-color: ${themeCssVariables.accent.primary};
  color: ${themeCssVariables.font.color.inverted};
`;

const StyledChartCard = styled.article`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[3]};

  h3,
  p {
    margin: 0;
  }

  h3 {
    font-size: ${themeCssVariables.font.size.md};
  }

  p {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.xs};
    margin-top: ${themeCssVariables.spacing[1]};
  }
`;

const StyledChart = styled.div`
  height: 230px;
  min-width: 0;
  width: 100%;
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

const StyledMuted = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  display: block;
  font-size: ${themeCssVariables.font.size.sm};
  overflow-wrap: anywhere;
`;

const StyledStatus = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 999px;
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  min-height: 22px;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: fit-content;
`;

const StyledOpportunityHeading = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};

  strong {
    flex-basis: 100%;
  }
`;

const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledVisuallyHidden = styled.ul`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

const StyledPagination = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledTableRegion = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow-x: auto;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 960px;
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
    vertical-align: top;
  }
`;

const StyledSplit = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledFeed = styled.section`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  min-width: 0;
  overflow: hidden;
`;

const StyledFeedHeading = styled.h3`
  background: ${themeCssVariables.background.secondary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledFeedItem = styled.article`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1fr) minmax(130px, 0.35fr) auto;
  padding: ${themeCssVariables.spacing[3]};

  @media (max-width: 620px) {
    align-items: start;
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledBoard = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(3, minmax(250px, 1fr));
  overflow-x: auto;
`;

const StyledLane = styled.section`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  min-height: 390px;
  padding: ${themeCssVariables.spacing[3]};

  h3 {
    font-size: ${themeCssVariables.font.size.md};
    margin: 0 0 ${themeCssVariables.spacing[3]};
  }
`;

const StyledCard = styled.article`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};

  p {
    margin: 0;
  }
`;

const StyledSignalList = styled.ul`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    align-items: center;
    display: flex;
    gap: ${themeCssVariables.spacing[2]};
  }
`;

const StyledSignalBar = styled.span<{ strength: number }>`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: 999px;
  display: block;
  height: 6px;
  overflow: hidden;
  width: 72px;

  &::after {
    background: ${themeCssVariables.accent.primary};
    content: '';
    display: block;
    height: 100%;
    width: ${({ strength }) => `${strength}%`};
  }
`;

const StyledTimeline = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[5]};
`;

const StyledTimelineGroup = styled.section`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(140px, 0.25fr) minmax(0, 1fr);

  h3 {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.md};
    margin: ${themeCssVariables.spacing[2]} 0;
  }

  @media (max-width: 680px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledDemandList = styled.ol`
  counter-reset: demand;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    align-items: center;
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    counter-increment: demand;
    display: grid;
    gap: ${themeCssVariables.spacing[2]};
    grid-template-columns: 30px minmax(0, 1fr) auto;
    padding: ${themeCssVariables.spacing[3]} 0;
  }

  li::before {
    color: ${themeCssVariables.font.color.tertiary};
    content: counter(demand, decimal-leading-zero);
    font-variant-numeric: tabular-nums;
  }
`;

const StyledDossiers = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.medium};
`;

const StyledDossier = styled.details`
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};

  summary {
    cursor: pointer;
    display: grid;
    gap: ${themeCssVariables.spacing[2]};
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 56px;
    padding: ${themeCssVariables.spacing[3]};
  }

  summary:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: -2px;
  }
`;

const StyledDossierBody = styled.div`
  background: ${themeCssVariables.background.secondary};
  padding: 0 ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[3]};
`;

const StyledWorkbench = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(240px, 0.7fr) minmax(380px, 1.3fr);

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledOpportunityList = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  max-height: 70vh;
  overflow-y: auto;
`;

const StyledOpportunityButton = styled.button`
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: block;
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &[aria-current='true'] {
    background: ${themeCssVariables.accent.quaternary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: -2px;
  }
`;

const StyledDecisionPanel = styled.article`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  min-height: 460px;
  padding: ${themeCssVariables.spacing[4]};

  h3 {
    font-size: ${themeCssVariables.font.size.xl};
    letter-spacing: -0.02em;
    margin: ${themeCssVariables.spacing[1]} 0 ${themeCssVariables.spacing[2]};
  }
`;

const StyledFacts = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: ${themeCssVariables.spacing[4]} 0;

  div {
    border-top: 1px solid ${themeCssVariables.border.color.medium};
    padding-top: ${themeCssVariables.spacing[2]};
  }

  dt {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
  }

  dd {
    margin: ${themeCssVariables.spacing[1]} 0 0;
  }
`;

const StyledNotes = styled.textarea`
  ${controlStyles}
  min-height: 88px;
  padding: ${themeCssVariables.spacing[2]};
  resize: vertical;
`;

const StyledSwitcher = styled.nav`
  align-items: center;
  align-self: center;
  background: ${themeCssVariables.font.color.primary};
  border-radius: 999px;
  bottom: 20px;
  box-shadow: ${themeCssVariables.boxShadow.strong};
  color: ${themeCssVariables.background.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  max-width: calc(100vw - 32px);
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  position: sticky;
  z-index: 30;

  button {
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    font-size: ${themeCssVariables.font.size.lg};
    min-height: 36px;
    min-width: 36px;
  }

  button:focus-visible {
    outline: 2px solid ${themeCssVariables.background.primary};
  }
`;

const getHoursUntilClosing = (closingAt?: string | null) =>
  closingAt
    ? Math.ceil((new Date(closingAt).getTime() - Date.now()) / 3_600_000)
    : null;

const getSignalStrength = (opportunity: Opportunity) =>
  [
    typeof opportunity.amountAvailableClp === 'number',
    Boolean(opportunity.closingAt),
    typeof opportunity.documentCount === 'number',
    Boolean(opportunity.regionName),
  ].filter(Boolean).length * 25;

const getClosingTo = (closingWindow: string, referenceTime: string) => {
  const days = Number(closingWindow);

  if (!days) {
    return undefined;
  }

  return new Date(
    new Date(referenceTime).getTime() + days * 86_400_000,
  ).toISOString();
};

const OpportunityHeading = ({ opportunity }: { opportunity: Opportunity }) => (
  <StyledOpportunityHeading>
    <strong>{opportunity.title ?? t`Título no informado`}</strong>
    <StyledStatus>{t`Compra Ágil`}</StyledStatus>
    <StyledStatus>
      {opportunity.callStage === MercadoPublicoCompraAgilCallStage.second_call
        ? t`Segundo llamado · revisar bases`
        : opportunity.callStage === MercadoPublicoCompraAgilCallStage.first_call
          ? t`Primer llamado · EMT`
          : t`Etapa no informada`}
    </StyledStatus>
    <StyledMuted>{opportunity.processCode}</StyledMuted>
  </StyledOpportunityHeading>
);

const Deadline = ({ opportunity }: { opportunity: Opportunity }) => {
  const hours = getHoursUntilClosing(opportunity.closingAt);

  if (hours === null) {
    return <StyledMuted>{t`Cierre no informado`}</StyledMuted>;
  }

  if (hours < 0) {
    return <StyledMuted>{t`Plazo vencido`}</StyledMuted>;
  }

  if (hours < 24) {
    return <strong>{t`${hours} h restantes`}</strong>;
  }

  return <strong>{t`${Math.ceil(hours / 24)} días restantes`}</strong>;
};

const SaveButton = ({
  isSaved,
  onClick,
}: {
  isSaved: boolean;
  onClick: () => void;
}) => (
  <StyledButton aria-pressed={isSaved} onClick={onClick} type="button">
    {isSaved ? t`Guardada` : t`Guardar`}
  </StyledButton>
);

const ChartCard = ({
  caption,
  children,
  id,
  summary,
  title,
}: {
  caption: string;
  children: ReactNode;
  id: string;
  summary: string[];
  title: string;
}) => (
  <StyledChartCard>
    <h3>{title}</h3>
    <p>{caption}</p>
    <StyledVisuallyHidden>
      {summary.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </StyledVisuallyHidden>
    <StyledChart>
      <PageLayoutComponentInstanceContext.Provider
        value={{ instanceId: 'mercado-publico-prototype' }}
      >
        <WidgetComponentInstanceContext.Provider value={{ instanceId: id }}>
          {children}
        </WidgetComponentInstanceContext.Provider>
      </PageLayoutComponentInstanceContext.Provider>
    </StyledChart>
  </StyledChartCard>
);

const ClosingChart = ({
  analytics,
  id,
}: {
  analytics: Analytics;
  id: string;
}) => (
  <ChartCard
    caption={t`Distribución de población filtrada con fecha informada`}
    id={`${id}-closing`}
    summary={(analytics?.closingByDay ?? []).map(
      (bucket) => t`${bucket.date}: ${bucket.count} oportunidades`,
    )}
    title={t`Cierres por día`}
  >
    <GraphWidgetLineChart
      colorMode="automaticPalette"
      data={
        analytics?.closingByDay.some(({ count }) => count > 0)
          ? [
              {
                key: 'closing',
                label: t`Oportunidades`,
                data: analytics.closingByDay.map((bucket) => ({
                  x: bucket.date,
                  y: bucket.count,
                })),
              },
            ]
          : []
      }
      displayType="number"
      enableArea
      id={`${id}-closing-chart`}
      showLegend={false}
    />
  </ChartCard>
);

const RegionChart = ({
  analytics,
  id,
  onSelect,
}: {
  analytics: Analytics;
  id: string;
  onSelect?: (regionName: string) => void;
}) => (
  <ChartCard
    caption={t`Regiones con cobertura geográfica disponible`}
    id={`${id}-regions`}
    summary={(analytics?.regions ?? []).map(
      (bucket) => t`${bucket.regionName}: ${bucket.count} oportunidades`,
    )}
    title={t`Demanda por región`}
  >
    <GraphWidgetBarChart
      colorMode="automaticPalette"
      data={(analytics?.regions ?? []).map((bucket) => ({
        oportunidades: bucket.count,
        region: bucket.regionName,
      }))}
      displayType="number"
      id={`${id}-regions-chart`}
      indexBy="region"
      keys={['oportunidades']}
      onSliceClick={
        onSelect
          ? (slice: BarChartSlice) => onSelect(slice.indexValue)
          : undefined
      }
      showLegend={false}
      showValues
    />
  </ChartCard>
);

const AmountChart = ({
  analytics,
  id,
}: {
  analytics: Analytics;
  id: string;
}) => {
  const labels: Record<string, string> = {
    '100k_to_500k': t`$100–500 mil`,
    '1m_to_3m': t`$1–3 millones`,
    '500k_to_1m': t`$500 mil–1 millón`,
    over_3m: t`Más de $3 millones`,
    under_100k: t`Menos de $100 mil`,
  };

  return (
    <ChartCard
      caption={t`Sólo procesos con monto publicado`}
      id={`${id}-amounts`}
      summary={(analytics?.amountBands ?? []).map(
        (bucket) =>
          t`${labels[bucket.band] ?? bucket.band}: ${bucket.count} oportunidades`,
      )}
      title={t`Oportunidades por monto`}
    >
      <GraphWidgetBarChart
        colorMode="automaticPalette"
        data={(analytics?.amountBands ?? []).map((bucket) => ({
          oportunidades: bucket.count,
          rango: labels[bucket.band] ?? bucket.band,
        }))}
        displayType="number"
        id={`${id}-amounts-chart`}
        indexBy="rango"
        keys={['oportunidades']}
        showLegend={false}
        showValues
      />
    </ChartCard>
  );
};

const Metrics = ({
  analytics,
  formatAmount,
  formatCount,
}: {
  analytics: Analytics;
  formatAmount: (value?: number | null) => string;
  formatCount: (value?: number | null) => string;
}) => (
  <StyledMetrics aria-label={t`Resumen de oportunidades filtradas`}>
    <StyledMetric>
      <span>{t`Oportunidades`}</span>
      <strong>{formatCount(analytics?.summary.totalFound)}</strong>
    </StyledMetric>
    <StyledMetric>
      <span>{t`Cierran en 24 horas`}</span>
      <strong>{formatCount(analytics?.summary.closingNext24Hours)}</strong>
    </StyledMetric>
    <StyledMetric>
      <span>{t`Monto publicado`}</span>
      <strong>
        {formatAmount(analytics?.summary.knownAmountAvailableClp)}
      </strong>
    </StyledMetric>
    <StyledMetric>
      <span>{t`Con antecedentes`}</span>
      <strong>{formatCount(analytics?.summary.positiveDocumentCount)}</strong>
    </StyledMetric>
  </StyledMetrics>
);

type VariantProps = {
  analytics: Analytics;
  decisions: Record<string, Decision>;
  formatAmount: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  onDecide: (code: string, decision: Decision) => void;
  onOpen: (opportunity: Opportunity) => void;
  onToggleSaved: (code: string) => void;
  opportunities: Opportunity[];
  savedCodes: string[];
};

type VariantAProps = VariantProps;
type VariantBProps = VariantProps;
type VariantCProps = VariantProps;
type VariantDProps = VariantProps;
type VariantEProps = VariantProps;
type VariantFProps = VariantProps;
type VariantGProps = VariantProps;

const VariantA = ({
  analytics,
  formatAmount,
  formatDate,
  onOpen,
  onToggleSaved,
  opportunities,
  savedCodes,
}: VariantAProps) => (
  <>
    <ClosingChart analytics={analytics} id="variant-a" />
    <StyledTableRegion
      aria-label={t`Explorador denso de oportunidades`}
      role="region"
      tabIndex={0}
    >
      <StyledTable>
        <thead>
          <tr>
            <th scope="col">{t`Oportunidad`}</th>
            <th scope="col">{t`Institución / región`}</th>
            <th scope="col">{t`Monto`}</th>
            <th scope="col">{t`Publicada`}</th>
            <th scope="col">{t`Cierre`}</th>
            <th scope="col">{t`Señales`}</th>
            <th scope="col">{t`Acciones`}</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity) => (
            <tr key={opportunity.processCode}>
              <td>
                <OpportunityHeading opportunity={opportunity} />
              </td>
              <td>
                {opportunity.buyerName ?? t`Institución no informada`}
                <StyledMuted>
                  {opportunity.regionName ?? t`Región no informada`}
                </StyledMuted>
              </td>
              <td>{formatAmount(opportunity.amountAvailableClp)}</td>
              <td>{formatDate(opportunity.publishedAt)}</td>
              <td>
                <Deadline opportunity={opportunity} />
                <StyledMuted>{formatDate(opportunity.closingAt)}</StyledMuted>
              </td>
              <td>
                {opportunity.documentCount === null ||
                opportunity.documentCount === undefined
                  ? t`Antecedentes no informados`
                  : t`${opportunity.documentCount} documentos`}
                <StyledMuted>{t`${getSignalStrength(opportunity)}% de señales disponibles`}</StyledMuted>
              </td>
              <td>
                <StyledActions>
                  <SaveButton
                    isSaved={savedCodes.includes(opportunity.processCode)}
                    onClick={() => onToggleSaved(opportunity.processCode)}
                  />
                  <StyledPrimaryButton
                    onClick={() => onOpen(opportunity)}
                    type="button"
                  >
                    {t`Revisar`}
                  </StyledPrimaryButton>
                </StyledActions>
              </td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </StyledTableRegion>
  </>
);

const VariantB = ({
  analytics,
  formatAmount,
  onOpen,
  onToggleSaved,
  opportunities,
  savedCodes,
}: VariantBProps) => {
  const lanes = [
    {
      items: opportunities.filter((item) => {
        const hours = getHoursUntilClosing(item.closingAt);
        return hours !== null && hours >= 0 && hours <= 24;
      }),
      title: t`Cierra hoy`,
    },
    {
      items: opportunities.filter(
        (item) =>
          item.callStage === MercadoPublicoCompraAgilCallStage.second_call &&
          (getHoursUntilClosing(item.closingAt) ?? -1) > 24,
      ),
      title: t`Segundo llamado`,
    },
    {
      items: opportunities.filter(
        (item) =>
          item.callStage === MercadoPublicoCompraAgilCallStage.first_call &&
          (getHoursUntilClosing(item.closingAt) ?? -1) > 24,
      ),
      title: t`Primer llamado`,
    },
    {
      items: opportunities.filter(
        (item) =>
          (item.callStage === null || item.callStage === undefined) &&
          (getHoursUntilClosing(item.closingAt) ?? -1) > 24,
      ),
      title: t`Etapa por confirmar`,
    },
  ];

  return (
    <StyledSplit>
      <StyledBoard aria-label={t`Bandeja Compra Ágil por llamado y urgencia`}>
        {lanes.map((lane) => (
          <StyledLane key={lane.title}>
            <h3>
              {lane.title} · {lane.items.length}
            </h3>
            {lane.items.map((opportunity) => (
              <StyledCard key={opportunity.processCode}>
                <OpportunityHeading opportunity={opportunity} />
                <p>{opportunity.buyerName ?? t`Institución no informada`}</p>
                <Deadline opportunity={opportunity} />
                <strong>{formatAmount(opportunity.amountAvailableClp)}</strong>
                <StyledActions>
                  <SaveButton
                    isSaved={savedCodes.includes(opportunity.processCode)}
                    onClick={() => onToggleSaved(opportunity.processCode)}
                  />
                  <StyledPrimaryButton
                    onClick={() => onOpen(opportunity)}
                    type="button"
                  >
                    {t`Evaluar`}
                  </StyledPrimaryButton>
                </StyledActions>
              </StyledCard>
            ))}
          </StyledLane>
        ))}
      </StyledBoard>
      <ClosingChart analytics={analytics} id="variant-b" />
    </StyledSplit>
  );
};

const VariantC = ({
  analytics,
  formatAmount,
  onOpen,
  onToggleSaved,
  opportunities,
  savedCodes,
}: VariantCProps) => (
  <StyledSplit>
    <StyledFeed aria-label={t`Radar de oportunidades`}>
      <StyledFeedHeading>{t`Señales detectadas`}</StyledFeedHeading>
      {opportunities.map((opportunity) => (
        <StyledFeedItem key={opportunity.processCode}>
          <div>
            <OpportunityHeading opportunity={opportunity} />
            <StyledMuted>
              {opportunity.buyerName ?? t`Institución no informada`} ·{' '}
              {opportunity.regionName ?? t`Región no informada`}
            </StyledMuted>
          </div>
          <div>
            <Deadline opportunity={opportunity} />
            <StyledMuted>
              {formatAmount(opportunity.amountAvailableClp)}
            </StyledMuted>
          </div>
          <StyledActions>
            <SaveButton
              isSaved={savedCodes.includes(opportunity.processCode)}
              onClick={() => onToggleSaved(opportunity.processCode)}
            />
            <StyledPrimaryButton
              onClick={() => onOpen(opportunity)}
              type="button"
            >
              {t`Abrir`}
            </StyledPrimaryButton>
          </StyledActions>
        </StyledFeedItem>
      ))}
    </StyledFeed>
    <div>
      <ClosingChart analytics={analytics} id="variant-c" />
      <StyledChartCard>
        <h3>{t`Calidad de señales`}</h3>
        <p>{t`Cobertura factual, no puntaje de recomendación`}</p>
        <StyledSignalList>
          {opportunities.slice(0, 5).map((opportunity) => {
            const strength = getSignalStrength(opportunity);
            return (
              <li key={opportunity.processCode}>
                <StyledSignalBar strength={strength} />
                <span>{t`${strength}% disponible`}</span>
                <StyledMuted>{opportunity.processCode}</StyledMuted>
              </li>
            );
          })}
        </StyledSignalList>
      </StyledChartCard>
    </div>
  </StyledSplit>
);

const VariantD = ({
  analytics,
  formatAmount,
  formatDate,
  onOpen,
  onToggleSaved,
  opportunities,
  savedCodes,
}: VariantDProps) => {
  const groups = [
    {
      items: opportunities.filter((item) => {
        const hours = getHoursUntilClosing(item.closingAt);
        return hours !== null && hours >= 0 && hours <= 24;
      }),
      title: t`Hoy`,
    },
    {
      items: opportunities.filter((item) => {
        const hours = getHoursUntilClosing(item.closingAt);
        return hours !== null && hours > 24 && hours <= 72;
      }),
      title: t`Próximas 72 horas`,
    },
    {
      items: opportunities.filter(
        (item) => (getHoursUntilClosing(item.closingAt) ?? -1) > 72,
      ),
      title: t`Después`,
    },
  ];

  return (
    <>
      <ClosingChart analytics={analytics} id="variant-d" />
      <StyledTimeline aria-label={t`Calendario operativo de cierres`}>
        {groups.map((group) => (
          <StyledTimelineGroup key={group.title}>
            <h3>
              {group.title} · {group.items.length}
            </h3>
            <StyledFeed>
              {group.items.map((opportunity) => (
                <StyledFeedItem key={opportunity.processCode}>
                  <div>
                    <OpportunityHeading opportunity={opportunity} />
                    <StyledMuted>
                      {opportunity.buyerName ?? t`Institución no informada`}
                    </StyledMuted>
                  </div>
                  <div>
                    <Deadline opportunity={opportunity} />
                    <StyledMuted>
                      {formatDate(opportunity.closingAt)} ·{' '}
                      {formatAmount(opportunity.amountAvailableClp)}
                    </StyledMuted>
                  </div>
                  <StyledActions>
                    <SaveButton
                      isSaved={savedCodes.includes(opportunity.processCode)}
                      onClick={() => onToggleSaved(opportunity.processCode)}
                    />
                    <StyledPrimaryButton
                      onClick={() => onOpen(opportunity)}
                      type="button"
                    >
                      {t`Revisar`}
                    </StyledPrimaryButton>
                  </StyledActions>
                </StyledFeedItem>
              ))}
            </StyledFeed>
          </StyledTimelineGroup>
        ))}
      </StyledTimeline>
    </>
  );
};

const VariantE = ({
  analytics,
  formatAmount,
  onOpen,
  opportunities,
}: VariantEProps) => {
  const [marketFocus, setMarketFocus] = useState<{
    type: 'buyer' | 'region';
    value: string;
  } | null>(null);
  const focusedOpportunities = marketFocus
    ? opportunities.filter((opportunity) =>
        marketFocus.type === 'region'
          ? opportunity.regionName === marketFocus.value
          : opportunity.buyerName === marketFocus.value,
      )
    : opportunities;

  return (
    <>
      <StyledChartGrid>
        <ClosingChart analytics={analytics} id="variant-e" />
        <RegionChart
          analytics={analytics}
          id="variant-e"
          onSelect={(regionName) =>
            setMarketFocus({ type: 'region', value: regionName })
          }
        />
        <AmountChart analytics={analytics} id="variant-e" />
        <ChartCard
          caption={t`Selecciona una barra para ver sus oportunidades`}
          id="variant-e-buyers"
          summary={(analytics?.topBuyers ?? []).map(
            (bucket) =>
              t`${bucket.buyerName ?? bucket.buyerKey}: ${bucket.count} oportunidades`,
          )}
          title={t`Instituciones más activas`}
        >
          <GraphWidgetBarChart
            colorMode="automaticPalette"
            data={(analytics?.topBuyers ?? []).map((bucket) => ({
              institucion: bucket.buyerName ?? bucket.buyerKey,
              oportunidades: bucket.count,
            }))}
            displayType="number"
            id="variant-e-buyers-chart"
            indexBy="institucion"
            keys={['oportunidades']}
            onSliceClick={(slice) =>
              setMarketFocus({ type: 'buyer', value: slice.indexValue })
            }
            showLegend={false}
            showValues
          />
        </ChartCard>
      </StyledChartGrid>
      <StyledSplit>
        <StyledFeed aria-label={t`Oportunidades detrás de la analítica`}>
          <StyledFeedHeading>
            {marketFocus
              ? t`${focusedOpportunities.length} resultados · ${marketFocus.value}`
              : t`Oportunidades abiertas`}
          </StyledFeedHeading>
          {focusedOpportunities.slice(0, 8).map((opportunity) => (
            <StyledFeedItem key={opportunity.processCode}>
              <div>
                <OpportunityHeading opportunity={opportunity} />
                <StyledMuted>
                  {opportunity.buyerName ?? t`Institución no informada`}
                </StyledMuted>
              </div>
              <div>
                <Deadline opportunity={opportunity} />
                <StyledMuted>
                  {formatAmount(opportunity.amountAvailableClp)}
                </StyledMuted>
              </div>
              <StyledPrimaryButton
                onClick={() => onOpen(opportunity)}
                type="button"
              >
                {t`Investigar`}
              </StyledPrimaryButton>
            </StyledFeedItem>
          ))}
        </StyledFeed>
        <StyledChartCard>
          <h3>{t`Lectura analítica`}</h3>
          <p>{t`Cada gráfico describe el mismo universo filtrado`}</p>
          <StyledSignalList>
            <li>{t`Usa cierres para planificar capacidad de respuesta.`}</li>
            <li>{t`Selecciona región o comprador para abrir sus procesos.`}</li>
            <li>{t`Usa montos para ajustar tamaño de oportunidad.`}</li>
            <li>{t`Confirma requisitos y evidencia antes de decidir.`}</li>
          </StyledSignalList>
          {marketFocus ? (
            <StyledButton onClick={() => setMarketFocus(null)} type="button">
              {t`Quitar foco analítico`}
            </StyledButton>
          ) : null}
        </StyledChartCard>
      </StyledSplit>
    </>
  );
};

const VariantF = ({
  analytics,
  formatAmount,
  formatDate,
  onOpen,
  onToggleSaved,
  opportunities,
  savedCodes,
}: VariantFProps) => {
  const opportunitiesByBuyer = opportunities.reduce<
    Record<string, { buyerName: string; opportunities: Opportunity[] }>
  >((groups, opportunity) => {
    const buyerKey =
      opportunity.buyerRut ?? opportunity.buyerCode ?? opportunity.processCode;
    const existingGroup = groups[buyerKey];
    groups[buyerKey] = {
      buyerName:
        existingGroup?.buyerName ??
        opportunity.buyerName ??
        t`Institución no informada`,
      opportunities: [...(existingGroup?.opportunities ?? []), opportunity],
    };
    return groups;
  }, {});

  return (
    <StyledSplit>
      <div>
        <ChartCard
          caption={t`Número de oportunidades actuales por institución`}
          id="variant-f-buyers"
          summary={(analytics?.topBuyers ?? []).map(
            (bucket) =>
              t`${bucket.buyerName ?? bucket.buyerKey}: ${bucket.count} oportunidades`,
          )}
          title={t`Compradores con demanda activa`}
        >
          <GraphWidgetBarChart
            colorMode="automaticPalette"
            data={(analytics?.topBuyers ?? []).map((bucket) => ({
              institucion: bucket.buyerName ?? bucket.buyerKey,
              oportunidades: bucket.count,
            }))}
            displayType="number"
            id="variant-f-buyers-chart"
            indexBy="institucion"
            keys={['oportunidades']}
            showLegend={false}
            showValues
          />
        </ChartCard>
        <StyledDemandList aria-label={t`Ranking de compradores activos`}>
          {(analytics?.topBuyers ?? []).map((buyer) => (
            <li key={buyer.buyerKey}>
              <strong>{buyer.buyerName ?? buyer.buyerKey}</strong>
              <span>{t`${buyer.count} oportunidades`}</span>
            </li>
          ))}
        </StyledDemandList>
      </div>
      <StyledDossiers aria-label={t`Expedientes por institución`}>
        {Object.entries(opportunitiesByBuyer).map(([buyerKey, buyerGroup]) => (
          <StyledDossier key={buyerKey}>
            <summary>
              <strong>{buyerGroup.buyerName}</strong>
              <span>{t`${buyerGroup.opportunities.length} oportunidades`}</span>
            </summary>
            <StyledDossierBody>
              {buyerGroup.opportunities.map((opportunity) => (
                <StyledFeedItem key={opportunity.processCode}>
                  <div>
                    <OpportunityHeading opportunity={opportunity} />
                    <StyledMuted>
                      {formatDate(opportunity.closingAt)}
                    </StyledMuted>
                  </div>
                  <strong>
                    {formatAmount(opportunity.amountAvailableClp)}
                  </strong>
                  <StyledActions>
                    <SaveButton
                      isSaved={savedCodes.includes(opportunity.processCode)}
                      onClick={() => onToggleSaved(opportunity.processCode)}
                    />
                    <StyledPrimaryButton
                      onClick={() => onOpen(opportunity)}
                      type="button"
                    >
                      {t`Abrir`}
                    </StyledPrimaryButton>
                  </StyledActions>
                </StyledFeedItem>
              ))}
            </StyledDossierBody>
          </StyledDossier>
        ))}
      </StyledDossiers>
    </StyledSplit>
  );
};

const VariantG = ({
  analytics,
  decisions,
  formatAmount,
  formatDate,
  onDecide,
  onOpen,
  onToggleSaved,
  opportunities,
  savedCodes,
}: VariantGProps) => {
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const focusedOpportunity =
    opportunities.find((item) => item.processCode === focusedCode) ??
    opportunities[0];

  return (
    <>
      <ClosingChart analytics={analytics} id="variant-g" />
      <StyledWorkbench>
        <StyledOpportunityList aria-label={t`Oportunidades para investigar`}>
          {opportunities.map((opportunity) => (
            <StyledOpportunityButton
              aria-current={
                focusedOpportunity?.processCode === opportunity.processCode
                  ? 'true'
                  : undefined
              }
              key={opportunity.processCode}
              onClick={() => setFocusedCode(opportunity.processCode)}
              type="button"
            >
              <OpportunityHeading opportunity={opportunity} />
              <StyledMuted>
                {formatDate(opportunity.closingAt)} ·{' '}
                {formatAmount(opportunity.amountAvailableClp)}
              </StyledMuted>
              {decisions[opportunity.processCode] ? (
                <StyledStatus>
                  {decisions[opportunity.processCode] === 'participate'
                    ? t`Participar`
                    : t`Descartada`}
                </StyledStatus>
              ) : null}
            </StyledOpportunityButton>
          ))}
        </StyledOpportunityList>
        <StyledDecisionPanel>
          {focusedOpportunity ? (
            <>
              <StyledMuted>{focusedOpportunity.processCode}</StyledMuted>
              <h3>{focusedOpportunity.title ?? t`Título no informado`}</h3>
              <p>
                {focusedOpportunity.buyerName ?? t`Institución no informada`}
              </p>
              <StyledFacts>
                <div>
                  <dt>{t`Cierre`}</dt>
                  <dd>{formatDate(focusedOpportunity.closingAt)}</dd>
                </div>
                <div>
                  <dt>{t`Monto`}</dt>
                  <dd>{formatAmount(focusedOpportunity.amountAvailableClp)}</dd>
                </div>
                <div>
                  <dt>{t`Antecedentes`}</dt>
                  <dd>
                    {focusedOpportunity.documentCount === null ||
                    focusedOpportunity.documentCount === undefined
                      ? t`No informado`
                      : t`${focusedOpportunity.documentCount} documentos`}
                  </dd>
                </div>
                <div>
                  <dt>{t`Cobertura de señales`}</dt>
                  <dd>{t`${getSignalStrength(focusedOpportunity)}% disponible`}</dd>
                </div>
              </StyledFacts>
              <StyledControl htmlFor="analyst-notes">
                {t`Notas de análisis`}
                <StyledNotes
                  id="analyst-notes"
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [focusedOpportunity.processCode]: event.target.value,
                    }))
                  }
                  placeholder={t`Registra requisitos, dudas y próximo paso`}
                  value={notes[focusedOpportunity.processCode] ?? ''}
                />
              </StyledControl>
              <StyledActions>
                <StyledPrimaryButton
                  onClick={() => onOpen(focusedOpportunity)}
                  type="button"
                >
                  {t`Abrir evidencia`}
                </StyledPrimaryButton>
                <SaveButton
                  isSaved={savedCodes.includes(focusedOpportunity.processCode)}
                  onClick={() => onToggleSaved(focusedOpportunity.processCode)}
                />
                <StyledButton
                  aria-pressed={
                    decisions[focusedOpportunity.processCode] === 'participate'
                  }
                  onClick={() =>
                    onDecide(focusedOpportunity.processCode, 'participate')
                  }
                  type="button"
                >
                  {t`Participar`}
                </StyledButton>
                <StyledButton
                  aria-pressed={
                    decisions[focusedOpportunity.processCode] === 'discarded'
                  }
                  onClick={() =>
                    onDecide(focusedOpportunity.processCode, 'discarded')
                  }
                  type="button"
                >
                  {t`Descartar`}
                </StyledButton>
              </StyledActions>
            </>
          ) : null}
        </StyledDecisionPanel>
      </StyledWorkbench>
    </>
  );
};

const PrototypeSwitcher = ({
  onChange,
  variant,
}: {
  onChange: (variant: MercadoPublicoPrototypeVariant) => void;
  variant: MercadoPublicoPrototypeVariant;
}) => {
  const currentIndex = VARIANTS.findIndex(({ id }) => id === variant);
  const move = (offset: number) => {
    const nextIndex =
      (currentIndex + offset + VARIANTS.length) % VARIANTS.length;
    onChange(VARIANTS[nextIndex].id);
  };

  return (
    <StyledSwitcher aria-label={t`Selector de variante de prototipo`}>
      <button aria-label={t`Variante anterior`} onClick={() => move(-1)}>
        <IconChevronLeft aria-hidden="true" size={18} />
      </button>
      <strong>
        {variant} · {VARIANTS[currentIndex].name}
      </strong>
      <button aria-label={t`Variante siguiente`} onClick={() => move(1)}>
        <IconChevronRight aria-hidden="true" size={18} />
      </button>
    </StyledSwitcher>
  );
};

export const MercadoPublicoAnalystWorkspacePrototype = ({
  variant,
}: {
  variant: MercadoPublicoPrototypeVariant;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatAmount, formatCount, formatDate } = useMercadoPublicoDisplay();
  const { openMercadoPublicoProcessInSidePanel } =
    useOpenMercadoPublicoProcessInSidePanel();
  const [search, setSearch] = useState('');
  const [regionName, setRegionName] = useState('');
  const [callStage, setCallStage] = useState<
    '' | MercadoPublicoCompraAgilCallStage
  >('');
  const [closingWindow, setClosingWindow] = useState('30');
  const [filterReferenceTime] = useState(() => new Date().toISOString());
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(
    `${MercadoPublicoDetectedProcessSortKey.closingAt}:${MercadoPublicoDetectedProcessSortDirection.asc}`,
  );
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [sortKey, sortDirection] = sort.split(':') as [
    MercadoPublicoDetectedProcessSortKey,
    MercadoPublicoDetectedProcessSortDirection,
  ];
  const businessFilters = {
    callStages: callStage ? [callStage] : undefined,
    closingFrom: filterReferenceTime,
    closingTo: getClosingTo(closingWindow, filterReferenceTime),
    regionName: regionName || undefined,
    search: search || undefined,
  };
  const {
    analytics,
    error: analyticsError,
    isRefetching: isAnalyticsRefetching,
    refetch: refetchAnalytics,
  } = useMercadoPublicoCompraAgilAnalytics(businessFilters);
  const {
    processes,
    isInitialLoading,
    isRefetching: isListRefetching,
    error: listError,
    refetch: refetchList,
  } = useMercadoPublicoDetectedProcesses({
    ...businessFilters,
    limit: PAGE_SIZE,
    page,
    processTypes: [MercadoPublicoDetectedProcessType.compra_agil],
    search: search || undefined,
    sort: {
      direction: sortDirection,
      key: sortKey,
    },
    states: [],
  });

  const opportunities = processes?.items ?? [];
  const selectedVariant = VARIANTS.find(({ id }) => id === variant)!;
  const onVariantChange = (nextVariant: MercadoPublicoPrototypeVariant) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('variant', nextVariant);
    navigate(
      `${location.pathname}?${searchParams.toString()}${location.hash}`,
      { replace: true },
    );
  };
  const onOpen = (opportunity: Opportunity) =>
    openMercadoPublicoProcessInSidePanel({
      processCode: opportunity.processCode,
      processTitle: opportunity.title ?? opportunity.processCode,
      processType: MercadoPublicoDetectedProcessType.compra_agil,
    });
  const onToggleSaved = (code: string) =>
    setSavedCodes((current) =>
      current.includes(code)
        ? current.filter((currentCode) => currentCode !== code)
        : [...current, code],
    );
  const onDecide = (code: string, decision: Decision) =>
    setDecisions((current) => ({ ...current, [code]: decision }));
  let content: ReactNode;

  if (isInitialLoading) {
    content = (
      <StyledState aria-live="polite">{t`Cargando oportunidades…`}</StyledState>
    );
  } else if (listError && opportunities.length === 0) {
    content = (
      <StyledState role="alert">
        <p>{t`No pudimos cargar las oportunidades.`}</p>
        <Button
          onClick={() => refetchList()}
          size="small"
          title={t`Reintentar`}
          variant="secondary"
        />
      </StyledState>
    );
  } else if (opportunities.length === 0) {
    content = (
      <StyledState>{t`No hay oportunidades para estos filtros.`}</StyledState>
    );
  } else if (variant === 'A') {
    content = (
      <VariantA
        analytics={analytics}
        decisions={decisions}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onDecide={onDecide}
        onOpen={onOpen}
        onToggleSaved={onToggleSaved}
        opportunities={opportunities}
        savedCodes={savedCodes}
      />
    );
  } else if (variant === 'B') {
    content = (
      <VariantB
        analytics={analytics}
        decisions={decisions}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onDecide={onDecide}
        onOpen={onOpen}
        onToggleSaved={onToggleSaved}
        opportunities={opportunities}
        savedCodes={savedCodes}
      />
    );
  } else if (variant === 'C') {
    content = (
      <VariantC
        analytics={analytics}
        decisions={decisions}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onDecide={onDecide}
        onOpen={onOpen}
        onToggleSaved={onToggleSaved}
        opportunities={opportunities}
        savedCodes={savedCodes}
      />
    );
  } else if (variant === 'D') {
    content = (
      <VariantD
        analytics={analytics}
        decisions={decisions}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onDecide={onDecide}
        onOpen={onOpen}
        onToggleSaved={onToggleSaved}
        opportunities={opportunities}
        savedCodes={savedCodes}
      />
    );
  } else if (variant === 'E') {
    content = (
      <VariantE
        analytics={analytics}
        decisions={decisions}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onDecide={onDecide}
        onOpen={onOpen}
        onToggleSaved={onToggleSaved}
        opportunities={opportunities}
        savedCodes={savedCodes}
      />
    );
  } else if (variant === 'F') {
    content = (
      <VariantF
        analytics={analytics}
        decisions={decisions}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onDecide={onDecide}
        onOpen={onOpen}
        onToggleSaved={onToggleSaved}
        opportunities={opportunities}
        savedCodes={savedCodes}
      />
    );
  } else {
    content = (
      <VariantG
        analytics={analytics}
        decisions={decisions}
        formatAmount={formatAmount}
        formatDate={formatDate}
        onDecide={onDecide}
        onOpen={onOpen}
        onToggleSaved={onToggleSaved}
        opportunities={opportunities}
        savedCodes={savedCodes}
      />
    );
  }

  return (
    <StyledPrototype
      aria-busy={isListRefetching || isAnalyticsRefetching}
      data-testid={`analyst-workspace-prototype-${variant}`}
    >
      <StyledHeader>
        <div>
          <h2>{t`Radar de oportunidades públicas`}</h2>
          <p>{t`Encuentra procesos atendibles, confirma evidencia y decide dónde participar.`}</p>
        </div>
        <StyledVariantMark>
          <strong>
            {variant} · {selectedVariant.name}
          </strong>
          {selectedVariant.purpose}
        </StyledVariantMark>
      </StyledHeader>
      <StyledFilterBar onSubmit={(event) => event.preventDefault()}>
        <StyledControl htmlFor="prototype-search">
          {t`¿Qué quieres vender al Estado?`}
          <StyledInput
            id="prototype-search"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t`Producto, servicio, código o institución`}
            value={search}
          />
        </StyledControl>
        <StyledControl htmlFor="prototype-region">
          {t`Región`}
          <StyledInput
            id="prototype-region"
            onChange={(event) => {
              setRegionName(event.target.value);
              setPage(1);
            }}
            placeholder={t`Todas las regiones`}
            value={regionName}
          />
        </StyledControl>
        <StyledControl htmlFor="prototype-call-stage">
          {t`Convocatoria`}
          <StyledSelect
            id="prototype-call-stage"
            onChange={(event) => {
              setCallStage(
                event.target.value as '' | MercadoPublicoCompraAgilCallStage,
              );
              setPage(1);
            }}
            value={callStage}
          >
            <option value="">{t`Todos los llamados`}</option>
            <option value={MercadoPublicoCompraAgilCallStage.first_call}>
              {t`Primer llamado`}
            </option>
            <option value={MercadoPublicoCompraAgilCallStage.second_call}>
              {t`Segundo llamado`}
            </option>
          </StyledSelect>
        </StyledControl>
        <StyledControl htmlFor="prototype-closing-window">
          {t`Cierre`}
          <StyledSelect
            id="prototype-closing-window"
            onChange={(event) => {
              setClosingWindow(event.target.value);
              setPage(1);
            }}
            value={closingWindow}
          >
            <option value="1">{t`Próximas 24 horas`}</option>
            <option value="7">{t`Próximos 7 días`}</option>
            <option value="30">{t`Próximos 30 días`}</option>
            <option value="">{t`Cualquier cierre futuro`}</option>
          </StyledSelect>
        </StyledControl>
        <StyledControl htmlFor="prototype-sort">
          {t`Orden`}
          <StyledSelect
            id="prototype-sort"
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            value={sort}
          >
            <option value="closingAt:asc">{t`Cierre más próximo`}</option>
            <option value="lastSeenAt:desc">{t`Más recientes`}</option>
            <option value="amountAvailableClp:desc">{t`Mayor monto`}</option>
            <option value="amountAvailableClp:asc">{t`Menor monto`}</option>
          </StyledSelect>
        </StyledControl>
      </StyledFilterBar>
      {listError || analyticsError ? (
        <StyledState role="alert">
          <p>
            {processes || analytics
              ? t`Mostramos datos anteriores porque no pudimos actualizar todo.`
              : t`No pudimos cargar las oportunidades.`}
          </p>
          <Button
            onClick={() => {
              refetchList();
              refetchAnalytics();
            }}
            size="small"
            title={t`Reintentar`}
            variant="secondary"
          />
        </StyledState>
      ) : null}
      {isListRefetching || isAnalyticsRefetching ? (
        <StyledMuted aria-live="polite">{t`Actualizando resultados…`}</StyledMuted>
      ) : null}
      <Metrics
        analytics={analytics}
        formatAmount={formatAmount}
        formatCount={formatCount}
      />
      {content}
      {processes && processes.total > 0 ? (
        <StyledPagination>
          <span>
            {t`Mostrando ${formatCount((page - 1) * PAGE_SIZE + 1)}–${formatCount(Math.min(page * PAGE_SIZE, processes.total))} de ${formatCount(processes.total)}`}
          </span>
          <StyledActions>
            <Button
              disabled={page === 1 || isListRefetching}
              onClick={() => setPage((current) => current - 1)}
              size="small"
              title={t`Anterior`}
              variant="secondary"
            />
            <Button
              disabled={page * PAGE_SIZE >= processes.total || isListRefetching}
              onClick={() => setPage((current) => current + 1)}
              size="small"
              title={t`Siguiente`}
              variant="secondary"
            />
          </StyledActions>
        </StyledPagination>
      ) : null}
      <PrototypeSwitcher onChange={onVariantChange} variant={variant} />
    </StyledPrototype>
  );
};
