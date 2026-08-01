import { mercadoPublicoProcessDetailComponentState } from '@/mercado-publico/states/mercadoPublicoProcessDetailComponentState';
import { useNavigateSidePanel } from '@/side-panel/hooks/useNavigateSidePanel';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { SidePanelPages } from 'twenty-shared/types';
import { IconWorld } from 'twenty-ui/icon';
import { v4 } from 'uuid';
import { type MercadoPublicoDetectedProcessType } from '~/generated/graphql';

type OpenMercadoPublicoProcessInput = {
  processCode: string;
  processTitle: string;
  processType: MercadoPublicoDetectedProcessType;
};

export const useOpenMercadoPublicoProcessInSidePanel = () => {
  const store = useStore();
  const { navigateSidePanel } = useNavigateSidePanel();

  const openMercadoPublicoProcessInSidePanel = useCallback(
    ({
      processCode,
      processTitle,
      processType,
    }: OpenMercadoPublicoProcessInput) => {
      const pageId = v4();

      store.set(
        mercadoPublicoProcessDetailComponentState.atomFamily({
          instanceId: pageId,
        }),
        { processCode, processType },
      );

      navigateSidePanel({
        page: SidePanelPages.MercadoPublicoProcessDetail,
        pageIcon: IconWorld,
        pageId,
        pageTitle: processTitle,
        resetNavigationStack: true,
      });
    },
    [navigateSidePanel, store],
  );

  return { openMercadoPublicoProcessInSidePanel };
};
