import { saveAs } from 'file-saver';

import { REACT_APP_SERVER_BASE_URL } from '~/config';

export const downloadMercadoPublicoRawCsvFile = async (
  rawCsvFileId: string,
  accessToken: string,
): Promise<void> => {
  const response = await fetch(
    `${REACT_APP_SERVER_BASE_URL}/mercado-publico/raw-csv-files/${encodeURIComponent(rawCsvFileId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`CSV download failed with status ${response.status}`);
  }

  saveAs(await response.blob(), `${rawCsvFileId}.csv`);
};
