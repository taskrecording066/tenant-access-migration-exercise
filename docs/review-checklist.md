# Review checklist
- Verify UUID backfill is deterministic/idempotent and all foreign keys/indexes survive rollback.
- Check dual-read sunset and clients that still use integer IDs.
- Confirm policy runs before repository access and tenant IDs cannot be confused.
- Try cross-tenant role updates, platform role grants, and destructive actions.
- Review transaction boundaries and audit event behavior.
