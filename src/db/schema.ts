import {
  pgTable,
  text,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export const study = pgTable("study", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner"),
  public: boolean("public"),
  starred: boolean("starred"),
  passage: text("passage").notNull(),
  model: boolean("model"),
  metadata: jsonb("metadata"),
  book: text("book"),
  notes: text("notes"),
  xataCreatedAt: timestamp("xata_created_at", { withTimezone: true }),
  xataUpdatedAt: timestamp("xata_updated_at", { withTimezone: true }),
});

export const motif = pgTable("motif", {
  id: text("id").primaryKey(),
  categories: text("categories").array(),
  lemmaLink: text("lemmaLink"),
  relatedStrongCodes: text("relatedStrongCodes").array(),
});

export const lexicon = pgTable("lexicon", {
  id: text("id").primaryKey(),
  gloss: text("gloss"),
  lemma: text("lemma"),
});

export const stepbibleTbesh = pgTable("stepbible_tbesh", {
  id: text("id").primaryKey(),
  eStrong: text("eStrong"),
  dStrong: text("dStrong"),
  uStrong: text("uStrong"),
  Hebrew: text("Hebrew"),
  Transliteration: text("Transliteration"),
  Morph: text("Morph"),
  Gloss: text("Gloss"),
  Meaning: text("Meaning"),
});

export const hebBibleGenesisAndPsalms = pgTable(
  "heb_bible_genesis_and_psalms",
  {
    id: text("id").primaryKey(),
    hebId: integer("hebId"),
    book: text("book"),
    chapter: integer("chapter"),
    verse: integer("verse"),
    wlcWord: text("wlcWord"),
    hebUnicode: text("hebUnicode"),
    strongNumber: doublePrecision("strongNumber"),
    gloss: text("gloss"),
    morphology: text("morphology"),
    ETCBCgloss: text("ETCBCgloss"),
    BSBnewLine: boolean("BSBnewLine"),
    motifLink: text("motifLink"),
  }
);

export const styling = pgTable("styling", {
  id: text("id").primaryKey(),
  studyId: text("studyId"),
  colorFill: text("colorFill"),
  borderColor: text("borderColor"),
  textColor: text("textColor"),
  hebId: integer("hebId").notNull(),
  numIndent: integer("numIndent"),
  indented: boolean("indented"),
  stropheDiv: boolean("stropheDiv"),
  lineBreak: boolean("lineBreak"),
  stanzaDiv: boolean("stanzaDiv"),
});

export const stropheStyling = pgTable("stropheStyling", {
  id: text("id").primaryKey(),
  studyId: text("studyId"),
  colorFill: text("colorFill"),
  borderColor: text("borderColor"),
  stropheId: integer("stropheId"),
  expanded: boolean("expanded"),
});

export const stanzaStyling = pgTable("stanzaStyling", {
  id: text("id").primaryKey(),
  studyId: text("studyId"),
  expanded: boolean("expanded"),
  stanzaId: integer("stanzaId"),
});

export type StudyRecord = InferSelectModel<typeof study>;
export type StepbibleTbeshRecord = InferSelectModel<typeof stepbibleTbesh>;
export type HebBibleGenesisAndPsalmsRecord = InferSelectModel<
  typeof hebBibleGenesisAndPsalms
>;
