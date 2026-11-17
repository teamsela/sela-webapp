// Pure, dependency-free rich-text helpers shared by the client editor and the
// server-side API route. Intentionally NO React/Tiptap imports here so the
// `/api/noteSync` route can validate untrusted input without pulling the editor
// (or its browser-only deps) into the server bundle.
//
// The security model has three layers:
//   1. The editor's schema (Tiptap) only ever *produces* the nodes/marks below.
//   2. `sanitizeRichDoc` re-validates on the server — the client is untrusted.
//   3. Attribute *values* (colors, font sizes) are allow-listed, not just tags,
//      which blocks CSS-based vectors (url(), expression(), etc.).

export type RichMark = { type: string; attrs?: Record<string, unknown> };
export type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: RichMark[];
  content?: RichNode[];
  text?: string;
};
export type RichDoc = { type: "doc"; content: RichNode[] };

/** Bumped when the stored notes shape changes; lets us migrate lazily on read. */
export const RICH_TEXT_VERSION = 2;

/** Font sizes offered in the toolbar AND accepted by the sanitizer. */
export const FONT_SIZE_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Small", value: "0.875rem" },
  { label: "Normal", value: "1rem" },
  { label: "Large", value: "1.25rem" },
  { label: "Huge", value: "1.75rem" },
];
const ALLOWED_FONT_SIZES = new Set(FONT_SIZE_OPTIONS.map((o) => o.value));

/** Curated palettes (hex values mirror the app swatch palette in colors.ts). */
export const TEXT_COLOR_PALETTE: readonly string[] = [
  "#000000", "#525252", "#F44336", "#E91E63", "#9C27B0", "#673AB7",
  "#2196F3", "#00BCD4", "#009688", "#4CAF50", "#FF9800", "#795548",
];
export const HIGHLIGHT_PALETTE: readonly string[] = [
  "#FFF176", "#FFCDD2", "#F8BBD0", "#E1BEE7", "#C5CAE9", "#BBDEFB",
  "#B2EBF2", "#C8E6C9", "#FFECB3", "#FFCCBC",
];

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Return a normalized `#RRGGBB` string, or null if `value` is not a plain hex
 * color. Rejecting anything non-hex is what blocks CSS-injection via color attrs.
 */
