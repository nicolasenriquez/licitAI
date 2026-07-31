import { type Meta, type StoryObj } from '@storybook/react-vite';
import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { useState } from 'react';

import { SidePanelGroup } from '@/side-panel/components/SidePanelGroup';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';
import { Tag } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { ComponentDecorator } from 'twenty-ui/testing';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title, H3Title, Label } from 'twenty-ui/typography';

type PrototypeProcess = {
  buyerCode: string | null;
  buyerName: string | null;
  canonicalState: string;
  closingAt: string | null;
  lastSeenAt: string;
  processCode: string;
  publishedAt: string | null;
  title: string | null;
};

type PrototypeState =
  | 'empty'
  | 'error'
  | 'loaded'
  | 'loading'
  | 'source-pending';

type CompraAgilSourceFixture = {
  budget: {
    availableClp: number | null;
    estimated: number | null;
  };
  delivery: {
    address: string | null;
    leadTimeDays: number | null;
  };
  documents: readonly { id: string; name: string | null }[];
  flags: {
    environmental: boolean | null;
    socialEconomic: boolean | null;
  };
  needDescription: string | null;
  offersReceived: number | null;
  suppliers: readonly {
    name: string | null;
    quoteTotalAmount: number | null;
  }[];
};

type LicitacionDetailFixture = {
  adjudications: readonly {
    amount: number | null;
    quantity: number | null;
    supplierCode: string | null;
  }[];
  items: readonly {
    code: string;
    description: string | null;
    name: string | null;
    quantity: number | null;
    unit: string | null;
  }[];
  reconciliation: {
    candidate: number;
    exact: number;
    unmatched: number;
  };
  relatedOcs: readonly {
    canonicalState: string | null;
    code: string;
    matchType: string;
  }[];
  sourceLineage: readonly {
    lastSeenAt: string;
    rowCount: number;
    source: string;
  }[];
};

type MercadoPublicoBrowseDetailPrototypeProps = {
  initialSelectedCode?: string;
  processFamily: 'Compra Ágil' | 'Licitaciones';
  state: PrototypeState;
};

const compraAgilFixture: readonly PrototypeProcess[] = [
  {
    buyerCode: 'comprador-fixture-01',
    buyerName: 'Organismo de prueba',
    canonicalState: 'publicada',
    closingAt: '2026-07-31T15:00:00.000Z',
    lastSeenAt: '2026-07-31T12:00:00.000Z',
    processCode: 'CA-FIXTURE-001',
    publishedAt: '2026-07-31T10:00:00.000Z',
    title: 'Proceso de prueba para validar densidad',
  },
  {
    buyerCode: 'comprador-fixture-02',
    buyerName: null,
    canonicalState: 'cerrada',
    closingAt: null,
    lastSeenAt: '2026-07-31T11:00:00.000Z',
    processCode: 'CA-FIXTURE-002',
    publishedAt: null,
    title: null,
  },
];

const licitacionesFixture: readonly PrototypeProcess[] = [
  {
    buyerCode: 'comprador-fixture-03',
    buyerName:
      'Entidad de prueba con denominación extensa para revisar truncamiento y densidad en español',
    canonicalState: 'publicada',
    closingAt: '2026-08-04T15:00:00.000Z',
    lastSeenAt: '2026-07-31T12:00:00.000Z',
    processCode: 'L-FIXTURE-001',
    publishedAt: '2026-07-30T10:00:00.000Z',
    title:
      'Licitación de prueba con una descripción extensa para validar jerarquía, corte de texto y lectura en filas densas',
  },
  {
    buyerCode: null,
    buyerName: 'Entidad de prueba',
    canonicalState: 'adjudicada',
    closingAt: '2026-07-29T15:00:00.000Z',
    lastSeenAt: '2026-07-31T09:00:00.000Z',
    processCode: 'L-FIXTURE-002',
    publishedAt: '2026-07-22T10:00:00.000Z',
    title: 'Segundo registro de prueba',
  },
];

