export type DetectedDelimiter = ';' | ',' | '\t' | '|';

const DELIMITER_CANDIDATES: DetectedDelimiter[] = [';', ',', '\t', '|'];

const isInsideQuotes = (line: string, index: number): boolean => {
  let inside = false;

  for (let i = 0; i < index; i++) {
    if (line[i] === '"') {
      inside = !inside;
    }
  }

  return inside;
};

export const detectDelimiter = (
  text: string,
): { delimiter: DetectedDelimiter; confidence: number } => {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('Cannot detect delimiter from empty text');
  }

  let bestDelimiter: DetectedDelimiter = ';';
  let bestScore = 0;

  for (const delimiter of DELIMITER_CANDIDATES) {
    const countsPerLine = lines.map((line) => {
      let count = 0;

      for (let i = 0; i < line.length; i++) {
        if (line[i] === delimiter && !isInsideQuotes(line, i)) {
          count++;
        }
      }

      return count;
    });

    const nonZeroLines = countsPerLine.filter((c) => c > 0);

    if (nonZeroLines.length === 0) {
      continue;
    }

    const coverage = nonZeroLines.length / lines.length;
    const avgCount = nonZeroLines.reduce((a, b) => a + b, 0) / nonZeroLines.length;
    const maxDeviation = Math.max(
      ...nonZeroLines.map((c) => Math.abs(c - avgCount)),
    );
    const consistency = avgCount > 0 ? 1 - Math.min(maxDeviation / avgCount, 1) : 0;
    const score = coverage * 0.6 + consistency * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return { delimiter: bestDelimiter, confidence: bestScore };
};
