import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { IconX } from 'twenty-ui/icon';
import { Button, Checkbox, IconButton, SearchInput } from 'twenty-ui/input';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MercadoPublicoV2OpportunitySort } from '~/generated/graphql';

import {
  type MercadoPublicoV2CohortStatus,
  type MercadoPublicoV2Filters,
  type MercadoPublicoV2QuickView,
  type MercadoPublicoV2Sort,
  getMercadoPublicoV2QuickView,
  getMercadoPublicoV2QuickViewFilters,
} from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';
import { formatMercadoPublicoRegion } from '@/mercado-publico/utils/format-mercado-publico-display';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';

export const MERCADO_PUBLICO_V2_STATES = [
  'publicada',
  'cerrada',
  'desierta',
  'cancelada',
  'proveedor_seleccionado',
  'oc_emitida',
] as const;

const MERCADO_PUBLICO_V2_COHORTS: MercadoPublicoV2CohortStatus[] = [
  'active',
  'terminal',
];
const MERCADO_PUBLICO_V2_REGIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
];
const MERCADO_PUBLICO_V2_CURRENCIES = ['CLP', 'UF', 'USD'];
const FILTER_MODAL_ID = 'mercado-publico-v2-filters';

export const MERCADO_PUBLICO_V2_SORTS: MercadoPublicoV2Sort[] = [
  MercadoPublicoV2OpportunitySort.CLOSING_AT_ASC,
  MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC,
  MercadoPublicoV2OpportunitySort.PUBLISHED_AT_DESC,
  MercadoPublicoV2OpportunitySort.PUBLISHED_AT_ASC,
  MercadoPublicoV2OpportunitySort.AMOUNT_DESC,
  MercadoPublicoV2OpportunitySort.AMOUNT_ASC,
];

const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPrimaryRow = styled.div`
  align-items: end;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(220px, 1fr) auto minmax(180px, 220px);

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const StyledRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
`;

const StyledField = styled.label`
  align-items: stretch;
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledFieldLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  min-height: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledSearchInput = styled(SearchInput)`
  width: 100%;
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  min-height: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[2]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledClosingRange = styled.fieldset`
  border: 0;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  min-width: 0;
  padding: 0;

  legend {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.xs};
    margin-bottom: ${themeCssVariables.spacing[1]};
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCheckboxGroup = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledCheckbox = styled.label`
  align-items: center;
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledSection = styled.section`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding-top: ${themeCssVariables.spacing[3]};
`;

const StyledSectionHeading = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledModalHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledModalTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
`;

const StyledModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledQuickFilters = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledQuickFilterLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  width: 100%;
`;

const StyledNotice = styled.p`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledFieldError = styled.p`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
  grid-column: 1 / -1;
  margin: 0;
