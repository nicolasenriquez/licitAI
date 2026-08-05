import { useCreateAppRouter } from '@/app/hooks/useCreateAppRouter';
import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { RouterProvider } from 'react-router-dom';

export const AppRouter = () => {
  // We want to disable logic function settings but keep the code for now
  const isFunctionSettingsEnabled = false;

  const currentUser = useAtomStateValue(currentUserState);

  const isAdminPageEnabled =
    (currentUser?.canImpersonate || currentUser?.canAccessFullAdminPanel) ??
    false;

  const isMercadoPublicoV2Enabled =
    import.meta.env.VITE_MERCADO_PUBLICO_V2_ENABLED === 'true';

  return (
    <RouterProvider
      router={useCreateAppRouter(
        isFunctionSettingsEnabled,
        isAdminPageEnabled,
        isMercadoPublicoV2Enabled,
      )}
    />
  );
};