const stateOptionsByProcessFamily = {
  'Compra Ágil': [
    { label: 'Todos los estados', value: '' },
    { label: 'Publicada', value: 'publicada' },
    { label: 'Cerrada', value: 'cerrada' },
    { label: 'Desierta', value: 'desierta' },
    { label: 'Proveedor seleccionado', value: 'proveedor_seleccionado' },
    { label: 'OC emitida', value: 'oc_emitida' },
    { label: 'Cancelada', value: 'cancelada' },
  ],
  Licitaciones: [
    { label: 'Todos los estados', value: '' },
    { label: 'Publicada', value: 'publicada' },
    { label: 'Cerrada', value: 'cerrada' },
    { label: 'Desierta', value: 'desierta' },
    { label: 'Adjudicada', value: 'adjudicada' },
    { label: 'Suspendida', value: 'suspendida' },
    { label: 'Revocada', value: 'revocada' },
  ],
} satisfies Record<
  MercadoPublicoBrowseDetailPrototypeProps['processFamily'],
  readonly { label: string; value: string }[]
>;

const sortOptions = [
  { label: 'Última observación, reciente primero', value: 'last-seen-desc' },
  { label: 'Código, A–Z', value: 'process-code-asc' },
];

const accessibleFilterLabelClassName = css`
  label,
  span {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const compraAgilSourceFixture: CompraAgilSourceFixture = {
  budget: {
    availableClp: 150000,
    estimated: 180000,
  },
  delivery: {
    address: 'Dirección de muestra',
    leadTimeDays: 5,
  },
  documents: [{ id: 'documento-fixture-01', name: 'Documento de muestra' }],
  flags: {
    environmental: null,
    socialEconomic: true,
  },
  needDescription: 'Descripción de necesidad de muestra.',
  offersReceived: 2,
  suppliers: [{ name: 'Proveedor de muestra', quoteTotalAmount: 142800 }],
};

const licitacionDetailFixture: LicitacionDetailFixture = {
  adjudications: [
    {
      amount: 142800,
      quantity: 1,
      supplierCode: 'proveedor-fixture-01',
    },
  ],
  items: [
    {
      code: 'item-fixture-01',
      description:
        'Descripción de muestra suficientemente extensa para comprobar el flujo de lectura del detalle.',
      name: 'Ítem de prueba',
      quantity: 1,
      unit: 'unidad',
    },
    {
      code: 'item-fixture-02',
      description: null,
      name: null,
      quantity: null,
      unit: null,
    },
  ],
  reconciliation: {
    candidate: 1,
    exact: 1,
    unmatched: 0,
  },
  relatedOcs: [
    {
      canonicalState: 'emitida',
      code: 'OC-FIXTURE-001',
      matchType: 'exact',
    },
  ],
  sourceLineage: [
    {
      lastSeenAt: '2026-07-31T12:00:00.000Z',
      rowCount: 1,
      source: 'licitaciones-api-fixture',
    },
  ],
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(
        new Date(value),
      )
    : 'No informado';

const formatAmount = (value: number | null) =>
  value === null
    ? 'No informado por fuente'
    : new Intl.NumberFormat('es-CL', {
        currency: 'CLP',
        currencyDisplay: 'narrowSymbol',
        style: 'currency',
      }).format(value);

const getStatusColor = (state: string) => {
  if (state === 'publicada') {
    return 'green';
  }

  if (state === 'adjudicada') {
    return 'blue';
  }

  return 'gray';
};

const StyledPrototype = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  padding: ${themeCssVariables.spacing[4]};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledBrowse = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;

const StyledFilterBar = styled.div`
  align-items: end;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(3, minmax(160px, 1fr));

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StyledTableWrap = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow-x: auto;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 720px;
  width: 100%;

  th {
    background: ${themeCssVariables.background.secondary};
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.medium};
    padding: ${themeCssVariables.spacing[2]};
    text-align: left;
  }

  td {
    border-top: 1px solid ${themeCssVariables.border.color.light};
    color: ${themeCssVariables.font.color.secondary};
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

const StyledPagination = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledDetail = styled.aside`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledDetailDefinition = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  margin: 0;

  dt {
    color: ${themeCssVariables.font.color.secondary};
  }

  dd {
    color: ${themeCssVariables.font.color.primary};
    margin: 0;
  }
`;

const StyledNotice = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledSourceList = styled.ul`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  margin: 0;
  padding-left: ${themeCssVariables.spacing[3]};
`;

const StyledSupportingText = styled(Label)`
  color: ${themeCssVariables.font.color.secondary};
`;

const StyledState = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  justify-content: center;
  min-height: 220px;
  padding: ${themeCssVariables.spacing[4]};
  text-align: center;
`;

const BrowseState = ({ state }: { state: PrototypeState }) => {
  if (state === 'loading') {
    return <StyledState aria-live="polite">Cargando procesos…</StyledState>;
  }

  if (state === 'empty') {
    return (
      <StyledState>No hay procesos para los filtros aplicados.</StyledState>
    );
  }

  if (state === 'error') {
    return (
      <StyledState role="alert">
        No fue posible obtener los procesos. Reintenta cuando el origen esté
        disponible.
      </StyledState>
    );
  }

  return null;
};

const MercadoPublicoBrowseDetailPrototype = ({
  initialSelectedCode,
  processFamily,
  state,
}: MercadoPublicoBrowseDetailPrototypeProps) => {
  const processes =
    processFamily === 'Compra Ágil' ? compraAgilFixture : licitacionesFixture;
  const [selectedCode, setSelectedCode] = useState(
    initialSelectedCode ?? processes[0]?.processCode ?? null,
  );
  const [buyerCode, setBuyerCode] = useState('');
  const [processState, setProcessState] = useState('');
  const [sort, setSort] = useState('last-seen-desc');
  const selectedProcess =
    processes.find(({ processCode }) => processCode === selectedCode) ?? null;
  const shouldShowList = state === 'loaded' || state === 'source-pending';
  const visibleSelectedProcess = shouldShowList ? selectedProcess : null;
  const hasHydratedCompraAgilSource =
    processFamily === 'Compra Ágil' && state === 'loaded';
  const hasLicitacionDetail =
    processFamily === 'Licitaciones' && state === 'loaded';
  const filteredProcesses = processes.filter(
    (process) =>
      (!buyerCode || process.buyerCode === buyerCode) &&
      (!processState || process.canonicalState === processState),
  );
  const sortedProcesses = [...filteredProcesses].sort((left, right) =>
    sort === 'process-code-asc'
      ? left.processCode.localeCompare(right.processCode)
      : right.lastSeenAt.localeCompare(left.lastSeenAt),
  );

  return (
    <StyledPrototype>
      <StyledBrowse aria-label={`Exploración de ${processFamily}`}>
        <div>
          <H2Title title={processFamily} />
          <StyledSupportingText>
            Prototipo aislado: valores de muestra, sin consulta a Mercado
            Público.
          </StyledSupportingText>
        </div>
        <StyledFilterBar>
          <TextInput
            className={accessibleFilterLabelClassName}
            label="Código del organismo"
            placeholder="Coincidencia exacta"
            value={buyerCode}
            onChange={setBuyerCode}
          />
          <Select
            className={accessibleFilterLabelClassName}
            dropdownId={`mercado-publico-${processFamily}-state`}
            label="Estado"
            options={stateOptionsByProcessFamily[processFamily]}
            value={processState}
            onChange={(value) => setProcessState(value ?? '')}
          />
          <Select
            className={accessibleFilterLabelClassName}
            dropdownId={`mercado-publico-${processFamily}-sort`}
            label="Ordenar por"
            options={sortOptions}
            value={sort}
            onChange={(value) => setSort(value ?? 'last-seen-desc')}
          />
        </StyledFilterBar>
        {shouldShowList && sortedProcesses.length ? (
          <>
            <StyledTableWrap>
              <StyledTable>
                <thead>
                  <tr>
                    <th scope="col">Objeto</th>
                    <th scope="col">Organismo</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Cierre</th>
                    <th scope="col">Publicada</th>
                    <th scope="col">Código</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProcesses.map((process) => (
                    <StyledSelectedRow
                      isSelected={process.processCode === selectedCode}
                      key={process.processCode}
                    >
                      <td>
                        <StyledTitleButton
                          onClick={() => setSelectedCode(process.processCode)}
                          size="small"
                          title={process.title ?? 'Sin información'}
                          variant="tertiary"
                        />
                      </td>
                      <td>
                        {process.buyerName ??
                          process.buyerCode ??
                          'No informado'}
                      </td>
                      <td>
                        <Tag
                          color={getStatusColor(process.canonicalState)}
                          text={process.canonicalState}
                        />
                      </td>
                      <td>{formatDate(process.closingAt)}</td>
                      <td>{formatDate(process.publishedAt)}</td>
                      <td>{process.processCode}</td>
                    </StyledSelectedRow>
                  ))}
                </tbody>
              </StyledTable>
            </StyledTableWrap>
            <StyledPagination>
              <StyledSupportingText>
                Mostrando 1–{sortedProcesses.length} de {sortedProcesses.length}
              </StyledSupportingText>
              <div>
                <Button
                  disabled
                  size="small"
                  title="Anterior"
                  variant="secondary"
                />
                <Button
                  disabled
                  size="small"
                  title="Siguiente"
                  variant="secondary"
                />
              </div>
            </StyledPagination>
          </>
        ) : (
          <BrowseState state={shouldShowList ? 'empty' : state} />
        )}
      </StyledBrowse>
      <StyledDetail
        aria-live="polite"
        aria-label="Detalle del proceso seleccionado"
      >
        <H3Title title="Detalle" />
        {visibleSelectedProcess ? (
          <>
            <SidePanelGroup heading="Resumen">
              <StyledDetailDefinition>
                <dt>Código</dt>
                <dd>{visibleSelectedProcess.processCode}</dd>
                <dt>Organismo</dt>
                <dd>
                  {visibleSelectedProcess.buyerName ??
                    visibleSelectedProcess.buyerCode ??
                    'No informado'}
                </dd>
                <dt>Última observación</dt>
                <dd>{formatDate(visibleSelectedProcess.lastSeenAt)}</dd>
              </StyledDetailDefinition>
            </SidePanelGroup>
            {state === 'source-pending' ? (
              <StyledNotice>
                El detalle específico de Compra Ágil no está retenido aún. No se
                muestran ofertas, presupuesto ni documentos como si fueran cero.
              </StyledNotice>
            ) : hasHydratedCompraAgilSource ? (
              <>
                <SidePanelGroup heading="Necesidad y entrega">
                  <StyledDetailDefinition>
                    <dt>Necesidad</dt>
                    <dd>
                      {compraAgilSourceFixture.needDescription ??
                        'No informado por fuente'}
                    </dd>
                    <dt>Dirección</dt>
                    <dd>
                      {compraAgilSourceFixture.delivery.address ??
                        'No informado por fuente'}
                    </dd>
                    <dt>Plazo</dt>
                    <dd>
                      {compraAgilSourceFixture.delivery.leadTimeDays === null
                        ? 'No informado por fuente'
                        : `${compraAgilSourceFixture.delivery.leadTimeDays} días`}
                    </dd>
                  </StyledDetailDefinition>
                </SidePanelGroup>
                <SidePanelGroup heading="Presupuesto y ofertas">
                  <StyledDetailDefinition>
                    <dt>Presupuesto estimado</dt>
                    <dd>
                      {formatAmount(compraAgilSourceFixture.budget.estimated)}
                    </dd>
                    <dt>Disponible CLP</dt>
                    <dd>
                      {formatAmount(
                        compraAgilSourceFixture.budget.availableClp,
                      )}
                    </dd>
                    <dt>Ofertas recibidas</dt>
                    <dd>
                      {compraAgilSourceFixture.offersReceived ??
                        'No informado por fuente'}
                    </dd>
                  </StyledDetailDefinition>
                </SidePanelGroup>
                <SidePanelGroup heading="Proveedores y documentos">
                  <StyledSourceList>
                    {compraAgilSourceFixture.suppliers.map((supplier) => (
                      <li key={supplier.name}>
                        {supplier.name ?? 'No informado por fuente'} ·{' '}
                        {formatAmount(supplier.quoteTotalAmount)}
                      </li>
                    ))}
                    {compraAgilSourceFixture.documents.map((document) => (
                      <li key={document.id}>
                        {document.name ?? 'No informado por fuente'}
                      </li>
                    ))}
                  </StyledSourceList>
                </SidePanelGroup>
                <SidePanelGroup heading="Indicadores de fuente">
                  <StyledDetailDefinition>
                    <dt>Ambiental</dt>
                    <dd>
                      {compraAgilSourceFixture.flags.environmental === null
                        ? 'No informado por fuente'
                        : compraAgilSourceFixture.flags.environmental
                          ? 'Sí'
                          : 'No'}
                    </dd>
                    <dt>Socioeconómico</dt>
                    <dd>
                      {compraAgilSourceFixture.flags.socialEconomic === null
                        ? 'No informado por fuente'
                        : compraAgilSourceFixture.flags.socialEconomic
                          ? 'Sí'
                          : 'No'}
                    </dd>
                  </StyledDetailDefinition>
                </SidePanelGroup>
              </>
            ) : hasLicitacionDetail ? (
              <>
                <SidePanelGroup heading="Ítems">
                  <StyledSourceList>
                    {licitacionDetailFixture.items.map((item) => (
                      <li key={item.code}>
                        {item.code} · {item.name ?? 'No informado por fuente'} ·{' '}
                        {item.description ?? 'No informado por fuente'} ·{' '}
                        {item.quantity ?? 'No informado por fuente'}{' '}
                        {item.unit ?? ''}
                      </li>
                    ))}
                  </StyledSourceList>
                </SidePanelGroup>
                <SidePanelGroup heading="Adjudicaciones">
                  <StyledSourceList>
                    {licitacionDetailFixture.adjudications.map(
                      (adjudication) => (
                        <li key={adjudication.supplierCode}>
                          {adjudication.supplierCode ??
                            'No informado por fuente'}{' '}
                          · {adjudication.quantity ?? 'No informado por fuente'}{' '}
                          · {formatAmount(adjudication.amount)}
                        </li>
                      ),
                    )}
                  </StyledSourceList>
                </SidePanelGroup>
                <SidePanelGroup heading="Órdenes de compra relacionadas">
                  <StyledSourceList>
                    {licitacionDetailFixture.relatedOcs.map((order) => (
                      <li key={order.code}>
                        {order.code} · {order.canonicalState ?? 'No informado'}{' '}
                        · coincidencia {order.matchType}
                      </li>
                    ))}
                  </StyledSourceList>
                </SidePanelGroup>
                <SidePanelGroup heading="Trazabilidad y conciliación">
                  <StyledDetailDefinition>
                    <dt>Coincidencias exactas</dt>
                    <dd>{licitacionDetailFixture.reconciliation.exact}</dd>
                    <dt>Candidatas</dt>
                    <dd>{licitacionDetailFixture.reconciliation.candidate}</dd>
                    <dt>Sin relación</dt>
                    <dd>{licitacionDetailFixture.reconciliation.unmatched}</dd>
                  </StyledDetailDefinition>
                  <StyledSourceList>
                    {licitacionDetailFixture.sourceLineage.map((source) => (
                      <li key={source.source}>
                        {source.source} · {source.rowCount} filas ·{' '}
                        {formatDate(source.lastSeenAt)}
                      </li>
                    ))}
                  </StyledSourceList>
                </SidePanelGroup>
              </>
            ) : (
              <SidePanelGroup heading="Datos disponibles">
                <StyledSupportingText>
                  El detalle usa divulgación progresiva: sólo muestra campos
                  entregados por el DTO de la familia.
                </StyledSupportingText>
              </SidePanelGroup>
            )}
          </>
        ) : (
          <StyledNotice>
            {shouldShowList
              ? 'Selecciona un proceso para abrir su detalle.'
              : 'El detalle estará disponible cuando la lista de procesos pueda mostrarse.'}
          </StyledNotice>
        )}
        <StyledNotice>
          No existe un contrato de frescura global. La interfaz muestra la
          última observación retenida, no una etiqueta de “actualizado”.
        </StyledNotice>
      </StyledDetail>
    </StyledPrototype>
  );
};

const meta: Meta<typeof MercadoPublicoBrowseDetailPrototype> = {
  title: 'Mercado Público/Browse detail prototype',
  component: MercadoPublicoBrowseDetailPrototype,
  decorators: [ComponentDecorator],
};

export default meta;
type Story = StoryObj<typeof MercadoPublicoBrowseDetailPrototype>;

export const CompraAgilLoaded: Story = {
  args: { processFamily: 'Compra Ágil', state: 'loaded' },
};

export const LicitacionesLoaded: Story = {
  args: { processFamily: 'Licitaciones', state: 'loaded' },
};

export const LicitacionesMissingValues: Story = {
  args: {
    initialSelectedCode: 'L-FIXTURE-002',
    processFamily: 'Licitaciones',
    state: 'loaded',
  },
};

export const CompraAgilSourcePending: Story = {
  args: { processFamily: 'Compra Ágil', state: 'source-pending' },
};

export const Loading: Story = {
  args: { processFamily: 'Compra Ágil', state: 'loading' },
};

export const Empty: Story = {
  args: { processFamily: 'Licitaciones', state: 'empty' },
};

export const Error: Story = {
  args: { processFamily: 'Licitaciones', state: 'error' },
};
