const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("foreign_keys=ON");
function migrate() {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`,
  );
  const applied = new Set(
    db
      .prepare("SELECT version FROM schema_migrations")
      .all()
      .map((x) => x.version),
  );
  for (const file of fs
    .readdirSync(path.join(__dirname, "../../migrations"))
    .filter((x) => /^\d+_.*\.sql$/.test(x) && !x.includes(".down."))
    .sort()) {
    const v = file.split("_")[0];
    if (!applied.has(v)) {
      const apply = db.transaction(() => {
        db.exec(
          fs.readFileSync(
            path.join(__dirname, "../../migrations", file),
            "utf8",
          ),
        );
        db.prepare(
          "INSERT INTO schema_migrations VALUES (?,datetime('now'))",
        ).run(v);
      });
      apply();
    }
  }
}
function seed() {
  if (db.prepare("SELECT count(*) n FROM users").get().n) return;
  const t = db.prepare("INSERT INTO tenants(id,name) VALUES (?,?)");
  const u = db.prepare(
    "INSERT INTO users(id,legacy_id,email,name) VALUES (?,?,?,?)",
  );
  const p = db.prepare(
    "INSERT INTO projects(id,tenant_id,name) VALUES (?,?,?)",
  );
  const r = db.prepare(
    "INSERT INTO memberships(user_id,tenant_id,role) VALUES (?,?,?)",
  );
  const [a, b, c, d, e] = [
    "00000000-0000-4000-8000-000000000101",
    "00000000-0000-4000-8000-000000000102",
    "00000000-0000-4000-8000-000000000201",
    "00000000-0000-4000-8000-000000000202",
    "00000000-0000-4000-8000-000000000999",
  ];
  const [ta, tb] = [
    "00000000-0000-4000-8000-000000000001",
    "00000000-0000-4000-8000-000000000002",
  ];
  t.run(ta, "Acme Logistics");
  t.run(tb, "Globex Manufacturing");
  [
    [a, 101, "alice@acme.test", "Alice Admin"],
    [b, 102, "bob@acme.test", "Bob Operator"],
    [c, 201, "carol@globex.test", "Carol Viewer"],
    [d, 202, "dave@globex.test", "Dave Admin"],
    [e, 999, "erin@platform.test", "Erin Platform"],
  ].forEach((x) => u.run(...x));
  [
    ["00000000-0000-4000-8000-000000001101", ta, "Acme Fleet"],
    ["00000000-0000-4000-8000-000000001102", ta, "Acme Billing"],
    ["00000000-0000-4000-8000-000000002201", tb, "Globex Plants"],
  ].forEach((x) => p.run(...x));
  r.run(a, ta, "tenant_admin");
  r.run(b, ta, "operator");
  r.run(c, tb, "viewer");
  r.run(d, tb, "tenant_admin");
  for (const tid of [ta, tb]) r.run(e, tid, "platform_admin");
}
migrate();
seed();
module.exports = { db, migrate, seed, dbPath };
