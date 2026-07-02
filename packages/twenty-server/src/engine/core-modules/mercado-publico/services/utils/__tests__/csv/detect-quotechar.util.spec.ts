import { detectQuotechar } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-quotechar.util';

describe('detectQuotechar', () => {
  it('should detect double-quote when header field starts with quote', () => {
    const result = detectQuotechar('"Codigo";"Nombre";"Estado"', ';');

    expect(result).toBe('"');
  });

  it('should detect double-quote when first field is quoted', () => {
    const result = detectQuotechar('"Codigo";Nombre;Estado', ';');

    expect(result).toBe('"');
  });

  it('should detect double-quote when last field ends with quote', () => {
    const result = detectQuotechar('Codigo;Nombre;"Estado"', ';');

    expect(result).toBe('"');
  });

  it('should return null when no fields are quoted', () => {
    const result = detectQuotechar('Codigo;Nombre;Estado', ';');

    expect(result).toBeNull();
  });

  it('should return null for empty header line', () => {
    const result = detectQuotechar('', ';');

    expect(result).toBeNull();
  });

  it('should detect quotechar with comma delimiter', () => {
    const result = detectQuotechar(
      'Codigo,"Nombre completo",Estado',
      ',',
    );

    expect(result).toBe('"');
  });
});
