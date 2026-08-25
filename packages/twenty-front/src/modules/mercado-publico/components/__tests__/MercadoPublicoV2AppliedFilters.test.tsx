import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { MercadoPublicoV2AppliedFilters } from '@/mercado-publico/components/MercadoPublicoV2AppliedFilters';
import { type MercadoPublicoV2Filters } from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

const filters: MercadoPublicoV2Filters = {
  search: 'luminarias',
  cohortStatus: null,
  states: [],
  buyer: '',
  region: 13,
  closingAtFrom: null,
  closingAtTo: null,
  documentCountMin: 0,
  documentCountMax: null,
  llamado: null,
  amountMin: null,
  amountMax: null,
  currencies: [],
};

describe('MercadoPublicoV2AppliedFilters', () => {
  it('removes one filter and distinguishes zero from unavailable', async () => {
    const onRemove = jest.fn();
    const user = userEvent.setup();

    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2AppliedFilters
            filters={filters}
            onRemove={onRemove}
            onClear={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText('Filtros aplicados')).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Documentos: 0–—/ }),
    ).toBeDefined();
    await user.click(
      screen.getByRole('button', { name: /Búsqueda: luminarias/ }),
    );
    expect(onRemove).toHaveBeenCalledWith({ search: '' });
  });

  it('clears all filters', async () => {
    const onClear = jest.fn();
    const user = userEvent.setup();
    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2AppliedFilters
            filters={filters}
            onRemove={jest.fn()}
            onClear={onClear}
          />
        </I18nProvider>
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: /^Limpiar/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
