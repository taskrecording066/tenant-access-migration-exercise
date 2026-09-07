# Trainer cheat sheet — Tenant Access Migration Exercise

**Private trainer file. Do not distribute to learners.**

This is a backend design-review and stacked-PR exercise, not an incident investigation. The learner should test the completed top branch first, review the stack from bottom to top, document risks, then merge the PRs in order.

## Exercise objective

The learner is reviewing a B2B tenant-administration API that is:

- migrating public identifiers from legacy integer IDs to UUIDs;
- adding tenant-scoped roles and authorization policies;
- enforcing those policies at the API boundary;
- preserving compatibility while the migration rolls out.

The learner must reason about migration safety, relationship integrity, authorization boundaries, negative cases, and stacked-PR ordering.

## Applications

Use at least three applications:

1. **GitHub browser** — inspect the issue-free repository, stacked PRs, changed files, review comments, and merge order.
2. **VS Code** — inspect the database, migrations, repositories, policy module, middleware, controllers, and tests.
3. **Insomnia or Postman** — exercise the running API with different users, tenants, IDs, and authorization outcomes.

The terminal is support tooling for checkout, tests, and starting the API. It is not counted as an application.

## Current repository state

Repository: https://github.com/taskrecording066/tenant-access-migration-exercise

The learner should begin on the complete top branch:

```text
main
  └── pr/1-migration-foundation
        └── pr/2-authorization-domain
              └── pr/3-api-enforcement
```

All three GitHub PRs are intentionally open and unmerged.

