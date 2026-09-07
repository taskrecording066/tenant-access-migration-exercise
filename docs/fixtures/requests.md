# API fixtures
`GET /health`
`GET /migration/status`
`GET /tenants` with `x-user-id: 101`
`GET /tenants/<tenant UUID>/projects` with `x-user-id: 101`
`PUT /tenants/<tenant UUID>/members/102/role` JSON `{"role":"viewer"}` as user 101
`DELETE /tenants/<tenant UUID>/projects/<project UUID>` as user 101
Expected: 200 health, 200 tenant list, 403 for cross-tenant or insufficient role, 204 for tenant-admin delete.
