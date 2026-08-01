import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render } from '@testing-library/react';

import { MercadoPublicoProcessDetailPanel } from '@/mercado-publico/components/MercadoPublicoProcessDetailPanel';
import { MercadoPublicoDetectedProcessType } from '~/generated/graphql';

const mockUseMercadoPublicoProcessDetail = jest.fn();

jest.mock('@/mercado-publico/hooks/useMercadoPublicoProcessDetail', () => ({
  useMercadoPublicoProcessDetail: () => mockUseMercadoPublicoProcessDetail(),
}));
jest.mock('@/mercado-publico/utils/mercadoPublicoDisplay', () => ({
  getMercadoPublicoStatusColor: () => 'gray',
  getMercadoPublicoStatusLabel: (value: string | null) =>
    value ?? 'No informado',
  useMercadoPublicoDisplay: () => ({
    formatAmount: (value: number | null) =>
      value === null ? 'No informado' : String(value),
    formatCount: (value: number | null) =>
      value === null ? 'No informado' : String(value),
    formatDate: (value: string | null) => value ?? 'No informado',
  }),
}));

const queryState = {
  error: undefined,
  isInitialLoading: false,
  refetch: jest.fn(),
};

describe('MercadoPublicoProcessDetailPanel', () => {
  it('distinguishes source-pending detail from an unavailable process', () => {
    mockUseMercadoPublicoProcessDetail.mockReturnValue({
      ...queryState,
      processDetail: {
        adjudications: null,
        buyer: { code: null, name: null },
        canonicalState: null,
        compraAgilSource: null,
        dates: { closingAt: null, publishedAt: null },
        items: [],
        lastSeenAt: null,
        processCode: 'CA-001',
        processType: 'compra_agil',
        rawState: null,
        reconciliationSummary: {
          candidate: 0,
          exact: 0,
          manualReviewRequired: 0,
          unmatched: 0,
        },
        relatedOcs: [],
        sourceLineage: [],
        sourcePriority: null,
        title: 'Compra pendiente',
      },
    });

    const { getByText, rerender } = render(
      <I18nProvider i18n={i18n}>
        <MercadoPublicoProcessDetailPanel
          processCode="CA-001"
          processType={MercadoPublicoDetectedProcessType.compra_agil}
        />
      </I18nProvider>,
    );

    expect(getByText('Detalle fuente aún no disponible.')).toBeInTheDocument();

    mockUseMercadoPublicoProcessDetail.mockReturnValue({
      ...queryState,
      processDetail: undefined,
    });

    rerender(
      <I18nProvider i18n={i18n}>
        <MercadoPublicoProcessDetailPanel
          processCode="CA-404"
          processType={MercadoPublicoDetectedProcessType.compra_agil}
        />
      </I18nProvider>,
    );

    expect(getByText('Este proceso ya no está disponible')).toBeInTheDocument();
  });
});
