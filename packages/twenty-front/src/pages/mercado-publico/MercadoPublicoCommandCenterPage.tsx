import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MercadoPublicoDetectedProcessType } from '~/generated/mercado-publico-legacy.graphql';
import { IconWorld } from 'twenty-ui/icon';

import { MercadoPublicoBrowseTab } from '@/mercado-publico/components/MercadoPublicoBrowseTab';
import { MercadoPublicoControlCenterTab } from '@/mercado-publico/components/MercadoPublicoControlCenterTab';
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

export const MercadoPublicoCommandCenterPage = () => {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTabId = parseMercadoPublicoTabHash(location.hash);
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
        <PageCardHeader icon={<IconWorld />} title={t`Mercado Público`} />
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
          <MercadoPublicoBrowseTab
            processType={MercadoPublicoDetectedProcessType.compra_agil}
          />
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
