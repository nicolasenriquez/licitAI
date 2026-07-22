import { NavigationMenuItemType } from 'src/engine/metadata-modules/navigation-menu-item/enums/navigation-menu-item-type.enum';
import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { createStandardNavigationMenuItemFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/navigation-menu-item/create-standard-navigation-menu-item-flat-metadata.util';

describe('createStandardNavigationMenuItemFlatMetadata', () => {
  it('creates the standard Mercado Público LINK without a view', () => {
    const navigationMenuItem = createStandardNavigationMenuItemFlatMetadata({
      workspaceId: 'workspace-id',
      navigationMenuItemName: 'mercadoPublico',
      position: 5.5,
      navigationMenuItemId: 'navigation-menu-item-id',
      dependencyFlatEntityMaps: {
        flatViewMaps: createEmptyFlatEntityMaps(),
      },
      twentyStandardApplicationId: 'application-id',
      now: '2026-07-19T00:00:00.000Z',
    });

    expect(navigationMenuItem).toMatchObject({
      type: NavigationMenuItemType.LINK,
      name: 'Mercado Público',
      link: '/mercado-publico#compra-agil',
      icon: 'IconWorld',
      position: 5.5,
    });
    expect(navigationMenuItem.viewId).toBeNull();
    expect(navigationMenuItem.viewUniversalIdentifier).toBeNull();
  });
});
