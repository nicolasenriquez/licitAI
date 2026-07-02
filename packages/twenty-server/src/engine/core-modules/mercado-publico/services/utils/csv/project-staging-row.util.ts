type ColumnMap = Record<string, string[]>;

export type StagingRowValues = Record<string, string | null>;

export const projectStagingRow = (
  rawRowJson: string[],
  observedColumns: string[],
  columnMap: ColumnMap,
): StagingRowValues => {
  const columnIndex: Record<string, number> = {};

  for (let i = 0; i < observedColumns.length; i++) {
    columnIndex[observedColumns[i]] = i;
  }

  const result: StagingRowValues = {};

  for (const [targetColumn, sourceColumnNames] of Object.entries(columnMap)) {
    let value: string | null = null;

    for (const sourceName of sourceColumnNames) {
      const idx = columnIndex[sourceName];

      if (idx !== undefined && idx < rawRowJson.length) {
        const candidate = rawRowJson[idx];

        if (candidate && candidate.length > 0) {
          value = candidate;
          break;
        }
      }
    }

    result[targetColumn] = value;
  }

  return result;
};
