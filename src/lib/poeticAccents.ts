/**
 * Hebrew poetic accent (te'amim) scanner.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CLAIM-BASED SCANNER
 * ────────────────────────────────────────────────────────────────────────────
 * Many poetic accents share component marks (the Qadma of an Azla Legarmeh is
 * the same codepoint as a bare Azla; the Merkha of an Ole VeYored is the same
 * codepoint as the Merkha of a Sinnorit Merkha; every Legarmeh ends in the same
 * Paseq bar; a Dechi followed by a Munach/Merkha/Revia absorbs that mark). The
 * scanner therefore works by *claims*:
 *
 *   1. Every occurrence names the exact mark positions (token index + char
 *      index) it consumes.
 *   2. Scan passes run in a fixed order (see SCAN_PASSES). Once a pass claims a
 *      mark, later passes see it as taken.
 *   3. Fall-through cases (bare conjunctives) run last and pick up only the
 *      marks no compound claimed.
 *   4. `emit()` is atomic: it refuses if ANY of the marks it would claim is
 *      already taken — guaranteeing no double counting.
 *
 * A "prosodic word" is one or more tokens joined by maqqef (U+05BE). Compounds
 * that span "two adjacent words" span two adjacent prosodic words in the same
 * verse and never cross a verse/chapter boundary.
 */

/** A word in reading (verse) order. Only these fields are read. */
export type AccentToken = {
  /** Pointed Hebrew for the word, including accent marks / maqqef / paseq. */
  hebrew: string;
  /** Chapter — used for verse-boundary detection. */
  chapter: number;
  /** Verse — compared by equality. */
  verse: number | string;
};

/** Disjunctive level; `null` marks a conjunctive accent. */
export type AccentLevel = 1 | 2 | 3 | 4;

/** Position of a single consumed mark: token index + char index in the token. */
export type MarkPos = { t: number; i: number };

/** One accent occurrence (a two-word accent still counts once). */
export type AccentOccurrence = {
  /** Earlier word(s) of a multi-word accent (rendered underlined). */
  lead: number[];
  /** Word the accent resolves on (rendered highlighted). */
  head: number[];
  /** Mark positions consumed by this occurrence. */
  claims: MarkPos[];
};

export type ScanResult = {
  /** Per token: accent ids that HIGHLIGHT it (head word), strongest first. */
  ids: string[][];
  /** Per token: accent ids that UNDERLINE it (lead word), strongest first. */
  underIds: string[][];
  /** Per-pattern occurrence counts (a two-word accent counts once). */
  counts: Record<string, number>;
  /** Per-pattern list of occurrences. */
  spans: Record<string, AccentOccurrence[]>;
};

export type AccentDefinition = {
  /** Stable kebab-case identifier. */
  id: string;
  /** Human label (used by the panel / debugging). */
  label: string;
  /** Disjunctive level 1–4, or `null` for a conjunctive. */
  level: AccentLevel | null;
};

/** Hebrew accent codepoints referenced by the spec. */
export const ACCENT_CODEPOINTS: Record<string, number> = {
  ETNACHTA: 0x0591,
  SHALSHELET: 0x0593,
  TARCHA: 0x0596, // HEBREW ACCENT TIPEHA
  REVIA: 0x0597,
  TSINNORIT: 0x0598, // HEBREW ACCENT ZARQA (Sinnorit)
  GERESH: 0x059c,
  GERESH_MUQDAM: 0x059d,
  PAZER: 0x05a1,
  MUNACH: 0x05a3,
  MAHAPAKH: 0x05a4,
  MERKHA: 0x05a5,
  QADMA: 0x05a8, // Azla
  GALGAL: 0x05aa,
  OLE: 0x05ab,
  ILUY: 0x05ac,
  DEHI: 0x05ad, // Dechi
  ZINOR: 0x05ae, // Tsinnor
  METEG: 0x05bd, // Silluq — ambiguous, not classified
  MAQQEF: 0x05be, // prosodic-word joiner, not an accent
  PASEQ: 0x05c0,
  SOF_PASUQ: 0x05c3,
};

const CP = ACCENT_CODEPOINTS;

/**
 * Accent registry, ordered STRONGEST → weakest (Level 1 … Level 4, then the
 * conjunctives). Registry order is the tie-break for "render a word by its
 * strongest accent": a token's category is the level of the first id listed
 * for it after sorting by this order.
 */
