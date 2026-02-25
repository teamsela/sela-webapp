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
  updatedAt: text('xata_updatedat'),
  createdAt: text('xata_createdat'),
});

export const hebBible = pgTable('heb_bible', {
  id: text('id').primaryKey(),
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

export const motifLink = pgTable('motif_link', {
  id: text('id').primaryKey(),
  categories: text('categories').array(),
  relatedStrongCodes: text('relatedStrongCodes').array(),
  lemmaLinkId: text('lemmaLink'),
});

export const lemmaLink = pgTable('lemma_link', {
  id: text('id').primaryKey(),
  lemma: text('lemma'),
});

export const stepbibleTbesh = pgTable('stepbible_tbesh', {
  id: text('id').primaryKey(),
  Hebrew: text('Hebrew'),
  Transliteration: text('Transliteration'),
  Gloss: text('Gloss'),
  Meaning: text('Meaning'),
  Morph: text('Morph'),
  eStrong: text('eStrong'),
  dStrong: text('dStrong'),
  uStrong: text('uStrong'),
});