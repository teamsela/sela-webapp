import { pgTable, text, boolean, jsonb, integer, doublePrecision, primaryKey } from 'drizzle-orm/pg-core';

export const study = pgTable('study', {
  id: text('xata_id').primaryKey(),
  name: text('name'),
  owner: text('owner'),
  book: text('book'),
  passage: text('passage'),
  public: boolean('public').default(false),
  model: boolean('model').default(false),
  metadata: jsonb('metadata').default({ words: [] }),
  //layers: jsonb('layers').default({ }),
  notes: text('notes'),
  starred: boolean('starred').default(false),
  scriptura: boolean('scriptura').default(false),
  updatedAt: text('updatedTime'),
  createdAt: text('createdTime'),
});

export const hebBible = pgTable('heb_bible', {
  id: text('xata_id').primaryKey(),
  hebId: integer('hebId'),
  book: text('book'),
  chapter: integer('chapter'),
  verse: integer('verse'),
  strongNumber: doublePrecision('strongNumber'),
  wlcWord: text('wlcWord'),
  hebUnicode: text('hebUnicode'), // OHB Hebrew text (qere readings, e.g. אֲדֹנָי for יהוה)
  gloss: text('gloss'),
  ETCBCgloss: text('ETCBCgloss'),
  morphology: text('morphology'),
  BSBnewLine: boolean('BSBnewLine'),
  BSBstanzaBreak: boolean('BSBstanzaBreak'),
  motifLinkId: text('motifLink'), // FK to motif_link
});

export const motifLink = pgTable('motif', {
  id: text('xata_id').primaryKey(),
  categories: text('categories').array(),
  relatedStrongCodes: text('relatedStrongCodes').array(),
  lemmaLinkId: text('lemmaLink'),
});

export const lemmaLink = pgTable('lexicon', {
  id: text('xata_id').primaryKey(),
  gloss: text('gloss'),
  lemma: text('lemma'),
});

export const stepbibleTbesh = pgTable('stepbible_tbesh', {
  id: text('xata_id').primaryKey(),
  Hebrew: text('Hebrew'),
  Transliteration: text('Transliteration'),
  Gloss: text('Gloss'),
  Meaning: text('Meaning'),
  Morph: text('Morph'),
  eStrong: text('eStrong'),
  dStrong: text('dStrong'),
  uStrong: text('uStrong'),
});

/*
  Classrooms. An admin creates a classroom and invites members by email; members
  share their own studies into it. Tables are created by
  scripts/create-classroom-tables.js.

  Membership is keyed by (lower-cased) email rather than Clerk user id so an
  admin can invite someone who has not signed up yet: they see the classroom as
  soon as they sign in with that address.
*/
export const classroom = pgTable('classroom', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  owner: text('owner').notNull(), // Clerk user id of the creator (informational; admins are classroom_member rows with role 'admin')
  createdAt: text('createdTime'),
});

export const classroomMember = pgTable('classroom_member', {
  classroomId: text('classroomId').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'), // 'member' | 'admin' (manages this classroom)
  invitedBy: text('invitedBy'),
  createdAt: text('createdTime'),
}, (t) => [primaryKey({ columns: [t.classroomId, t.email] })]);

export const classroomStudy = pgTable('classroom_study', {
  classroomId: text('classroomId').notNull(),
  studyId: text('studyId').notNull(),
  sharedBy: text('sharedBy'),
  createdAt: text('createdTime'),
}, (t) => [primaryKey({ columns: [t.classroomId, t.studyId] })]);
