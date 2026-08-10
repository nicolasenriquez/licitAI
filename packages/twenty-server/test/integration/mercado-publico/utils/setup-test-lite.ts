import 'tsconfig-paths/register';

import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';

export default async () => {
  await rawDataSource.initialize();

  global.testDataSource = rawDataSource;
};
