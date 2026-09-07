const {db}=require('../db/database');
function userById(id){return db.prepare('SELECT * FROM users WHERE id=? OR legacy_id=?').get(id,String(id).match(/^\d+$/)?Number(id):-1)}
function membership(user,tenant){return db.prepare('SELECT role FROM memberships WHERE user_id=? AND tenant_id=?').get(user.id,tenant)}
function tenants(user){return db.prepare(`SELECT t.id,t.name,m.role FROM tenants t JOIN memberships m ON m.tenant_id=t.id WHERE m.user_id=? ORDER BY t.name`).all(user.id)}
function projects(user,tenant){return db.prepare(`SELECT p.* FROM projects p JOIN memberships m ON m.tenant_id=p.tenant_id WHERE p.tenant_id=? AND m.user_id=?`).all(tenant,user.id)}
function updateRole(actor,target,tenant,role){db.prepare('INSERT INTO memberships(user_id,tenant_id,role) VALUES (?,?,?) ON CONFLICT(user_id,tenant_id) DO UPDATE SET role=excluded.role').run(target,tenant,role)}
function deleteProject(user,id){const p=db.prepare('SELECT * FROM projects WHERE id=?').get(id); if(!p)return null; db.prepare('DELETE FROM projects WHERE id=?').run(id);db.prepare('INSERT INTO audit_events(id,tenant_id,user_id,action) VALUES (?,?,?,?)').run(require('node:crypto').randomUUID(),p.tenant_id,user.id,'project.delete');return p}
module.exports={userById,membership,tenants,projects,updateRole,deleteProject};
