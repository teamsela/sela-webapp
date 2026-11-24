#!/usr/bin/env node
/*
  Creates the tables behind classrooms (see the classroom tables in
  src/schema.ts). Every statement is IF NOT EXISTS, so it is safe to re-run.

  Usage:  node scripts/create-classroom-tables.js
*/

require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ path: '.env', quiet: true });

const { Client } = require('pg');

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS classroom (
     id            text PRIMARY KEY,
     name          text NOT NULL,
     owner         text NOT NULL,
     "createdTime" text
   )`,
  `CREATE TABLE IF NOT EXISTS classroom_member (
     "classroomId" text NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
     email         text NOT NULL,
     role          text NOT NULL DEFAULT 'member',
     "invitedBy"   text,
     "createdTime" text,
     PRIMARY KEY ("classroomId", email)
   )`,
  // Added after the first release: per-classroom admins.
  `ALTER TABLE classroom_member ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'`,
  `CREATE INDEX IF NOT EXISTS classroom_member_email_idx ON classroom_member (email)`,
  `CREATE TABLE IF NOT EXISTS classroom_study (
     "classroomId" text NOT NULL REFERENCES classroom(id) ON DELETE CASCADE,
     "studyId"     text NOT NULL,
     "sharedBy"    text,
     "createdTime" text,
     PRIMARY KEY ("classroomId", "studyId")
   )`,
  `CREATE INDEX IF NOT EXISTS classroom_study_study_idx ON classroom_study ("studyId")`,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    for (const sql of STATEMENTS) {
      console.log(sql.split('\n')[0]);
      await client.query(sql);
    }
    console.log('done');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
