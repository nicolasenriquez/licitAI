import { styled } from '@linaria/react';
import { type Meta, type StoryObj } from '@storybook/react-vite';
import { Fragment, useState } from 'react';

import { Tag } from 'twenty-ui/data-display';
import { InlineBanner } from 'twenty-ui/feedback';
import { Button } from 'twenty-ui/input';
import { ComponentDecorator } from 'twenty-ui/testing';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title, H3Title, Label } from 'twenty-ui/typography';

type PrototypeState = 'empty' | 'error' | 'loaded' | 'partial';
type InvestigationView = 'api-calls' | 'job-runs';

type MercadoPublicoControlCenterPrototypeProps = {
  state: PrototypeState;
};

const pipelineFixture = [
  {
    failuresLastSevenDays: 0,
    job: 'refresh-canonical-processes',
    lastFailure: null,
    lastSuccess: '31 jul 2026, 10:20',
    lag: '12 min',
    status: 'completed',
  },
  {
    failuresLastSevenDays: 2,
    job: 'hydrate-compra-agil',
    lastFailure: '31 jul 2026, 09:40',
    lastSuccess: '31 jul 2026, 08:12',
    lag: 'No disponible con contrato actual',
    status: 'failed',
  },
] as const;

const quotaFixture = {
  dailyLimit: 2500,
  last429: null,
  resetAt: '01 ago 2026, 00:00',
  source: 'mercado-publico-api-v2',
  used: 836,
};

const jobRunsFixture = [
  {
    finishedAt: '31 jul 2026, 10:20',
    id: 'job-fixture-021',
    name: 'refresh-canonical-processes',
    startedAt: '31 jul 2026, 10:08',
    status: 'completed',
  },
  {
    finishedAt: '31 jul 2026, 09:40',
    id: 'job-fixture-020',
    name: 'hydrate-compra-agil',
    startedAt: '31 jul 2026, 09:22',
    status: 'failed',
  },
] as const;

const apiCallPagesFixture = [
  [
    {
      endpoint: '/licitaciones',
      errorSummary: null,
      fetchedAt: '31 jul 2026, 10:16',
      httpStatus: 200,
      id: 'api-fixture-031',
      recordsFetched: 50,
      requestParams: {
        codigo: 'L-FIXTURE-001',
        ticket: '[REDACTADO POR SERVIDOR]',
      },
      source: 'mercado-publico-api-v1',
    },
  ],
  [
    {
      endpoint: '/ordenes-de-compra',
      errorSummary: 'Respuesta temporal del proveedor',
      fetchedAt: '31 jul 2026, 09:40',
      httpStatus: 503,
      id: 'api-fixture-030',
      recordsFetched: null,
      requestParams: {
        codigo: 'OC-FIXTURE-001',
        token: '[REDACTADO POR SERVIDOR]',
      },
      source: 'mercado-publico-api-v1',
    },
  ],
] as const;

const csvFixture = [
  {
    checksum: 'fixture-7a2c',
    dataset: 'licitaciones',
    file: 'licitaciones-fixture.csv',
    lastSuccessfulLoad: '31 jul 2026, 08:05',
    parsedRows: 128,
    rejectedRows: 3,
    status: 'partial',
  },
] as const;

const unavailable = 'No disponible con contrato actual';

const getTagColor = (status: string) => {
  if (status === 'completed') {
    return 'green';
  }

  if (status === 'failed') {
    return 'red';
  }

  return 'gray';
};

const getStatusLabel = (status: string) => {
  if (status === 'completed') {
    return 'Completado';
  }

  if (status === 'failed') {
    return 'Fallido';
  }

  if (status === 'partial') {
    return 'Parcial';
  }

  return status;
};

const PrototypeStateMessage = ({ state }: { state: PrototypeState }) => {
  if (state === 'empty') {
    return (
      <StyledState aria-live="polite">
        No hay registros de monitoreo disponibles en esta consulta.
      </StyledState>
    );
  }

  if (state === 'error') {
    return (
      <StyledState role="alert">
        No fue posible obtener el Centro de Control. No se sustituyen datos por
        ceros.
      </StyledState>
    );
  }

  return null;
};

