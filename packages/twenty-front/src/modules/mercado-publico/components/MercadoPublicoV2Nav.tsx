import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { AppPath } from 'twenty-shared/types';
import { StyledTabContainer, TabButton } from 'twenty-ui/input';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

const SYNC_ACCESS_PROBE = gql`
  query MercadoPublicoV2SyncControlNavigationProbe {
    mercadoPublicoV2SyncControl {
      latestRun {
        safeStatus
      }
    }
  }
`;

const isActivePath = (pathname: string, to: string): boolean =>
  to === AppPath.MercadoPublico
    ? pathname === AppPath.MercadoPublico
    : pathname.startsWith(to);

export const MercadoPublicoV2Nav = () => {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const apolloCoreClient = useApolloCoreClient();
  const { data: syncAccessData } = useQuery(SYNC_ACCESS_PROBE, {
    client: apolloCoreClient,
    errorPolicy: 'ignore',
  });
  const tabs = [
    {
      id: 'mercado-publico-processes',
      to: AppPath.MercadoPublico,
      title: t`Procesos`,
    },
    {
      id: 'mercado-publico-buyers',
      to: AppPath.MercadoPublicoV2Buyers,
      title: t`Compradores`,
    },
    ...(syncAccessData
      ? [
          {
            id: 'mercado-publico-sync',
            to: AppPath.MercadoPublicoV2SyncControl,
            title: t`Sincronización`,
          },
        ]
      : []),
  ];

  return (
    <nav aria-label={t`Secciones de Mercado Público`}>
      <StyledTabContainer>
        {tabs.map(({ id, to, title }) => (
          <TabButton
            key={id}
            id={id}
            title={title}
            to={to}
            active={isActivePath(pathname, to)}
          />
        ))}
      </StyledTabContainer>
    </nav>
  );
};
