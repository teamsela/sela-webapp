#!/usr/bin/env node
/*
  Drops the _test suffix from the reference tables by swapping names:

    heb_bible      -> heb_bible_old        heb_bible_test -> heb_bible
    motif          -> motif_old            motif_test     -> motif
    lexicon        -> lexicon_old          lexicon_test   -> lexicon

  The _test tables are the ones the app has been reading (see src/schema.ts
  before this change); the unsuffixed ones are stale copies kept as *_old so the
  swap can be reversed. The _test tables' own index / unique-constraint names
  are renamed to match. Everything runs in one transaction: either all of it
  happens or none of it does.

  Deploy the schema.ts change immediately after --apply: until then the
  running app is still querying heb_bible_test, which no longer exists.

  Usage:
    node scripts/swap-test-tables.js             # dry run: checks state, prints the SQL
    node scripts/swap-test-tables.js --apply     # perform the swap
    node scripts/swap-test-tables.js --rollback  # undo a completed swap
*/

require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ path: '.env', quiet: true });

const { Client } = require('pg');

const TABLES = ['heb_bible', 'motif', 'lexicon'];

// [table after swap, old name, new name] - unique constraints carry their index.
const CONSTRAINTS = TABLES.map((t) => [t, `${t}_test_xata_id_key`, `${t}_xata_id_key`]);
const INDEXES = [['heb_bible_test_passage_idx', 'heb_bible_passage_idx']];

const swapSql = () => [
  ...TABLES.map((t) => `ALTER TABLE ${t} RENAME TO ${t}_old`),
  ...TABLES.map((t) => `ALTER TABLE ${t}_test RENAME TO ${t}`),
  ...CONSTRAINTS.map(([t, from, to]) => `ALTER TABLE ${t} RENAME CONSTRAINT ${from} TO ${to}`),
  ...INDEXES.map(([from, to]) => `ALTER INDEX ${from} RENAME TO ${to}`),
];

const rollbackSql = () => [
  ...INDEXES.map(([from, to]) => `ALTER INDEX ${to} RENAME TO ${from}`),
  ...CONSTRAINTS.map(([t, from, to]) => `ALTER TABLE ${t} RENAME CONSTRAINT ${to} TO ${from}`),
  ...TABLES.map((t) => `ALTER TABLE ${t} RENAME TO ${t}_test`),
  ...TABLES.map((t) => `ALTER TABLE ${t}_old RENAME TO ${t}`),
];

async function relations(c) {
  const { rows } = await c.query(
    `SELECT c.relname, c.relkind, c.reltuples::bigint AS rows
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'`
  );
  return new Map(rows.map((r) => [r.relname, r]));
}

// Returns a list of problems; empty means the database is in the expected state.
function check(rel, mode) {
  const problems = [];
  const want = (name, present) => {
    if (rel.has(name) !== present) problems.push(`${name} should ${present ? '' : 'not '}exist`);
  };
  const before = mode !== 'rollback';
  for (const t of TABLES) {
    want(t, true);
    want(`${t}_test`, before);
    want(`${t}_old`, !before);
  }
  for (const [, from, to] of CONSTRAINTS) { want(from, before); want(to, !before); }
  for (const [from, to] of INDEXES) { want(from, before); want(to, !before); }
  return problems;
}

function printCounts(rel, label) {
  console.log(`\n${label}`);
  const names = [...rel.keys()].filter((n) => TABLES.some((t) => n === t || n === `${t}_test` || n === `${t}_old`)).sort();
  for (const n of names) console.log(`  ${n.padEnd(16)} ~${rel.get(n).rows} rows`);
}

(async () => {
  const mode = process.argv.includes('--rollback') ? 'rollback' : process.argv.includes('--apply') ? 'apply' : 'dry-run';
  const sql = mode === 'rollback' ? rollbackSql() : swapSql();

  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const rel = await relations(c);
    printCounts(rel, 'Current state:');

    const problems = check(rel, mode);
    if (problems.length) {
      console.error(`\nDatabase is not in the expected state for ${mode === 'rollback' ? 'a rollback' : 'the swap'}:`);
      for (const p of problems) console.error(`  - ${p}`);
      process.exitCode = 1;
      return;
    }

    console.log(`\nStatements (${mode === 'rollback' ? 'rollback' : 'swap'}), one transaction:`);
    for (const s of sql) console.log(`  ${s};`);

    if (mode === 'dry-run') {
      console.log('\nDry run only - nothing changed. Re-run with --apply to perform the swap.');
      return;
    }

    await c.query('BEGIN');
    try {
      // Renames need an ACCESS EXCLUSIVE lock. Fail fast rather than queue
      // behind (and block) live app queries if the tables are busy.
      await c.query(`SET LOCAL lock_timeout = '5s'`);
      for (const s of sql) await c.query(s);
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }

    printCounts(await relations(c), 'Done. New state:');
    if (mode === 'apply') console.log('\nNow deploy the src/schema.ts change.');
  } finally {
    await c.end();
  }
})().catch((e) => { console.error('\nfailed (nothing changed):', e.message); process.exit(1); });
