import * as path from 'path';
import * as fs from 'fs/promises';

const assertPeriod = (period: string): void => {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error(`Invalid source_period: "${period}". Expected YYYY-MM format.`);
  }
};

const assertSafeSegment = (value: string, label: string): void => {
  if (value.length === 0) {
    throw new Error(`Empty ${label}`);
  }
  if (/[\\/]/.test(value) || value.includes('..')) {
    throw new Error(`Unsafe ${label}: "${value}"`);
  }
};

const assertSafeFileName = (value: string): void => {
  if (value.length === 0) {
    throw new Error('Empty source_file_name');
  }
  if (value.includes('..') || /[\\/]/.test(value)) {
    throw new Error(`Unsafe source_file_name: "${value}"`);
  }
};

export const resolveCsvStorageTargetPath = async (
  csvStorageRoot: string,
  dataset: string,
  period: string,
  sourceFileName: string,
  sourceModality?: string | null,
): Promise<string> => {
  assertSafeSegment(dataset, 'source_dataset');
  assertPeriod(period);
  if (sourceModality !== undefined && sourceModality !== null) {
    assertSafeSegment(sourceModality, 'source_modality');
  }
  assertSafeFileName(sourceFileName);

  const modalitySegment = sourceModality ?? '_default';
  const dirPath = path.join(csvStorageRoot, dataset, period, modalitySegment);
  const resolved = path.resolve(dirPath, sourceFileName);
  const rootResolved = path.resolve(csvStorageRoot) + path.sep;

  if (
    resolved + path.sep === rootResolved ||
    !resolved.startsWith(rootResolved)
  ) {
    throw new Error(
      `Resolved path escapes csvStorageRoot: "${resolved}" (root: "${rootResolved}")`,
    );
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });

  return resolved;
};
