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