| Order | PR | Branch | Base | Purpose |
| --- | --- | --- | --- | --- |
| 1 | [PR #1](https://github.com/taskrecording066/tenant-access-migration-exercise/pull/1) | `pr/1-migration-foundation` | `main` | UUID migration and compatibility foundation |
| 2 | [PR #2](https://github.com/taskrecording066/tenant-access-migration-exercise/pull/2) | `pr/2-authorization-domain` | `pr/1-migration-foundation` | Roles, permissions, and policy domain |
| 3 | [PR #3](https://github.com/taskrecording066/tenant-access-migration-exercise/pull/3) | `pr/3-api-enforcement` | `pr/2-authorization-domain` | Middleware and endpoint enforcement |

## 35–45 minute schedule

### 0–5 minutes — Orient and check out the stack

In GitHub, open the repository and confirm all three PRs are open.

In VS Code, open the repository and use the integrated terminal:

```bash
git status
git branch -a
git log --oneline --decorate --graph --all
git checkout pr/3-api-enforcement
npm install
npm test
```

Expected result: the top branch is clean and all tests pass.

Ask the learner:

- Why is the top branch the correct starting point?
- Which branch contains the complete application behavior?
- Why must the PRs be merged bottom-to-top?

### 5–10 minutes — Run the application and establish the baseline

Start the API:

```bash
npm start
```

The API listens on `http://localhost:3000`.

In Insomnia/Postman, create a base URL variable:

```text
http://localhost:3000
```

Run:

```text
GET /health
GET /migration/status
```

Expected observations:

- health reports `ok`;
- migration status reports the UUID migration as applied;
- the top branch starts with seeded tenants, users, and projects.

### 10–18 minutes — Review PR #3 first: API enforcement

Open PR #3 in GitHub and review **Files changed**, checks, and review discussion.

In VS Code, follow this path:

```text
src/app.js
  -> src/auth/middleware.js
  -> src/auth/policy.js
  -> src/repos/tenantRepository.js
  -> test/authorization.test.js
```

Inspect:

- where the authenticated user is derived from `x-user-id`;
- where authorization is evaluated;
- whether the policy receives both the user and target tenant;
- whether the controller checks authorization before mutating data;
- whether failed checks return `403` rather than leaking data;
- whether repository lookups use UUIDs consistently.

Use the authorization matrix in `docs/authorization-matrix.md` to predict outcomes before sending requests.

### 18–25 minutes — Test authorization boundaries

Use these seeded users:

| Header | Role | Tenant |
| --- | --- | --- |
| `x-user-id: 101` | tenant admin | Northstar |
| `x-user-id: 102` | operator | Northstar |
| `x-user-id: 201` | viewer | Cedar |
| `x-user-id: 1` | platform admin | platform-wide |

Run these requests:

#### List tenants

```text
GET /tenants
```

Try user `101`, then user `201`. Confirm tenant-scoped users cannot see unrelated tenant data.

#### List projects

```text
GET /tenants/{tenantUuid}/projects
```

Use a Northstar UUID with users `101`, `102`, and `201`.

Expected:

- Northstar admin/operator can read Northstar projects;
- Cedar viewer receives `403` or an equivalent denial;
- platform admin can read across tenant boundaries.

#### Delete a project

```text
DELETE /projects/{projectUuid}
```

Expected:

- viewer is denied;
- operator is denied if the policy reserves deletion for tenant admins;
- tenant admin can delete within their tenant;
- a tenant admin cannot delete a project belonging to another tenant;
- platform admin can perform the platform-wide operation.

#### Change a user role

```text
POST /tenants/{tenantUuid}/users/{userUuid}/role
Content-Type: application/json

{
  "role": "operator"
}
```

Expected:

- tenant admin can update a user in the same tenant;
- operator cannot escalate or update roles;
- a tenant admin cannot update a user in another tenant;
- platform admin can update across tenants.

Record the request, identity, target tenant, expected decision, actual status, and explanation.

### 25–32 minutes — Review PR #2: authorization domain

Open PR #2 and inspect its changed files.

Follow:

```text
src/auth/roles.js
  -> src/auth/policy.js
  -> src/repos/userRepository.js
  -> test/authorization.test.js
  -> docs/authorization-matrix.md
```

Review questions:

- Are roles defined centrally or duplicated in controllers?
- Is authorization based only on role, or role plus tenant ownership?
- What is the difference between `operator`, `tenant_admin`, and `platform_admin`?
- Can a user update their own role?
- Can a tenant admin act on a resource from another tenant?
- Does the data model support a user having access to multiple tenants?
- Are negative authorization cases tested, or only happy paths?

Expected finding: policy decisions must include both permission and tenant scope. Role names alone are insufficient for authorization.

### 32–40 minutes — Review PR #1: migration foundation

Open PR #1 and inspect:

```text
migrations/001_foundation.sql
migrations/001_foundation.down.sql
src/db/database.js
src/repos/tenantRepository.js
src/repos/projectRepository.js
test/migration.test.js
docs/migration-plan.md
```

Trace:

```text
legacy integer ID
  -> UUID/public ID column
  -> backfill
  -> foreign-key relationship
  -> repository lookup
  -> API response
```

Review questions:

- Are UUIDs generated for every existing row?
- Are relationships preserved during backfill?
- Are UUIDs indexed and unique?
- Can old numeric IDs still be read during the transition?
- Do writes populate both identifiers consistently?
- What happens if the migration is interrupted halfway through?
- Does the down migration destroy data or require a backup/write freeze?
- Can a rollback restore application compatibility, not just schema shape?
- How long should dual-read/dual-write compatibility remain?

Expected findings:

1. The migration must be treated as a coordinated application and database rollout.
2. The down migration is destructive or operationally risky and needs backup/write-freeze planning.
3. Compatibility logic needs an explicit sunset plan so legacy IDs do not become permanent.
4. Relationship and tenant-scope tests are required before production rollout.

### 40–45 minutes — Merge and final review

Do not merge the stack out of order.

Merge in GitHub:

1. PR #1 into `main`
2. PR #2 after its base updates
3. PR #3 after its base updates

After each merge:

```bash
git checkout main
git pull --ff-only
npm test
```

After the final merge, repeat:

```bash
GET /health
GET /migration/status
GET /tenants
```

Confirm the final main branch preserves:

- migration integrity;
- UUID API responses;
- legacy compatibility where documented;
- tenant isolation;
- role enforcement;
- negative authorization behavior.

## Final learner deliverable

Ask the learner to add a review summary to the top PR or a repository review document containing:

- stack order and why it matters;
- migration strategy and rollback risks;
- UUID backfill and relationship-integrity evidence;
- authorization matrix findings;
- cross-tenant test results;
- role-escalation test results;
- missing or insufficient regression coverage;
- merge recommendation for each PR;
- operational conditions required before production rollout.

## Trainer answer key

The expected recommendation is:

- **PR #1:** approve with migration/rollback conditions. Require backup, write-freeze or carefully staged rollout, relationship-integrity verification, and a compatibility sunset plan.
- **PR #2:** approve only if the role model remains tenant-scoped and negative authorization cases are explicit.
- **PR #3:** approve after verifying middleware runs before data access/mutation and all cross-tenant and role-escalation paths return denial.

The exercise is complete when the learner can explain both the code behavior and the rollout safety of the stacked changes, not merely report that the test suite is green.
