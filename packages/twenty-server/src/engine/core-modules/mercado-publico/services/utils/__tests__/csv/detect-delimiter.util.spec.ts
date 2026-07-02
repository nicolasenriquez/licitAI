import { detectDelimiter } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-delimiter.util';

describe('detectDelimiter', () => {
  it('should detect semicolon delimiter', () => {
    const text = 'Codigo;FechaEnvio;Estado\nOC-1;2026-06-15;Aceptada\nOC-2;2026-06-16;Enviada';
    const result = detectDelimiter(text);

    expect(result.delimiter).toBe(';');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect comma delimiter', () => {
    const text = 'Codigo,FechaEnvio,Estado\nOC-1,2026-06-15,Aceptada\nOC-2,2026-06-16,Enviada';
    const result = detectDelimiter(text);

    expect(result.delimiter).toBe(',');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect tab delimiter', () => {
    const text = 'Codigo\tFechaEnvio\tEstado\nOC-1\t2026-06-15\tAceptada\nOC-2\t2026-06-16\tEnviada';
    const result = detectDelimiter(text);

    expect(result.delimiter).toBe('\t');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect pipe delimiter', () => {
    const text = 'Codigo|FechaEnvio|Estado\nOC-1|2026-06-15|Aceptada\nOC-2|2026-06-16|Enviada';
    const result = detectDelimiter(text);

    expect(result.delimiter).toBe('|');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect semicolon when comma appears inside quoted decimal values', () => {
    const text = '"Monto";"1,5";"Estado"\n"1000,00";"2,5";"Aceptada"';
    const result = detectDelimiter(text);

    expect(result.delimiter).toBe(';');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should detect delimiter by frequency on multi-line sample', () => {
    const text =
      'A;B;C;D\nE;F;G;H\nI;J;K,L\nM;N;O;P\nQ;R;S;T';
    const result = detectDelimiter(text);

    expect(result.delimiter).toBe(';');
  });

  it('should throw for empty text', () => {
    expect(() => detectDelimiter('')).toThrow(
      'Cannot detect delimiter from empty text',
    );
  });
});
