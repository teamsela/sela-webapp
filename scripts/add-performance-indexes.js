#!/usr/bin/env node
/*
  Adds the indexes the hot read path needs, and collects the planner statistics
  that have never been gathered on the reference tables.

  Context: heb_bible_test (305k rows / 190 MB), stepbible_tbesh and motif_test
  carried no index other than the xata_id primary key and had never been
  ANALYZEd, so every study page load ran a parallel sequential scan over the
  whole Hebrew Bible table. See scripts/loadtest-study.js for the measurements.

  Every statement is CREATE INDEX CONCURRENTLY / IF NOT EXISTS, so it is safe to
  run against a live database and safe to re-run. Reverse with --drop.

  Usage:  node scripts/add-performance-indexes.js [--drop]
*/

require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ path: '.env', quiet: true });

const { Client } = require('pg');

const INDEXES = [
  // The passage range filter: book + chapter + verse, ordered by hebId.
  ['heb_bible_test_passage_idx',
   `CREATE INDEX CONCURRENTLY IF NOT EXISTS heb_bible_test_passage_idx
      ON heb_bible_test (book, chapter, verse, "hebId")`],

  /*
    text_pattern_ops on the three StepBible code columns. These serve BOTH
    StepBible passes: the planner uses them for the exact "= ANY(codes)" pass as
    well as the "LIKE 'CODE%'" fallback, so plain btree copies of the same three
    columns are redundant - measured at 0 index scans against 28,625 on these.
  */
  ['stepbible_tbesh_estrong_pattern_idx',
   `CREATE INDEX CONCURRENTLY IF NOT EXISTS stepbible_tbesh_estrong_pattern_idx
      ON stepbible_tbesh ("eStrong" text_pattern_ops)`],
  ['stepbible_tbesh_dstrong_pattern_idx',
   `CREATE INDEX CONCURRENTLY IF NOT EXISTS stepbible_tbesh_dstrong_pattern_idx
      ON stepbible_tbesh ("dStrong" text_pattern_ops)`],
  ['stepbible_tbesh_ustrong_pattern_idx',
   `CREATE INDEX CONCURRENTLY IF NOT EXISTS stepbible_tbesh_ustrong_pattern_idx
      ON stepbible_tbesh ("uStrong" text_pattern_ops)`],

  // Dashboard "my studies" lookup, currently a seq scan of the study table.
  ['study_owner_idx',
   `CREATE INDEX CONCURRENTLY IF NOT EXISTS study_owner_idx ON study (owner)`],
];

const ANALYZE = ['heb_bible_test', 'stepbible_tbesh', 'motif_test', 'lexicon_test', 'study'];

/*
  Created by an earlier version of this script and since measured as never used
  (the text_pattern_ops indexes above cover the same queries). Listed here so
  --drop removes them; they are not recreated.
*/
const OBSOLETE = [
  'stepbible_tbesh_estrong_idx',
  'stepbible_tbesh_dstrong_idx',
  'stepbible_tbesh_ustrong_idx',
];

(async () => {
  const drop = process.argv.includes('--drop');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    for (const name of OBSOLETE) {
      process.stdout.write(`removing obsolete ${name} ... `);
      const t = Date.now();
      await c.query(`DROP INDEX CONCURRENTLY IF EXISTS ${name}`);
      console.log(`${Date.now() - t}ms`);
    }

    for (const [name, ddl] of INDEXES) {
      const sql = drop ? `DROP INDEX CONCURRENTLY IF EXISTS ${name}` : ddl;
      const t = Date.now();
      process.stdout.write(`${drop ? 'dropping' : 'creating'} ${name} ... `);
      await c.query(sql);
      console.log(`${Date.now() - t}ms`);
    }

    if (!drop) {
      for (const t of ANALYZE) {
        const start = Date.now();
        process.stdout.write(`analyzing ${t} ... `);
        await c.query(`ANALYZE ${t}`);
        console.log(`${Date.now() - start}ms`);
      }
    }
  } finally {
    await c.end();
  }
  console.log(drop ? '\nIndexes removed.' : '\nDone. Re-run scripts/loadtest-study.js to compare.');
})().catch((e) => { console.error('failed:', e.message); process.exit(1); });
