import { mkdtempSync, writeFileSync, createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { MercadoPublicoCsvProfilingService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profiling.service';

describe('MercadoPublicoCsvProfilingService', () => {
  const service = new MercadoPublicoCsvProfilingService(
    {} as never,
    {} as never,
  );

  const writeFixture = (filename: string, contents: Buffer | string): string => {
    const directory = mkdtempSync(join(tmpdir(), 'mp-profile-'));
    const filePath = join(directory, filename);

    writeFileSync(filePath, contents);

    return filePath;
  };

  it('counts data rows when the file has no trailing newline', async () => {
    const filePath = writeFixture('no-trailing-newline.csv', 'Codigo;Estado\n1;Publicada\n2;Cerrada');

    const profile = await service.profileFile(createReadStream(filePath));

    expect(profile.rowCount).toBe(2);
  });

  it('counts data rows with CRLF line endings', async () => {
    const filePath = writeFixture(
      'windows-newlines.csv',
      'Codigo;Estado\r\n1;Publicada\r\n2;Cerrada\r\n',
    );

    const profile = await service.profileFile(createReadStream(filePath));

    expect(profile.rowCount).toBe(2);
  });

  it('counts data rows with lone carriage returns', async () => {
    const filePath = writeFixture(
      'old-mac-newlines.csv',
      Buffer.from('Codigo;Estado\r1;Publicada\r2;Cerrada\r', 'utf8'),
    );

    const profile = await service.profileFile(createReadStream(filePath));

    expect(profile.rowCount).toBe(2);
  });
});
