export const isolatedE2EComposeProject = 'twenty-mp-e2e';

export const getE2EComposePreflightError = ({
  composeProject,
  isServerRunning,
}) => {
  if (composeProject !== isolatedE2EComposeProject) {
    return `The Mercado Publico E2E provisioner only supports ${isolatedE2EComposeProject}.`;
  }

  if (isServerRunning) {
    return `The ${isolatedE2EComposeProject} server is already running. Inspect it or clean it explicitly: reuse state with "docker compose -p ${isolatedE2EComposeProject} -f docker-compose.yml -f docker-compose.e2e.yml down --remove-orphans", or full reset with "--fresh" (or "... down --volumes --remove-orphans").`;
  }
};
