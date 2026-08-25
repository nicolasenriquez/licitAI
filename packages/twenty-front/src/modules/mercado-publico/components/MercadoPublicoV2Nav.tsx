import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { AppPath } from 'twenty-shared/types';
import { StyledTabContainer, TabButton } from 'twenty-ui/input';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { getMercadoPublicoV2SectionSearch } from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

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
  const { pathname, search } = useLocation();
  const apolloCoreClient = useApolloCoreClient();
  const { data: syncAccessData } = useQuery(SYNC_ACCESS_PROBE, {
    client: apolloCoreClient,
    errorPolicy: 'ignore',
  });
  const tabs = [
    {
      id: 'mercado-publico-processes',
      to: `${AppPath.MercadoPublico}${getMercadoPublicoV2SectionSearch(search)}`,
      activePath: AppPath.MercadoPublico,
      title: t`Procesos`,
    },
    {
      id: 'mercado-publico-buyers',
      to: `${AppPath.MercadoPublicoV2Buyers}${getMercadoPublicoV2SectionSearch(search)}`,
      activePath: AppPath.MercadoPublicoV2Buyers,
      title: t`Compradores`,
    },
    ...(syncAccessData
      ? [
          {
            id: 'mercado-publico-sync',
            to: AppPath.MercadoPublicoV2SyncControl,
            activePath: AppPath.MercadoPublicoV2SyncControl,
            title: t`Sincronización`,
          },
        ]
      : []),
  ];

  return (
    <nav aria-label={t`Secciones de Mercado Público`}>
      <StyledTabContainer>
        {tabs.map(({ id, to, activePath, title }) => (
          <TabButton
            key={id}
            id={id}
            title={title}
            to={to}
            active={isActivePath(pathname, activePath)}
          />
        ))}
      </StyledTabContainer>
    </nav>
  );
};
