import {
  type ChartFilter,
  type SerializedRelation,
  type UniversalChartFilter,
} from 'twenty-shared/types';
import { type AllMetadataName } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import {
  FlatEntityMapsException,
  FlatEntityMapsExceptionCode,
} from 'src/engine/metadata-modules/flat-entity/exceptions/flat-entity-maps.exception';
import { type MetadataFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity-maps.type';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';

const resolveEntityIdOrThrow = <TMetadataName extends AllMetadataName>({
  metadataName,
  universalIdentifier,
  flatEntityMaps,
}: {
  metadataName: TMetadataName;
  universalIdentifier: string | null;
  flatEntityMaps: MetadataFlatEntityMaps<TMetadataName>;
}): SerializedRelation => {
  if (!isDefined(universalIdentifier)) {
    throw new FlatEntityMapsException(
      `Could not resolve ${metadataName} without a universal identifier`,
      FlatEntityMapsExceptionCode.ENTITY_NOT_FOUND,
    );
  }

  const flatEntity = findFlatEntityByUniversalIdentifier({
    flatEntityMaps,
    universalIdentifier,
  });

  if (!isDefined(flatEntity)) {
    throw new FlatEntityMapsException(
      `${metadataName} not found for universal identifier: ${universalIdentifier}`,
      FlatEntityMapsExceptionCode.ENTITY_NOT_FOUND,
    );
  }

  return flatEntity.id as SerializedRelation;
};

const resolveOptionalEntityId = <TMetadataName extends AllMetadataName>({
  metadataName,
  universalIdentifier,
  flatEntityMaps,
}: {
  metadataName: TMetadataName;
  universalIdentifier: string | null | undefined;
  flatEntityMaps: MetadataFlatEntityMaps<TMetadataName>;
}): SerializedRelation | undefined => {
  if (!isDefined(universalIdentifier)) {
    return undefined;
  }

  return resolveEntityIdOrThrow({
    metadataName,
    universalIdentifier,
    flatEntityMaps,
  });
};

const resolveNullableEntityId = <TMetadataName extends AllMetadataName>({
  metadataName,
  universalIdentifier,
  flatEntityMaps,
}: {
  metadataName: TMetadataName;
  universalIdentifier: string | null | undefined;
  flatEntityMaps: MetadataFlatEntityMaps<TMetadataName>;
}): SerializedRelation | null => {
  if (!isDefined(universalIdentifier)) {
    return null;
  }

  return resolveEntityIdOrThrow({
    metadataName,
    universalIdentifier,
    flatEntityMaps,
  });
};

const fromUniversalChartFilterToFlatChartFilter = ({
  filter,
  flatFieldMetadataMaps,
}: {
  filter: UniversalChartFilter | undefined;
  flatFieldMetadataMaps: MetadataFlatEntityMaps<'fieldMetadata'>;
}): ChartFilter | undefined => {
  if (!isDefined(filter)) {
    return undefined;
  }

  return {
    ...filter,
    recordFilters: filter.recordFilters?.map(
      ({
        fieldMetadataUniversalIdentifier,
        relationTargetFieldMetadataUniversalIdentifier,
        ...rest
      }) => ({
        ...rest,
        fieldMetadataId: resolveEntityIdOrThrow({
          metadataName: 'fieldMetadata',
          universalIdentifier: fieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        relationTargetFieldMetadataId: resolveOptionalEntityId({
          metadataName: 'fieldMetadata',
          universalIdentifier: relationTargetFieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
      }),
    ),
  };
};

export const fromUniversalConfigurationToFlatPageLayoutWidgetConfiguration = ({
  universalConfiguration,
  flatFieldMetadataMaps,
  flatFrontComponentMaps,
  flatViewMaps,
}: {
  universalConfiguration: FlatPageLayoutWidget['universalConfiguration'];
  flatFieldMetadataMaps: MetadataFlatEntityMaps<'fieldMetadata'>;
  flatFrontComponentMaps: MetadataFlatEntityMaps<'frontComponent'>;
  flatViewMaps: MetadataFlatEntityMaps<'view'>;
}): FlatPageLayoutWidget['configuration'] => {
  switch (universalConfiguration.configurationType) {
    case WidgetConfigurationType.AGGREGATE_CHART: {
      const {
        aggregateFieldMetadataUniversalIdentifier,
        ratioAggregateConfig: universalRatioAggregateConfig,
        filter: universalFilter,
        ...rest
      } = universalConfiguration;

      const ratioAggregateConfig = isDefined(universalRatioAggregateConfig)
        ? {
            optionValue: universalRatioAggregateConfig.optionValue,
            fieldMetadataId: resolveEntityIdOrThrow({
              metadataName: 'fieldMetadata',
              universalIdentifier:
                universalRatioAggregateConfig.fieldMetadataUniversalIdentifier,
              flatEntityMaps: flatFieldMetadataMaps,
            }),
          }
        : undefined;

      return {
        ...rest,
        aggregateFieldMetadataId: resolveEntityIdOrThrow({
          metadataName: 'fieldMetadata',
          universalIdentifier: aggregateFieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        ratioAggregateConfig,
        filter: fromUniversalChartFilterToFlatChartFilter({
          filter: universalFilter,
          flatFieldMetadataMaps,
        }),
      };
    }

    case WidgetConfigurationType.PIE_CHART: {
      const {
        aggregateFieldMetadataUniversalIdentifier,
        groupByFieldMetadataUniversalIdentifier,
        filter: universalFilter,
        ...rest
      } = universalConfiguration;

      return {
        ...rest,
        aggregateFieldMetadataId: resolveEntityIdOrThrow({
          metadataName: 'fieldMetadata',
          universalIdentifier: aggregateFieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        groupByFieldMetadataId: resolveEntityIdOrThrow({
          metadataName: 'fieldMetadata',
          universalIdentifier: groupByFieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        filter: fromUniversalChartFilterToFlatChartFilter({
          filter: universalFilter,
          flatFieldMetadataMaps,
        }),
      };
    }

    case WidgetConfigurationType.BAR_CHART:
    case WidgetConfigurationType.LINE_CHART: {
      const {
        aggregateFieldMetadataUniversalIdentifier,
        primaryAxisGroupByFieldMetadataUniversalIdentifier,
        secondaryAxisGroupByFieldMetadataUniversalIdentifier,
        filter: universalFilter,
        ...rest
      } = universalConfiguration;

      return {
        ...rest,
        aggregateFieldMetadataId: resolveEntityIdOrThrow({
          metadataName: 'fieldMetadata',
          universalIdentifier: aggregateFieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        primaryAxisGroupByFieldMetadataId: resolveEntityIdOrThrow({
          metadataName: 'fieldMetadata',
          universalIdentifier:
            primaryAxisGroupByFieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        secondaryAxisGroupByFieldMetadataId: resolveOptionalEntityId({
          metadataName: 'fieldMetadata',
          universalIdentifier:
            secondaryAxisGroupByFieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        filter: fromUniversalChartFilterToFlatChartFilter({
          filter: universalFilter,
          flatFieldMetadataMaps,
        }),
      };
    }

    case WidgetConfigurationType.FIELDS: {
      const { viewUniversalIdentifier, ...rest } = universalConfiguration;

      return {
        ...rest,
        viewId: resolveNullableEntityId({
          metadataName: 'view',
          universalIdentifier: viewUniversalIdentifier,
          flatEntityMaps: flatViewMaps,
        }),
      };
    }

    case WidgetConfigurationType.RECORD_TABLE: {
      const { viewId: viewUniversalIdentifier, ...rest } =
        universalConfiguration;

      return {
        ...rest,
        viewId: resolveOptionalEntityId({
          metadataName: 'view',
          universalIdentifier: viewUniversalIdentifier,
          flatEntityMaps: flatViewMaps,
        }),
      };
    }

    case WidgetConfigurationType.FRONT_COMPONENT: {
      const { frontComponentUniversalIdentifier, configurationType } =
        universalConfiguration;

      return {
        configurationType,
        frontComponentId: resolveEntityIdOrThrow({
          metadataName: 'frontComponent',
          universalIdentifier: frontComponentUniversalIdentifier,
          flatEntityMaps: flatFrontComponentMaps,
        }),
      };
    }

    case WidgetConfigurationType.FIELD: {
      const {
        fieldMetadataId: fieldMetadataUniversalIdentifier,
        viewId: viewUniversalIdentifier,
        ...rest
      } = universalConfiguration;

      return {
        ...rest,
        fieldMetadataId: resolveEntityIdOrThrow({
          metadataName: 'fieldMetadata',
          universalIdentifier: fieldMetadataUniversalIdentifier,
          flatEntityMaps: flatFieldMetadataMaps,
        }),
        viewId: resolveOptionalEntityId({
          metadataName: 'view',
          universalIdentifier: viewUniversalIdentifier,
          flatEntityMaps: flatViewMaps,
        }),
      };
    }

    case WidgetConfigurationType.VIEW:
    case WidgetConfigurationType.TIMELINE:
    case WidgetConfigurationType.TASKS:
    case WidgetConfigurationType.NOTES:
    case WidgetConfigurationType.FILES:
    case WidgetConfigurationType.EMAILS:
    case WidgetConfigurationType.CALENDAR:
    case WidgetConfigurationType.FIELD_RICH_TEXT:
    case WidgetConfigurationType.WORKFLOW:
    case WidgetConfigurationType.WORKFLOW_VERSION:
    case WidgetConfigurationType.WORKFLOW_RUN:
    case WidgetConfigurationType.IFRAME:
    case WidgetConfigurationType.STANDALONE_RICH_TEXT:
    case WidgetConfigurationType.EMAIL_THREAD:
      return universalConfiguration;
  }
};
