import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query(`
  create table if not exists _migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  );
`);

const { rows } = await client.query("select filename from _migrations");
const applied = new Set(rows.map((r) => r.filename));

for (const file of files) {
  if (applied.has(file)) {
    console.log(`Skipping ${file} (already applied)`);
    continue;
  }
  const sql = readFileSync(join(dir, file), "utf8");
  console.log(`Running ${file}...`);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into _migrations (filename) values ($1)", [file]);
    await client.query("commit");
    console.log(`  ok`);
  } catch (err) {
    await client.query("rollback");
    console.error(`  FAILED: ${err.message}`);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("All migrations applied.");
