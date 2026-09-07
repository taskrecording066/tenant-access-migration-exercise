# Tenant Access Migration Exercise

Small Express/SQLite tenant administration API used for a stacked-PR review exercise.

## Run

```sh
npm install
npm test
npm run build
npm start
```

The deterministic seed is available at `GET /fixtures` (no authentication), including
UUIDs, legacy IDs, tenants, and projects. Authentication is represented by `x-user-id`;
both UUIDs and legacy numeric IDs (`101`, `102`, `201`, `202`, `999`) are accepted.

Important requests:

* `GET /tenants/:tenantId/projects`
* `PUT /tenants/:tenantId/members/:userId/role` with `{"role":"operator"}`
* `DELETE /tenants/:tenantId/projects/:projectId`

Every write is checked against the route tenant before mutation. The down migration is
destructive and is not run automatically; take a backup and use a write freeze before
using it.

## Review stack

The historical `pr/*` branches are retained. The replacement corrective stack is:

```text
main
  -> corrective/1-migration-foundation
  -> corrective/2-authorization-domain
  -> corrective/3-api-enforcement
```

Check out `corrective/3-api-enforcement`, run the commands above, then review and merge
the corrective PRs bottom-to-top. All corrective PRs are intentionally open and unmerged.
