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
  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
  );
  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();
  const currentView = useAtomFamilySelectorValue(viewFromViewIdFamilySelector, {
    viewId: contextStoreCurrentViewId ?? '',
  });
  const initializationParameters = {
    viewId: contextStoreCurrentViewId ?? undefined,
  };

  const [
    hasInitializedCurrentRecordFields,
    setHasInitializedCurrentRecordFields,
  ] = useAtomComponentFamilyState(
    hasInitializedCurrentRecordFieldsComponentFamilyState,
    initializationParameters,
  );
  const [
    hasInitializedCurrentRecordFilters,
    setHasInitializedCurrentRecordFilters,
  ] = useAtomComponentFamilyState(
    hasInitializedCurrentRecordFiltersComponentFamilyState,
    initializationParameters,
  );
  const [
    hasInitializedCurrentRecordFilterGroups,
    setHasInitializedCurrentRecordFilterGroups,
  ] = useAtomComponentFamilyState(
    hasInitializedCurrentRecordFilterGroupsComponentFamilyState,
    initializationParameters,
  );
  const [
    hasInitializedCurrentRecordSorts,
    setHasInitializedCurrentRecordSorts,
  ] = useAtomComponentFamilyState(
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

    if (!hasInitializedCurrentRecordFields) {
      setCurrentRecordFields(
        currentView.viewFields.map(mapViewFieldToRecordField).filter(isDefined),
      );
      setHasInitializedCurrentRecordFields(true);
    }

    if (!hasInitializedCurrentRecordFilters) {
      setCurrentRecordFilters(
        mapViewFiltersToRecordFilters(currentView.viewFilters),
      );
      setHasInitializedCurrentRecordFilters(true);
    }

    if (!hasInitializedCurrentRecordFilterGroups) {
      setCurrentRecordFilterGroups(
        mapViewFilterGroupsToRecordFilterGroups(
          currentView.viewFilterGroups ?? [],
        ),
      );
      setHasInitializedCurrentRecordFilterGroups(true);
    }

    if (!hasInitializedCurrentRecordSorts) {
      setCurrentRecordSorts(currentView.viewSorts);
      setHasInitializedCurrentRecordSorts(true);
    }

    if (!hasInitializedAnyFieldFilter) {
      setAnyFieldFilterValue(currentView.anyFieldFilterValue ?? '');
      setHasInitializedAnyFieldFilter(true);
    }
  }, [
    currentView,
    objectMetadataItem.id,
    hasInitializedCurrentRecordFields,
    hasInitializedCurrentRecordFilters,
    hasInitializedCurrentRecordFilterGroups,
    hasInitializedCurrentRecordSorts,
    hasInitializedAnyFieldFilter,
    mapViewFiltersToRecordFilters,
    setCurrentRecordFields,
    setCurrentRecordFilters,
    setCurrentRecordFilterGroups,
    setCurrentRecordSorts,
    setAnyFieldFilterValue,
    setHasInitializedCurrentRecordFields,
    setHasInitializedCurrentRecordFilters,
    setHasInitializedCurrentRecordFilterGroups,
    setHasInitializedCurrentRecordSorts,
    setHasInitializedAnyFieldFilter,
  ]);

  return null;
};
