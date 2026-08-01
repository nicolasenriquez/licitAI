import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';
import { type MercadoPublicoDetectedProcessType } from '~/generated/graphql';

export type MercadoPublicoProcessDetailContext = {
  processCode: string;
  processType: MercadoPublicoDetectedProcessType;
};

export const mercadoPublicoProcessDetailComponentState =
  createAtomComponentState<MercadoPublicoProcessDetailContext | null>({
    key: 'mercado-publico/process-detail',
    defaultValue: null,
    componentInstanceContext: SidePanelPageComponentInstanceContext,
  });
