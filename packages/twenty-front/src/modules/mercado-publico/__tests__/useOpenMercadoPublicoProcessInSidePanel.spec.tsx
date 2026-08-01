import { useOpenMercadoPublicoProcessInSidePanel } from '@/mercado-publico/hooks/useOpenMercadoPublicoProcessInSidePanel';
import { mercadoPublicoProcessDetailComponentState } from '@/mercado-publico/states/mercadoPublicoProcessDetailComponentState';
import { useNavigateSidePanel } from '@/side-panel/hooks/useNavigateSidePanel';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { SidePanelPages } from 'twenty-shared/types';
import { MercadoPublicoDetectedProcessType } from '~/generated/graphql';

const navigateSidePanelMock = jest.fn();

jest.mock('@/side-panel/hooks/useNavigateSidePanel', () => ({
  useNavigateSidePanel: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mercado-publico-page-id'),
}));

describe('useOpenMercadoPublicoProcessInSidePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useNavigateSidePanel).mockReturnValue({
      navigateSidePanel: navigateSidePanelMock,
    });
  });

  it('should transport family and code in per-instance SidePanel state', () => {
    const { result } = renderHook(
      () => useOpenMercadoPublicoProcessInSidePanel(),
      {
        wrapper: ({ children }) => (
          <JotaiProvider store={jotaiStore}>{children}</JotaiProvider>
        ),
      },
    );

    act(() => {
      result.current.openMercadoPublicoProcessInSidePanel({
        processCode: 'CA-001',
        processTitle: 'Compra de insumos',
        processType: MercadoPublicoDetectedProcessType.compra_agil,
      });
    });

    expect(
      jotaiStore.get(
        mercadoPublicoProcessDetailComponentState.atomFamily({
          instanceId: 'mercado-publico-page-id',
        }),
      ),
    ).toEqual({
      processCode: 'CA-001',
      processType: MercadoPublicoDetectedProcessType.compra_agil,
    });
    expect(navigateSidePanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: SidePanelPages.MercadoPublicoProcessDetail,
        pageId: 'mercado-publico-page-id',
        pageTitle: 'Compra de insumos',
        resetNavigationStack: true,
      }),
    );
  });
});
