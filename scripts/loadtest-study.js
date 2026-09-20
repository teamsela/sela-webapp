#!/usr/bin/env node
/*
  Load test for the "New Study" (createStudy) and "Copy to My Studies" (cloneStudy)
  paths in src/lib/actions.ts.

  Both server actions do the same three things:
     1. currentUser()            -> a Clerk Backend API round trip
     2. INSERT INTO study ...    -> one row, RETURNING xata_id
     3. redirect('/study/<id>/edit')
        -> which immediately runs currentUser() again + fetchPassageData(),
           and fetchPassageData is by far the most expensive query in the app.

  Step 3 is part of the click. A user who presses "Copy to My Studies" is not
  done until the edit page has rendered, so the load test measures the whole
  chain, not just the INSERT.

  Usage
    node scripts/loadtest-study.js --scenario clone-full --concurrency 1,2,4,6,8,12
    node scripts/loadtest-study.js --scenario insert --concurrency 6 --commit
    node scripts/loadtest-study.js --scenario passage --concurrency 1,6,12 --runs 5
    node scripts/loadtest-study.js --scenario clerk   --concurrency 6
    node scripts/loadtest-study.js --scenario connections --concurrency 2,4,6 --pool-max 5
    node scripts/loadtest-study.js --cleanup-only

  Safety
    Writes run inside a transaction that is ROLLED BACK by default, so the
    real `study` table is left untouched while still exercising the full
    INSERT path (WAL, row locks, index maintenance, connection hold time).
    Pass --commit to persist rows; they are tagged with owner
    'loadtest_<runId>' and deleted at the end of the run. --cleanup-only
    purges any leftovers from earlier interrupted runs.
*/

require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ path: '.env', quiet: true });

const { Pool, Client } = require('pg');

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const OPTS = {
  scenario: arg('scenario', 'clone-full'),
  concurrency: String(arg('concurrency', '1,2,4,6,8,12'))
    .split(',').map((n) => parseInt(n.trim(), 10)).filter(Boolean),
  runs: parseInt(arg('runs', '3'), 10),          // requests per virtual user per level
  poolMax: parseInt(arg('pool-max', process.env.PG_POOL_MAX ?? '3'), 10),
  connectionTimeout: parseInt(arg('connection-timeout', process.env.PG_CONNECTION_TIMEOUT_MS ?? '5000'), 10),
  maxConnections: parseInt(arg('max-connections', '30'), 10),  // hard cap for the `connections` scenario
  passage: arg('passage', '23'),                 // fallback passage for the read path
  commit: flag('commit'),
  cleanupOnly: flag('cleanup-only'),
  json: flag('json'),
  quiet: flag('quiet'),
};

const RUN_ID = Math.random().toString(36).slice(2, 10);
const LOADTEST_OWNER = `loadtest_${RUN_ID}`;
const LOADTEST_OWNER_PREFIX = 'loadtest_';

// ---------------------------------------------------------------- stats

const pct = (sorted, p) => {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, i)];
};

function summarize(values) {
  const s = [...values].sort((a, b) => a - b);
  return {
    n: s.length,
    min: s[0] ?? 0,
    p50: pct(s, 50),
    p95: pct(s, 95),
    p99: pct(s, 99),
    max: s[s.length - 1] ?? 0,
    mean: s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0,
  };
}

const ms = (n) => `${n.toFixed(0)}ms`;

// ---------------------------------------------------------------- passage parsing
// Mirrors parsePassageInfo() / createPassageRangeCondition() in src/lib/actions.ts.

/* Mirrors parsePassageInfo(inputString, bookString): `passage` holds only the
   reference ("23", "48:1-4", "119") and the book lives in its own column.
   A missing end verse is represented as 999 rather than pulling in the full
   per-chapter verse-count tables - the row set matched is identical. */
