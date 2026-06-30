import { config as loadDotenv } from 'dotenv';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  createPool,
  sql,
  type DatabasePool,
  type DatabaseTransactionConnection,
} from 'slonik';
import { createPgDriverFactory } from '@slonik/pg-driver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

loadDotenv({ path: join(__dirname, '../../../.env') });

type Migration = {
  up: (tx: DatabaseTransactionConnection) => Promise<void>;
  down?: (tx: DatabaseTransactionConnection) => Promise<void>;
};

async function ensureMigrationsTable(pool: DatabasePool) {
  await pool.query(sql.unsafe`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function loadAppliedNames(pool: DatabasePool): Promise<Set<string>> {
  const rows = await pool.any(
    sql.unsafe`select name from _migrations order by name`,
  );
  return new Set(rows.map((r) => (r as { name: string }).name));
}

async function discoverFiles(): Promise<string[]> {
  const all = await readdir(MIGRATIONS_DIR);
  return all.filter((f) => /^\d+_.+\.ts$/.test(f)).sort();
}

async function loadMigration(file: string): Promise<Migration> {
  const url = pathToFileURL(join(MIGRATIONS_DIR, file)).href;
  return (await import(url)) as Migration;
}

async function migrateUp(pool: DatabasePool) {
  const applied = await loadAppliedNames(pool);
  const files = await discoverFiles();
  let count = 0;
  for (const file of files) {
    const name = file.replace(/\.ts$/, '');
    if (applied.has(name)) {
      console.log(`  skip   ${name}`);
      continue;
    }
    const mod = await loadMigration(file);
    console.log(`  apply  ${name}`);
    await pool.transaction(async (tx) => {
      await mod.up(tx);
      await tx.query(
        sql.unsafe`insert into _migrations (name) values (${name})`,
      );
    });
    count++;
  }
  console.log(`done. ${count} migration(s) applied.`);
}

async function migrateDown(pool: DatabasePool) {
  const applied = await loadAppliedNames(pool);
  const files = await discoverFiles();
  const lastName = [...applied].sort().pop();
  if (!lastName) {
    console.log('nothing to revert.');
    return;
  }
  const file = files.find((f) => f.replace(/\.ts$/, '') === lastName);
  if (!file) {
    throw new Error(`migration file for ${lastName} not found`);
  }
  const mod = await loadMigration(file);
  if (!mod.down) {
    throw new Error(
      `migration ${lastName} has no down() — cannot revert. recreate the database for a clean slate.`,
    );
  }
  console.log(`  revert ${lastName}`);
  await pool.transaction(async (tx) => {
    await tx.query(
      sql.unsafe`delete from _migrations where name = ${lastName}`,
    );
    await mod.down!(tx);
  });
  console.log('done.');
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL is not set. copy .env.example to .env at the repo root.',
    );
    process.exit(1);
  }

  const command = process.argv[2] ?? 'up';
  const pool = await createPool(databaseUrl, {
    driverFactory: createPgDriverFactory(),
  });

  try {
    await ensureMigrationsTable(pool);
    if (command === 'up') {
      await migrateUp(pool);
    } else if (command === 'down') {
      await migrateDown(pool);
    } else {
      console.error(`unknown command: ${command}. use 'up' or 'down'.`);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
