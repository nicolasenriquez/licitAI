import { useMercadoPublicoProcessDetail } from '@/mercado-publico/hooks/useMercadoPublicoProcessDetail';
import {
  getMercadoPublicoStatusColor,
  getMercadoPublicoStatusLabel,
  useMercadoPublicoDisplay,
} from '@/mercado-publico/utils/mercadoPublicoDisplay';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { type MercadoPublicoDetectedProcessType } from '~/generated/graphql';
import { Tag } from 'twenty-ui/data-display';
import { IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

type MercadoPublicoProcessDetailPanelProps = {
  processCode: string;
  processType: MercadoPublicoDetectedProcessType;
  originElement: HTMLButtonElement | null;
  onClose: () => void;
};

const StyledPanel = styled.aside`
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  position: fixed;
  right: 0;
  top: 0;
  width: min(var(--t-side-panel-width, 500px), 100vw);
  z-index: 20;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    border-left: 0;
    width: 100%;
  }
`;

const StyledBackdrop = styled.button`
  background: ${themeCssVariables.background.overlayPrimary};
  border: 0;
  inset: 0;
  position: fixed;
  z-index: 19;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    display: none;
  }
`;

const StyledHeader = styled.header`
  align-items: flex-start;
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
  position: sticky;
  top: 0;
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 0;
  overflow: auto;
  overflow-wrap: anywhere;
  overscroll-behavior: contain;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  margin: 0;
  padding-left: ${themeCssVariables.spacing[4]};
`;

const StyledCloseButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: inherit;
  display: flex;
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
  width: ${themeCssVariables.spacing[8]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }
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
  originElement,
  onClose,
}: MercadoPublicoProcessDetailPanelProps) => {
  const { formatAmount, formatCount, formatDate } = useMercadoPublicoDisplay();
  const [closeButtonElement, setCloseButtonElement] =
    useState<HTMLButtonElement | null>(null);
  const panelElement = useRef<HTMLElement>(null);
  const titleId = useId();
  const { processDetail, isInitialLoading, error, refetch } =
    useMercadoPublicoProcessDetail({
      processType,
      processCode,
    });

  const handleClose = () => {
    onClose();
    originElement?.focus();
  };

  useEffect(() => {
    closeButtonElement?.focus();
  }, [closeButtonElement]);

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      return;
    }

    if (event.key !== 'Tab' || !panelElement.current) {
      return;
    }

    const focusableElements = Array.from(
      panelElement.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      panelElement.current.focus();
      return;
    }

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements.at(-1);

    if (
      event.shiftKey &&
      document.activeElement === firstFocusableElement &&
      lastFocusableElement
    ) {
      event.preventDefault();
      lastFocusableElement.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === lastFocusableElement
    ) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  };

  const handleCloseButtonKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      handleClose();
    }
  };

  const detail = processDetail;

  return (
    <>
      <StyledBackdrop
        aria-hidden="true"
        onClick={handleClose}
        tabIndex={-1}
        type="button"
      />
      <StyledPanel
        aria-labelledby={titleId}
        aria-modal="true"
        onKeyDown={handlePanelKeyDown}
        ref={panelElement}
        role="dialog"
        tabIndex={-1}
      >
        <StyledHeader>
          <div>
            <StyledPanelHeading id={titleId}>
              {detail?.title ?? processCode}
            </StyledPanelHeading>
            <div>{processCode}</div>
            <Tag
              color={getMercadoPublicoStatusColor(detail?.canonicalState)}
              text={getMercadoPublicoStatusLabel(detail?.canonicalState)}
            />
          </div>
          <StyledCloseButton
            aria-label={t`Cerrar detalle`}
            data-close-panel=""
            onClick={handleClose}
            onKeyDown={handleCloseButtonKeyDown}
            ref={setCloseButtonElement}
            type="button"
          >
            <IconX />
          </StyledCloseButton>
        </StyledHeader>
        <StyledContent aria-busy={isInitialLoading}>
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
              {detail.compraAgilSource ? (
                <StyledSection>
                  <h2>{t`Datos de Compra Ágil`}</h2>
                  <div>
                    {t`Estado de origen`}:{' '}
                    {detail.compraAgilSource.state.label ??
                      detail.compraAgilSource.state.code ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`Código de estado`}:{' '}
                    {detail.compraAgilSource.state.code ?? t`No informado`}
                  </div>
                  <div>
                    {t`Identificador de estado`}:{' '}
                    {detail.compraAgilSource.state.id ?? t`No informado`}
                  </div>
                  <div>
                    {t`Último cambio`}:{' '}
                    {formatDate(
                      detail.compraAgilSource.additionalDates.lastChangedAt,
                    )}
                  </div>
                  <div>
                    {t`Cierre primer llamado`}:{' '}
                    {formatDate(
                      detail.compraAgilSource.additionalDates
                        .firstCallClosingAt,
                    )}
                  </div>
                  <div>
                    {t`Cierre segundo llamado`}:{' '}
                    {formatDate(
                      detail.compraAgilSource.additionalDates
                        .secondCallClosingAt,
                    )}
                  </div>
                  <div>
                    {t`Monto disponible`}:{' '}
                    {detail.compraAgilSource.amounts.available === null
                      ? t`No informado`
                      : `${detail.compraAgilSource.amounts.available} ${detail.compraAgilSource.amounts.currency ?? ''}`}
                  </div>
                  <div>
                    {t`Monto disponible en CLP`}:{' '}
                    {formatAmount(detail.compraAgilSource.amounts.availableClp)}
                  </div>
                  <div>
                    {t`Ofertas recibidas`}:{' '}
                    {detail.compraAgilSource.offersReceived === null
                      ? t`No informado`
                      : formatCount(detail.compraAgilSource.offersReceived)}
                  </div>
                  <div>
                    {t`Institución`}:{' '}
                    {detail.compraAgilSource.institution.buyerName ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`RUT técnico`}:{' '}
                    {detail.compraAgilSource.institution.rut ?? t`No informado`}
                  </div>
                  <div>
                    {t`Unidad de compra`}:{' '}
                    {detail.compraAgilSource.institution.purchaseUnit ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`Región`}:{' '}
                    {detail.compraAgilSource.institution.regionName ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`Convocatoria`}:{' '}
                    {detail.compraAgilSource.call.description ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`Estado de convocatoria`}:{' '}
                    {detail.compraAgilSource.call.state ?? t`No informado`}
                  </div>
                  <div>
                    {t`Motivo de deserción`}:{' '}
                    {detail.compraAgilSource.reasons.deserted ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`Motivo de selección`}:{' '}
                    {detail.compraAgilSource.reasons.selection ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`Motivo de cancelación`}:{' '}
                    {detail.compraAgilSource.reasons.cancellation ??
                      t`No informado`}
                  </div>
                  <div>
                    {t`Ruta de origen`}:{' '}
                    {detail.compraAgilSource.sourcePath ?? t`No informado`}
                  </div>
                  <div>{t`Documentos`}</div>
                  {detail.compraAgilSource.documents.length ? (
                    <StyledList>
                      {detail.compraAgilSource.documents.map((document) => (
                        <li key={document.id}>
                          {document.id} · {document.name ?? t`Sin información`}
                        </li>
                      ))}
                    </StyledList>
                  ) : (
                    <p>{t`Sin información`}</p>
                  )}
                </StyledSection>
              ) : null}
              <StyledSection>
                <h2>{t`Ítems`}</h2>
                {detail.items.length ? (
                  <StyledList>
                    {detail.items.map((item) => (
                      <li key={item.code}>
                        {item.code}: {item.name ?? t`Sin información`} ·{' '}
                        {item.quantity ?? t`No informado`} ·{' '}
                        {formatAmount(item.amount)}
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
                  {t`Exactas`}:{' '}
                  {formatCount(detail.reconciliationSummary.exact)} ·{' '}
                  {t`Candidatas`}:{' '}
                  {formatCount(detail.reconciliationSummary.candidate)} ·{' '}
                  {t`Sin relación`}:{' '}
                  {formatCount(detail.reconciliationSummary.unmatched)}
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
              </StyledTechnicalDetails>
            </>
          ) : null}
        </StyledContent>
      </StyledPanel>
    </>
  );
};