const PipelineTable = ({ isPartial }: { isPartial: boolean }) => (
  <StyledTableWrap aria-label="Estado del pipeline" role="region" tabIndex={0}>
    <StyledTable>
      <thead>
        <tr>
          <th scope="col">Trabajo</th>
          <th scope="col">Estado</th>
          <th scope="col">Último éxito</th>
          <th scope="col">Último fallo</th>
          <th scope="col">Lag</th>
          <th scope="col">Fallos, 7 días</th>
        </tr>
      </thead>
      <tbody>
        {pipelineFixture
          .slice(0, isPartial ? 1 : pipelineFixture.length)
          .map((job) => (
            <tr key={job.job}>
              <td>{job.job}</td>
              <td>
                <Tag
                  color={getTagColor(job.status)}
                  text={getStatusLabel(job.status)}
                />
              </td>
              <td>{job.lastSuccess ?? unavailable}</td>
              <td>{job.lastFailure ?? unavailable}</td>
              <td>{job.lag}</td>
              <td>{job.failuresLastSevenDays}</td>
            </tr>
          ))}
      </tbody>
    </StyledTable>
  </StyledTableWrap>
);

const QuotaFacts = () => {
  const remaining = Math.max(0, quotaFixture.dailyLimit - quotaFixture.used);

  return (
    <>
      <StyledFacts>
        <div>
          <dt>Fuente</dt>
          <dd>{quotaFixture.source}</dd>
        </div>
        <div>
          <dt>Uso diario</dt>
          <dd>
            {quotaFixture.used} de {quotaFixture.dailyLimit}
          </dd>
        </div>
        <div>
          <dt>Restante</dt>
          <dd>{remaining}</dd>
        </div>
        <div>
          <dt>Reinicio</dt>
          <dd>{quotaFixture.resetAt}</dd>
        </div>
        <div>
          <dt>Último 429</dt>
          <dd>{quotaFixture.last429 ?? unavailable}</dd>
        </div>
      </StyledFacts>
      <StyledFormulaNote>
        Restante = max(0, límite diario − uso). Cada fuente conserva su propio
        límite; no se suma una cuota global.
      </StyledFormulaNote>
    </>
  );
};

const InvestigationTable = () => (
  <StyledTableWrap
    aria-label="Ejecuciones de trabajos"
    role="region"
    tabIndex={0}
  >
    <StyledTable>
      <thead>
        <tr>
          <th scope="col">Trabajo</th>
          <th scope="col">Estado</th>
          <th scope="col">Inicio</th>
          <th scope="col">Fin</th>
          <th scope="col">Identificador</th>
        </tr>
      </thead>
      <tbody>
        {jobRunsFixture.map((jobRun) => (
          <tr key={jobRun.id}>
            <td>{jobRun.name}</td>
            <td>
              <Tag
                color={getTagColor(jobRun.status)}
                text={getStatusLabel(jobRun.status)}
              />
            </td>
            <td>{jobRun.startedAt}</td>
            <td>{jobRun.finishedAt}</td>
            <td>{jobRun.id}</td>
          </tr>
        ))}
      </tbody>
    </StyledTable>
  </StyledTableWrap>
);

