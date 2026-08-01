import { useMercadoPublicoDetectedProcesses } from '@/mercado-publico/hooks/useMercadoPublicoDetectedProcesses';
import { useOpenMercadoPublicoProcessInSidePanel } from '@/mercado-publico/hooks/useOpenMercadoPublicoProcessInSidePanel';
import { useListenToSidePanelClosing } from '@/ui/layout/side-panel/hooks/useListenToSidePanelClosing';
import {
  getMercadoPublicoStatusLabel,
  useMercadoPublicoDisplay,
} from '@/mercado-publico/utils/mercadoPublicoDisplay';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useCallback, useRef, useState } from 'react';
import {
  MercadoPublicoDetectedProcessSortDirection,
  MercadoPublicoDetectedProcessSortKey,
  MercadoPublicoDetectedProcessType,
} from '~/generated/graphql';
import { Tag } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

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

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 720px;
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
    vertical-align: middle;
  }
`;

const StyledTableWrap = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
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
  const { openMercadoPublicoProcessInSidePanel } =
    useOpenMercadoPublicoProcessInSidePanel();
  const [filters, setFilters] = useState<BrowseFilters>(EMPTY_FILTERS);
  const [draftBuyerCode, setDraftBuyerCode] = useState('');
  const [draftChangedSince, setDraftChangedSince] = useState('');
  const [draftPublishedFrom, setDraftPublishedFrom] = useState('');
  const [draftPublishedTo, setDraftPublishedTo] = useState('');
  const [dateRangeError, setDateRangeError] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(
    MercadoPublicoDetectedProcessSortKey.lastSeenAt,
  );
  const [sortDirection, setSortDirection] = useState(
    MercadoPublicoDetectedProcessSortDirection.desc,
  );
  const [selectedProcessCode, setSelectedProcessCode] = useState<string | null>(
    null,
  );
  const [originElement, setOriginElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const publishedFromInputElement = useRef<HTMLInputElement>(null);
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
        direction: sortDirection,
      },
      states: filters.state ? [filters.state] : [],
    });

  const restoreOriginFocus = useCallback(() => {
    if (originElement === null) {
      return;
    }

    originElement.focus();
    setOriginElement(null);
  }, [originElement]);

  useListenToSidePanelClosing(restoreOriginFocus);

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
      publishedFromInputElement.current?.focus();
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
    setSortDirection(MercadoPublicoDetectedProcessSortDirection.desc);
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
      <StyledBrowseContent aria-busy={isRefetching}>
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
              ref={publishedFromInputElement}
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
                const [nextSortKey, nextSortDirection] =
                  event.target.value.split(':');
                setSortKey(nextSortKey as MercadoPublicoDetectedProcessSortKey);
                setSortDirection(
                  nextSortDirection as MercadoPublicoDetectedProcessSortDirection,
                );
                setPage(1);
              }}
              value={`${sortKey}:${sortDirection}`}
            >
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.lastSeenAt}:${MercadoPublicoDetectedProcessSortDirection.desc}`}
              >{t`Última observación, reciente primero`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.lastSeenAt}:${MercadoPublicoDetectedProcessSortDirection.asc}`}
              >{t`Última observación, antigua primero`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.publishedAt}:${MercadoPublicoDetectedProcessSortDirection.desc}`}
              >{t`Publicación, reciente primero`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.publishedAt}:${MercadoPublicoDetectedProcessSortDirection.asc}`}
              >{t`Publicación, antigua primero`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.closingAt}:${MercadoPublicoDetectedProcessSortDirection.asc}`}
              >{t`Cierre, próximo primero`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.closingAt}:${MercadoPublicoDetectedProcessSortDirection.desc}`}
              >{t`Cierre, lejano primero`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.processCode}:${MercadoPublicoDetectedProcessSortDirection.asc}`}
              >{t`Código, ascendente`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.processCode}:${MercadoPublicoDetectedProcessSortDirection.desc}`}
              >{t`Código, descendente`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.canonicalState}:${MercadoPublicoDetectedProcessSortDirection.asc}`}
              >{t`Estado, ascendente`}</option>
              <option
                value={`${MercadoPublicoDetectedProcessSortKey.canonicalState}:${MercadoPublicoDetectedProcessSortDirection.desc}`}
              >{t`Estado, descendente`}</option>
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
            <StyledTable>
              <thead>
                <tr>
                  <th scope="col">{t`Objeto`}</th>
                  <th scope="col">{t`Organismo`}</th>
                  <th scope="col">{t`Estado`}</th>
                  <th scope="col">{t`Cierre`}</th>
                  <th scope="col">{t`Publicada`}</th>
                  <th scope="col">{t`Código`}</th>
                </tr>
              </thead>
              <tbody>
                {processes.items.map((process) => {
                  const processTitle = process.title ?? process.processCode;

                  return (
                    <StyledSelectedRow
                      isSelected={selectedProcessCode === process.processCode}
                      key={process.processCode}
                    >
                      <td>
                        <StyledTitleButton
                          ariaLabel={t`Abrir detalle de ${processTitle}`}
                          data-process-code={process.processCode}
                          data-testid={`process-row-${process.processCode}`}
                          onClick={(event) => {
                            setOriginElement(event.currentTarget);
                            setSelectedProcessCode(process.processCode);
                            openMercadoPublicoProcessInSidePanel({
                              processCode: process.processCode,
                              processTitle,
                              processType,
                            });
                          }}
                          size="small"
                          title={process.title ?? t`Sin información`}
                          variant="tertiary"
                        />
                      </td>
                      <td>
                        {process.buyerName ??
                          process.buyerCode ??
                          t`No informado`}
                      </td>
                      <td>
                        <Tag
                          color="gray"
                          text={getMercadoPublicoStatusLabel(
                            process.canonicalState,
                          )}
                        />
                      </td>
                      <td>
                        {process.closingAt
                          ? formatDate(process.closingAt)
                          : t`Cierre no informado`}
                      </td>
                      <td>{formatDate(process.publishedAt)}</td>
                      <td>{process.processCode}</td>
                    </StyledSelectedRow>
                  );
                })}
              </tbody>
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
    </StyledContainer>
  );
};
