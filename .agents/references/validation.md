# Validation reference

Run the smallest check that proves the changed contract. Use a single Jest file
or pattern when possible; use full package tests when a change spans the
package. Do not start Docker for read-only, documentation, or code-review work.

```bash
# Focused lint, typecheck, and tests
npx nx lint:diff-with-main twenty-front
npx nx lint:diff-with-main twenty-server
npx nx lint:diff-with-main twenty-server --configuration=fix
npx nx typecheck twenty-front
npx nx typecheck twenty-server
cd packages/<package> && npx jest "<pattern-or-file>"

# GraphQL and database contracts
npx nx run twenty-front:graphql:generate
npx nx database:reset twenty-server
npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>
npx nx run twenty-server:database:migrate

# Broader checks
npx nx test twenty-front
npx nx test twenty-server
npx nx build twenty-shared
npx nx build twenty-front
npx nx build twenty-server
```

`lint:diff-with-main` intentionally uses `main...HEAD` for the server and
`main` for the frontend. On a fresh clone, run `npx nx build
twenty-oxlint-rules` before the first lint. Entity changes require a generated
instance command with immutable `up` and `down`; GraphQL changes require
generated frontend documents and compatibility review.
