$composeFile = 'packages/twenty-docker/docker-compose.dev.yml'

$databaseExists = docker compose -f $composeFile exec -T db psql -U postgres -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = 'test'"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (($databaseExists -join '').Trim() -ne '1') {
    docker compose -f $composeFile exec -T db psql -U postgres -d postgres -c 'CREATE DATABASE test WITH OWNER postgres;'
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
