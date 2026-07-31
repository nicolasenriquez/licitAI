import { downloadMercadoPublicoRawCsvFile } from '@/mercado-publico/utils/downloadMercadoPublicoRawCsvFile';
import { saveAs } from 'file-saver';

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

describe('downloadMercadoPublicoRawCsvFile', () => {
  const blob = new Blob(['csv'], { type: 'text/csv' });

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: jest.fn().mockResolvedValue(blob),
    } as unknown as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('downloads CSV evidence with the current bearer token', async () => {
    await downloadMercadoPublicoRawCsvFile('raw/csv-id', 'access-token');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/mercado-publico/raw-csv-files/raw%2Fcsv-id',
      ),
      {
        headers: {
          Authorization: 'Bearer access-token',
        },
      },
    );
    expect(saveAs).toHaveBeenCalledWith(blob, 'raw/csv-id.csv');
  });

  it('rejects an unsuccessful download', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response);

    await expect(
      downloadMercadoPublicoRawCsvFile('raw-csv-id', 'access-token'),
    ).rejects.toThrow('CSV download failed with status 403');
  });
});
