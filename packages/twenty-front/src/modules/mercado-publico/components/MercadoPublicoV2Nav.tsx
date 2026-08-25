import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link, useLocation } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';
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

const StyledNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledNavLink = styled(Link)`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  text-decoration: none;

  &[aria-current='page'] {
    color: ${themeCssVariables.font.color.primary};
    text-decoration: underline;
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
  const links = [
    { to: AppPath.MercadoPublico, label: t`Oportunidades` },
    { to: AppPath.MercadoPublicoV2Buyers, label: t`Compradores` },
    ...(syncAccessData
      ? [{ to: AppPath.MercadoPublicoV2SyncControl, label: t`Sincronización` }]
      : []),
  ];

  return (
    <StyledNav aria-label={t`Navegación Mercado Público V2`}>
      {links.map(({ to, label }) => (
        <StyledNavLink
          key={to}
          to={to}
          aria-current={isActivePath(pathname, to) ? 'page' : undefined}
        >
          {label}
        </StyledNavLink>
      ))}
    </StyledNav>
  );
};
