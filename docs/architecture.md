# Architecture
Express routes call authentication context, tenant membership policy, then repository queries. SQLite stores UUID primary keys and `legacy_id` compatibility values. `memberships` is the tenant boundary; platform admins have membership in every seed tenant.