export const ACCENT_REGISTRY: readonly AccentDefinition[] = [
  // ── Level 1 ──────────────────────────────────────────────────────────────
  { id: "sof-pasuq", label: "Sof Pasuq", level: 1 },
  // ── Level 2 ──────────────────────────────────────────────────────────────
  { id: "etnachta", label: "Etnachta", level: 2 },
  { id: "revia-mugrash", label: "Revia Mugrash", level: 2 },
  { id: "geresh", label: "Geresh", level: 2 },
  { id: "ole-veyored", label: "Ole VeYored", level: 2 },
  { id: "shalshelet-gedolah", label: "Shalshelet Gedolah", level: 2 },
  { id: "azla-illuy", label: "Azla Illuy", level: 2 },
  { id: "illuy-illuy", label: "Illuy Illuy", level: 2 },
  { id: "tarcha-munach", label: "Tarcha Munach", level: 2 },
  // ── Level 3 ──────────────────────────────────────────────────────────────
  { id: "tsinnor", label: "Tsinnor", level: 3 },
  { id: "dechi", label: "Dechi", level: 3 },
  { id: "sinnorit-merkha", label: "Sinnorit Merkha", level: 3 },
  { id: "azla-tarcha", label: "Azla Tarcha", level: 3 },
  { id: "munach-munach", label: "Munach Munach", level: 3 },
  // ── Level 4 ──────────────────────────────────────────────────────────────
  { id: "pazer", label: "Pazer", level: 4 },
  { id: "azla-legarmeh", label: "Azla Legarmeh", level: 4 },
  { id: "mahpakh-legarmeh", label: "Mahpakh Legarmeh", level: 4 },
  // ── Conjunctives (level null) ─────────────────────────────────────────────
  { id: "sinnorit-mahpakh", label: "Sinnorit Mahpakh", level: null },
  { id: "munach", label: "Munach", level: null },
  { id: "merkha", label: "Merkha", level: null },
  { id: "tarcha", label: "Tarcha", level: null },
  { id: "azla", label: "Azla", level: null },
  { id: "mahpakh", label: "Mahpakh", level: null },
  { id: "illuy", label: "Illuy", level: null },
  { id: "sinnorit", label: "Sinnorit", level: null },
  { id: "ole", label: "Ole", level: null },
  { id: "shalshelet", label: "Shalshelet", level: null },
  { id: "galgal", label: "Galgal", level: null },
  { id: "paseq", label: "Paseq", level: null },
];

const REGISTRY_ORDER = new Map(ACCENT_REGISTRY.map((accent, index) => [accent.id, index]));
const LEVEL_BY_ID = new Map(ACCENT_REGISTRY.map((accent) => [accent.id, accent.level]));

/** Level (1–4) of an accent id, or `null` if it is a conjunctive / unknown. */
export const getAccentLevel = (id: string): AccentLevel | null => LEVEL_BY_ID.get(id) ?? null;

/**
 * The strongest category for a token given its sorted `ids` list:
 * a disjunctive level (1–4), `"conjunctive"`, or `null` when it has no accent.
 */
export type TokenCategory = AccentLevel | "conjunctive" | null;

export const tokenCategory = (idsForToken: string[]): TokenCategory => {
  if (!idsForToken.length) {
    return null;
  }
  // ids are pre-sorted strongest-first, and every disjunctive sorts before
  // every conjunctive, so the first id decides the category.
  return getAccentLevel(idsForToken[0]) ?? "conjunctive";
};

const sortByRegistry = (list: string[]): string[] =>
  list.sort((a, b) => (REGISTRY_ORDER.get(a) ?? Infinity) - (REGISTRY_ORDER.get(b) ?? Infinity));

// ════════════════════════════════════════════════════════════════════════════
// scanAccents — the ordered, claim-based pipeline.
// ════════════════════════════════════════════════════════════════════════════

