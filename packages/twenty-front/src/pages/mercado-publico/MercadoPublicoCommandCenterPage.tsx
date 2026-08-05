import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { ApolloProvider } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MercadoPublicoDetectedProcessType } from '~/generated/graphql';
import { TintedIconTile } from 'twenty-ui/data-display';
import { IconBuildingSkyscraper } from 'twenty-ui/icon';

import { MercadoPublicoBrowseTab } from '@/mercado-publico/components/MercadoPublicoBrowseTab';
import { MercadoPublicoCompraAgilTab } from '@/mercado-publico/components/MercadoPublicoCompraAgilTab';
import { MercadoPublicoControlCenterTab } from '@/mercado-publico/components/MercadoPublicoControlCenterTab';
import {
  MercadoPublicoAnalystWorkspacePrototype,
  type MercadoPublicoPrototypeVariant,
} from '@/mercado-publico/components/prototype/MercadoPublicoAnalystWorkspacePrototype';
import {
  MERCADO_PUBLICO_TAB_IDS,
  parseMercadoPublicoTabHash,
} from '@/mercado-publico/utils/parseMercadoPublicoTabHash';

const MERCADO_PUBLICO_TAB_LIST_INSTANCE_ID = 'mercado-publico-tabs';

const StyledPageHeading = styled.h1`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

const StyledTabBarContainer = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

const MercadoPublicoCommandCenterPageContent = () => {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTabId = parseMercadoPublicoTabHash(location.hash);
  const prototypeVariant = new URLSearchParams(location.search).get('variant');
  const isLocalPrototypeHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const isPrototypeVariant =
    (import.meta.env.DEV || isLocalPrototypeHost) &&
    (prototypeVariant === 'A' ||
      prototypeVariant === 'B' ||
      prototypeVariant === 'C' ||
      prototypeVariant === 'D' ||
      prototypeVariant === 'E' ||
      prototypeVariant === 'F' ||
      prototypeVariant === 'G');
  const [mountedTabIds, setMountedTabIds] = useState([activeTabId]);

  useEffect(() => {
    const canonicalHash = `#${activeTabId}`;

    if (location.hash !== canonicalHash) {
      navigate(`${location.pathname}${location.search}${canonicalHash}`, {
        replace: true,
      });
    }
  }, [activeTabId, location, navigate]);

  useEffect(() => {
    setMountedTabIds((currentTabIds) =>
      currentTabIds.includes(activeTabId)
        ? currentTabIds
        : [...currentTabIds, activeTabId],
    );
  }, [activeTabId]);

  const tabs = [
    { id: MERCADO_PUBLICO_TAB_IDS[0], title: t`Compra Ágil` },
    { id: MERCADO_PUBLICO_TAB_IDS[1], title: t`Licitaciones` },
    { id: MERCADO_PUBLICO_TAB_IDS[2], title: t`Centro de Control` },
  ];

  return (
    <PageCardLayout
      header={
        <PageCardHeader
          icon={<TintedIconTile Icon={IconBuildingSkyscraper} color="blue" />}
          title={t`Mercado Público`}
        />
      }
      secondaryBar={
        <StyledTabBarContainer>
          <SettingsTabBar
            tabs={tabs}
            componentInstanceId={MERCADO_PUBLICO_TAB_LIST_INSTANCE_ID}
          />
        </StyledTabBarContainer>
      }
    >
      <StyledPageHeading>{t`Mercado Público`}</StyledPageHeading>
      {mountedTabIds.includes(MERCADO_PUBLICO_TAB_IDS[0]) ||
      activeTabId === MERCADO_PUBLICO_TAB_IDS[0] ? (
        <div hidden={activeTabId !== MERCADO_PUBLICO_TAB_IDS[0]}>
          {isPrototypeVariant ? (
            <MercadoPublicoAnalystWorkspacePrototype
              variant={prototypeVariant as MercadoPublicoPrototypeVariant}
            />
          ) : (
            <MercadoPublicoCompraAgilTab />
          )}
        </div>
      ) : null}
      {mountedTabIds.includes(MERCADO_PUBLICO_TAB_IDS[1]) ||
      activeTabId === MERCADO_PUBLICO_TAB_IDS[1] ? (
        <div hidden={activeTabId !== MERCADO_PUBLICO_TAB_IDS[1]}>
          <MercadoPublicoBrowseTab
            processType={MercadoPublicoDetectedProcessType.licitacion}
          />
        </div>
      ) : null}
      {mountedTabIds.includes(MERCADO_PUBLICO_TAB_IDS[2]) ||
      activeTabId === MERCADO_PUBLICO_TAB_IDS[2] ? (
        <div hidden={activeTabId !== MERCADO_PUBLICO_TAB_IDS[2]}>
          <MercadoPublicoControlCenterTab />
        </div>
      ) : null}
    </PageCardLayout>
  );
};

export const MercadoPublicoCommandCenterPage = () => {
  const apolloCoreClient = useApolloCoreClient();

  return (
    <ApolloProvider client={apolloCoreClient}>
      <MercadoPublicoCommandCenterPageContent />
    </ApolloProvider>
  );
};
