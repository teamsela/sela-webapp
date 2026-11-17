/**
 * Pausal-forms catalogue: parsing, per-psalm verse alignment, and word matching.
 *
 * A *pausal form* is a word whose vowels/stress shift because it sits at a major
 * prosodic break, marked in the Masoretic system by a specific disjunctive (or,
 * occasionally, conjunctive) accent. The catalogue (embedded in
 * `@/lib/pausalFormsData`) records, per verse, WHICH accent marks the pausal
 * form(s). Highlighting "the word bearing accent X in verse Y" is what locates
 * the pausal form on screen.
 *
 * This module is deliberately pure (no fetch / no React) so it can be unit-tested
 * directly. It sits on top of `scanAccents` in `@/lib/poeticAccents` — the same
 * detector that powers "Accents in Poetry". Matching keys off the scan's *claimed
 * marks* (`spans[id][].claims`), so a word lights up only when it actually carries
 * a mark of the accent — a maqqef "leaner" that carries no mark of its own does
 * not, exactly as in the accent panel.
 */

import type { AccentOccurrence } from "@/lib/poeticAccents";

/** Catalogue keyed by `"chapter:verse"` (Masoretic) → set of detector accent ids. */
export type PausalCatalogue = Map<string, Set<string>>;

/** Minimal token shape: only the verse coordinates are read. */
export type PausalToken = { chapter: number; verse: number };

/** Per-pattern occurrence lists, as produced by `scanAccents` (`ScanResult.spans`). */
export type AccentSpans = Record<string, AccentOccurrence[]>;

/**
 * Accent NAME as written in `pausal_forms.txt` → detector id emitted by
 * `scanAccents` (see ACCENT_REGISTRY in @/lib/poeticAccents). These are the 12
 * names that actually occur in the catalogue; every one maps to a real id.
 */
export const PAUSAL_NAME_TO_ID: Readonly<Record<string, string>> = {
  Etnachta: "etnachta",
  "Sof Pasuq": "sof-pasuq",
  "Ole VeYored": "ole-veyored",
  Revia: "revia",
  "Revia Mugrash": "revia-mugrash",
  Dechi: "dechi",
  Munach: "munach",
  Merkha: "merkha",
  "Azla Legarmeh": "azla-legarmeh",
  Pazer: "pazer",
  Tsinnor: "tsinnor",
  Tarcha: "tarcha",
};

// `Ps <chapter>:<verse> <Accent Name>` with optional trailing editorial markers
// (* notable, ? uncertain, ! emphatic) which are stripped for matching.
const LINE_RE = /^Ps\s+(\d+):(\d+)\s+([A-Za-z][A-Za-z ]+?)[*?!]*\s*$/;

/** Parse the raw catalogue text into `"ch:verse" → Set(accentId)`. */
export function parsePausalCatalogue(text: string): PausalCatalogue {
  const catalogue: PausalCatalogue = new Map();
  for (const raw of text.split("\n")) {
    const match = LINE_RE.exec(raw.trim());
    if (!match) {
      continue;
    }
    const id = PAUSAL_NAME_TO_ID[match[3].trim()];
    if (!id) {
      continue; // unmapped name → skip
    }
    const key = `${Number(match[1])}:${Number(match[2])}`;
    let set = catalogue.get(key);
    if (!set) {
      catalogue.set(key, (set = new Set<string>()));
    }
    set.add(id);
  }
  return catalogue;
}

// Masoretic numbering counts a psalm's superscription as verse 1, so many
// digital texts run 0–2 verses behind. The shift is per-psalm and not derivable
// from superscription length, so we probe these candidate offsets and pick the
// one that best matches the accents the detector actually found.
const OFFSET_CANDIDATES = [0, 1, 2, 3] as const;

/** The reading verse an occurrence resolves in (all its marks share one verse). */
const occurrenceToken = (tokens: PausalToken[], occ: AccentOccurrence): PausalToken | undefined =>
  occ.claims && occ.claims.length ? tokens[occ.claims[0].t] : undefined;

