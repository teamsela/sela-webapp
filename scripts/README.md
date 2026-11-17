# scripts

## loadtest-study.js

Load test for the "New Study" (`createStudy`) and "Copy to My Studies"
(`cloneStudy`) paths in `src/lib/actions.ts`.

Both actions do the same three things: a Clerk `currentUser()` call, one
`INSERT INTO study`, and then `redirect('/study/<id>/edit')`. The redirect is
part of the click — the user is not done until the edit page has rendered — so
the tool measures the whole chain, including the `fetchPassageData()` queries
the edit page runs.

```bash
# the full click, swept across concurrency levels
node scripts/loadtest-study.js --scenario clone-full --concurrency 2,4,6,8,12,16,24

# isolate one component
node scripts/loadtest-study.js --scenario insert  --concurrency 1,6,12   # the INSERT only
node scripts/loadtest-study.js --scenario passage --concurrency 1,6,12   # the edit-page read only
node scripts/loadtest-study.js --scenario clerk   --concurrency 1,6,12   # Clerk BAPI only

# simulate N Vercel instances, each with its own pool (staging only)
node scripts/loadtest-study.js --scenario connections --concurrency 2,4,6 --pool-max 5

node scripts/loadtest-study.js --cleanup-only
```

### Options

| flag | default | meaning |
| --- | --- | --- |
| `--scenario` | `clone-full` | `create`, `clone`, `insert`, `passage`, `clone-full`, `clerk`, `connections` |
| `--concurrency` | `1,2,4,6,8,12` | comma-separated virtual-user counts to sweep |
| `--runs` | `3` | requests per virtual user per level |
| `--pool-max` | `PG_POOL_MAX` or `3` | matches `src/db.ts` |
| `--connection-timeout` | `5000` | matches `src/db.ts` |
| `--max-connections` | `30` | hard cap for the `connections` scenario |
| `--commit` | off | persist inserted rows (then delete them) instead of rolling back |
| `--json` | off | dump raw results |

### Safety

Writes run inside a transaction that is **rolled back** by default, so the
`study` table is left untouched while the INSERT still really executes (WAL, row
locks, index maintenance, connection hold time). `--commit` persists rows; they
are tagged `owner = 'loadtest_<runId>'` and deleted when the run finishes.
`--cleanup-only` purges leftovers from an interrupted run.

The `connections` scenario deliberately consumes connections and can lock real
users out of a live database. Point it at a staging branch.

### Reading the output

- **req/s flattening while p50 keeps climbing** is the saturation knee: past that
  point extra users buy latency, not throughput.
- **poolWait** separates "the database is slow" from "we ran out of
  connections". `src/db.ts` sets no `connectionTimeoutMillis`, so in production
  an exhausted pool hangs rather than erroring.
- **pgActive / pgPar** are sampled from `pg_stat_activity`. `pgPar` counts
  parallel workers: a query that needs them consumes three backends, not one.

## add-performance-indexes.js

Creates the indexes the hot read path needs and runs `ANALYZE` on the reference
tables, which had never had statistics collected. All statements are
`CREATE INDEX CONCURRENTLY ... IF NOT EXISTS`, so it is safe against a live
database and safe to re-run.

```bash
node scripts/add-performance-indexes.js
node scripts/add-performance-indexes.js --drop   # reverse
```