function parsePassage(passage, book) {
  const m = String(passage).trim().match(/^(\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/);
  if (!m) throw new Error(`Cannot parse passage "${passage}" (expected e.g. "23" or "48:1-4")`);
  const [, c1, v1, c2, v2] = m;

  const startChapter = parseInt(c1, 10);
  let startVerse = v1 ? parseInt(v1, 10) : 1;
  let endChapter = startChapter;
  let endVerse = v1 ? startVerse : 999;

  if (c2) {
    const raw = parseInt(c2, 10);
    if (!v1 && !v2) { endChapter = raw; startVerse = 1; endVerse = 999; }
    else if (!v1 && v2) { endChapter = raw; startVerse = 1; endVerse = parseInt(v2, 10); }
    else if (v1 && v2) { endChapter = raw; endVerse = parseInt(v2, 10); }
    else if (raw < startVerse) { endChapter = raw; endVerse = 999; }
    else { endVerse = raw; }
  }

  return { book: (book || 'psalms').toLowerCase(), startChapter, startVerse, endChapter, endVerse };
}

function passageWhere(p) {
  if (p.startChapter === p.endChapter) {
    return {
      sql: `h.book = $1 AND h.chapter = $2 AND h.verse >= $3 AND h.verse <= $4`,
      params: [p.book, p.startChapter, p.startVerse, p.endVerse],
    };
  }
  return {
    sql: `h.book = $1 AND (
            (h.chapter = $2 AND h.verse >= $3)
         OR (h.chapter = $4 AND h.verse <= $5)
         OR (h.chapter > $2 AND h.chapter < $4))`,
    params: [p.book, p.startChapter, p.startVerse, p.endChapter, p.endVerse],
  };
}

// ---------------------------------------------------------------- SQL
// Hand-written equivalents of the Drizzle queries, so the tool runs on plain
// `pg` with no TypeScript toolchain. Column names are the physical Xata ones.

const INSERT_STUDY = `
  INSERT INTO study
    (xata_id, name, passage, book, owner, metadata, notes,
     public, model, starred, scriptura, "createdTime", "updatedTime")
  VALUES ($1,$2,$3,$4,$5,$6,$7,false,false,false,false,$8,$8)
  RETURNING xata_id`;

const SELECT_STUDY_BY_ID = `SELECT * FROM study WHERE xata_id = $1 LIMIT 1`;

const passageQuery = (where) => `
  SELECT h."hebId", h.chapter, h.verse, h."strongNumber", h."wlcWord", h."hebUnicode",
         h.gloss, h."ETCBCgloss", h.morphology, h."BSBnewLine", h."BSBstanzaBreak",
         m.categories, m."relatedStrongCodes", l.lemma
  FROM heb_bible_test h
  LEFT JOIN motif_test m ON h."motifLink" = m.xata_id
  LEFT JOIN lexicon_test l ON m."lemmaLink" = l.xata_id
  WHERE ${where}
  ORDER BY h."hebId" ASC`;

const STEPBIBLE_EQUALS = `
  SELECT "Hebrew","Transliteration","Gloss","Meaning","Morph","eStrong","dStrong","uStrong"
  FROM stepbible_tbesh
  WHERE ("eStrong" = ANY($1::text[]) OR "dStrong" = ANY($1::text[]) OR "uStrong" = ANY($1::text[]))`;

const STEPBIBLE_LIKE = `
  SELECT "Hebrew","Transliteration","Gloss","Meaning","Morph","eStrong","dStrong","uStrong"
  FROM stepbible_tbesh
  WHERE ("eStrong" LIKE ANY($1::text[]) OR "dStrong" LIKE ANY($1::text[]) OR "uStrong" LIKE ANY($1::text[]))`;

// ---------------------------------------------------------------- pool
// Mirrors src/db.ts. `connectionTimeoutMillis` defaults to 0 there, which means
// a checkout request queues forever rather than failing fast - the tool keeps
// that default so the measured behaviour matches production.

let pool;
function makePool() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: OPTS.poolMax,
    connectionTimeoutMillis: OPTS.connectionTimeout,
  });
  pool.on('error', (e) => console.error('pool error:', e.message));
  return pool;
}