`;

export type MercadoPublicoV2FilterBarProps = {
  filters: MercadoPublicoV2Filters;
  sort: MercadoPublicoV2Sort;
  showSort?: boolean;
  notice: string | null;
  noticeId: string;
  onApply: (filters: Partial<MercadoPublicoV2Filters>) => void;
  onClear: () => void;
  onSortChange?: (sort: MercadoPublicoV2Sort) => void;
};

export const MercadoPublicoV2FilterBar = ({
  filters,
  sort,
  showSort = true,
  notice,
  noticeId,
  onApply,
  onClear,
  onSortChange,
}: MercadoPublicoV2FilterBarProps) => {
  const { t } = useLingui();
  const { closeModal, openModal } = useModal();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<MercadoPublicoV2Filters>(filters);
  const [validationErrors, setValidationErrors] = useState({
    closing: null as string | null,
    amount: null as string | null,
    documents: null as string | null,
  });

  const stateLabels: Record<
    (typeof MERCADO_PUBLICO_V2_STATES)[number],
    string
  > = {
    publicada: t`Publicada`,
    cerrada: t`Cerrada`,
    desierta: t`Desierta`,
    cancelada: t`Cancelada`,
    proveedor_seleccionado: t`Proveedor seleccionado`,
    oc_emitida: t`Orden de compra emitida`,
  };
  const cohortLabels: Record<MercadoPublicoV2CohortStatus, string> = {
    active: t`Activa`,
    terminal: t`Terminal`,
  };
  const sortLabels: Record<MercadoPublicoV2Sort, string> = {
    [MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC]: t`Cierre más lejano`,
    [MercadoPublicoV2OpportunitySort.CLOSING_AT_ASC]: t`Cierre más próximo`,
    [MercadoPublicoV2OpportunitySort.PUBLISHED_AT_DESC]: t`Publicación reciente`,
    [MercadoPublicoV2OpportunitySort.PUBLISHED_AT_ASC]: t`Publicación antigua`,
    [MercadoPublicoV2OpportunitySort.AMOUNT_DESC]: t`Monto mayor a menor`,
    [MercadoPublicoV2OpportunitySort.AMOUNT_ASC]: t`Monto menor a mayor`,
  };

  useEffect(() => setDraft(filters), [filters]);

  const updateDraft = (partial: Partial<MercadoPublicoV2Filters>): void => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const activeFilterCount = [
    filters.search.trim() !== '',
    filters.cohortStatus !== null,
    filters.states.length > 0,
    filters.buyer.trim() !== '',
    filters.region !== null,
    filters.closingAtFrom !== null,
    filters.closingAtTo !== null,
    filters.documentCountMin !== null,
    filters.documentCountMax !== null,
    filters.llamado !== null,
    filters.amountMin !== null,
    filters.amountMax !== null,
    filters.currencies.length > 0,
  ].filter(Boolean).length;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextErrors = {
      closing:
        draft.closingAtFrom !== null &&
        draft.closingAtTo !== null &&
        draft.closingAtFrom > draft.closingAtTo
          ? t`La fecha desde no puede superar la fecha hasta.`
          : null,
      amount:
        draft.amountMin !== null &&
        draft.amountMax !== null &&
        Number(draft.amountMin) > Number(draft.amountMax)
          ? t`El mínimo no puede superar el máximo.`
          : null,
      documents:
        draft.documentCountMin !== null &&
        draft.documentCountMax !== null &&
        draft.documentCountMin > draft.documentCountMax
          ? t`El mínimo no puede superar el máximo.`
          : null,
    };

    setValidationErrors(nextErrors);
    if (Object.values(nextErrors).some((error) => error !== null)) return;

    onApply(draft);
    closeModal(FILTER_MODAL_ID);
    triggerRef.current?.querySelector('button')?.focus();
  };

  const handleOpen = (): void => {
    setDraft(filters);
    setValidationErrors({ closing: null, amount: null, documents: null });
    openModal(FILTER_MODAL_ID);
  };

  const handleClose = (): void => {
    setDraft(filters);
    setValidationErrors({ closing: null, amount: null, documents: null });
    closeModal(FILTER_MODAL_ID);
    triggerRef.current?.querySelector('button')?.focus();
  };

  const handleClear = (): void => {
    onClear();
    closeModal(FILTER_MODAL_ID);
    triggerRef.current?.querySelector('button')?.focus();
  };

  const selectedQuickView = getMercadoPublicoV2QuickView(filters);
  const quickViewOptions: Array<{
    id: MercadoPublicoV2QuickView;
    label: string;
  }> = [
    { id: 'active', label: 'Activas' },
    { id: 'closing-today', label: 'Cierra hoy' },
    { id: 'closing-next-three-days', label: 'Próx. 3 días' },
    { id: 'all', label: 'Todas' },
  ];

  const selectQuickView = (quickView: MercadoPublicoV2QuickView): void => {
    onApply(getMercadoPublicoV2QuickViewFilters(quickView));
  };

  return (
    <StyledForm>
      <StyledPrimaryRow>
        <StyledField>
          <StyledFieldLabel>{t`Buscar por código, título o comprador`}</StyledFieldLabel>
          <StyledSearchInput
            placeholder={t`Buscar por código, título o comprador…`}
            value={filters.search}
            onChange={(search) => onApply({ search })}
          />
        </StyledField>
        <div ref={triggerRef}>
          <Button
            ariaLabel={
              activeFilterCount > 0
                ? `Filtros (${activeFilterCount})`
                : 'Filtros'
            }
            onClick={handleOpen}
            title={
              activeFilterCount > 0
                ? `Filtros (${activeFilterCount})`
                : 'Filtros'
            }
            type="button"
            variant="secondary"
          />
        </div>
        {showSort && onSortChange && (
          <StyledField>
            <StyledFieldLabel>{t`Orden`}</StyledFieldLabel>
            <StyledSelect
              aria-label={t`Orden de resultados`}
              value={sort}
              onChange={(event) =>
                onSortChange(event.target.value as MercadoPublicoV2Sort)
              }
            >
              {MERCADO_PUBLICO_V2_SORTS.map((sortOption) => (
                <option key={sortOption} value={sortOption}>
                  {sortLabels[sortOption]}
                </option>
              ))}
            </StyledSelect>
          </StyledField>
        )}
      </StyledPrimaryRow>

      <StyledQuickFilters aria-label="Vistas rápidas" role="group">
        <StyledQuickFilterLabel>Vistas rápidas</StyledQuickFilterLabel>
        {quickViewOptions.map(({ id, label }) => {
          const selected = selectedQuickView === id;

          return (
            <Button
              key={id}
              ariaLabel={selected ? `${label} (seleccionada)` : label}
              dataTestId={`mercado-publico-quick-view-${id}`}
              onClick={() => selectQuickView(id)}
              size="small"
              title={label}
              type="button"
              variant={selected ? 'primary' : 'secondary'}
            />
          );
        })}
      </StyledQuickFilters>

      {notice && (
        <StyledNotice id={noticeId} role="alert" aria-live="assertive">
          {notice}
        </StyledNotice>
      )}

      <ModalStatefulWrapper
        ariaLabel={t`Filtros de Mercado Público`}
        autoHeight
        isClosable
        modalInstanceId={FILTER_MODAL_ID}
        onClose={handleClose}
        renderInDocumentBody
        size="large"
        trapFocus
      >
        <ModalHeader>
          <StyledModalHeader>
            <StyledModalTitle>{t`Filtros`}</StyledModalTitle>
            <IconButton
              Icon={IconX}
              ariaLabel={t`Cerrar filtros`}
              onClick={handleClose}
              size="small"
              variant="tertiary"
            />
          </StyledModalHeader>
        </ModalHeader>
        <StyledModalForm onSubmit={handleSubmit}>
          <ModalContent>
            <StyledSection>
              <StyledSectionHeading>{t`Contexto`}</StyledSectionHeading>
              <StyledRow>
                <StyledField>
                  <StyledFieldLabel>{t`Situación`}</StyledFieldLabel>
                  <StyledSelect
                    aria-label={t`Filtrar por situación`}
                    value={draft.cohortStatus ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        cohortStatus: (event.target.value ||
                          null) as MercadoPublicoV2CohortStatus | null,
                      })
                    }
                  >
                    <option value="">{t`Todas`}</option>
                    {MERCADO_PUBLICO_V2_COHORTS.map((cohort) => (
                      <option key={cohort} value={cohort}>
                        {cohortLabels[cohort]}
                      </option>
                    ))}
                  </StyledSelect>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>{t`Región`}</StyledFieldLabel>
                  <StyledSelect
                    aria-label={t`Filtrar por región`}
                    value={draft.region === null ? '' : String(draft.region)}
                    onChange={(event) =>
                      updateDraft({
                        region:
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  >
                    <option value="">{t`Todas`}</option>
                    {MERCADO_PUBLICO_V2_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {formatMercadoPublicoRegion(region)}
                      </option>
                    ))}
                  </StyledSelect>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>{t`Comprador o RUT`}</StyledFieldLabel>
                  <StyledInput
                    aria-label={t`Filtrar por comprador o RUT`}
                    type="search"
                    value={draft.buyer}
                    onChange={(event) =>
                      updateDraft({ buyer: event.target.value })
                    }
                  />
                </StyledField>
              </StyledRow>
            </StyledSection>

            <StyledSection>
              <StyledSectionHeading>{t`Cierre y estado`}</StyledSectionHeading>
              <StyledRow>
                <StyledClosingRange>
                  <legend>{t`Cierre · dd/mm/aaaa`}</legend>
                  <StyledInput
                    aria-label={t`Fecha de cierre desde`}
                    aria-describedby={
                      validationErrors.closing
                        ? 'mercado-publico-closing-error'
                        : undefined
                    }
                    aria-invalid={validationErrors.closing !== null}
                    lang="es-CL"
                    type="date"
                    value={draft.closingAtFrom ?? ''}
                    onChange={(event) =>
                      updateDraft({ closingAtFrom: event.target.value || null })
                    }
                  />
                  <StyledInput
                    aria-label={t`Fecha de cierre hasta`}
                    aria-describedby={
                      validationErrors.closing
                        ? 'mercado-publico-closing-error'
                        : undefined
                    }
                    aria-invalid={validationErrors.closing !== null}
                    lang="es-CL"
                    type="date"
                    value={draft.closingAtTo ?? ''}
                    onChange={(event) =>
                      updateDraft({ closingAtTo: event.target.value || null })
                    }
                  />
                  {validationErrors.closing && (
                    <StyledFieldError
                      id="mercado-publico-closing-error"
                      role="alert"
                    >
                      {validationErrors.closing}
                    </StyledFieldError>
                  )}
                </StyledClosingRange>
                <StyledField>
                  <StyledFieldLabel>{t`Llamado`}</StyledFieldLabel>
                  <StyledSelect
                    aria-label={t`Filtrar por número de llamado`}
                    value={draft.llamado === null ? '' : String(draft.llamado)}
                    onChange={(event) =>
                      updateDraft({
                        llamado:
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  >
                    <option value="">{t`Todos`}</option>
                    {[1, 2, 3].map((llamado) => (
                      <option key={llamado} value={llamado}>
                        {t`Llamado ${llamado}`}
                      </option>
                    ))}
                  </StyledSelect>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>{t`Estados`}</StyledFieldLabel>
                  <StyledCheckboxGroup aria-label={t`Filtrar por estados`}>
                    {MERCADO_PUBLICO_V2_STATES.map((state) => (
                      <StyledCheckbox key={state}>
                        <Checkbox
                          aria-label={stateLabels[state]}
                          checked={draft.states.includes(state)}
                          onCheckedChange={(checked) =>
                            updateDraft({
                              states: checked
                                ? [...draft.states, state]
                                : draft.states.filter((item) => item !== state),
                            })
                          }
                        />
                        {stateLabels[state]}
                      </StyledCheckbox>
                    ))}
                  </StyledCheckboxGroup>
                </StyledField>
              </StyledRow>
            </StyledSection>

            <StyledSection>
              <StyledSectionHeading>{t`Monto y evidencia`}</StyledSectionHeading>
              <StyledRow>
                <StyledClosingRange>
                  <legend>{t`Monto equivalente CLP`}</legend>
                  <StyledInput
                    aria-label={t`Monto equivalente CLP mínimo`}
                    aria-describedby={
                      validationErrors.amount
                        ? 'mercado-publico-amount-error'
                        : undefined
                    }
                    aria-invalid={validationErrors.amount !== null}
                    min={0}
                    type="number"
                    value={draft.amountMin ?? ''}
                    onChange={(event) =>
                      updateDraft({ amountMin: event.target.value || null })
                    }
                  />
                  <StyledInput
                    aria-label={t`Monto equivalente CLP máximo`}
                    aria-describedby={
                      validationErrors.amount
                        ? 'mercado-publico-amount-error'
                        : undefined
                    }
                    aria-invalid={validationErrors.amount !== null}
                    min={0}
                    type="number"
                    value={draft.amountMax ?? ''}
                    onChange={(event) =>
                      updateDraft({ amountMax: event.target.value || null })
                    }
                  />
                  {validationErrors.amount && (
                    <StyledFieldError
                      id="mercado-publico-amount-error"
                      role="alert"
                    >
                      {validationErrors.amount}
                    </StyledFieldError>
                  )}
                </StyledClosingRange>
                <StyledField>
                  <StyledFieldLabel>{t`Documentos mínimos`}</StyledFieldLabel>
                  <StyledInput
                    aria-label={t`Cantidad mínima de documentos`}
                    aria-describedby={
                      validationErrors.documents
                        ? 'mercado-publico-documents-error'
                        : undefined
                    }
                    aria-invalid={validationErrors.documents !== null}
                    min={0}
                    type="number"
                    value={draft.documentCountMin ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        documentCountMin:
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>{t`Documentos máximos`}</StyledFieldLabel>
                  <StyledInput
                    aria-label={t`Cantidad máxima de documentos`}
                    aria-describedby={
                      validationErrors.documents
                        ? 'mercado-publico-documents-error'
                        : undefined
                    }
                    aria-invalid={validationErrors.documents !== null}
                    min={0}
                    type="number"
                    value={draft.documentCountMax ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        documentCountMax:
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>{t`Monedas`}</StyledFieldLabel>
                  <StyledCheckboxGroup aria-label={t`Filtrar por moneda`}>
                    {MERCADO_PUBLICO_V2_CURRENCIES.map((currency) => (
                      <StyledCheckbox key={currency}>
                        <Checkbox
                          aria-label={currency}
                          checked={draft.currencies.includes(currency)}
                          onCheckedChange={(checked) =>
                            updateDraft({
                              currencies: checked
                                ? [...draft.currencies, currency]
                                : draft.currencies.filter(
                                    (item) => item !== currency,
                                  ),
                            })
                          }
                        />
                        {currency}
                      </StyledCheckbox>
                    ))}
                  </StyledCheckboxGroup>
                </StyledField>
              </StyledRow>
              {validationErrors.documents && (
                <StyledFieldError
                  id="mercado-publico-documents-error"
                  role="alert"
                >
                  {validationErrors.documents}
                </StyledFieldError>
              )}
            </StyledSection>
          </ModalContent>
          <ModalFooter>
            <StyledActions>
              <Button
                ariaLabel="Cancelar filtros"
                onClick={handleClose}
                size="small"
                title="Cancelar filtros"
                type="button"
                variant="secondary"
              />
              <Button
                ariaLabel="Limpiar filtros"
                onClick={handleClear}
                size="small"
                title="Limpiar filtros"
                type="button"
                variant="tertiary"
              />
              <Button
                ariaLabel="Aplicar filtros"
                size="small"
                title="Aplicar filtros"
                type="submit"
              />
            </StyledActions>
          </ModalFooter>
        </StyledModalForm>
      </ModalStatefulWrapper>
    </StyledForm>
  );
};