/** Accents the detector found, unioned per app verse (`"chapter:verse"`). */
const detectedAccentsByVerse = (
  tokens: PausalToken[],
  spans: AccentSpans,
): Map<string, Set<string>> => {
  const byVerse = new Map<string, Set<string>>();
  for (const [id, occurrences] of Object.entries(spans)) {
    for (const occ of occurrences) {
      const token = occurrenceToken(tokens, occ);
      if (!token) {
        continue;
      }
      const key = `${token.chapter}:${token.verse}`;
      let set = byVerse.get(key);
      if (!set) {
        byVerse.set(key, (set = new Set<string>()));
      }
      set.add(id);
    }
  }
  return byVerse;
};

/**
 * Per-psalm verse-alignment offset detection (spec §6).
 *
 * For each chapter, choose the offset whose catalogue accents best match the
 * accents detected in the app text. Distinctive disjunctives (Revia, Pazer,
 * Dechi, Ole VeYored, Tsinnor) make the true offset win clearly; sparse verses
 * tie and fall back to offset 0 (correct for unshifted psalms). Ties keep the
 * SMALLER offset via the strict `>` comparison.
 *
 * Returns a map of `chapter → offset`; only non-zero offsets are recorded.
 */
export function computePsalmOffsets(
  tokens: PausalToken[],
  spans: AccentSpans,
  catalogue: PausalCatalogue,
): Map<number, number> {
  const offsetOf = new Map<number, number>();
  const appAcc = detectedAccentsByVerse(tokens, spans);

  // Catalogue entries grouped by chapter as [verse, accentId] pairs.
  const catByChapter = new Map<number, Array<[number, string]>>();
  for (const [key, ids] of catalogue) {
    const [chapter, verse] = key.split(":").map(Number);
    let arr = catByChapter.get(chapter);
    if (!arr) {
      catByChapter.set(chapter, (arr = []));
    }
    ids.forEach((id) => arr!.push([verse, id]));
  }

  for (const chapter of new Set(tokens.map((token) => token.chapter))) {
    const entries = catByChapter.get(chapter);
    if (!entries) {
      continue;
    }
    let bestOffset = 0;
    let bestHits = -1;
    for (const offset of OFFSET_CANDIDATES) {
      let hits = 0;
      for (const [verse, id] of entries) {
        const set = appAcc.get(`${chapter}:${verse - offset}`);
        if (set && set.has(id)) {
          hits += 1;
        }
      }
      if (hits > bestHits) {
        bestHits = hits;
        bestOffset = offset;
      }
    }
    if (bestOffset) {
      offsetOf.set(chapter, bestOffset);
    }
  }

  return offsetOf;
}

/**
 * Token indices (into `tokens`) of every word that carries a mark of a catalogued
 * pausal accent for its offset-corrected verse (spec §5), plus the offsets used.
 *
 * Selection keys off the claimed marks of each accent occurrence, so both words
 * of a cross-word compound (e.g. an Ole VeYored spanning two words) light up,
 * while a maqqef "leaner" carrying no mark of its own does not.
 */
export function selectPausalTokens(
  tokens: PausalToken[],
  spans: AccentSpans,
  catalogue: PausalCatalogue,
  offsets: Map<number, number> = computePsalmOffsets(tokens, spans, catalogue),
): { indices: number[]; offsets: Map<number, number> } {
  const selected = new Set<number>();
  for (const [id, occurrences] of Object.entries(spans)) {
    for (const occ of occurrences) {
      const token = occurrenceToken(tokens, occ);
      if (!token) {
        continue;
      }
      const offset = offsets.get(token.chapter) ?? 0;
      const accents = catalogue.get(`${token.chapter}:${token.verse + offset}`);
      if (accents && accents.has(id)) {
        occ.claims.forEach((claim) => selected.add(claim.t));
      }
    }
  }
  return { indices: Array.from(selected).sort((a, b) => a - b), offsets };
}