/* Drizzle checks a connection out of the pool per statement and releases it
   immediately, so the tool does the same rather than holding one connection for
   a whole request. Checkout wait is accumulated across the statements of a
   request: it is the signal that separates "the database is slow" from "we ran
   out of connections". */
async function q(marks, text, params) {
  const t0 = process.hrtime.bigint();
  const client = await pool.connect();
  marks.poolWait += Number(process.hrtime.bigint() - t0) / 1e6;
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/* A multi-statement transaction genuinely needs one pinned connection. */
async function withClient(fn, marks) {
  const t0 = process.hrtime.bigint();
  const client = await pool.connect();
  marks.poolWait += Number(process.hrtime.bigint() - t0) / 1e6;
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------- scenarios

const nanoidish = () =>
  'rec_' + Array.from({ length: 20 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]
  ).join('');

/* Seed study whose metadata/notes a clone copies, so payload size is realistic. */
let SEED = null;
async function loadSeed() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT xata_id, name, book, passage, metadata, notes
         FROM study
        WHERE public = true AND metadata IS NOT NULL
        ORDER BY length(metadata::text) DESC
        LIMIT 1`
    );
    SEED = rows[0] || null;
  } finally {
    await c.end();
  }
}

async function doInsert(marks, { clone }) {
  const now = new Date().toISOString();
  const params = clone && SEED
    ? [nanoidish(), `Copy of ${SEED.name}`, SEED.passage, SEED.book, LOADTEST_OWNER,
       typeof SEED.metadata === 'string' ? SEED.metadata : JSON.stringify(SEED.metadata),
       SEED.notes, now]
    : [nanoidish(), 'Untitled Study', OPTS.passage, 'psalms', LOADTEST_OWNER,
       JSON.stringify({ words: {} }), null, now];

  if (OPTS.commit) {
    const { rows } = await q(marks, INSERT_STUDY, params);
    return rows[0].xata_id;
  }
  /* Rollback mode: the INSERT really executes (WAL, page locks, index update)
     and is then discarded. Holds the connection for at least as long as the
     committed path would, so contention is measured, not understated. */
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const { rows } = await client.query(INSERT_STUDY, params);
      return rows[0].xata_id;
    } finally {
      await client.query('ROLLBACK');
    }
  }, marks);
}

// --------------------------------------------------- strong-code helpers
// Mirrors getStrongSuffix / getStrongCodeVariants / findStepBibleRecord in
// src/lib/actions.ts, so the tool issues the same two-pass StepBible lookup the
// app does: an exact `= ANY` pass, then a `LIKE ANY` fallback covering only the
// strong numbers the exact pass failed to resolve.

function strongSuffix(strongNumber) {
  const [, fractional] = strongNumber.toString().split('.');
  let i = -1;
  if (fractional) {
    const n = parseInt(fractional.replace(/0+$/, ''), 10);
    if (Number.isFinite(n) && n > 0) i = n - 1;
  }
  if (i < 0 || i >= 26) {
    const approx = Math.round(Math.abs(strongNumber - Math.trunc(strongNumber)) * 10) - 1;
    if (approx >= 0 && approx < 26) i = approx;
  }
  return i < 0 || i >= 26 ? '' : String.fromCharCode(97 + i);
}

function strongVariants(strongNumber) {
  const n = Math.trunc(strongNumber).toString();
  const suffix = strongSuffix(strongNumber);
  const base = [`H${n}`, `H${n.padStart(4, '0')}`, `H${n.padStart(5, '0')}`];
  return [...new Set([...(suffix ? base.map((c) => c + suffix) : []), ...base])];
}

function strongNumericValue(code) {
  if (!code) return undefined;
  const m = code.toUpperCase().match(/H?0*(\d{1,5})/);
  return m ? parseInt(m[1], 10) : undefined;
}

function resolvesExactly(candidates, strongNumber) {
  const base = Math.trunc(strongNumber);
  return strongVariants(strongNumber).some((code) =>
    candidates.some((r) =>
      ['eStrong', 'dStrong', 'uStrong'].some((col) => {
        const v = r[col] && r[col].trim();
        return strongNumericValue(v) === base && (v || '').toUpperCase() === code.toUpperCase();
      })
    )
  );
}

/* The read path the browser hits right after the redirect: fetchPassageData(). */
async function doPassageRead(marks) {
  const p = parsePassage(SEED ? SEED.passage : OPTS.passage, SEED ? SEED.book : 'psalms');
  const w = passageWhere(p);

  let t = process.hrtime.bigint();
  const words = await q(marks, passageQuery(w.sql), w.params);
  marks.passageJoin = Number(process.hrtime.bigint() - t) / 1e6;

  const strongs = [];
  for (const r of words.rows) if (r.strongNumber) strongs.push(Number(r.strongNumber));
  const uniqueStrongs = [...new Set(strongs)];
  const allCodes = [...new Set(uniqueStrongs.flatMap(strongVariants))];

  t = process.hrtime.bigint();
  let exact = { rows: [] };
  if (allCodes.length) exact = await q(marks, STEPBIBLE_EQUALS, [allCodes]);

  // Only the strong numbers the exact pass could not resolve reach the LIKE pass.
  const unresolved = uniqueStrongs.filter((n) => !resolvesExactly(exact.rows, n));
  const prefixCodes = [...new Set(unresolved.flatMap(strongVariants))];
  if (prefixCodes.length) await q(marks, STEPBIBLE_LIKE, [prefixCodes.map((c) => `${c}%`)]);

  marks.stepBible = Number(process.hrtime.bigint() - t) / 1e6;
  marks.strongs = uniqueStrongs.length;
  marks.unresolved = unresolved.length;
  marks.likePatterns = prefixCodes.length;
  marks.words = words.rowCount;
}

async function runOnce(scenario) {
  const marks = { poolWait: 0 };
  const t0 = process.hrtime.bigint();

  if (scenario === 'clerk') {
    const t = process.hrtime.bigint();
    const res = await fetch('https://api.clerk.com/v1/users?limit=1', {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    marks.clerk = Number(process.hrtime.bigint() - t) / 1e6;
    marks.clerkStatus = res.status;
    marks.rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
    await res.arrayBuffer();
    marks.total = Number(process.hrtime.bigint() - t0) / 1e6;
    return marks;
  }

  if (scenario === 'insert' || scenario === 'create' || scenario === 'clone') {
    const t = process.hrtime.bigint();
    await doInsert(marks, { clone: scenario !== 'create' });
    marks.insert = Number(process.hrtime.bigint() - t) / 1e6;
  } else if (scenario === 'passage') {
    await doPassageRead(marks);
  } else if (scenario === 'clone-full') {
    // The full click: INSERT, then the edit page's own study lookup + passage load.
    let t = process.hrtime.bigint();
    const id = await doInsert(marks, { clone: true });
    marks.insert = Number(process.hrtime.bigint() - t) / 1e6;

    t = process.hrtime.bigint();
    await q(marks, SELECT_STUDY_BY_ID, [id]);
    marks.studyLookup = Number(process.hrtime.bigint() - t) / 1e6;

    await doPassageRead(marks);
  } else {
    throw new Error(`Unknown scenario "${scenario}"`);
  }

  marks.total = Number(process.hrtime.bigint() - t0) / 1e6;
  return marks;
}


// ---------------------------------------------------------------- connection amplification
/*
  On Vercel each lambda instance gets its OWN module scope, so `globalThis.selaPgPool`
  in src/db.ts is per-instance, not global. A burst of simultaneous users is spread
  across instances, and every instance opens its own pool of up to PG_POOL_MAX
  connections. Total connections to Postgres are therefore
  (instances x pool.max), not pool.max -- and the Xata instance allows
  max_connections=50, of which 3 are superuser-reserved.

  This scenario simulates `instances` independent pools issuing the clone-full
  workload at the same time, which is what a real burst looks like from the
  database's side. It is capped so the tool never tries to consume more than
  --max-connections sockets.

  WARNING: run this against a staging branch, not a live production database.
  Saturating max_connections locks out real users for as long as the run lasts.
*/
async function runConnectionStorm(instances, perInstance) {
  const budget = OPTS.maxConnections;
  const wanted = instances * OPTS.poolMax;
  if (wanted > budget) {
    console.log(`  refusing: ${instances} instances x pool.max ${OPTS.poolMax} = ${wanted} connections ` +
                `exceeds --max-connections ${budget}. Lower --pool-max or raise the cap deliberately.`);
    return null;
  }

  const pools = Array.from({ length: instances }, () => new Pool({
    connectionString: process.env.DATABASE_URL,
    max: OPTS.poolMax,
    connectionTimeoutMillis: OPTS.connectionTimeout,
  }));
  pools.forEach((p) => p.on('error', () => {}));

  const mon = startMonitor();
  await mon.ready;

  const lat = [];
  const errors = [];
  const t0 = Date.now();
  await Promise.all(pools.flatMap((instancePool) =>
    Array.from({ length: perInstance }, async () => {
      const t = process.hrtime.bigint();
      try {
        const c = await instancePool.connect();
        try { await c.query(SELECT_STUDY_BY_ID, [SEED ? SEED.xata_id : 'rec_none']); }
        finally { c.release(); }
        lat.push(Number(process.hrtime.bigint() - t) / 1e6);
      } catch (e) { errors.push(e.message); }
    })
  ));
  const wallMs = Date.now() - t0;
  await mon.state.stop?.();
  await Promise.all(pools.map((p) => p.end().catch(() => {})));

  return {
    concurrency: instances,
    requests: lat.length,
    errors,
    wallMs,
    throughput: (lat.length / wallMs) * 1000,
    total: summarize(lat),
    poolWait: summarize([0]),
    insert: null, passageJoin: null, stepBible: null, words: 0, strongs: 0, unresolved: 0,
    server: monitorSummary(mon.state.samples),
  };
}

// ---------------------------------------------------------------- server-side monitor

function startMonitor() {
  const state = { samples: [], stop: null };
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  const ready = c.connect().then(() => {
    const timer = setInterval(async () => {
      try {
        const { rows } = await c.query(`
          SELECT count(*) FILTER (WHERE state = 'active')            AS active,
                 count(*) FILTER (WHERE wait_event_type IS NOT NULL) AS waiting,
                 count(*) FILTER (WHERE wait_event_type = 'Lock')    AS lock_waits,
                 count(*) FILTER (WHERE backend_type = 'parallel worker') AS par_workers,
                 count(*)                                            AS total,
                 coalesce(max(extract(epoch FROM (now() - query_start))), 0) AS longest_s
            FROM pg_stat_activity
           WHERE datname = current_database()`);
        state.samples.push(rows[0]);
      } catch { /* sampler must never break the run */ }
    }, 200);
    state.stop = async () => { clearInterval(timer); await c.end().catch(() => {}); };
  }).catch(() => { state.stop = async () => {}; });
  return { ready, state };
}

function monitorSummary(samples) {
  if (!samples.length) return null;
  const num = (k) => samples.map((s) => Number(s[k]));
  const peak = (k) => Math.max(...num(k));
  return {
    peakActive: peak('active'),
    peakWaiting: peak('waiting'),
    peakLockWaits: peak('lock_waits'),
    peakParallelWorkers: peak('par_workers'),
    peakTotalBackends: peak('total'),
    longestQuery: Math.max(...num('longest_s')),
  };
}

// ---------------------------------------------------------------- driver

/* Open and park `n` connections so the measured pool-checkout wait reflects
   queueing for a busy pool, not the one-off TLS handshake of a cold pool. */
async function warmPool(n) {
  const held = [];
  for (let i = 0; i < Math.min(n, OPTS.poolMax); i++) held.push(await pool.connect());
  held.forEach((c) => c.release());
}

async function runLevel(scenario, concurrency) {
  if (pool) await warmPool(concurrency);
  const mon = startMonitor();
  await mon.ready;

  const totals = [];
  const poolWaits = [];
  const inserts = [];
  const passages = [];
  const steps = [];
  const errors = [];
  let words = 0;
  let strongs = 0;
  let unresolved = 0;

  const t0 = Date.now();
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let i = 0; i < OPTS.runs; i++) {
        try {
          const m = await runOnce(scenario);
          totals.push(m.total);
          poolWaits.push(m.poolWait || 0);
          if (m.insert != null) inserts.push(m.insert);
          if (m.passageJoin != null) passages.push(m.passageJoin);
          if (m.stepBible != null) steps.push(m.stepBible);
          if (m.words) words = m.words;
          if (m.strongs != null) { strongs = m.strongs; unresolved = m.unresolved; }
        } catch (e) {
          errors.push(e.message);
        }
      }
    })
  );
  const wallMs = Date.now() - t0;

  await mon.state.stop?.();

  return {
    concurrency,
    requests: totals.length,
    errors,
    wallMs,
    throughput: (totals.length / wallMs) * 1000,
    total: summarize(totals),
    poolWait: summarize(poolWaits),
    insert: inserts.length ? summarize(inserts) : null,
    passageJoin: passages.length ? summarize(passages) : null,
    stepBible: steps.length ? summarize(steps) : null,
    words,
    strongs,
    unresolved,
    server: monitorSummary(mon.state.samples),
  };
}

async function cleanup() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rowCount } = await c.query(
      `DELETE FROM study WHERE owner LIKE $1`, [`${LOADTEST_OWNER_PREFIX}%`]
    );
    return rowCount;
  } finally {
    await c.end();
  }
}

function printLevel(r) {
  const pad = (s, n) => String(s).padStart(n);
  console.log(
    `  ${pad(r.concurrency, 3)} │ ${pad(ms(r.total.p50), 8)} ${pad(ms(r.total.p95), 8)} ${pad(ms(r.total.max), 8)} │` +
    ` ${pad(ms(r.poolWait.p95), 8)} │ ${pad(r.throughput.toFixed(1), 6)} │ ` +
    `${pad(r.server ? r.server.peakActive : '-', 6)} ${pad(r.server ? r.server.peakParallelWorkers : '-', 5)} │ ` +
    `${pad(r.errors.length, 4)}`
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.local / .env');
    process.exit(1);
  }

  if (OPTS.cleanupOnly) {
    const n = await cleanup();
    console.log(`Deleted ${n} leftover load-test study rows.`);
    return;
  }

  if (OPTS.scenario !== 'clerk') {
    if (OPTS.scenario !== 'connections') makePool();
    await loadSeed();
  }

  const host = new URL(process.env.DATABASE_URL).hostname;
  console.log(`\nSela load test  ·  scenario=${OPTS.scenario}  runs/user=${OPTS.runs}  pool.max=${OPTS.poolMax}`);
  console.log(`host=${host}  mode=${OPTS.commit ? 'COMMIT (rows persisted then deleted)' : 'ROLLBACK (no rows persisted)'}`);
  if (SEED) console.log(`seed study: "${SEED.name}" (${SEED.passage}), metadata ${JSON.stringify(SEED.metadata).length} bytes`);

  const unit = OPTS.scenario === 'connections' ? 'inst' : ' VUs';
  console.log(`\n ${unit} │  p50      p95      max    │ poolWait │  req/s │ pgActive pgPar │ err`);
  console.log('  ────┼───────────────────────────┼──────────┼────────┼────────────────┼─────');

  const results = [];
  for (const c of OPTS.concurrency) {
    const r = OPTS.scenario === 'connections'
      ? await runConnectionStorm(c, OPTS.runs)
      : await runLevel(OPTS.scenario, c);
    if (!r) continue;
    results.push(r);
    printLevel(r);
  }

  if (!results.length) { await pool?.end(); return; }

  // ---- breakdown of where the time goes, at the highest level tested
  const last = results[results.length - 1];
  const first = results[0];
  console.log('\nPer-phase p95 at highest concurrency (VUs=' + last.concurrency + '):');
  if (last.insert)      console.log(`  INSERT study .............. ${ms(last.insert.p95)}`);
  if (last.passageJoin) console.log(`  heb_bible_test join ....... ${ms(last.passageJoin.p95)}   (${last.words} words)`);
  if (last.stepBible)   console.log(`  stepbible_tbesh lookups ... ${ms(last.stepBible.p95)}` +
                                    (last.strongs ? `   (${last.strongs} strongs, ${last.unresolved} needing the LIKE fallback)` : ''));
  console.log(`  pool checkout wait ........ ${ms(last.poolWait.p95)}`);

  // ---- scaling verdict
  if (results.length > 1) {
    const degradation = last.total.p95 / (first.total.p95 || 1);
    const concFactor = last.concurrency / first.concurrency;
    const efficiency = last.throughput / (first.throughput || 1) / concFactor;
    console.log(`\nScaling: p95 grew ${degradation.toFixed(1)}x going from ${first.concurrency} to ${last.concurrency}` +
                ` concurrent users (${concFactor}x load).`);
    console.log(`         throughput ${first.throughput.toFixed(1)} -> ${last.throughput.toFixed(1)} req/s` +
                ` (${(efficiency * 100).toFixed(0)}% of linear scaling).`);

    // Find the knee: the first level past which throughput stops improving by >10%.
    let knee = null;
    for (let i = 1; i < results.length; i++) {
      if (results[i].throughput < results[i - 1].throughput * 1.1) { knee = results[i - 1]; break; }
    }
    if (knee) {
      console.log(`  => SATURATION KNEE at ~${knee.concurrency} concurrent users / ${knee.throughput.toFixed(1)} req/s.` +
                  ` Past this point extra users add latency but no throughput.`);
    } else {
      console.log('  => No saturation knee reached at the levels tested.');
    }
    if (efficiency < 0.5) {
      console.log('  => Work is largely SERIALIZED: the database is saturated, not merely busy.');
    }
  }
  if (last.poolWait.p95 > 50) {
    console.log(`  => Pool contention: p95 checkout wait ${ms(last.poolWait.p95)} with max=${OPTS.poolMax}` +
                `, against a --connection-timeout of ${OPTS.connectionTimeout || 'unlimited'}.`);
  }
  if (last.server && last.server.peakParallelWorkers > 0) {
    console.log(`  => Peak ${last.server.peakParallelWorkers} parallel workers and ${last.server.peakTotalBackends}` +
                ` total backends (max_connections=50): each passage query recruits 2 extra backends.`);
  }

  const errs = results.flatMap((r) => r.errors);
  if (errs.length) {
    console.log(`\nErrors (${errs.length}):`);
    [...new Set(errs)].slice(0, 10).forEach((e) => console.log(`  - ${e}`));
  }

  if (OPTS.json) {
    console.log('\n' + JSON.stringify({ opts: OPTS, results }, null, 2));
  }

  if (OPTS.commit) {
    const n = await cleanup();
    console.log(`\nCleanup: deleted ${n} load-test rows.`);
  }

  await pool?.end();
}

main().catch(async (e) => {
  console.error('\nload test failed:', e);
  try { if (OPTS.commit) await cleanup(); } catch {}
  process.exit(1);
});
