import { drizzle } from 'drizzle-orm/node-postgres';
import { getXataClient } from './xata'; // Generated client
import { Pool } from 'pg';

const xata = getXataClient();
declare global {
  // eslint-disable-next-line no-var
  var selaPgPool: Pool | undefined;
}

const envInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/*
  Connection budget.

  On Vercel each function instance gets its own module scope, so this pool is
  per-instance, not per-deployment: the number of sockets Postgres actually sees
  is (live instances x max), not max. The Xata instance allows
  max_connections = 50 with 3 reserved for superusers, so `max` is deliberately
  small - a handful of instances at the old default of 10 was enough to exhaust
  the server. See scripts/README.md for how to re-measure this.
*/
const POOL_MAX = envInt(process.env.PG_POOL_MAX, 3);

/*
  Statement-level guards, applied as libpq startup parameters so they cover
  every session this pool opens rather than having to be re-issued per query.

  statement_timeout matters even though it is longer than the platform's
  function timeout: when Vercel kills a function the socket drops, but Postgres
  does not notice until the query tries to write results back, so a runaway
  query can keep burning a connection long after the request is gone. The
  server itself sets no timeout at all.
*/
const STATEMENT_TIMEOUT_MS = envInt(process.env.PG_STATEMENT_TIMEOUT_MS, 15_000);
const IDLE_TX_TIMEOUT_MS = envInt(process.env.PG_IDLE_TX_TIMEOUT_MS, 30_000);

const pool =
  globalThis.selaPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: POOL_MAX,

    /*
      Fail fast when the pool is exhausted. The pg default is 0, which queues a
      checkout request forever: the browser sits on a spinner until the platform
      kills the function and returns a generic gateway error, instead of the
      action surfacing a message it can act on. 5s comfortably covers a TLS
      handshake plus a real queue wait while still erroring well inside any
      function time limit.
    */
    connectionTimeoutMillis: envInt(process.env.PG_CONNECTION_TIMEOUT_MS, 5_000),

    // Hand idle connections back promptly so a traffic burst does not leave
    // every instance sitting on sockets it has stopped using.
    idleTimeoutMillis: envInt(process.env.PG_IDLE_TIMEOUT_MS, 10_000),

    options:
      `-c statement_timeout=${STATEMENT_TIMEOUT_MS} ` +
      `-c idle_in_transaction_session_timeout=${IDLE_TX_TIMEOUT_MS}`,
  });

/*
  An idle client that dies (server restart, network drop, an idle timeout from
  the provider) emits 'error' on the pool. With no listener that is an unhandled
  event, which takes the whole process down and turns one dropped connection
  into a cold start for every in-flight request on the instance.
*/
if (!globalThis.selaPgPool) {
  pool.on('error', (err) => {
    console.error('pg pool error on idle client:', err.message);
  });
  globalThis.selaPgPool = pool;
}

export const db = drizzle(pool);
