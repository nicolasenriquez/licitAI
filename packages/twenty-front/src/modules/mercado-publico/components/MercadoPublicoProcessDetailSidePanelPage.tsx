import { MercadoPublicoProcessDetailPanel } from '@/mercado-publico/components/MercadoPublicoProcessDetailPanel';
import { mercadoPublicoProcessDetailComponentState } from '@/mercado-publico/states/mercadoPublicoProcessDetailComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { t } from '@lingui/core/macro';

export const MercadoPublicoProcessDetailSidePanelPage = () => {
  const processDetailContext = useAtomComponentStateValue(
    mercadoPublicoProcessDetailComponentState,
  );

  if (!processDetailContext) {
    return <p>{t`No hay un proceso seleccionado.`}</p>;
  }

  return <MercadoPublicoProcessDetailPanel {...processDetailContext} />;
};
