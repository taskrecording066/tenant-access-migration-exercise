# PR 1 — Migration foundation
Scope: UUID schema, legacy ID backfill/dual-read, constraints, indexes, migration runner, and integrity tests. Risk: down migration is destructive; compatibility window must be coordinated. Review: verify FK ordering and idempotency. Test: `npm test` migration shape and relationship checks.
