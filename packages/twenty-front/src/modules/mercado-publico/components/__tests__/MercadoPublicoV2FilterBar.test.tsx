import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { MercadoPublicoV2OpportunitySort } from '~/generated/graphql';
import { MercadoPublicoV2FilterBar } from '@/mercado-publico/components/MercadoPublicoV2FilterBar';
import { type MercadoPublicoV2Filters } from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

const filters: MercadoPublicoV2Filters = {
  search: '',
  cohortStatus: null,
  states: [],
  buyer: '',
  region: null,
  closingAtFrom: null,
  closingAtTo: null,
  documentCountMin: null,
  documentCountMax: null,
  llamado: null,
  amountMin: null,
  amountMax: null,
  currencies: [],
};

describe('MercadoPublicoV2FilterBar', () => {
  afterEach(() => {
    act(() => {
      document
        .querySelector<HTMLButtonElement>('[aria-label="Cerrar filtros"]')
        ?.click();
    });
  });

  it('keeps secondary controls inside the compact filters dialog', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2FilterBar
            filters={filters}
            sort={MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC}
            notice={null}
            noticeId="notice"
            onApply={jest.fn()}
            onClear={jest.fn()}
            onSortChange={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(
      screen
        .getByLabelText('Buscar por código, título o comprador')
        .closest('details'),
    ).toBeNull();
    expect(screen.queryByLabelText('Filtrar por comprador o RUT')).toBeNull();
    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    expect(screen.getByText('Contexto')).toBeDefined();
    expect(screen.getByLabelText('Filtrar por comprador o RUT')).toBeDefined();
    expect(screen.getByText('Monto y evidencia')).toBeDefined();
  });

  it('shows quick views and applies them without dropping other filters', async () => {
    const user = userEvent.setup();
    const onApply = jest.fn();

    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2FilterBar
            filters={{
              ...filters,
              search: 'computadores',
              buyer: '69000100-1',
            }}
            sort={MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC}
            notice={null}
            noticeId="notice"
            onApply={onApply}
            onClear={jest.fn()}
            onSortChange={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Cierra hoy' }));

    expect(onApply).toHaveBeenCalledWith({
      cohortStatus: 'active',
      states: ['publicada'],
      closingAtFrom: expect.any(String),
      closingAtTo: expect.any(String),
    });
  });

  it('uses Todas as the empty situation option', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2FilterBar
            filters={filters}
            sort={MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC}
            notice={null}
            noticeId="notice"
            onApply={jest.fn()}
            onClear={jest.fn()}
            onSortChange={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    expect(screen.getByLabelText('Filtrar por situación')).toHaveValue('');
    expect(
      screen.getByLabelText('Filtrar por situación').querySelector('option'),
    ).toHaveTextContent('Todas');
  });

  it('keeps amount secondary and hides unsupported buyer sorting', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2FilterBar
            filters={filters}
            sort={MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC}
            showSort={false}
            notice={null}
            noticeId="notice"
            onApply={jest.fn()}
            onClear={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    expect(screen.getByLabelText('Monto equivalente CLP mínimo')).toBeDefined();
    expect(screen.queryByLabelText('Orden de resultados')).toBeNull();
  });
  it('counts zero-valued numeric filters as active', () => {
    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2FilterBar
            filters={{
              ...filters,
              documentCountMin: 0,
              documentCountMax: 0,
              llamado: 0,
            }}
            sort={MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC}
            notice={null}
            noticeId="mercado-publico-v2-filters-notice"
            onApply={jest.fn()}
            onClear={jest.fn()}
            onSortChange={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('button', { name: /^Filtros \(3\)/ }),
    ).toBeDefined();
  });

  it('keeps staged filters until the user applies the dialog', async () => {
    const onApply = jest.fn();
    const user = userEvent.setup();

    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2FilterBar
            filters={filters}
            sort={MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC}
            notice={null}
            noticeId="mercado-publico-v2-filters-notice"
            onApply={onApply}
            onClear={jest.fn()}
            onSortChange={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    await user.selectOptions(screen.getByLabelText('Filtrar por región'), '13');
    await user.click(screen.getByRole('button', { name: /^Aplicar/ }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ region: 13 }),
    );
  });

  it('returns focus to the filter trigger on Escape', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MercadoPublicoV2FilterBar
            filters={filters}
            sort={MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC}
            notice={null}
            noticeId="notice"
            onApply={jest.fn()}
            onClear={jest.fn()}
            onSortChange={jest.fn()}
          />
        </I18nProvider>
      </ThemeProvider>,
    );

    const trigger = screen.getByRole('button', { name: /^Filtros/ });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
  });
});
