import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type MercadoPublicoV2Filters } from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

type AppliedFilter = {
  key: keyof MercadoPublicoV2Filters;
  label: string;
  remove: Partial<MercadoPublicoV2Filters>;
};

const StyledRegion = styled.section`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
`;

export const MercadoPublicoV2AppliedFilters = ({
  filters,
  onRemove,
  onClear,
}: {
  filters: MercadoPublicoV2Filters;
  onRemove: (filters: Partial<MercadoPublicoV2Filters>) => void;
  onClear: () => void;
}) => {
  const { t } = useLingui();
  const applied: AppliedFilter[] = [
    ...(filters.search.trim()
      ? [
          {
            key: 'search' as const,
            label: t`Búsqueda: ${filters.search.trim()}`,
            remove: { search: '' },
          },
        ]
      : []),
    ...(filters.cohortStatus
      ? [
          {
            key: 'cohortStatus' as const,
            label:
              filters.cohortStatus === 'active'
                ? t`Situación: Activas`
                : t`Situación: Terminales`,
            remove: { cohortStatus: null },
          },
        ]
      : []),
    ...(filters.region !== null
      ? [
          {
            key: 'region' as const,
            label: t`Región ${filters.region}`,
            remove: { region: null },
          },
        ]
      : []),
    ...(filters.closingAtFrom
      ? [
          {
            key: 'closingAtFrom' as const,
            label: t`Cierre desde ${filters.closingAtFrom}`,
            remove: { closingAtFrom: null },
          },
        ]
      : []),
    ...(filters.closingAtTo
      ? [
          {
            key: 'closingAtTo' as const,
            label: t`Cierre hasta ${filters.closingAtTo}`,
            remove: { closingAtTo: null },
          },
        ]
      : []),
    ...(filters.buyer.trim()
      ? [
          {
            key: 'buyer' as const,
            label: t`Comprador: ${filters.buyer.trim()}`,
            remove: { buyer: '' },
          },
        ]
      : []),
    ...(filters.states.length
      ? [
          {
            key: 'states' as const,
            label: t`Estados: ${filters.states.join(', ')}`,
            remove: { states: [] },
          },
        ]
      : []),
    ...(filters.documentCountMin !== null || filters.documentCountMax !== null
      ? [
          {
            key: 'documentCountMin' as const,
            label: t`Documentos: ${filters.documentCountMin ?? '—'}–${filters.documentCountMax ?? '—'}`,
            remove: { documentCountMin: null, documentCountMax: null },
          },
        ]
      : []),
    ...(filters.llamado !== null
      ? [
          {
            key: 'llamado' as const,
            label: t`Llamado ${filters.llamado}`,
            remove: { llamado: null },
          },
        ]
      : []),
    ...(filters.amountMin !== null || filters.amountMax !== null
      ? [
          {
            key: 'amountMin' as const,
            label: t`Monto: ${filters.amountMin ?? '—'}–${filters.amountMax ?? '—'}`,
            remove: { amountMin: null, amountMax: null },
          },
        ]
      : []),
    ...(filters.currencies.length
      ? [
          {
            key: 'currencies' as const,
            label: t`Moneda: ${filters.currencies.join(', ')}`,
            remove: { currencies: [] },
          },
        ]
      : []),
  ];

  if (applied.length === 0) return null;

  return (
    <StyledRegion aria-label={t`Filtros aplicados`}>
      <StyledLabel>{t`Filtros aplicados`}</StyledLabel>
      {applied.map((filter) => (
        <Button
          key={filter.key}
          title={t`Quitar ${filter.label}`}
          type="button"
          size="small"
          variant="secondary"
          onClick={() => onRemove(filter.remove)}
        />
      ))}
      <Button
        title={t`Limpiar`}
        type="button"
        size="small"
        variant="tertiary"
        onClick={onClear}
      />
    </StyledRegion>
  );
};
