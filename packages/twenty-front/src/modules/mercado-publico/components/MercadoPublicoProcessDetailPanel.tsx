import { useMercadoPublicoProcessDetail } from '@/mercado-publico/hooks/useMercadoPublicoProcessDetail';
import {
  getMercadoPublicoStatusLabel,
  useMercadoPublicoDisplay,
} from '@/mercado-publico/utils/mercadoPublicoDisplay';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type MercadoPublicoDetectedProcessType } from '~/generated/graphql';
import { Tag } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type MercadoPublicoProcessDetailPanelProps = {
  processCode: string;
  processType: MercadoPublicoDetectedProcessType;
};

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledIdentity = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledList = styled.ul`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  margin: 0;
  padding-left: ${themeCssVariables.spacing[4]};
`;

const StyledPanelHeading = styled.h2`
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
  overflow-wrap: anywhere;
`;

const StyledTechnicalDetails = styled.details`
  summary {
    border-radius: ${themeCssVariables.border.radius.sm};
    cursor: pointer;
    padding: ${themeCssVariables.spacing[1]};

    &:focus-visible {
      outline: 2px solid ${themeCssVariables.accent.primary};
      outline-offset: 2px;
    }
  }
`;

export const MercadoPublicoProcessDetailPanel = ({
  processCode,
  processType,
}: MercadoPublicoProcessDetailPanelProps) => {
  const { formatAmount, formatCount, formatDate } = useMercadoPublicoDisplay();
  const { processDetail, isInitialLoading, error, refetch } =
    useMercadoPublicoProcessDetail({
      processType,
      processCode,
    });

  const detail = processDetail;

  return (
    <StyledContent aria-busy={isInitialLoading}>
      <StyledIdentity>
        <StyledPanelHeading>{detail?.title ?? processCode}</StyledPanelHeading>
        <div>{processCode}</div>
        <Tag
          color="gray"
          text={getMercadoPublicoStatusLabel(detail?.canonicalState)}
        />
      </StyledIdentity>
      {error ? (
        <div role="alert">
          <p>{t`No pudimos cargar el detalle.`}</p>
          <Button
            onClick={() => refetch()}
            size="small"
            title={t`Reintentar`}
            variant="secondary"
          />
        </div>
      ) : null}
      {isInitialLoading && !detail ? (
        <p aria-live="polite">{t`Cargando detalle…`}</p>
      ) : null}
      {!isInitialLoading && !error && !detail ? (
        <p>{t`Este proceso ya no está disponible`}</p>
      ) : null}
      {detail ? (
        <>
          <StyledSection>
            <h2>{t`Comprador`}</h2>
            <p>{detail.buyer.name ?? t`Sin información`}</p>
            <small>{detail.buyer.code ?? t`Sin información`}</small>
          </StyledSection>
          <StyledSection>
            <h2>{t`Fechas`}</h2>
            <div>
              {t`Publicada`}: {formatDate(detail.dates.publishedAt)}
            </div>
            <div>
              {t`Cierre`}: {formatDate(detail.dates.closingAt)}
            </div>
          </StyledSection>
          {detail.processType === 'compra_agil' && !detail.compraAgilSource ? (
            <StyledSection>
              <p>{t`Detalle fuente aún no disponible.`}</p>
            </StyledSection>
          ) : null}
          {detail.compraAgilSource ? (
            <>
              <StyledSection>
                <h2>{t`Necesidad y entrega`}</h2>
                <div>
                  {detail.compraAgilSource.need?.description ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Dirección`}:{' '}
                  {detail.compraAgilSource.delivery?.address ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Plazo (días)`}:{' '}
                  {detail.compraAgilSource.delivery?.leadTimeDays ??
                    t`No informado por fuente.`}
                </div>
              </StyledSection>
              <StyledSection>
                <h2>{t`Presupuesto`}</h2>
                <div>
                  {t`Tipo`}:{' '}
                  {detail.compraAgilSource.budget?.type ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Estimado`}:{' '}
                  {formatAmount(
                    detail.compraAgilSource.budget?.estimated ?? null,
                  )}
                </div>
                <div>
                  {t`Disponible`}:{' '}
                  {formatAmount(
                    detail.compraAgilSource.budget?.available ?? null,
                  )}
                </div>
                <div>
                  {t`Disponible CLP`}:{' '}
                  {formatAmount(
                    detail.compraAgilSource.budget?.availableClp ?? null,
                  )}
                </div>
                <div>
                  {t`Monto disponible de origen`}:{' '}
                  {detail.compraAgilSource.amounts.currency ??
                    t`Moneda no informada`}{' '}
                  {formatCount(detail.compraAgilSource.amounts.available)}
                </div>
                <div>
                  {t`Monto disponible CLP de origen`}:{' '}
                  {formatAmount(detail.compraAgilSource.amounts.availableClp)}
                </div>
                <div>
                  {t`Ofertas recibidas`}:{' '}
                  {formatCount(detail.compraAgilSource.offersReceived)}
                </div>
              </StyledSection>
              <StyledSection>
                <h2>{t`Proveedores y cotizaciones`}</h2>
                {detail.compraAgilSource.suppliers?.length ? (
                  <StyledList>
                    {detail.compraAgilSource.suppliers.map(
                      (supplier, index) => (
                        <li key={`${supplier.rut ?? 'proveedor'}-${index}`}>
                          {supplier.name ??
                            supplier.rut ??
                            t`No informado por fuente.`}{' '}
                          · {formatAmount(supplier.quote.totalAmount)}
                          {supplier.quote.products?.map(
                            (product, productIndex) => (
                              <div
                                key={`${product.code ?? 'producto'}-${productIndex}`}
                              >
                                {product.code ?? t`No informado por fuente.`}:{' '}
                                {product.name ?? t`No informado por fuente.`} ·{' '}
                                {product.quantity ??
                                  t`No informado por fuente.`}{' '}
                                · {formatAmount(product.totalAmount)}
                              </div>
                            ),
                          )}
                        </li>
                      ),
                    )}
                  </StyledList>
                ) : (
                  <p>{t`No informado por fuente.`}</p>
                )}
              </StyledSection>
              <StyledSection>
                <h2>{t`Documentos`}</h2>
                {detail.compraAgilSource.documents.length ? (
                  <StyledList>
                    {detail.compraAgilSource.documents.map((document) => (
                      <li key={document.id}>
                        {document.id} ·{' '}
                        {document.name ?? t`No informado por fuente.`}
                      </li>
                    ))}
                  </StyledList>
                ) : (
                  <p>{t`No informado por fuente.`}</p>
                )}
              </StyledSection>
              <StyledSection>
                <h2>{t`Estado, fechas y motivos`}</h2>
                <div>
                  {t`Estado de origen`}:{' '}
                  {detail.compraAgilSource.state.label ??
                    t`No informado por fuente.`}{' '}
                  ({detail.compraAgilSource.state.code ?? t`Sin código`} ·{' '}
                  {detail.compraAgilSource.state.id ?? t`Sin ID`})
                </div>
                <div>
                  {t`Último cambio`}:{' '}
                  {formatDate(
                    detail.compraAgilSource.additionalDates.lastChangedAt,
                  )}
                </div>
                <div>
                  {t`Cierre del primer llamado`}:{' '}
                  {formatDate(
                    detail.compraAgilSource.additionalDates.firstCallClosingAt,
                  )}
                </div>
                <div>
                  {t`Cierre del segundo llamado`}:{' '}
                  {formatDate(
                    detail.compraAgilSource.additionalDates.secondCallClosingAt,
                  )}
                </div>
                <div>
                  {t`Motivo de deserción`}:{' '}
                  {detail.compraAgilSource.reasons.deserted ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Motivo de selección`}:{' '}
                  {detail.compraAgilSource.reasons.selection ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Motivo de cancelación`}:{' '}
                  {detail.compraAgilSource.reasons.cancellation ??
                    t`No informado por fuente.`}
                </div>
              </StyledSection>
              <StyledSection>
                <h2>{t`Institución y convocatoria`}</h2>
                <div>
                  {t`RUT de institución`}:{' '}
                  {detail.compraAgilSource.institution.rut ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Región`}:{' '}
                  {detail.compraAgilSource.institution.regionName ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Unidad de compra`}:{' '}
                  {detail.compraAgilSource.institution.purchaseUnit ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Comprador de origen`}:{' '}
                  {detail.compraAgilSource.institution.buyerName ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Convocatoria`}:{' '}
                  {detail.compraAgilSource.call.description ??
                    t`No informado por fuente.`}
                </div>
                <div>
                  {t`Estado de convocatoria`}:{' '}
                  {detail.compraAgilSource.call.state ??
                    t`No informado por fuente.`}
                </div>
              </StyledSection>
            </>
          ) : null}
          <StyledSection>
            <h2>{t`Ítems`}</h2>
            {detail.items.length ? (
              <StyledList>
                {detail.items.map((item) => (
                  <li key={item.code}>
                    {item.code}: {item.name ?? t`Sin información`} ·{' '}
                    {item.description ?? t`No informado`} ·{' '}
                    {item.quantity ?? t`No informado`} ·{' '}
                    {item.unit ?? t`No informado`} · {formatAmount(item.amount)}
                  </li>
                ))}
              </StyledList>
            ) : (
              <p>{t`Sin información`}</p>
            )}
          </StyledSection>
          <StyledSection>
            <h2>{t`Adjudicaciones`}</h2>
            {detail.adjudications?.length ? (
              <StyledList>
                {detail.adjudications.map((adjudication) => (
                  <li key={adjudication.supplierCode}>
                    {adjudication.supplierCode} ·{' '}
                    {adjudication.quantity ?? t`No informado`} ·{' '}
                    {formatAmount(adjudication.amount)}
                  </li>
                ))}
              </StyledList>
            ) : (
              <p>{t`Sin información`}</p>
            )}
          </StyledSection>
          <StyledSection>
            <h2>{t`Órdenes de compra relacionadas`}</h2>
            {detail.relatedOcs.length ? (
              <StyledList>
                {detail.relatedOcs.map((order) => (
                  <li key={order.code}>
                    {order.code} ·{' '}
                    {getMercadoPublicoStatusLabel(order.canonicalState)} ·{' '}
                    {order.matchType} · {order.matchConfidence}
                  </li>
                ))}
              </StyledList>
            ) : (
              <p>{t`Sin información`}</p>
            )}
          </StyledSection>
          <StyledSection>
            <h2>{t`Conciliación`}</h2>
            <p>
              {t`Exactas`}: {formatCount(detail.reconciliationSummary.exact)} ·{' '}
              {t`Candidatas`}:{' '}
              {formatCount(detail.reconciliationSummary.candidate)} ·{' '}
              {t`Sin relación`}:{' '}
              {formatCount(detail.reconciliationSummary.unmatched)} ·{' '}
              {t`Revisión manual`}:{' '}
              {formatCount(detail.reconciliationSummary.manualReviewRequired)}
            </p>
          </StyledSection>
          <StyledSection>
            <h2>{t`Fuentes`}</h2>
            {detail.sourceLineage.length ? (
              <StyledList>
                {detail.sourceLineage.map((source) => (
                  <li key={source.source}>
                    {source.source} · {formatCount(source.rowCount)} ·{' '}
                    {formatDate(source.lastSeenAt)}
                  </li>
                ))}
              </StyledList>
            ) : (
              <p>{t`Sin información`}</p>
            )}
          </StyledSection>
          <StyledTechnicalDetails>
            <summary>{t`Información técnica`}</summary>
            <p>
              {t`Prioridad de fuente`}:{' '}
              {detail.sourcePriority ?? t`No informado`}
            </p>
            <p>
              {t`Última observación`}: {formatDate(detail.lastSeenAt)}
            </p>
            <p>
              {t`Estado original`}:{' '}
              {detail.rawState?.label ??
                detail.rawState?.code ??
                t`No informado`}
            </p>
            {detail.compraAgilSource ? (
              <p>
                {t`Ruta de detalle de origen`}:{' '}
                {detail.compraAgilSource.sourcePath ?? t`No informado`}
              </p>
            ) : null}
          </StyledTechnicalDetails>
        </>
      ) : null}
    </StyledContent>
  );
};
