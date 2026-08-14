const missingEnvironmentVariables = (environment, names) =>
  names.filter((name) => !environment[name]);

export const requireE2eEnvironment = (suite, names, environment = process.env) => {
  const missing = missingEnvironmentVariables(environment, names);

  if (missing.length > 0) {
    throw new Error(
      `${suite} requires configured disposable test inputs: ${missing.join(', ')}`,
    );
  }
};

export const createEnvironmentPreflight = (suite, names) => async () => {
  requireE2eEnvironment(suite, names);
};
