import { pgTable, text, boolean, jsonb, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const study = pgTable('study', {
  id: text('xata_id').primaryKey(),
  name: text('name'),
  owner: text('owner'),
  book: text('book'),
  passage: text('passage'),
  public: boolean('public').default(false),
  model: boolean('model').default(false),
  metadata: jsonb('metadata').default({ words: [] }),
  notes: text('notes'),
  starred: boolean('starred').default(false),
  updatedAt: text('updatedTime'),
  createdAt: text('createdTime'),
});

// export const hebBible = pgTable('heb_bible', {
//   id: text('xata_id').primaryKey(),
//   hebId: integer('hebId'),
//   book: text('book'),
//   chapter: integer('chapter'),
//   verse: integer('verse'),
//   strongNumber: doublePrecision('strongNumber'),
//   wlcWord: text('wlcWord'),
//   gloss: text('gloss'),
//   ETCBCgloss: text('ETCBCgloss'),
//   morphology: text('morphology'),
//   BSBnewLine: boolean('BSBnewLine'),
//   motifLinkId: text('motifLink'), // FK to motif_link
// });

export const hebBible = pgTable('heb_bible_test1', {
  id: text('xata_id').primaryKey(),
  hebId: integer('hebId'),
  book: text('book'),
  chapter: integer('chapter'),
  verse: integer('verse'),
  strongNumber: doublePrecision('strongNumber'),
  wlcWord: text('wlcWord'),
  gloss: text('gloss'),
  ETCBCgloss: text('ETCBCgloss'),
  morphology: text('morphology'),
  BSBnewLine: boolean('BSBnewLine'),
  motifLinkId: text('motifLink'), // FK to motif_link
});

// export const motifLink = pgTable('motif', {
export const motifLink = pgTable('motif_test1', {
  id: text('xata_id').primaryKey(),
  categories: text('categories').array(),
  relatedStrongCodes: text('relatedStrongCodes').array(),
  lemmaLinkId: text('lemmaLink'),
});

// export const lemmaLink = pgTable('lexicon', {
export const lemmaLink = pgTable('lexicon_test1', {
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