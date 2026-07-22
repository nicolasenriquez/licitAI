import { renderHook } from '@testing-library/react';
import { useLocation, useParams } from 'react-router-dom';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useIdentifyActiveNavigationMenuItems } from '@/navigation-menu-item/display/hooks/useIdentifyActiveNavigationMenuItems';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  NavigationMenuItemType,
  type NavigationMenuItem,
} from '~/generated-metadata/graphql';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/object-metadata/hooks/useFilteredObjectMetadataItems', () => ({
  useFilteredObjectMetadataItems: jest.fn(),
}));

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue');
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue');

jest.mock(
  '@/navigation-menu-item/display/utils/getNavigationMenuItemComputedLink',
  () => ({
    getNavigationMenuItemComputedLink: jest.fn(
      (item: Pick<NavigationMenuItem, 'link'>) => item.link ?? '',
    ),
  }),
);

const mercadoPublicoNavigationMenuItem = {
  id: 'mercado-publico-navigation-menu-item-id',
  type: NavigationMenuItemType.LINK,
  link: '/mercado-publico#compra-agil',
  position: 5.5,
  createdAt: '',
  updatedAt: '',
} satisfies NavigationMenuItem;

const setupMocks = (hash: string) => {
  jest.mocked(useLocation).mockReturnValue({
    pathname: '/mercado-publico',
    search: '',
    hash,
    state: null,
    key: 'default',
  });
  jest.mocked(useParams).mockReturnValue({});
  jest.mocked(useFilteredObjectMetadataItems).mockReturnValue({
    activeObjectMetadataItems: [],
    objectMetadataItems: [],
  } as unknown as ReturnType<typeof useFilteredObjectMetadataItems>);
  jest
    .mocked(useAtomStateValue)
    .mockReturnValueOnce([mercadoPublicoNavigationMenuItem])
    .mockReturnValueOnce(null)
    .mockReturnValueOnce([]);
  jest.mocked(useAtomComponentStateValue).mockReturnValue(undefined);
};

describe('useIdentifyActiveNavigationMenuItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks a LINK active when the current URL includes its hash', () => {
    setupMocks('#compra-agil');

    const { result } = renderHook(() => useIdentifyActiveNavigationMenuItems());

    expect(result.current.activeNavigationMenuItemIds).toEqual([
      mercadoPublicoNavigationMenuItem.id,
    ]);
  });

  it('does not mark a LINK active for a different hash', () => {
    setupMocks('#licitaciones');

    const { result } = renderHook(() => useIdentifyActiveNavigationMenuItems());

    expect(result.current.activeNavigationMenuItemIds).toEqual([]);
  });
});