export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!HEX_COLOR.test(v)) return null;
  let digits = v.slice(1);
  if (digits.length === 3) {
    digits = digits.split("").map((c) => c + c).join("");
  }
  return `#${digits.toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Shape guards & migration
// ---------------------------------------------------------------------------

export function isRichDoc(value: unknown): value is RichDoc {
  return (
    !!value &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "doc"
  );
}

/** Convert legacy plain-text notes into a ProseMirror doc (one paragraph per line). */
export function plainTextToDoc(text: string): RichDoc {
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
  const content: RichNode[] = lines.map((line) =>
    line.length
      ? { type: "paragraph", content: [{ type: "text", text: line }] }
      : { type: "paragraph" },
  );
  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

/** Coerce a stored value (doc | legacy string | undefined) into a doc for the editor. */
export function toRichDoc(value: unknown): RichDoc {
  if (isRichDoc(value)) return value;
  if (typeof value === "string") return plainTextToDoc(value);
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/**
 * Concatenate several note bodies (docs or legacy strings) into one doc — used
 * when strophes/stanzas merge and their notes must be combined.
 */
export function mergeRichDocs(bodies: Array<RichDoc | string | undefined>): RichDoc {
  const content = bodies
    .map(toRichDoc)
    .flatMap((d) => (Array.isArray(d.content) ? d.content : []));
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/** Concatenate every descendant text node of a rich node into a plain string. */
function nodeText(node: RichNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  if (Array.isArray(node.content)) return node.content.map(nodeText).join("");
  return "";
}

/**
 * Plain text of the first block of a note — used as the strophe "title" so it can
 * be shown on the strophe when the note pane is closed. `title` is the first line
 * of the combined note body, derived programmatically (not a separate field).
 */
export function firstLineText(doc: RichDoc | string | undefined): string {
  const d = toRichDoc(doc);
  return nodeText(d.content[0]).trim();
}

/**
 * Build the combined note doc from a (possibly legacy) separate title + body:
 * if the body doesn't already lead with the title line, prepend it. This lets a
 * legacy `{title, text}` pair round-trip into one editor where line 1 is the title.
 */
export function combineNoteDoc(title: string | undefined, text: unknown): RichDoc {
  const body = toRichDoc(text);
  const t = (typeof title === "string" ? title : "").trim();
  if (!t) return body;
  if (firstLineText(body) === t) return body;
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: t }] }, ...body.content],
  };
}

// ---------------------------------------------------------------------------
// Sanitizer — the server-side allow-list gate
// ---------------------------------------------------------------------------

const ALLOWED_NODES = new Set([
  "doc", "paragraph", "text", "hardBreak", "bulletList", "orderedList", "listItem",
]);
const ALLOWED_MARKS = new Set(["bold", "italic", "strike", "textStyle", "highlight"]);

const MAX_DEPTH = 30;
const MAX_TEXT_LEN = 20_000;

function sanitizeMark(mark: unknown): RichMark | null {
  if (!mark || typeof mark !== "object") return null;
  const m = mark as RichMark;
  if (typeof m.type !== "string" || !ALLOWED_MARKS.has(m.type)) return null;

  if (m.type === "textStyle") {
    const attrs: Record<string, string> = {};
    const color = normalizeHexColor((m.attrs as { color?: unknown } | undefined)?.color);
    if (color) attrs.color = color;
    const fontSize = (m.attrs as { fontSize?: unknown } | undefined)?.fontSize;
    if (typeof fontSize === "string" && ALLOWED_FONT_SIZES.has(fontSize)) {
      attrs.fontSize = fontSize;
    }
    // A textStyle mark with no valid attrs carries no meaning — drop it.
    return Object.keys(attrs).length ? { type: "textStyle", attrs } : null;
  }

  if (m.type === "highlight") {
    const color = normalizeHexColor((m.attrs as { color?: unknown } | undefined)?.color);
    return color ? { type: "highlight", attrs: { color } } : { type: "highlight" };
  }

  // bold / italic / strike — no attributes to keep.
  return { type: m.type };
}

function sanitizeNode(node: unknown, depth: number): RichNode | null {
  if (depth > MAX_DEPTH || !node || typeof node !== "object") return null;
  const n = node as RichNode;
  if (typeof n.type !== "string" || !ALLOWED_NODES.has(n.type)) return null;

  const clean: RichNode = { type: n.type };

  if (n.type === "text") {
    if (typeof n.text !== "string" || n.text.length === 0) return null;
    clean.text = n.text.slice(0, MAX_TEXT_LEN);
  }

  if (Array.isArray(n.marks)) {
    const marks = n.marks
      .map(sanitizeMark)
      .filter((x): x is RichMark => x !== null);
    if (marks.length) clean.marks = marks;
  }

  if (Array.isArray(n.content)) {
    const content = n.content
      .map((c) => sanitizeNode(c, depth + 1))
      .filter((x): x is RichNode => x !== null);
    if (content.length) clean.content = content;
  }

  return clean;
}

/** Sanitize an untrusted doc against the node/mark/attr allow-list. Never throws. */
export function sanitizeRichDoc(input: unknown): RichDoc {
  if (typeof input === "string") return plainTextToDoc(input);
  if (!isRichDoc(input)) return { type: "doc", content: [{ type: "paragraph" }] };
  const content = (Array.isArray(input.content) ? input.content : [])
    .map((c) => sanitizeNode(c, 0))
    .filter((x): x is RichNode => x !== null);
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

// ---------------------------------------------------------------------------
// Whole-payload sanitizer used by the API route
// ---------------------------------------------------------------------------

const MAX_STRING_FIELD = 20_000;
const MAX_STROPHES = 2_000;

function capString(v: unknown): string {
  return typeof v === "string" ? v.slice(0, MAX_STRING_FIELD) : "";
}

function toInt(v: unknown, fallback = -1): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;
}

/**
 * Parse and sanitize the full `StudyNotes` JSON string that arrives at the API.
 * Throws on unparseable / wrong-shape input so the route can return 400.
 * `main` may be a rich doc (sanitized) or legacy plain text (length-capped).
 * Per-strophe notes remain plain text in this prototype (rendered as escaped
 * text), so they are only length-capped.
 */
function sanitizeStropheNote(entry: unknown) {
  const e = (entry ?? {}) as Record<string, unknown>;
  const text =
    e.text && typeof e.text === "object"
      ? sanitizeRichDoc(e.text)
      : capString(e.text);
  const title =
    typeof text === "object"
      ? capString(firstLineText(text)).replace(/[\r\n]+/g, " ")
      : capString(e.title).replace(/[\r\n]+/g, " ");
  return {
    title,
    text,
    firstWordId: toInt(e.firstWordId),
    lastWordId: toInt(e.lastWordId),
  };
}

function sanitizeStropheArray(arr: unknown): Record<string, unknown>[] {
  const input = Array.isArray(arr) ? arr : [];
  return input.slice(0, MAX_STROPHES).map(sanitizeStropheNote);
}

/**
 * Sanitize a rich-text doc or legacy string value (used for layerNotes entries).
 */
function sanitizeLayerNoteValue(value: unknown): string | RichDoc {
  return typeof value === "string" ? capString(value) : sanitizeRichDoc(value);
}

export function sanitizeStudyNotes(raw: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid notes JSON");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid notes shape");
  }

  const obj = parsed as Record<string, unknown>;

  const main =
    typeof obj.main === "string" ? capString(obj.main) : sanitizeRichDoc(obj.main);

  // Root-level strophes (legacy / layer-0 fallback).
  const strophes = sanitizeStropheArray(obj.strophes);

  // Per-layer main notes keyed by layer id string.
  const layerNotesRaw = obj.layerNotes as Record<string, unknown> | undefined;
  const layerNotes: Record<string, string | RichDoc> = {};
  if (layerNotesRaw && typeof layerNotesRaw === "object") {
    for (const [key, value] of Object.entries(layerNotesRaw)) {
      layerNotes[key] = sanitizeLayerNoteValue(value);
    }
  }

  // Per-layer strophe notes keyed by layer id string.
  const layerStrophesRaw = obj.layerStrophes as Record<string, unknown[]> | undefined;
  const layerStrophes: Record<string, Record<string, unknown>[]> = {};
  if (layerStrophesRaw && typeof layerStrophesRaw === "object") {
    for (const [key, arr] of Object.entries(layerStrophesRaw)) {
      const sanitized = sanitizeStropheArray(arr);
      if (sanitized.length > 0) {
        layerStrophes[key] = sanitized;
      }
    }
  }

  const result: Record<string, unknown> = {
    version: RICH_TEXT_VERSION,
    main,
    strophes,
  };
  if (Object.keys(layerNotes).length > 0) {
    result.layerNotes = layerNotes;
  }
  if (Object.keys(layerStrophes).length > 0) {
    result.layerStrophes = layerStrophes;
  }

  return JSON.stringify(result);
}
