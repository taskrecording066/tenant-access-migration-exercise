CREATE TABLE IF NOT EXISTS tenants(id TEXT PRIMARY KEY,name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,legacy_id INTEGER UNIQUE,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,name TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS projects_tenant_idx ON projects(tenant_id);
CREATE TABLE IF NOT EXISTS memberships(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN ('viewer','operator','tenant_admin','platform_admin')),PRIMARY KEY(user_id,tenant_id));
CREATE INDEX IF NOT EXISTS memberships_tenant_role_idx ON memberships(tenant_id,role);
CREATE TABLE IF NOT EXISTS audit_events(id TEXT PRIMARY KEY,tenant_id TEXT,user_id TEXT,action TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