const ApiCallTable = ({
  expandedCallId,
  onToggleDetails,
  page,
}: {
  expandedCallId: string | null;
  onToggleDetails: (callId: string) => void;
  page: number;
}) => {
  const calls = apiCallPagesFixture[page - 1] ?? [];

  return (
    <StyledTableWrap aria-label="Llamadas a la API" role="region" tabIndex={0}>
      <StyledTable>
        <thead>
          <tr>
            <th scope="col">Fuente</th>
            <th scope="col">Endpoint</th>
            <th scope="col">HTTP</th>
            <th scope="col">Fecha</th>
            <th scope="col">Registros</th>
            <th scope="col">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <Fragment key={call.id}>
              <tr>
                <td>{call.source}</td>
                <td>{call.endpoint}</td>
                <td>{call.httpStatus}</td>
                <td>{call.fetchedAt}</td>
                <td>{call.recordsFetched ?? unavailable}</td>
                <td>
                  <Button
                    onClick={() => onToggleDetails(call.id)}
                    size="small"
                    title={
                      expandedCallId === call.id
                        ? 'Ocultar detalle'
                        : 'Ver detalle'
                    }
                    variant="tertiary"
                  />
                </td>
              </tr>
              {expandedCallId === call.id && (
                <tr>
                  <td colSpan={6}>
                    <StyledTechnicalDetail>
                      <strong>Parámetros redactados por servidor</strong>
                      <code>{JSON.stringify(call.requestParams)}</code>
                      <span>{call.errorSummary ?? 'Sin error informado'}</span>
                    </StyledTechnicalDetail>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </StyledTable>
    </StyledTableWrap>
  );
};

const CsvTable = () => (
  <StyledTableWrap
    aria-label="Integridad de archivos CSV"
    role="region"
    tabIndex={0}
  >
    <StyledTable>
      <thead>
        <tr>
          <th scope="col">Dataset</th>
          <th scope="col">Archivo</th>
          <th scope="col">Estado</th>
          <th scope="col">Filas parseadas</th>
          <th scope="col">Rechazadas</th>
          <th scope="col">Última carga exitosa</th>
        </tr>
      </thead>
      <tbody>
        {csvFixture.map((csv) => (
          <tr key={csv.checksum}>
            <td>{csv.dataset}</td>
            <td>{csv.file}</td>
            <td>
              <Tag color="orange" text={getStatusLabel(csv.status)} />
            </td>
            <td>{csv.parsedRows}</td>
            <td>{csv.rejectedRows}</td>
            <td>{csv.lastSuccessfulLoad}</td>
          </tr>
        ))}
      </tbody>
    </StyledTable>
  </StyledTableWrap>
);

const Diagnostico = ({ isPartial }: { isPartial: boolean }) => (
  <StyledSection id="diagnostico">
    <H3Title title="Diagnóstico" />
    <StyledSupportingText>
      Pipeline y cuota por fuente. Sin clasificación de frescura.
    </StyledSupportingText>
    {isPartial && (
      <InlineBanner
        color="blue"
        message="Pipeline parcial: se muestran sólo los trabajos presentes en la respuesta."
      />
    )}
    <PipelineTable isPartial={isPartial} />
    <QuotaFacts />
  </StyledSection>
);

const Investigacion = () => {
  const [view, setView] = useState<InvestigationView>('job-runs');
  const [page, setPage] = useState(1);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const isApiCalls = view === 'api-calls';
  const hasMore = isApiCalls && page < apiCallPagesFixture.length;

  const selectView = (nextView: InvestigationView) => {
    setView(nextView);
    setPage(1);
    setExpandedCallId(null);
  };

  return (
    <StyledSection id="investigacion">
      <StyledSectionHeading>
        <div>
          <H3Title title="Investigación" />
          <StyledSupportingText>
            Resultados paginados. El origen entrega `hasMore`, no un total
            global.
          </StyledSupportingText>
        </div>
        <StyledInvestigationControls>
          <Button
            onClick={() => selectView('job-runs')}
            size="small"
            title="Ejecuciones"
            variant={view === 'job-runs' ? 'primary' : 'secondary'}
          />
          <Button
            onClick={() => selectView('api-calls')}
            size="small"
            title="Llamadas API"
            variant={isApiCalls ? 'primary' : 'secondary'}
          />
        </StyledInvestigationControls>
      </StyledSectionHeading>
      {isApiCalls ? (
        <ApiCallTable
          expandedCallId={expandedCallId}
          onToggleDetails={(callId) =>
            setExpandedCallId((currentId) =>
              currentId === callId ? null : callId,
            )
          }
          page={page}
        />
      ) : (
        <InvestigationTable />
      )}
      <StyledPagination>
        <Button
          disabled={page === 1}
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          size="small"
          title="Anterior"
          variant="secondary"
        />
        <StyledSupportingText>
          Página {page} · Sin total global
        </StyledSupportingText>
        <Button
          disabled={!hasMore}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          size="small"
          title="Siguiente"
          variant="secondary"
        />
      </StyledPagination>
    </StyledSection>
  );
};

const Integridad = ({ isPartial }: { isPartial: boolean }) => (
  <StyledSection id="integridad">
    <H3Title title="Integridad" />
    <StyledSupportingText>
      CSV conserva conteos y estado del último procesamiento; no se infiere
      frescura.
    </StyledSupportingText>
    {isPartial ? (
      <StyledUnavailableState>
        Salud CSV no disponible en esta respuesta parcial. No se infieren cero
        errores ni validez completa.
      </StyledUnavailableState>
    ) : (
      <CsvTable />
    )}
  </StyledSection>
);

const ContinuousLayout = ({ isPartial }: { isPartial: boolean }) => (
  <StyledContinuousLayout>
    <Diagnostico isPartial={isPartial} />
    <Investigacion />
    <Integridad isPartial={isPartial} />
  </StyledContinuousLayout>
);

const MercadoPublicoControlCenterPrototype = ({
  state,
}: MercadoPublicoControlCenterPrototypeProps) => {
  const shouldShowData = state === 'loaded' || state === 'partial';

  return (
    <StyledPrototype>
      <StyledHeader>
        <div>
          <H2Title title="Centro de Control" />
          <StyledSupportingText>
            Prototipo aislado · fixture compatible con contrato · sin consulta.
          </StyledSupportingText>
        </div>
        <Tag color="gray" text="Lectura continua" />
      </StyledHeader>
      {state === 'partial' && (
        <InlineBanner
          color="blue"
          message="Respuesta parcial: se muestran sólo hechos entregados por el contrato."
        />
      )}
      {shouldShowData ? (
        <ContinuousLayout isPartial={state === 'partial'} />
      ) : (
        <PrototypeStateMessage state={state} />
      )}
    </StyledPrototype>
  );
};

const StyledPrototype = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  margin: 0 auto;
  max-width: min(1180px, 100%);
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledHeader = styled.header`
  align-items: end;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    align-items: start;
    flex-direction: column;
  }
`;

const StyledContinuousLayout = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  min-width: 0;
`;

const StyledInvestigationControls = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledSectionHeading = styled.div`
  align-items: start;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const StyledPagination = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledTechnicalDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};

  code {
    color: ${themeCssVariables.font.color.secondary};
    overflow-wrap: anywhere;
  }
`;

const StyledUnavailableState = styled.p`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledTableWrap = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  max-width: 100%;
  min-width: 0;
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

const StyledFacts = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;

  div {
    border-top: 1px solid ${themeCssVariables.border.color.light};
    padding-top: ${themeCssVariables.spacing[2]};
  }

  dt {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
  }

  dd {
    color: ${themeCssVariables.font.color.primary};
    margin: ${themeCssVariables.spacing[1]} 0 0;
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledFormulaNote = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
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

const meta: Meta<typeof MercadoPublicoControlCenterPrototype> = {
  title: 'Mercado Público/Control center prototype',
  component: MercadoPublicoControlCenterPrototype,
  decorators: [ComponentDecorator],
};

export default meta;
type Story = StoryObj<typeof MercadoPublicoControlCenterPrototype>;

export const Healthy: Story = {
  args: { state: 'loaded' },
};

export const Partial: Story = {
  args: { state: 'partial' },
};

export const Empty: Story = {
  args: { state: 'empty' },
};

export const Error: Story = {
  args: { state: 'error' },
};
