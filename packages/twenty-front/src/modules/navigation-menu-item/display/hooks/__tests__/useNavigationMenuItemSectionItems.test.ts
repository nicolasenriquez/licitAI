import { AppPath, NavigationMenuItemType } from 'twenty-shared/types';

import { insertMercadoPublicoNavigationItem } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemSectionItems';

const buildItem = (link: string, id: string) => ({
  __typename: 'NavigationMenuItem' as const,
  id,
  type: NavigationMenuItemType.LINK,
  name: id,
  link,
  icon: null,
  position: 0,
  createdAt: '',
  updatedAt: '',
});

describe('insertMercadoPublicoNavigationItem', () => {
  it('inserts Mercado Público after Opportunities without reordering saved items', () => {
    const items = [
      buildItem('/objects/companies', 'Companies'),
      buildItem(AppPath.OpportunitiesPage, 'Opportunities'),
      buildItem('/objects/people', 'People'),
    ];

    const result = insertMercadoPublicoNavigationItem(items);

    expect(result.map(({ link }) => link)).toEqual([
      '/objects/companies',
      AppPath.OpportunitiesPage,
      '/mercado-publico',
      '/objects/people',
    ]);
    expect(result[2]).toMatchObject({
      icon: 'IconBuildingBank',
      id: 'mercado-publico-navigation-fallback',
    });
  });

  it('keeps a customized Mercado Público position and avoids duplicates', () => {
    const items = [
      buildItem('/mercado-publico', 'saved-mercado-publico'),
      buildItem(AppPath.OpportunitiesPage, 'Opportunities'),
    ];

    expect(insertMercadoPublicoNavigationItem(items)).toBe(items);
  });
});
