import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getXataClient } from './xata'; // Generated client
import { Pool } from 'pg';

const xata = getXataClient();
const pool = new Pool({ connectionString: xata.sql.connectionString, max: 20 });

//export const db = drizzle(process.env.DATABASE_URL!);
export const db = drizzle(pool);