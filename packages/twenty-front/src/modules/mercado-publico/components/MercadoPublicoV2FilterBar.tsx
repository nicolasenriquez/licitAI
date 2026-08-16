import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MercadoPublicoV2OpportunitySort } from '~/generated/graphql';

import {
  type MercadoPublicoV2Filters,
  type MercadoPublicoV2CohortStatus,
  type MercadoPublicoV2Sort,
} from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

export const MERCADO_PUBLICO_V2_STATES = [
  'publicada',
  'cerrada',
  'desierta',
  'cancelada',
  'proveedor_seleccionado',
  'oc_emitida',
] as const;

const MERCADO_PUBLICO_V2_COHORTS: Array<{
  value: MercadoPublicoV2CohortStatus;
  label: string;
}> = [
  { value: 'active', label: 'Activa' },
  { value: 'terminal', label: 'Terminal' },
];

const MERCADO_PUBLICO_V2_REGIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
];

const MERCADO_PUBLICO_V2_CURRENCIES = ['CLP', 'UF', 'USD'];

export const MERCADO_PUBLICO_V2_SORTS: Array<{
  value: MercadoPublicoV2Sort;
  label: string;
}> = [
  {
    value: MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC,
    label: 'Cierre más lejano',
  },
  {
    value: MercadoPublicoV2OpportunitySort.CLOSING_AT_ASC,
    label: 'Cierre más próximo',
  },
  {
    value: MercadoPublicoV2OpportunitySort.PUBLISHED_AT_DESC,
    label: 'Publicación reciente',
  },
  {
    value: MercadoPublicoV2OpportunitySort.PUBLISHED_AT_ASC,
    label: 'Publicación antigua',
  },
  {
    value: MercadoPublicoV2OpportunitySort.AMOUNT_DESC,
    label: 'Monto mayor a menor',
  },
  {
    value: MercadoPublicoV2OpportunitySort.AMOUNT_ASC,
    label: 'Monto menor a mayor',
  },
];

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
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

  input:focus-visible {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;

const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledNotice = styled.p`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

export type MercadoPublicoV2FilterBarProps = {
  filters: MercadoPublicoV2Filters;
  sort: MercadoPublicoV2Sort;
  notice: string | null;
  noticeId: string;
  onApply: (filters: Partial<MercadoPublicoV2Filters>) => void;
  onClear: () => void;
  onSortChange: (sort: MercadoPublicoV2Sort) => void;
};

export const MercadoPublicoV2FilterBar = ({
  filters,
  sort,
  notice,
  noticeId,
  onApply,
  onClear,
  onSortChange,
}: MercadoPublicoV2FilterBarProps) => {
  const { t } = useLingui();
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
  const [draft, setDraft] = useState<MercadoPublicoV2Filters>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const updateDraft = (partial: Partial<MercadoPublicoV2Filters>): void => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  return (
    <StyledForm
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
    >
      <StyledRow>
        <StyledField>
          <StyledFieldLabel>{t`Cohorte`}</StyledFieldLabel>
          <StyledSelect
            aria-label={t`Filtrar por cohorte`}
            value={draft.cohortStatus ?? ''}
            onChange={(event) =>
              updateDraft({
                cohortStatus: (event.target.value ||
                  null) as MercadoPublicoV2CohortStatus | null,
              })
            }
          >
            <option value="">{t`Activas`}</option>
            {MERCADO_PUBLICO_V2_COHORTS.map((cohort) => (
              <option key={cohort.value} value={cohort.value}>
                {cohort.label}
              </option>
            ))}
          </StyledSelect>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Búsqueda`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Buscar por código, título o comprador`}
            type="search"
            value={draft.search}
            onChange={(event) => updateDraft({ search: event.target.value })}
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Orden`}</StyledFieldLabel>
          <StyledSelect
            aria-label={t`Orden de resultados`}
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as MercadoPublicoV2Sort)
            }
          >
            {MERCADO_PUBLICO_V2_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
          >
            <option value="">{t`Todas`}</option>
            {MERCADO_PUBLICO_V2_REGIONS.map((region) => (
              <option key={region} value={region}>
                {t`Región ${region}`}
              </option>
            ))}
          </StyledSelect>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Llamado`}</StyledFieldLabel>
          <StyledSelect
            aria-label={t`Filtrar por número de llamado`}
            value={draft.llamado === null ? '' : String(draft.llamado)}
            onChange={(event) =>
              updateDraft({
                llamado:
                  event.target.value === '' ? null : Number(event.target.value),
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
          <StyledFieldLabel>{t`Cierre desde`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Fecha de cierre desde`}
            type="date"
            value={draft.closingAtFrom ?? ''}
            onChange={(event) =>
              updateDraft({
                closingAtFrom: event.target.value || null,
              })
            }
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Cierre hasta`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Fecha de cierre hasta`}
            type="date"
            value={draft.closingAtTo ?? ''}
            onChange={(event) =>
              updateDraft({ closingAtTo: event.target.value || null })
            }
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Documentos mín`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Cantidad mínima de documentos`}
            type="number"
            min={0}
            value={draft.documentCountMin ?? ''}
            onChange={(event) =>
              updateDraft({
                documentCountMin:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Documentos máx`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Cantidad máxima de documentos`}
            type="number"
            min={0}
            value={draft.documentCountMax ?? ''}
            onChange={(event) =>
              updateDraft({
                documentCountMax:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Monto mín`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Monto mínimo`}
            type="number"
            min={0}
            value={draft.amountMin ?? ''}
            onChange={(event) =>
              updateDraft({ amountMin: event.target.value || null })
            }
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Monto máx`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Monto máximo`}
            type="number"
            min={0}
            value={draft.amountMax ?? ''}
            onChange={(event) =>
              updateDraft({ amountMax: event.target.value || null })
            }
          />
        </StyledField>
      </StyledRow>

      <StyledRow>
        <StyledField>
          <StyledFieldLabel>{t`Comprador o RUT`}</StyledFieldLabel>
          <StyledInput
            aria-label={t`Filtrar por comprador o RUT`}
            type="search"
            value={draft.buyer}
            onChange={(event) => updateDraft({ buyer: event.target.value })}
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Estados`}</StyledFieldLabel>
          <StyledCheckboxGroup aria-label={t`Filtrar por estados`}>
            {MERCADO_PUBLICO_V2_STATES.map((state) => (
              <StyledCheckbox key={state}>
                <input
                  type="checkbox"
                  checked={draft.states.includes(state)}
                  onChange={(event) => {
                    const states = event.target.checked
                      ? [...draft.states, state]
                      : draft.states.filter((item) => item !== state);

                    updateDraft({ states });
                  }}
                />
                {stateLabels[state]}
              </StyledCheckbox>
            ))}
          </StyledCheckboxGroup>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>{t`Monedas`}</StyledFieldLabel>
          <StyledCheckboxGroup aria-label={t`Filtrar por moneda`}>
            {MERCADO_PUBLICO_V2_CURRENCIES.map((currency) => (
              <StyledCheckbox key={currency}>
                <input
                  type="checkbox"
                  checked={draft.currencies.includes(currency)}
                  onChange={(event) => {
                    const currencies = event.target.checked
                      ? [...draft.currencies, currency]
                      : draft.currencies.filter((item) => item !== currency);

                    updateDraft({ currencies });
                  }}
                />
                {currency}
              </StyledCheckbox>
            ))}
          </StyledCheckboxGroup>
        </StyledField>
      </StyledRow>

      <StyledActions>
        <Button
          title={t`Aplicar filtros`}
          type="submit"
          size="small"
          variant="primary"
        />
        <Button
          title={t`Limpiar filtros`}
          type="button"
          size="small"
          variant="secondary"
          onClick={onClear}
        />
      </StyledActions>

      {notice && (
        <StyledNotice id={noticeId} role="alert" aria-live="assertive">
          {notice}
        </StyledNotice>
      )}
    </StyledForm>
  );
};
