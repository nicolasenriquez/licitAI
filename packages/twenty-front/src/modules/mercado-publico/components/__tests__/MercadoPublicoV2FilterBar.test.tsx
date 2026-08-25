import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { fireEvent, render, screen } from '@testing-library/react';
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
  it('keeps only secondary controls inside More filters', () => {
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
    expect(
      screen.getByLabelText('Filtrar por comprador o RUT').closest('details'),
    ).not.toBeNull();
    expect(
      screen.getByLabelText('Cantidad mínima de documentos').closest('details'),
    ).not.toBeNull();
  });

  it('uses Todas as the empty situation option', () => {
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
    expect(screen.getByLabelText('Filtrar por situación')).toHaveValue('');
    expect(
      screen.getByLabelText('Filtrar por situación').querySelector('option'),
    ).toHaveTextContent('Todas');
  });

  it('labels the normalized amount and hides unsupported buyer sorting', () => {
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

    expect(
      screen.getByLabelText('Monto equivalente CLP mínimo').closest('details'),
    ).toBeNull();
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

    expect(screen.getByText('Más filtros (3)')).toBeDefined();
  });

  it('keeps staged filters when the user enters a search before applying', async () => {
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

    await user.selectOptions(screen.getByLabelText('Filtrar por región'), '13');
    await user.type(
      screen.getByLabelText('Buscar por código, título o comprador'),
      'obra',
    );

    fireEvent.submit(
      screen
        .getByLabelText('Buscar por código, título o comprador')
        .closest('form') as HTMLFormElement,
    );

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ region: 13, search: 'obra' }),
    );
  });
});
