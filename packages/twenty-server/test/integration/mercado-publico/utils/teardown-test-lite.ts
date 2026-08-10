export default async () => {
  await global.testDataSource.destroy();
};
