const rank={viewer:0,operator:1,tenant_admin:2,platform_admin:3};
const permissions={viewer:['tenant:read','project:read'],operator:['tenant:read','project:read','project:write'],tenant_admin:['tenant:read','project:read','project:write','member:manage','project:delete'],platform_admin:['tenant:read','project:read','project:write','member:manage','project:delete']};
function can(role,permission){return (permissions[role]||[]).includes(permission)}
function requirePermission(permission){return (req,res,next)=>{if(!req.user)return res.status(401).json({error:'authentication required'}); if(req.tenantRole!=='platform_admin'&&!can(req.tenantRole,permission))return res.status(403).json({error:'forbidden',required:permission});next()}}
module.exports={rank,permissions,can,requirePermission};
