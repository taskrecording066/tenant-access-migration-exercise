# Tenant Access Migration Exercise

Backend B2B tenant administration API: SQLite migration, UUID identifiers, and tenant-scoped authorization. This is a review exercise, not an incident report.

## Stacked review
Top branch: `pr/3-api-enforcement`. Check it out first to run the complete application, then review/merge in order: `main` -> `pr/1-migration-foundation` -> `pr/2-authorization-domain` -> `pr/3-api-enforcement`.

```sh
npm install && npm test && npm start
curl http://localhost:3000/health
curl -H 'x-user-id: 101' http://localhost:3000/tenants
```
Legacy numeric IDs remain accepted during transition; UUIDs are returned by APIs. See docs for rollback and compatibility questions.
