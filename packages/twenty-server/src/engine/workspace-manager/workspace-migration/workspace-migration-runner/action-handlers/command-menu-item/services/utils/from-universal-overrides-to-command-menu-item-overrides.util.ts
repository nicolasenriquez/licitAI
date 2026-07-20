import { type FormatRecordSerializedRelationProperties } from 'twenty-shared/types';

import { type CommandMenuItemOverrides } from 'src/engine/metadata-modules/command-menu-item/entities/command-menu-item.entity';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatPageLayoutMaps } from 'src/engine/metadata-modules/flat-page-layout/types/flat-page-layout-maps.type';
import { type FlatPageLayout } from 'src/engine/metadata-modules/flat-page-layout/types/flat-page-layout.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';

type UniversalCommandMenuItemOverrides =
  FormatRecordSerializedRelationProperties<CommandMenuItemOverrides>;

export const fromUniversalOverridesToCommandMenuItemOverrides = ({
  universalOverrides,
  flatObjectMetadataMaps,
  flatPageLayoutMaps,
}: {
  universalOverrides: UniversalCommandMenuItemOverrides;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatPageLayoutMaps: FlatPageLayoutMaps;
}): CommandMenuItemOverrides => {
  const {
    availabilityObjectMetadataUniversalIdentifier,
    pageLayoutUniversalIdentifier,
    ...scalarOverrides
  } = universalOverrides;

  return {
    ...scalarOverrides,
    ...(availabilityObjectMetadataUniversalIdentifier === undefined
      ? {}
      : {
          availabilityObjectMetadataId:
            availabilityObjectMetadataUniversalIdentifier === null
              ? null
              : (findFlatEntityByUniversalIdentifier<FlatObjectMetadata>({
                  flatEntityMaps: flatObjectMetadataMaps,
                  universalIdentifier:
                    availabilityObjectMetadataUniversalIdentifier,
                })?.id ?? null),
        }),
    ...(pageLayoutUniversalIdentifier === undefined
      ? {}
      : {
          pageLayoutId:
            pageLayoutUniversalIdentifier === null
              ? null
              : (findFlatEntityByUniversalIdentifier<FlatPageLayout>({
                  flatEntityMaps: flatPageLayoutMaps,
                  universalIdentifier: pageLayoutUniversalIdentifier,
                })?.id ?? null),
        }),
  };
};
