import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

import { MercadoPublicoV2Nav } from '@/mercado-publico/components/MercadoPublicoV2Nav';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { TopBar } from '@/ui/layout/top-bar/components/TopBar';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';

const StyledContent = styled.main`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[4]};
  }
`;

type MercadoPublicoV2PageShellProps = {
  children: ReactNode;
  title: string;
  tag?: ReactNode;
  topBarRight?: ReactNode;
};

export const MercadoPublicoV2PageShell = ({
  children,
  title,
  tag,
  topBarRight,
}: MercadoPublicoV2PageShellProps) => (
  <PageContainer>
    <PageTitle title={title} />
    <PageCardLayout
      header={<PageCardHeader title={title} tag={tag} />}
      secondaryBar={
        <TopBar
          leftComponent={<MercadoPublicoV2Nav />}
          rightComponent={topBarRight}
        />
      }
    >
      <StyledContent>{children}</StyledContent>
    </PageCardLayout>
  </PageContainer>
);
