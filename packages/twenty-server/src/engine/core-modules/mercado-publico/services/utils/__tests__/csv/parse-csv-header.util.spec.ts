import { parseCsvHeader } from 'src/engine/core-modules/mercado-publico/services/utils/csv/parse-csv-header.util';

describe('parseCsvHeader', () => {
  it('should split semicolon-delimited header', () => {
    const result = parseCsvHeader('Codigo;FechaEnvio;Estado', ';');

    expect(result).toEqual(['Codigo', 'FechaEnvio', 'Estado']);
  });

  it('should handle quoted fields containing delimiter', () => {
    const result = parseCsvHeader(
      '"Nombre completo";"Total;IVA";Estado',
      ';',
    );

    expect(result).toEqual(['Nombre completo', 'Total;IVA', 'Estado']);
  });

  it('should handle escaped double-quotes', () => {
    const result = parseCsvHeader(
      'Codigo;"Descripcion ""Especial""";Estado',
      ';',
    );

    expect(result).toEqual(['Codigo', 'Descripcion "Especial"', 'Estado']);
  });

  it('should preserve exact column names including spaces', () => {
    const result = parseCsvHeader(
      'Codigo;Nombre producto genrico;Monto Estimado Adjudicado',
      ';',
    );

    expect(result).toEqual([
      'Codigo',
      'Nombre producto genrico',
      'Monto Estimado Adjudicado',
    ]);
  });

  it('should handle dot-suffixed duplicate column names', () => {
    const result = parseCsvHeader(
      'DescripcionCriteriosRequisitosSociales.1;Campo;DescripcionCriteriosRequisitosSociales.2',
      ';',
    );

    expect(result).toEqual([
      'DescripcionCriteriosRequisitosSociales.1',
      'Campo',
      'DescripcionCriteriosRequisitosSociales.2',
    ]);
  });

  it('should handle comma-delimited header', () => {
    const result = parseCsvHeader('Codigo,Fecha,Estado', ',');

    expect(result).toEqual(['Codigo', 'Fecha', 'Estado']);
  });

  it('should trim whitespace around column names', () => {
    const result = parseCsvHeader(' Codigo ; Fecha ; Estado ', ';');

    expect(result).toEqual(['Codigo', 'Fecha', 'Estado']);
  });

  it('should handle single column header', () => {
    const result = parseCsvHeader('Codigo', ';');

    expect(result).toEqual(['Codigo']);
  });
});
