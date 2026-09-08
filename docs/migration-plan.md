# Migration plan

`001_foundation.sql` is a fresh-schema SQLite foundation, not an online ALTER/backfill
of an existing production database. It creates UUID public IDs, nullable-compatible
`legacy_id` values for users, foreign keys with cascading deletes, and tenant/membership
indexes. The deterministic seed supplies the legacy mappings used during the transition.

The repository dual-reads `users.id` and `users.legacy_id`; new writes use UUIDs. The
migration runner creates `schema_migrations`, applies numbered migrations in order, and
executes each migration plus its status row in one transaction. SQLite foreign-key
enforcement is enabled before migrations.

There is no automatic down-migration runner. `001_foundation.down.sql` drops all domain
tables and is therefore destructive: it cannot restore data or application compatibility.
Use a backup and write freeze, and verify the schema manually before any rollback.
