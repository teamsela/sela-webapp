import { drizzle } from 'drizzle-orm/node-postgres';
import { getXataClient } from './xata'; // Generated client
import { Pool } from 'pg';

const xata = getXataClient();
declare global {
  // eslint-disable-next-line no-var
  var selaPgPool: Pool | undefined;
}

const pool =
  globalThis.selaPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Keep default conservative to avoid exhausting shared Postgres plans.
    max: Number(process.env.PG_POOL_MAX ?? 10),
  });

if (!globalThis.selaPgPool) {
  globalThis.selaPgPool = pool;
}

export const db = drizzle(pool);