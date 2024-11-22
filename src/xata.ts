// Generated by Xata Codegen 0.28.4. Please do not edit.
import { buildClient } from "@xata.io/client";
import type {
  BaseClientOptions,
  SchemaInference,
  XataRecord,
} from "@xata.io/client";

const tables = [
  {
    name: "study",
    columns: [
      { name: "name", type: "string", notNull: true, defaultValue: "Untitled" },
      { name: "owner", type: "string" },
      { name: "public", type: "bool", defaultValue: "false" },
      { name: "starred", type: "bool", defaultValue: "false" },
      { name: "passage", type: "text", notNull: true, defaultValue: "1" },
      { name: "model", type: "bool", defaultValue: "false" },
    ],
    revLinks: [
      { column: "studyId", table: "styling" },
      { column: "studyId", table: "stropheStyling" },
      { column: "studyId", table: "stanzaStyling" },
    ],
  },
  {
    name: "styling",
    columns: [
      { name: "studyId", type: "link", link: { table: "study" } },
      { name: "colorFill", type: "string" },
      { name: "borderColor", type: "string" },
      { name: "textColor", type: "string" },
      { name: "hebId", type: "int", notNull: true, defaultValue: "0" },
      { name: "numIndent", type: "int", defaultValue: "0" },
      { name: "indented", type: "bool", defaultValue: "false" },
      { name: "stropheDiv", type: "bool" },
      { name: "lineBreak", type: "bool" },
      { name: "stanzaDiv", type: "bool" },
    ],
  },
  {
    name: "heb_bible_bsb_old2",
    columns: [
      { name: "hebId", type: "int" },
      { name: "book", type: "string" },
      { name: "chapter", type: "int" },
      { name: "verse", type: "int" },
      { name: "wlcWord", type: "string" },
      { name: "hebUnicode", type: "string" },
      { name: "strongNumber", type: "float" },
      { name: "gloss", type: "string" },
      { name: "morphology", type: "string" },
      { name: "WLCsort", type: "int" },
      { name: "poetryMarker", type: "bool" },
      { name: "paragraphMarker", type: "bool" },
      { name: "verseBreak", type: "bool" },
      { name: "BSBnewStanza", type: "bool" },
      {
        name: "stropheBreak",
        type: "bool",
        notNull: true,
        defaultValue: "false",
      },
    ],
  },
  {
    name: "stropheStyling",
    columns: [
      { name: "studyId", type: "link", link: { table: "study" } },
      { name: "colorFill", type: "text" },
      { name: "borderColor", type: "text" },
      { name: "stropheId", type: "int", notNull: true, defaultValue: "0" },
      { name: "expanded", type: "bool", defaultValue: "true" },
    ],
  },
  {
    name: "stanzaStyling",
    columns: [
      { name: "studyId", type: "link", link: { table: "study" } },
      { name: "expanded", type: "bool" },
      { name: "stanzaId", type: "int", notNull: true, defaultValue: "0" },
    ],
  },
  {
    name: "heb_bible_old",
    columns: [
      { name: "hebId", type: "int" },
      { name: "hebUnicode", type: "string" },
      { name: "book", type: "string" },
      { name: "chapter", type: "int" },
      { name: "verse", type: "int" },
      { name: "strongNumber", type: "float" },
      { name: "wlcWord", type: "string" },
      { name: "gloss", type: "string" },
      { name: "WLCsort", type: "int" },
      { name: "morphology", type: "string" },
      { name: "stropheBreak", type: "bool" },
      { name: "verseBreak", type: "bool" },
      { name: "poetryMarker", type: "bool" },
      { name: "paragraphMarker", type: "bool" },
      { name: "BSBnewStanza", type: "bool" },
      { name: "ETCBCgloss", type: "string" },
    ],
  },
  {
    name: "heb_bible",
    columns: [
      { name: "hebId", type: "int" },
      { name: "book", type: "string" },
      { name: "chapter", type: "int" },
      { name: "verse", type: "int" },
      { name: "wlcWord", type: "string" },
      { name: "hebUnicode", type: "string" },
      { name: "strongNumber", type: "float" },
      { name: "gloss", type: "string" },
      { name: "morphology", type: "string" },
      { name: "WLCsort", type: "int" },
      { name: "poetryMarker", type: "bool" },
      { name: "paragraphMarker", type: "bool" },
      { name: "xatacreatedAt", type: "datetime" },
      { name: "xataupdatedAt", type: "datetime" },
      { name: "xataversion", type: "int" },
      { name: "stropheBreak", type: "bool" },
      { name: "verseBreak", type: "bool" },
      { name: "BSBnewStanza", type: "bool" },
      { name: "ETCBCgloss", type: "string" },
      { name: "HebSort", type: "float" },
      { name: "BSBSort", type: "float" },
      { name: "Vs", type: "float" },
      { name: "BSBVersion", type: "string" },
      { name: "mergecolumn", type: "float" },
      { name: "BSBnewLine", type: "bool" },
      { name: "motifLink", type: "link", link: { table: "motif" } },
    ],
  },
  {
    name: "motif",
    columns: [
      { name: "strongCode", type: "int" },
      { name: "categories", type: "multiple" },
      { name: "rootLink", type: "link", link: { table: "lexicon" } },
    ],
    revLinks: [{ column: "motifLink", table: "heb_bible" }],
  },
  {
    name: "lexicon",
    columns: [
      { name: "gloss", type: "text" },
      { name: "lemma", type: "text" },
    ],
    revLinks: [{ column: "rootLink", table: "motif" }],
  },
] as const;

