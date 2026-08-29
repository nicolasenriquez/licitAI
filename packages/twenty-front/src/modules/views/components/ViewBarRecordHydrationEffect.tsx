import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { currentRecordFilterGroupsComponentState } from '@/object-record/record-filter-group/states/currentRecordFilterGroupsComponentState';
import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { currentRecordFieldsComponentState } from '@/object-record/record-field/states/currentRecordFieldsComponentState';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { currentRecordSortsComponentState } from '@/object-record/record-sort/states/currentRecordSortsComponentState';
import { useAtomComponentFamilyState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useMapViewFiltersToFilters } from '@/views/hooks/useMapViewFiltersToFilters';
import { hasInitializedAnyFieldFilterComponentFamilyState } from '@/views/states/hasInitializedAnyFieldFilterComponentFamilyState';
import { hasInitializedCurrentRecordFieldsComponentFamilyState } from '@/views/states/hasInitializedCurrentRecordFieldsComponentFamilyState';
import { hasInitializedCurrentRecordFilterGroupsComponentFamilyState } from '@/views/states/hasInitializedCurrentRecordFilterGroupsComponentFamilyState';
import { hasInitializedCurrentRecordFiltersComponentFamilyState } from '@/views/states/hasInitializedCurrentRecordFiltersComponentFamilyState';
import { hasInitializedCurrentRecordSortsComponentFamilyState } from '@/views/states/hasInitializedCurrentRecordSortsComponentFamilyState';
import { viewFromViewIdFamilySelector } from '@/views/states/selectors/viewFromViewIdFamilySelector';
import { mapViewFieldToRecordField } from '@/views/utils/mapViewFieldToRecordField';
import { mapViewFilterGroupsToRecordFilterGroups } from '@/views/utils/mapViewFilterGroupsToRecordFilterGroups';
import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

export const ViewBarRecordHydrationEffect = () => {
  const currentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
  );
  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();
  const currentView = useAtomFamilySelectorValue(viewFromViewIdFamilySelector, {
    viewId: currentViewId ?? '',
  });
  const initializationParameters = {
    viewId: currentViewId ?? undefined,
  };

  const [hasInitializedFields, setHasInitializedFields] =
    useAtomComponentFamilyState(
      hasInitializedCurrentRecordFieldsComponentFamilyState,
      initializationParameters,
    );
  const [hasInitializedFilters, setHasInitializedFilters] =
    useAtomComponentFamilyState(
      hasInitializedCurrentRecordFiltersComponentFamilyState,
      initializationParameters,
    );
  const [hasInitializedFilterGroups, setHasInitializedFilterGroups] =
    useAtomComponentFamilyState(
      hasInitializedCurrentRecordFilterGroupsComponentFamilyState,
      initializationParameters,
    );
  const [hasInitializedSorts, setHasInitializedSorts] =
    useAtomComponentFamilyState(
      hasInitializedCurrentRecordSortsComponentFamilyState,
      initializationParameters,
    );
  const [hasInitializedAnyFieldFilter, setHasInitializedAnyFieldFilter] =
    useAtomComponentFamilyState(
      hasInitializedAnyFieldFilterComponentFamilyState,
      initializationParameters,
    );

  const setCurrentRecordFields = useSetAtomComponentState(
    currentRecordFieldsComponentState,
  );
  const setCurrentRecordFilters = useSetAtomComponentState(
    currentRecordFiltersComponentState,
    recordIndexId,
  );
  const setCurrentRecordFilterGroups = useSetAtomComponentState(
    currentRecordFilterGroupsComponentState,
    recordIndexId,
  );
  const setCurrentRecordSorts = useSetAtomComponentState(
    currentRecordSortsComponentState,
    recordIndexId,
  );
  const setAnyFieldFilterValue = useSetAtomComponentState(
    anyFieldFilterValueComponentState,
    recordIndexId,
  );
  const { mapViewFiltersToRecordFilters } = useMapViewFiltersToFilters();

  useEffect(() => {
    if (
      !isDefined(currentView) ||
      currentView.objectMetadataId !== objectMetadataItem.id
    ) {
      return;
    }

    if (!hasInitializedFields) {
      setCurrentRecordFields(
        currentView.viewFields.map(mapViewFieldToRecordField).filter(isDefined),
      );
      setHasInitializedFields(true);
    }

    if (!hasInitializedFilters) {
      setCurrentRecordFilters(
        mapViewFiltersToRecordFilters(currentView.viewFilters),
      );
      setHasInitializedFilters(true);
    }

    if (!hasInitializedFilterGroups) {
      setCurrentRecordFilterGroups(
        mapViewFilterGroupsToRecordFilterGroups(
          currentView.viewFilterGroups ?? [],
        ),
      );
      setHasInitializedFilterGroups(true);
    }

    if (!hasInitializedSorts) {
      setCurrentRecordSorts(currentView.viewSorts);
      setHasInitializedSorts(true);
    }

    if (!hasInitializedAnyFieldFilter) {
      setAnyFieldFilterValue(currentView.anyFieldFilterValue ?? '');
      setHasInitializedAnyFieldFilter(true);
    }
  }, [
    currentView,
    objectMetadataItem.id,
    hasInitializedFields,
    hasInitializedFilters,
    hasInitializedFilterGroups,
    hasInitializedSorts,
    hasInitializedAnyFieldFilter,
    mapViewFiltersToRecordFilters,
    setCurrentRecordFields,
    setCurrentRecordFilters,
    setCurrentRecordFilterGroups,
    setCurrentRecordSorts,
    setAnyFieldFilterValue,
    setHasInitializedFields,
    setHasInitializedFilters,
    setHasInitializedFilterGroups,
    setHasInitializedSorts,
    setHasInitializedAnyFieldFilter,
  ]);

  return null;
};
