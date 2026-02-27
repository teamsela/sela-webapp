import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getXataClient } from './xata'; // Generated client
import { Pool } from 'pg';

const xata = getXataClient();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

export const db = drizzle(pool);