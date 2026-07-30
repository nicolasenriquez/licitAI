import { MercadoPublicoProcessDetailPanel } from '@/mercado-publico/components/MercadoPublicoProcessDetailPanel';
import { useMercadoPublicoDetectedProcesses } from '@/mercado-publico/hooks/useMercadoPublicoDetectedProcesses';
import {
  getMercadoPublicoStatusColor,
  getMercadoPublicoStatusLabel,
  useMercadoPublicoDisplay,
} from '@/mercado-publico/utils/mercadoPublicoDisplay';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useEffect, useRef, useState } from 'react';
import {
  MercadoPublicoDetectedProcessSortDirection,
  MercadoPublicoDetectedProcessSortKey,
  MercadoPublicoDetectedProcessType,
} from '~/generated/graphql';
import { Tag } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

type MercadoPublicoBrowseTabProps = {
  processType: MercadoPublicoDetectedProcessType;
};

type BrowseFilters = {
  buyerCode: string;
  changedSince: string;
  publishedFrom: string;
  publishedTo: string;
  state: string;
};

const EMPTY_FILTERS: BrowseFilters = {
  buyerCode: '',
  changedSince: '',
  publishedFrom: '',
  publishedTo: '',
  state: '',
};

const STATE_OPTIONS_BY_PROCESS_TYPE: Record<
  MercadoPublicoDetectedProcessType,
  readonly string[]
> = {
  [MercadoPublicoDetectedProcessType.compra_agil]: [
    'publicada',
    'cerrada',
    'desierta',
    'proveedor_seleccionado',
    'oc_emitida',
    'cancelada',
  ],
  [MercadoPublicoDetectedProcessType.licitacion]: [
    'publicada',
    'cerrada',
    'desierta',
    'adjudicada',
    'suspendida',
    'revocada',
  ],
  [MercadoPublicoDetectedProcessType.orden_compra]: [],
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
  padding: ${themeCssVariables.spacing[4]};

  @media (prefers-reduced-motion: reduce) {
    &,
    & * {
      animation-duration: 0.01ms;
      animation-iteration-count: 1;
      scroll-behavior: auto;
      transition-duration: 0.01ms;
    }
  }
`;

const StyledControls = styled.div`
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledControl = styled.label`
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledInput = styled.input`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  min-height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledSelect = styled.select`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  min-height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledDisclosureButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledChipButton = styled.button`
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledTable = styled.div`
  min-width: 0;
  width: 100%;
`;

const StyledTableWrap = styled.div`
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
`;

const StyledHeader = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns:
    minmax(0, 2fr) minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr)
    minmax(0, 1fr) minmax(0, 0.9fr);
  padding: ${themeCssVariables.spacing[2]};

  > div {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    grid-template-columns:
      minmax(0, 2fr) minmax(0, 1.3fr) minmax(0, 1fr)
      minmax(0, 1fr);

    > :nth-child(5),
    > :nth-child(6) {
      display: none;
    }
  }
`;

const StyledRow = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: inherit;
  cursor: pointer;
  display: grid;
  font: inherit;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns:
    minmax(0, 2fr) minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr)
    minmax(0, 1fr) minmax(0, 0.9fr);
  min-width: 0;
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }

  &[aria-selected='true'] {
    background: ${themeCssVariables.background.transparent.light};
  }

  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 1024px) {
    grid-template-columns:
      minmax(0, 2fr) minmax(0, 1.3fr) minmax(0, 1fr)
      minmax(0, 1fr);

    > :nth-child(5),
    > :nth-child(6) {
      display: none;
    }
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    align-items: flex-start;
    display: grid;
    gap: ${themeCssVariables.spacing[1]};
    grid-template-columns: minmax(0, 1fr);
    padding: ${themeCssVariables.spacing[3]};

    > span {
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
    }

    > span::before {
      color: ${themeCssVariables.font.color.secondary};
      content: attr(data-label) ': ';
      font-size: ${themeCssVariables.font.size.sm};
      font-weight: ${themeCssVariables.font.weight.medium};
    }

    > :first-child {
      font-weight: ${themeCssVariables.font.weight.semiBold};
    }
  }
`;

const StyledMobileHiddenHeader = styled(StyledHeader)`
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    display: none;
  }
`;

const StyledBrowseContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
`;

const StyledState = styled.p`
  margin: 0;
`;

const StyledSkeleton = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: ${themeCssVariables.spacing[10]};
`;

const StyledSkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledError = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPagination = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

