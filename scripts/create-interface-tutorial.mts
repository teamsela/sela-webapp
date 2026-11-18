/*
  Create the "Interface Tutorial" study (Psalm 23) that the dashboard
  sidebar's Tutorials folder lists.

  What it does, in order:
    1. Adds a boolean `tutorial` column to the `study` table (default false)
       if it is not there yet. Existing studies all get false. The app's
       study queries read this column, so this must run before the
       `tutorials` branch is deployed.
    2. Creates the tutorial study, unless a tutorial for Psalms 23 already
       exists (then it prints that study's id and links instead).

  The study is created empty, like one made with "New Study". Its owner edits
  it in the app; every other signed-in user sees it read-only, with
  "Copy to My Studies".

  Dry run by default: it connects, prints what it would change, and writes
  nothing. Add --apply to make the changes. Uses DATABASE_URL from
  .env.local / .env, the same database the app uses.

  Usage (Node 22.18+ runs TypeScript directly; otherwise use `npx tsx`):

    node scripts/create-interface-tutorial.mts --owner user_2abc...
    node scripts/create-interface-tutorial.mts --owner user_2abc... --apply

    # or take the owner from one of your studies (id from its URL, with rec_)
    node scripts/create-interface-tutorial.mts --owner-from-study rec_abc123 --apply
*/

import { randomInt } from "node:crypto";
import { parseArgs } from "node:util";

import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

const BOOK = "psalms";
const PASSAGE = "23";
const DEFAULT_NAME = "Interface Tutorial";

// Same id shape the app uses for new studies: "rec_" + nanoid(20).
const NANOID_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

const newStudyId = (): string => {
  let id = "rec_";
  for (let i = 0; i < 20; i++) {
    id += NANOID_ALPHABET[randomInt(NANOID_ALPHABET.length)];
  }
  return id;
};

const studyLink = (studyId: string, mode: "view" | "edit"): string =>
  `/study/${studyId.replace(/^rec_/, "")}/${mode}`;

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const { values: args } = parseArgs({
  options: {
    owner: { type: "string" },
    "owner-from-study": { type: "string" },
    name: { type: "string", default: DEFAULT_NAME },
    apply: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (args.help) {
  console.log("Usage: node scripts/create-interface-tutorial.mts (--owner <clerk user id> | --owner-from-study <rec_id>) [--name <name>] [--apply]");
  process.exit(0);
}
if (!args.owner === !args["owner-from-study"]) {
  fail("Give exactly one of --owner <clerk user id> or --owner-from-study <rec_id>.");
}

const connectionString = process.env.DATABASE_URL ?? fail("DATABASE_URL is not set in .env.local or .env.");
const client = new pg.Client({ connectionString });

const run = async (): Promise<void> => {
  await client.connect();
  console.log(args.apply ? "== APPLY" : "== DRY RUN (add --apply to write)");

  await client.query("BEGIN");

  // Owner
  let owner = args.owner;
  if (args["owner-from-study"]) {
    const res = await client.query<{ owner: string | null }>(
      "SELECT owner FROM study WHERE xata_id = $1",
      [args["owner-from-study"]],
    );
    owner = res.rows[0]?.owner ?? fail(`No study ${args["owner-from-study"]} (or it has no owner).`);
  }
  console.log(`Owner: ${owner}`);

  // 1. tutorial column
  const columnRes = await client.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name = 'study' AND column_name = 'tutorial'",
  );
  const hasColumn = (columnRes.rowCount ?? 0) > 0;

  if (hasColumn) {
    console.log("study.tutorial column: already exists");
  } else {
    console.log("study.tutorial column: missing -> ALTER TABLE study ADD COLUMN tutorial boolean DEFAULT false");
    if (args.apply) {
      await client.query("ALTER TABLE study ADD COLUMN IF NOT EXISTS tutorial boolean DEFAULT false");
    }
  }

  // 2. The tutorial study
  if (hasColumn) {
    const existing = await client.query<{ xata_id: string; name: string | null }>(
      `SELECT xata_id, name FROM study
        WHERE tutorial = true AND book = $1 AND passage = $2
        ORDER BY "createdTime" LIMIT 1`,
      [BOOK, PASSAGE],
    );
    const found = existing.rows[0];
    if (found) {
      console.log(`Tutorial study already exists: ${found.xata_id} "${found.name ?? ""}"`);
      console.log(`  open: ${studyLink(found.xata_id, "edit")}`);
      await client.query(args.apply ? "COMMIT" : "ROLLBACK");
      return;
    }
  }

  const studyId = newStudyId();
  const now = new Date().toISOString();
  console.log(`Create study ${studyId} "${args.name}" (${BOOK} ${PASSAGE}), tutorial = true`);

  if (!args.apply) {
    await client.query("ROLLBACK");
    console.log("Nothing written.");
    return;
  }

  await client.query(
    `INSERT INTO study
       (xata_id, name, owner, book, passage, metadata,
        public, model, starred, scriptura, tutorial, "createdTime", "updatedTime")
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, false, false, false, false, true, $7, $7)`,
    [studyId, args.name, owner, BOOK, PASSAGE, JSON.stringify({ words: {} }), now],
  );
  await client.query("COMMIT");

  console.log("Created.");
  console.log(`  owner edits it at:  ${studyLink(studyId, "edit")}`);
  console.log(`  everyone else sees: ${studyLink(studyId, "view")}`);
};

run()
  .catch(async (error: unknown) => {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
