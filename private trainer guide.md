# Trainer guide — Tenant Access Migration Exercise

Private trainer file. Learners start on the top corrective branch, run tests and smoke
checks, review the three open corrective PRs bottom-to-top, and merge in order.

## Exact review stack

```text
main
  -> corrective/1-migration-foundation
  -> corrective/2-authorization-domain
  -> corrective/3-api-enforcement
```

Review files in this order: `migrations/001_foundation.sql`,
`migrations/001_foundation.down.sql`, `src/db/database.js`,
`src/repository/access.js`, `src/auth/policy.js`, `src/app.js`, and
`test/app.test.js`. All paths exist on the top branch.

## Seed and smoke checks

```sh
npm install && npm test && npm run build && npm start
curl http://localhost:3000/health
curl http://localhost:3000/fixtures
curl -H 'x-user-id: 101' http://localhost:3000/tenants
```

`GET /fixtures` returns deterministic UUIDs for Acme Logistics and Globex
Manufacturing, users `101`, `102`, `201`, `202`, `999`, and their projects. Use those
values for Insomnia/Postman variables rather than inventing UUIDs.

Expected authorization checks:

* `101` can update an Acme member with
  `PUT /tenants/:tenantId/members/:userId/role`.
* `102` (operator) and viewers receive `403` for role updates and deletion.
* `999` (platform admin) can update members across seeded tenants.
* A cross-tenant role target is rejected and a cross-tenant delete
  `DELETE /tenants/:tenantId/projects/:projectId` returns `404` without deleting.

The migration is explicitly a fresh-schema foundation with dual-read legacy user IDs.
The down script is destructive, has no data backfill reversal, and is not invoked by the
runner. Discuss backup/write-freeze requirements and a future online backfill before
production use.
