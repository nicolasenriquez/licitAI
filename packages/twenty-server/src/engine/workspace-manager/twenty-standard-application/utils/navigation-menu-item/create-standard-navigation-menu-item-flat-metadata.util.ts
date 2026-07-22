import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { NavigationMenuItemType } from 'src/engine/metadata-modules/navigation-menu-item/enums/navigation-menu-item-type.enum';
import { type FlatNavigationMenuItem } from 'src/engine/metadata-modules/flat-navigation-menu-item/types/flat-navigation-menu-item.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  STANDARD_NAVIGATION_MENU_ITEM_DEFAULT_COLORS,
  STANDARD_NAVIGATION_MENU_ITEMS,
} from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-navigation-menu-item.constant';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';

export const createStandardNavigationMenuItemFlatMetadata = ({
  workspaceId,
  navigationMenuItemName,
  viewUniversalIdentifier,
  position,
  navigationMenuItemId,
  dependencyFlatEntityMaps: { flatViewMaps },
  twentyStandardApplicationId,
  now,
}: {
  workspaceId: string;
  navigationMenuItemName: keyof typeof STANDARD_NAVIGATION_MENU_ITEMS;
  viewUniversalIdentifier?: string;
  position: number;
  navigationMenuItemId: string;
  dependencyFlatEntityMaps: {
    flatViewMaps: FlatEntityMaps<FlatView>;
  };
  twentyStandardApplicationId: string;
  now: string;
}): FlatNavigationMenuItem => {
  const navigationMenuItemDefinition =
    STANDARD_NAVIGATION_MENU_ITEMS[navigationMenuItemName];

  if (!isDefined(navigationMenuItemDefinition)) {
    throw new Error(
      `Invalid navigation menu item configuration ${navigationMenuItemName}`,
    );
  }

  const isObjectType =
    navigationMenuItemDefinition.type === NavigationMenuItemType.OBJECT;
  const isLinkType =
    navigationMenuItemDefinition.type === NavigationMenuItemType.LINK;

  const flatView = isLinkType
    ? undefined
    : isDefined(viewUniversalIdentifier)
      ? findFlatEntityByUniversalIdentifier({
          flatEntityMaps: flatViewMaps,
          universalIdentifier: viewUniversalIdentifier,
        })
      : undefined;

  if (!isLinkType && !isDefined(flatView)) {
    throw new Error(
      `View not found for universal identifier ${viewUniversalIdentifier}`,
    );
  }

  return {
    id: navigationMenuItemId,
    type: navigationMenuItemDefinition.type,
    universalIdentifier: navigationMenuItemDefinition.universalIdentifier,
    applicationId: twentyStandardApplicationId,
    applicationUniversalIdentifier:
      TWENTY_STANDARD_APPLICATION.universalIdentifier,
    workspaceId,
    userWorkspaceId: null,
    targetRecordId: null,
    targetObjectMetadataId:
      isObjectType && isDefined(flatView) ? flatView.objectMetadataId : null,
    targetObjectMetadataUniversalIdentifier: isObjectType
      ? (flatView?.objectMetadataUniversalIdentifier ?? null)
      : null,
    viewId: isObjectType || isLinkType ? null : (flatView?.id ?? null),
    viewUniversalIdentifier:
      isObjectType || isLinkType
        ? null
        : (flatView?.universalIdentifier ?? null),
    folderId: null,
    folderUniversalIdentifier: null,
    pageLayoutId: null,
    pageLayoutUniversalIdentifier: null,
    name:
      isLinkType && 'name' in navigationMenuItemDefinition
        ? navigationMenuItemDefinition.name
        : null,
    link:
      isLinkType && 'link' in navigationMenuItemDefinition
        ? navigationMenuItemDefinition.link
        : null,
    icon:
      isLinkType && 'icon' in navigationMenuItemDefinition
        ? navigationMenuItemDefinition.icon
        : null,
    color:
      STANDARD_NAVIGATION_MENU_ITEM_DEFAULT_COLORS[navigationMenuItemName] ??
      null,
    position,
    createdAt: now,
    updatedAt: now,
  };
};
