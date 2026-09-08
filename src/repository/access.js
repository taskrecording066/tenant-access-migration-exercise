const { db } = require("../db/database");
function userById(id) {
  return db
    .prepare("SELECT * FROM users WHERE id=? OR legacy_id=?")
    .get(id, String(id).match(/^\d+$/) ? Number(id) : -1);
}
function membership(user, tenant) {
  return db
    .prepare("SELECT role FROM memberships WHERE user_id=? AND tenant_id=?")
    .get(user.id, tenant);
}
function tenants(user) {
  return db
    .prepare(
      `SELECT t.id,t.name,m.role FROM tenants t JOIN memberships m ON m.tenant_id=t.id WHERE m.user_id=? ORDER BY t.name`,
    )
    .all(user.id);
}
function projects(user, tenant) {
  return db
    .prepare(
      `SELECT p.* FROM projects p JOIN memberships m ON m.tenant_id=p.tenant_id WHERE p.tenant_id=? AND m.user_id=?`,
    )
    .all(tenant, user.id);
}
function fixtures() {
  return {
    tenants: db.prepare("SELECT id,name FROM tenants ORDER BY name").all(),
    users: db
      .prepare("SELECT id,legacy_id,email,name FROM users ORDER BY legacy_id")
      .all(),
    projects: db
      .prepare("SELECT id,tenant_id,name FROM projects ORDER BY name")
      .all(),
  };
}
function updateRole(actor, target, tenant, role) {
  const member = db
    .prepare("SELECT 1 FROM memberships WHERE user_id=? AND tenant_id=?")
    .get(target.id, tenant);
  if (!member) return null;
  db.prepare(
    "INSERT INTO memberships(user_id,tenant_id,role) VALUES (?,?,?) ON CONFLICT(user_id,tenant_id) DO UPDATE SET role=excluded.role",
  ).run(target.id, tenant, role);
  return true;
}
function deleteProject(user, id, tenant) {
  const p = db
    .prepare("SELECT * FROM projects WHERE id=? AND tenant_id=?")
    .get(id, tenant);
  if (!p) return null;
  const deleted = db
    .prepare("DELETE FROM projects WHERE id=? AND tenant_id=?")
    .run(id, tenant);
  if (!deleted.changes) return null;
  db.prepare(
    "INSERT INTO audit_events(id,tenant_id,user_id,action) VALUES (?,?,?,?)",
  ).run(require("node:crypto").randomUUID(), tenant, user.id, "project.delete");
  return p;
}
module.exports = {
  userById,
  membership,
  tenants,
  projects,
  fixtures,
  updateRole,
  deleteProject,
};