export function scanAccents(tokens: AccentToken[]): ScanResult {
  const spans: Record<string, AccentOccurrence[]> = {};
  ACCENT_REGISTRY.forEach((accent) => {
    spans[accent.id] = [];
  });

  // ── Claimed marks ─────────────────────────────────────────────────────────
  const used = new Set<string>();
  const keyOf = (m: MarkPos): string => `${m.t}:${m.i}`;
  const isFree = (m: MarkPos): boolean => !used.has(keyOf(m));

  /** Atomic emit: refuses if empty or if any claimed mark is already taken. */
  const emit = (id: string, lead: number[], head: number[], claims: MarkPos[]): boolean => {
    if (claims.length === 0) return false;
    for (const c of claims) {
      if (used.has(keyOf(c))) return false;
    }
    for (const c of claims) used.add(keyOf(c));
    spans[id].push({ lead, head, claims });
    return true;
  };

  // ── Prosodic words ──────────────────────────────────────────────────────
  // Group consecutive tokens where a token whose trimmed text ends with maqqef
  // joins the following token — never crossing a verse boundary.
  const trimmed = (t: number): string => (tokens[t]?.hebrew ?? "").trim();
  const sameVerseTokens = (a: number, b: number): boolean =>
    tokens[a].chapter === tokens[b].chapter && tokens[a].verse === tokens[b].verse;
  const endsWith = (t: number, cp: number): boolean => {
    const s = trimmed(t);
    return s.length > 0 && s.charCodeAt(s.length - 1) === cp;
  };

  const prosodicWords: number[][] = [];
  const wordOfToken: number[] = new Array(tokens.length).fill(-1);
  {
    let i = 0;
    while (i < tokens.length) {
      const group = [i];
      let last = i;
      while (
        endsWith(last, CP.MAQQEF) &&
        last + 1 < tokens.length &&
        sameVerseTokens(last, last + 1)
      ) {
        last += 1;
        group.push(last);
      }
      const w = prosodicWords.length;
      group.forEach((tok) => (wordOfToken[tok] = w));
      prosodicWords.push(group);
      i = last + 1;
    }
  }

  const wordTokens = (w: number): number[] => prosodicWords[w];
  const wordTokensOfToken = (t: number): number[] => prosodicWords[wordOfToken[t]];
  const wordVerseToken = (w: number): number => prosodicWords[w][0];

  /** Next prosodic word in the SAME verse, or null. */
  const nextWordSameVerse = (w: number): number | null => {
    const next = w + 1;
    if (next >= prosodicWords.length) return null;
    return sameVerseTokens(wordVerseToken(w), wordVerseToken(next)) ? next : null;
  };

  // ── Mark helpers ──────────────────────────────────────────────────────────
  const posCmp = (a: MarkPos, b: MarkPos): number => (a.t !== b.t ? a.t - b.t : a.i - b.i);
  const posLess = (a: MarkPos, b: MarkPos): boolean => posCmp(a, b) < 0;

  /** Char indices of a codepoint within a single token. */
  const marksInToken = (t: number, cp: number): number[] => {
    const s = tokens[t]?.hebrew ?? "";
    const out: number[] = [];
    for (let i = 0; i < s.length; i++) {
      if (s.charCodeAt(i) === cp) out.push(i);
    }
    return out;
  };

  /** All positions of a codepoint within a prosodic word, in reading order. */
  const marksInWord = (w: number, cp: number): MarkPos[] => {
    const out: MarkPos[] = [];
    for (const t of prosodicWords[w]) {
      for (const i of marksInToken(t, cp)) out.push({ t, i });
    }
    return out;
  };

  const freeMarksInWord = (w: number, cp: number): MarkPos[] =>
    marksInWord(w, cp).filter(isFree);

  /**
   * Position of a word-final Paseq of a prosodic word (last token, trailing
   * whitespace tolerated), or null.
   */
  const wordFinalPaseqPos = (w: number): MarkPos | null => {
    const t = prosodicWords[w][prosodicWords[w].length - 1];
    const s = tokens[t]?.hebrew ?? "";
    let end = s.length;
    while (end > 0 && /\s/.test(s[end - 1])) end -= 1;
    if (end > 0 && s.charCodeAt(end - 1) === CP.PASEQ) return { t, i: end - 1 };
    return null;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Generic pass builders
  // ══════════════════════════════════════════════════════════════════════════

  /** Single-mark accent: each free occurrence of `cp` becomes one occurrence. */
  const bareScan = (id: string, cp: number): void => {
    for (let t = 0; t < tokens.length; t++) {
      for (const i of marksInToken(t, cp)) {
        const pos = { t, i };
        if (isFree(pos)) emit(id, [], wordTokensOfToken(t), [pos]);
      }
    }
  };

  /**
   * Two-mark accent over the same or the immediately-next word in the verse.
   * Claims left-to-right; on the same word the second mark must follow the
   * first. When `sameWordOnly`, never reaches into the next word.
   */
  const pairScan = (
    id: string,
    firstCp: number,
    secondCp: number,
    opts: { sameWordOnly?: boolean } = {},
  ): void => {
    for (let w = 0; w < prosodicWords.length; w++) {
      for (const first of marksInWord(w, firstCp)) {
        if (!isFree(first)) continue;

        // Same word: earliest free `secondCp` strictly after the first mark.
        const sameWord = freeMarksInWord(w, secondCp).filter((m) => posLess(first, m));
        if (sameWord.length) {
          emit(id, [], wordTokens(w), [first, sameWord[0]]);
          continue;
        }
        if (opts.sameWordOnly) continue;

        // Next word in the same verse.
        const nw = nextWordSameVerse(w);
        if (nw === null) continue;
        const nextWord = freeMarksInWord(nw, secondCp);
        if (nextWord.length) {
          emit(id, wordTokens(w), wordTokens(nw), [first, nextWord[0]]);
        }
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Named passes (matching SCAN_PASSES order)
  // ══════════════════════════════════════════════════════════════════════════

  // Pass 3: Geresh Muqdam + Revia on the same token → Revia Mugrash.
  const scanReviaMugrash = (): void => {
    for (let t = 0; t < tokens.length; t++) {
      const muqdam = marksInToken(t, CP.GERESH_MUQDAM).map((i) => ({ t, i })).find(isFree);
      const revia = marksInToken(t, CP.REVIA).map((i) => ({ t, i })).find(isFree);
      if (muqdam && revia) {
        emit("revia-mugrash", [], wordTokensOfToken(t), [muqdam, revia]);
      }
    }
  };

  // Pass 5: Dechi, optionally absorbing a following Revia/Munach/Merkha on the
  // same word → single Dechi. Bare Dechi otherwise.
  const scanDechiAndCompounds = (): void => {
    for (let w = 0; w < prosodicWords.length; w++) {
      for (const dechi of marksInWord(w, CP.DEHI)) {
        if (!isFree(dechi)) continue;
        const following = [CP.REVIA, CP.MUNACH, CP.MERKHA]
          .flatMap((cp) => freeMarksInWord(w, cp))
          .filter((m) => posLess(dechi, m))
          .sort(posCmp)[0];
        emit("dechi", [], wordTokens(w), following ? [dechi, following] : [dechi]);
      }
    }
  };

  // Pass 8: Legarmeh family. A word-final Paseq is owned by the LAST free
  // former (Shalshelet/Qadma/Mahpakh) before it, on the Paseq's word or the
  // previous word in the verse. A Mahpakh preceded by a Tsinnorit on the same
  // word never forms a Legarmeh (that is a Sinnorit Mahpakh).
  const scanLegarmehFamily = (): void => {
    const FORMER: Record<number, string> = {
      [CP.SHALSHELET]: "shalshelet-gedolah",
      [CP.QADMA]: "azla-legarmeh",
      [CP.MAHAPAKH]: "mahpakh-legarmeh",
    };
    const mahpakhBlockedBySinnorit = (m: MarkPos): boolean =>
      // Mahpakh preceded by a free Tsinnorit on the same word.
      wordTokens(wordOfToken[m.t]).length > 0 &&
      freeMarksInWord(wordOfToken[m.t], CP.TSINNORIT).some((s) => posLess(s, m));

    for (let w = 0; w < prosodicWords.length; w++) {
      const paseq = wordFinalPaseqPos(w);
      if (!paseq || !isFree(paseq)) continue;

      const candidates: { pos: MarkPos; cp: number }[] = [];
      const prev = w - 1;
      if (prev >= 0 && sameVerseTokens(wordVerseToken(prev), wordVerseToken(w))) {
        for (const cp of [CP.SHALSHELET, CP.QADMA, CP.MAHAPAKH]) {
          for (const pos of freeMarksInWord(prev, cp)) candidates.push({ pos, cp });
        }
      }
      for (const cp of [CP.SHALSHELET, CP.QADMA, CP.MAHAPAKH]) {
        for (const pos of freeMarksInWord(w, cp)) {
          if (posLess(pos, paseq)) candidates.push({ pos, cp });
        }
      }
      candidates.sort((a, b) => posCmp(a.pos, b.pos));

      const valid = candidates.filter(
        (c) => !(c.cp === CP.MAHAPAKH && mahpakhBlockedBySinnorit(c.pos)),
      );
      if (!valid.length) continue;
      const owner = valid[valid.length - 1];

      const formerWord = wordOfToken[owner.pos.t];
      if (formerWord === w) {
        emit(FORMER[owner.cp], [], wordTokens(w), [owner.pos, paseq]);
      } else {
        emit(FORMER[owner.cp], wordTokens(formerWord), wordTokens(w), [owner.pos, paseq]);
      }
    }
  };

  // Pass 9: one-word Sinnorit Merkha (Tsinnorit before Merkha, same word)
  // followed by a word-final Paseq on the same or next word → plain Paseq.
  const scanPaseqAfterSinnoritMerkha = (): void => {
    for (let w = 0; w < prosodicWords.length; w++) {
      const tsinnorit = freeMarksInWord(w, CP.TSINNORIT)[0];
      if (!tsinnorit) continue;
      const merkha = freeMarksInWord(w, CP.MERKHA).filter((m) => posLess(tsinnorit, m))[0];
      if (!merkha) continue;

      let paseq = wordFinalPaseqPos(w);
      if (!paseq || !isFree(paseq)) {
        const nw = nextWordSameVerse(w);
        paseq = nw === null ? null : wordFinalPaseqPos(nw);
      }
      if (paseq && isFree(paseq)) {
        emit("paseq", [], wordTokens(w), [tsinnorit, merkha, paseq]);
      }
    }
  };

  // ── Assemble and run the ordered pipeline ──────────────────────────────────
  const SCAN_PASSES: Array<() => void> = [
    () => bareScan("sof-pasuq", CP.SOF_PASUQ), // 1  L1
    () => bareScan("etnachta", CP.ETNACHTA), // 2  L2
    scanReviaMugrash, // 3  L2
    () => bareScan("geresh", CP.GERESH), // 4  L2
    scanDechiAndCompounds, // 5  L3
    () => bareScan("tsinnor", CP.ZINOR), // 6  L3
    () => bareScan("pazer", CP.PAZER), // 7  L4
    scanLegarmehFamily, // 8  L2/L4
    scanPaseqAfterSinnoritMerkha, // 9  conjunctive paseq
    () => pairScan("ole-veyored", CP.OLE, CP.MERKHA, { sameWordOnly: true }), // 10 L2 (same word)
    () => pairScan("azla-illuy", CP.QADMA, CP.ILUY), // 11 L2
    () => pairScan("illuy-illuy", CP.ILUY, CP.ILUY), // 12 L2
    () => pairScan("tarcha-munach", CP.TARCHA, CP.MUNACH), // 13 L2
    () => pairScan("sinnorit-merkha", CP.TSINNORIT, CP.MERKHA), // 14 L3
    () => pairScan("azla-tarcha", CP.QADMA, CP.TARCHA), // 15 L3
    () => pairScan("munach-munach", CP.MUNACH, CP.MUNACH), // 16 L3
    () => pairScan("sinnorit-mahpakh", CP.TSINNORIT, CP.MAHAPAKH, { sameWordOnly: true }), // 17 conj
    () => pairScan("ole-veyored", CP.OLE, CP.MERKHA), // 18 L2 (cross word)
    () => bareScan("munach", CP.MUNACH), // 19
    () => bareScan("merkha", CP.MERKHA), // 20
    () => bareScan("tarcha", CP.TARCHA), // 21
    () => bareScan("azla", CP.QADMA), // 22
    () => bareScan("mahpakh", CP.MAHAPAKH), // 23
    () => bareScan("illuy", CP.ILUY), // 24
    () => bareScan("sinnorit", CP.TSINNORIT), // 25
    () => bareScan("ole", CP.OLE), // 26
    () => bareScan("shalshelet", CP.SHALSHELET), // 27
    () => bareScan("galgal", CP.GALGAL), // 28
    () => {
      // 29: word-final Paseq nothing else claimed.
      for (let w = 0; w < prosodicWords.length; w++) {
        const paseq = wordFinalPaseqPos(w);
        if (paseq && isFree(paseq)) emit("paseq", [], wordTokens(w), [paseq]);
      }
    },
  ];

  for (const pass of SCAN_PASSES) pass();

  // ── Build the result ────────────────────────────────────────────────────
  const counts: Record<string, number> = {};
  ACCENT_REGISTRY.forEach((accent) => {
    counts[accent.id] = spans[accent.id].length;
  });

  const ids: string[][] = tokens.map(() => []);
  const underIds: string[][] = tokens.map(() => []);
  for (const accent of ACCENT_REGISTRY) {
    for (const occ of spans[accent.id]) {
      for (const t of occ.head) {
        if (!ids[t].includes(accent.id)) ids[t].push(accent.id);
      }
      for (const t of occ.lead) {
        if (!underIds[t].includes(accent.id)) underIds[t].push(accent.id);
      }
    }
  }
  ids.forEach(sortByRegistry);
  underIds.forEach(sortByRegistry);

  return { ids, underIds, counts, spans };
}
