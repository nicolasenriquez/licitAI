import { render } from '@testing-library/react';

import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useAtomComponentFamilyState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { ViewBarRecordHydrationEffect } from '@/views/components/ViewBarRecordHydrationEffect';
import { useMapViewFiltersToFilters } from '@/views/hooks/useMapViewFiltersToFilters';
import { mapViewFieldToRecordField } from '@/views/utils/mapViewFieldToRecordField';
import { mapViewFilterGroupsToRecordFilterGroups } from '@/views/utils/mapViewFilterGroupsToRecordFilterGroups';

jest.mock(
  '@/object-record/record-index/contexts/RecordIndexContext',
  () => ({ useRecordIndexContextOrThrow: jest.fn() }),
);
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyState',
  () => ({ useAtomComponentFamilyState: jest.fn() }),
);
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue',
  () => ({ useAtomComponentStateValue: jest.fn() }),
);
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue',
  () => ({ useAtomFamilySelectorValue: jest.fn() }),
);
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState',
  () => ({ useSetAtomComponentState: jest.fn() }),
);
jest.mock('@/views/hooks/useMapViewFiltersToFilters', () => ({
  useMapViewFiltersToFilters: jest.fn(),
}));
jest.mock('@/views/utils/mapViewFieldToRecordField', () => ({
  mapViewFieldToRecordField: jest.fn(),
}));
jest.mock('@/views/utils/mapViewFilterGroupsToRecordFilterGroups', () => ({
  mapViewFilterGroupsToRecordFilterGroups: jest.fn(),
}));

const mockUseRecordIndexContextOrThrow = jest.mocked(
  useRecordIndexContextOrThrow,
);
const mockUseAtomComponentFamilyState = jest.mocked(
  useAtomComponentFamilyState,
);
const mockUseAtomComponentStateValue = jest.mocked(
  useAtomComponentStateValue,
);
const mockUseAtomFamilySelectorValue = jest.mocked(
  useAtomFamilySelectorValue,
);
const mockUseSetAtomComponentState = jest.mocked(useSetAtomComponentState);
const mockUseMapViewFiltersToFilters = jest.mocked(
  useMapViewFiltersToFilters,
);
const mockMapViewFieldToRecordField = jest.mocked(mapViewFieldToRecordField);
const mockMapViewFilterGroupsToRecordFilterGroups = jest.mocked(
  mapViewFilterGroupsToRecordFilterGroups,
);

describe('ViewBarRecordHydrationEffect', () => {
  const setFields = jest.fn();
  const setFilters = jest.fn();
  const setFilterGroups = jest.fn();
  const setSorts = jest.fn();
  const setAnyFieldFilter = jest.fn();
  const setInitializationFlags = Array.from({ length: 5 }, () => jest.fn());
  const mapViewFiltersToRecordFilters = jest.fn().mockReturnValue(['filter']);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAtomComponentStateValue.mockReturnValue('view-id');
    mockUseRecordIndexContextOrThrow.mockReturnValue({
      objectMetadataItem: { id: 'object-id' },
      recordIndexId: 'record-index-id',
    } as never);
    mockUseAtomComponentFamilyState
      .mockReturnValueOnce([false, setInitializationFlags[0]])
      .mockReturnValueOnce([false, setInitializationFlags[1]])
      .mockReturnValueOnce([false, setInitializationFlags[2]])
      .mockReturnValueOnce([false, setInitializationFlags[3]])
      .mockReturnValueOnce([false, setInitializationFlags[4]]);
    mockUseSetAtomComponentState
      .mockReturnValueOnce(setFields)
      .mockReturnValueOnce(setFilters)
      .mockReturnValueOnce(setFilterGroups)
      .mockReturnValueOnce(setSorts)
      .mockReturnValueOnce(setAnyFieldFilter);
    mockUseMapViewFiltersToFilters.mockReturnValue({
      mapViewFiltersToRecordFilters,
    } as never);
    mockMapViewFieldToRecordField.mockReturnValue('field' as never);
    mockMapViewFilterGroupsToRecordFilterGroups.mockReturnValue([
      'filter-group',
    ] as never);
  });

  it('hydrates every pending record state from the current view', () => {
    mockUseAtomFamilySelectorValue.mockReturnValue({
      objectMetadataId: 'object-id',
      viewFields: [{}],
      viewFilters: [{}],
      viewFilterGroups: [{}],
      viewSorts: ['sort'],
      anyFieldFilterValue: 'needle',
    } as never);

    render(<ViewBarRecordHydrationEffect />);

    expect(setFields).toHaveBeenCalledWith(['field']);
    expect(setFilters).toHaveBeenCalledWith(['filter']);
    expect(setFilterGroups).toHaveBeenCalledWith(['filter-group']);
    expect(setSorts).toHaveBeenCalledWith(['sort']);
    expect(setAnyFieldFilter).toHaveBeenCalledWith('needle');
    for (const setInitializationFlag of setInitializationFlags) {
      expect(setInitializationFlag).toHaveBeenCalledWith(true);
    }
  });

  it('does not hydrate a view for another object', () => {
    mockUseAtomFamilySelectorValue.mockReturnValue({
      objectMetadataId: 'another-object-id',
    } as never);

    render(<ViewBarRecordHydrationEffect />);

    expect(setFields).not.toHaveBeenCalled();
    expect(setFilters).not.toHaveBeenCalled();
    expect(setFilterGroups).not.toHaveBeenCalled();
    expect(setSorts).not.toHaveBeenCalled();
    expect(setAnyFieldFilter).not.toHaveBeenCalled();
  });
});