export const MercadoPublicoBrowseTab = ({
  processType,
}: MercadoPublicoBrowseTabProps) => {
  const { formatCount, formatDate } = useMercadoPublicoDisplay();
  const [filters, setFilters] = useState<BrowseFilters>(EMPTY_FILTERS);
  const [draftBuyerCode, setDraftBuyerCode] = useState('');
  const [draftChangedSince, setDraftChangedSince] = useState('');
  const [draftPublishedFrom, setDraftPublishedFrom] = useState('');
  const [draftPublishedTo, setDraftPublishedTo] = useState('');
  const [dateRangeError, setDateRangeError] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(
    MercadoPublicoDetectedProcessSortKey.closingAt,
  );
  const [selectedProcessCode, setSelectedProcessCode] = useState<string | null>(
    null,
  );
  const [originElement, setOriginElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const browseContentElement = useRef<HTMLDivElement>(null);
  const controlIdPrefix = `mercado-publico-${processType}`;

  const { processes, isInitialLoading, isRefetching, error, refetch } =
    useMercadoPublicoDetectedProcesses({
      buyerCode: filters.buyerCode || undefined,
      changedSince: filters.changedSince || undefined,
      limit: 25,
      page,
      processTypes: [processType],
      publishedFrom: filters.publishedFrom || undefined,
      publishedTo: filters.publishedTo || undefined,
      sort: {
        key: sortKey,
        direction:
          sortKey === MercadoPublicoDetectedProcessSortKey.lastSeenAt
            ? MercadoPublicoDetectedProcessSortDirection.desc
            : MercadoPublicoDetectedProcessSortDirection.asc,
      },
      states: filters.state ? [filters.state] : [],
    });

  useEffect(() => {
    if (browseContentElement.current) {
      browseContentElement.current.inert = selectedProcessCode !== null;
    }
  }, [selectedProcessCode]);

  const updateFilters = (updates: Partial<BrowseFilters>) => {
    setFilters((currentFilters) => ({ ...currentFilters, ...updates }));
    setPage(1);
  };

  const updatePublishedDate = (
    key: 'publishedFrom' | 'publishedTo',
    value: string,
  ) => {
    const nextPublishedFrom =
      key === 'publishedFrom' ? value : draftPublishedFrom;
    const nextPublishedTo = key === 'publishedTo' ? value : draftPublishedTo;

    if (key === 'publishedFrom') {
      setDraftPublishedFrom(value);
    } else {
      setDraftPublishedTo(value);
    }

    if (
      nextPublishedFrom &&
      nextPublishedTo &&
      nextPublishedFrom > nextPublishedTo
    ) {
      setDateRangeError(true);
      return;
    }

    setDateRangeError(false);
    updateFilters({
      publishedFrom: nextPublishedFrom,
      publishedTo: nextPublishedTo,
    });
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDraftBuyerCode('');
    setDraftChangedSince('');
    setDraftPublishedFrom('');
    setDraftPublishedTo('');
    setDateRangeError(false);
    setPage(1);
    setSortKey(MercadoPublicoDetectedProcessSortKey.lastSeenAt);
  };

  const removeFilter = (key: keyof BrowseFilters) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: '' }));

    if (key === 'buyerCode') {
      setDraftBuyerCode('');
    }
    if (key === 'changedSince') {
      setDraftChangedSince('');
    }
    if (key === 'publishedFrom') {
      setDraftPublishedFrom('');
    }
    if (key === 'publishedTo') {
      setDraftPublishedTo('');
    }
    if (key === 'publishedFrom' || key === 'publishedTo') {
      setDateRangeError(false);
    }

    setPage(1);
  };

  const closeProcessDetail = () => {
    if (browseContentElement.current) {
      browseContentElement.current.inert = false;
    }

    setSelectedProcessCode(null);
  };

  const activeFilters = [
    filters.state
      ? {
          key: 'state' as const,
          label: t`Estado: ${getMercadoPublicoStatusLabel(filters.state)}`,
        }
      : null,
    filters.publishedFrom
      ? {
          key: 'publishedFrom' as const,
          label: t`Desde: ${filters.publishedFrom}`,
        }
      : null,
    filters.publishedTo
      ? { key: 'publishedTo' as const, label: t`Hasta: ${filters.publishedTo}` }
      : null,
    filters.buyerCode
      ? { key: 'buyerCode' as const, label: t`Organismo: ${filters.buyerCode}` }
      : null,
    filters.changedSince
      ? {
          key: 'changedSince' as const,
          label: t`Último cambio: ${filters.changedSince}`,
        }
      : null,
  ].filter(
    (filter): filter is { key: keyof BrowseFilters; label: string } =>
      filter !== null,
  );

  const total = processes?.total;
  const limit = processes?.limit ?? 25;
  const currentPage = processes?.page ?? page;
  const firstItem = total ? (currentPage - 1) * limit + 1 : null;
  const lastItem =
    total === undefined ? null : Math.min(currentPage * limit, total);
  const hasAppliedFilters = activeFilters.length > 0;
  const noResultsMessage = hasAppliedFilters
    ? t`No encontramos resultados con estos filtros.`
    : t`Aún no hay oportunidades disponibles`;

  return (
    <StyledContainer>
      <StyledBrowseContent aria-busy={isRefetching} ref={browseContentElement}>
        <StyledControls>
          <StyledControl htmlFor={`${controlIdPrefix}-state`}>
            {t`Estado`}
            <StyledSelect
              aria-label={t`Estado`}
              disabled={isRefetching}
              id={`${controlIdPrefix}-state`}
              onChange={(event) => updateFilters({ state: event.target.value })}
              value={filters.state}
            >
              <option value="">{t`Todos`}</option>
              {STATE_OPTIONS_BY_PROCESS_TYPE[processType].map((state) => (
                <option key={state} value={state}>
                  {getMercadoPublicoStatusLabel(state)}
                </option>
              ))}
            </StyledSelect>
          </StyledControl>
          <StyledControl htmlFor={`${controlIdPrefix}-published-from`}>
            {t`Publicada desde`}
            <StyledInput
              aria-label={t`Publicada desde`}
              aria-invalid={dateRangeError}
              disabled={isRefetching}
              id={`${controlIdPrefix}-published-from`}
              onChange={(event) =>
                updatePublishedDate('publishedFrom', event.target.value)
              }
              type="date"
              value={draftPublishedFrom}
            />
          </StyledControl>
          <StyledControl htmlFor={`${controlIdPrefix}-published-to`}>
            {t`Publicada hasta`}
            <StyledInput
              aria-label={t`Publicada hasta`}
              aria-invalid={dateRangeError}
              disabled={isRefetching}
              id={`${controlIdPrefix}-published-to`}
              onChange={(event) =>
                updatePublishedDate('publishedTo', event.target.value)
              }
              type="date"
              value={draftPublishedTo}
            />
          </StyledControl>
          <StyledControl htmlFor={`${controlIdPrefix}-sort`}>
            {t`Orden`}
            <StyledSelect
              aria-label={t`Orden`}
              disabled={isRefetching}
              id={`${controlIdPrefix}-sort`}
              onChange={(event) => {
                setSortKey(
                  event.target.value as MercadoPublicoDetectedProcessSortKey,
                );
                setPage(1);
              }}
              value={sortKey}
            >
              <option
                value={MercadoPublicoDetectedProcessSortKey.closingAt}
              >{t`Cierre`}</option>
              <option
                value={MercadoPublicoDetectedProcessSortKey.publishedAt}
              >{t`Publicación`}</option>
              <option
                value={MercadoPublicoDetectedProcessSortKey.lastSeenAt}
              >{t`Última observación`}</option>
            </StyledSelect>
          </StyledControl>
          <StyledDisclosureButton
            aria-controls={`${controlIdPrefix}-more-filters`}
            aria-expanded={isMoreFiltersOpen}
            onClick={() => setIsMoreFiltersOpen((isOpen) => !isOpen)}
            type="button"
          >
            {t`Más filtros`}
          </StyledDisclosureButton>
        </StyledControls>
        {dateRangeError ? (
          <StyledState role="alert">
            {t`La fecha inicial debe ser anterior o igual a la fecha final.`}
          </StyledState>
        ) : null}
        {isMoreFiltersOpen ? (
          <StyledControls id={`${controlIdPrefix}-more-filters`}>
            <StyledControl htmlFor={`${controlIdPrefix}-buyer-code`}>
              {t`Código exacto de organismo`}
              <StyledInput
                id={`${controlIdPrefix}-buyer-code`}
                onChange={(event) => setDraftBuyerCode(event.target.value)}
                value={draftBuyerCode}
              />
            </StyledControl>
            <StyledControl htmlFor={`${controlIdPrefix}-changed-since`}>
              {t`Último cambio desde`}
              <StyledInput
                id={`${controlIdPrefix}-changed-since`}
                onChange={(event) => setDraftChangedSince(event.target.value)}
                type="date"
                value={draftChangedSince}
              />
            </StyledControl>
            <Button
              onClick={() =>
                updateFilters({
                  buyerCode: draftBuyerCode.trim(),
                  changedSince: draftChangedSince,
                })
              }
              size="small"
              title={t`Aplicar`}
              variant="secondary"
            />
          </StyledControls>
        ) : null}
        {activeFilters.length ? (
          <StyledChips>
            {activeFilters.map((filter) => (
              <StyledChipButton
                aria-label={t`Quitar filtro ${filter.label}`}
                key={filter.key}
                onClick={() => removeFilter(filter.key)}
                type="button"
              >
                <Tag color="gray" text={filter.label} variant="border" />
              </StyledChipButton>
            ))}
            <Button
              onClick={clearFilters}
              size="small"
              title={t`Limpiar filtros`}
              variant="secondary"
            />
          </StyledChips>
        ) : null}
        {error ? (
          <StyledError role="alert">
            <span>
              {processes
                ? t`No pudimos actualizar esta sección.`
                : t`No pudimos cargar esta sección.`}
            </span>
            <Button
              onClick={() => refetch()}
              size="small"
              title={t`Reintentar`}
              variant="secondary"
            />
          </StyledError>
        ) : null}
        {isRefetching ? (
          <StyledState aria-live="polite">{t`Actualizando…`}</StyledState>
        ) : null}
        {isInitialLoading && !processes ? (
          <StyledSkeletonList aria-hidden="true">
            <StyledSkeleton />
            <StyledSkeleton />
            <StyledSkeleton />
          </StyledSkeletonList>
        ) : null}
        {!isInitialLoading && !error && processes?.items.length === 0 ? (
          <StyledState aria-live="polite">{noResultsMessage}</StyledState>
        ) : null}
        {processes?.items.length ? (
          <StyledTableWrap
            aria-label={t`Resultados de procesos`}
            role="region"
            tabIndex={0}
          >
            <StyledTable role="table">
              <StyledMobileHiddenHeader>
                <div role="columnheader">{t`Objeto`}</div>
                <div role="columnheader">{t`Organismo`}</div>
                <div role="columnheader">{t`Estado`}</div>
                <div role="columnheader">{t`Cierre`}</div>
                <div role="columnheader">{t`Publicada`}</div>
                <div role="columnheader">{t`Código`}</div>
              </StyledMobileHiddenHeader>
              {processes.items.map((process) => {
                const processTitle = process.title ?? process.processCode;

                return (
                  <StyledRow
                    aria-haspopup="dialog"
                    aria-label={t`Abrir detalle de ${processTitle}`}
                    aria-selected={selectedProcessCode === process.processCode}
                    data-process-code={process.processCode}
                    data-testid={`process-row-${process.processCode}`}
                    key={process.processCode}
                    onClick={(event) => {
                      setOriginElement(event.currentTarget);
                      setSelectedProcessCode(process.processCode);
                    }}
                    type="button"
                  >
                    <span
                      data-label={t`Objeto`}
                      title={process.title ?? process.processCode}
                    >
                      {process.title ?? t`Sin información`}
                    </span>
                    <span data-label={t`Organismo`}>
                      {process.buyerName ??
                        process.buyerCode ??
                        t`No informado`}
                    </span>
                    <span data-label={t`Estado`}>
                      <Tag
                        color={getMercadoPublicoStatusColor(
                          process.canonicalState,
                        )}
                        text={getMercadoPublicoStatusLabel(
                          process.canonicalState,
                        )}
                      />
                    </span>
                    <span data-label={t`Cierre`}>
                      {process.closingAt
                        ? formatDate(process.closingAt)
                        : t`Cierre no informado`}
                    </span>
                    <span data-label={t`Publicada`}>
                      {formatDate(process.publishedAt)}
                    </span>
                    <span data-label={t`Código`}>{process.processCode}</span>
                  </StyledRow>
                );
              })}
            </StyledTable>
          </StyledTableWrap>
        ) : null}
        {processes ? (
          <StyledPagination>
            <span>
              {total
                ? t`${formatCount(firstItem)}–${formatCount(lastItem)} de ${formatCount(total)}`
                : t`Sin resultados`}
            </span>
            <div>
              <Button
                disabled={currentPage <= 1 || isRefetching}
                onClick={() => setPage((currentPage) => currentPage - 1)}
                size="small"
                title={t`Anterior`}
                variant="secondary"
              />
              <span>
                {' '}
                {t`Página`} {formatCount(currentPage)}{' '}
              </span>
              <Button
                disabled={
                  total === undefined ||
                  currentPage * limit >= total ||
                  isRefetching
                }
                onClick={() => setPage((currentPage) => currentPage + 1)}
                size="small"
                title={t`Siguiente`}
                variant="secondary"
              />
            </div>
          </StyledPagination>
        ) : null}
      </StyledBrowseContent>
      {selectedProcessCode ? (
        <MercadoPublicoProcessDetailPanel
          onClose={closeProcessDetail}
          originElement={originElement}
          processCode={selectedProcessCode}
          processType={processType}
        />
      ) : null}
    </StyledContainer>
  );
};
