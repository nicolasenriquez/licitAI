import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { StyledTabContainer, TabButton } from 'twenty-ui/input';

import { getMercadoPublicoV2SectionSearch } from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

const isActivePath = (pathname: string, to: string): boolean =>
  to === AppPath.MercadoPublico
    ? pathname === AppPath.MercadoPublico
    : pathname.startsWith(to);

export const MercadoPublicoV2Nav = () => {
  const { t } = useLingui();
  const { pathname, search } = useLocation();
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
