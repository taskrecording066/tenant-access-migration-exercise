# Authorization matrix
| Action | viewer | operator | tenant_admin | platform_admin |
| tenant/project read | yes | yes | yes | yes |
| project write | no | yes | yes | yes |
| member role management | no | no | yes | yes |
| delete project | no | no | yes | yes |
All decisions are scoped to the route tenant. A user from another tenant receives 403, even with a valid ID.

Policy tests must assert both tenant membership and permission rank before mutation.
