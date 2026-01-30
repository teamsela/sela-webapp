import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

const getConnectionString = () =>
  process.env.DATABASE_URL ?? process.env.XATA_DATABASE_URL ?? "";

export const getDb = () => {
  if (!db) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error("DATABASE_URL or XATA_DATABASE_URL must be set");
    }

    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });
  }

  return db;
};