export type SchemaTables = typeof tables;
export type InferredTypes = SchemaInference<SchemaTables>;

export type Study = InferredTypes["study"];
export type StudyRecord = Study & XataRecord;

export type Styling = InferredTypes["styling"];
export type StylingRecord = Styling & XataRecord;

export type HebBibleBsbOld2 = InferredTypes["heb_bible_bsb_old2"];
export type HebBibleBsbOld2Record = HebBibleBsbOld2 & XataRecord;

export type StropheStyling = InferredTypes["stropheStyling"];
export type StropheStylingRecord = StropheStyling & XataRecord;

export type StanzaStyling = InferredTypes["stanzaStyling"];
export type StanzaStylingRecord = StanzaStyling & XataRecord;

export type HebBibleOld = InferredTypes["heb_bible_old"];
export type HebBibleOldRecord = HebBibleOld & XataRecord;

export type HebBible = InferredTypes["heb_bible"];
export type HebBibleRecord = HebBible & XataRecord;

export type Motif = InferredTypes["motif"];
export type MotifRecord = Motif & XataRecord;

export type Lexicon = InferredTypes["lexicon"];
export type LexiconRecord = Lexicon & XataRecord;

export type DatabaseSchema = {
  study: StudyRecord;
  styling: StylingRecord;
  heb_bible_bsb_old2: HebBibleBsbOld2Record;
  stropheStyling: StropheStylingRecord;
  stanzaStyling: StanzaStylingRecord;
  heb_bible_old: HebBibleOldRecord;
  heb_bible: HebBibleRecord;
  motif: MotifRecord;
  lexicon: LexiconRecord;
};

const DatabaseClient = buildClient();

const defaultOptions = {
  databaseURL:
    "https://BiblePoetry-s-workspace-ab123i.us-east-1.xata.sh/db/main",
};

export class XataClient extends DatabaseClient<DatabaseSchema> {
  constructor(options?: BaseClientOptions) {
    super({ ...defaultOptions, ...options }, tables);
  }
}

let instance: XataClient | undefined = undefined;

export const getXataClient = () => {
  if (instance) return instance;

  instance = new XataClient();
  return instance;
};
