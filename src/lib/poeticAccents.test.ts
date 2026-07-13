import { describe, it, expect } from "vitest";

import {
  ACCENT_CODEPOINTS,
  ACCENT_REGISTRY,
  AccentToken,
  getAccentLevel,
  scanAccents,
  tokenCategory,
} from "@/lib/poeticAccents";

const C = ACCENT_CODEPOINTS;
const BET = 0x05d1; // base consonant to hang marks on

/** Build a one-word Hebrew string: a base letter plus the given accent marks. */
const word = (...codepoints: number[]): string => String.fromCharCode(BET, ...codepoints);

const token = (hebrew: string, verse: number | string = 1, chapter = 1): AccentToken => ({
  hebrew,
  chapter,
  verse,
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Interface shape
// ════════════════════════════════════════════════════════════════════════════

describe("interface shape", () => {
  it("aligns ids/underIds to the token list and seeds every registry id", () => {
    const tokens = [token(word(C.ETNACHTA)), token(word())];
    const result = scanAccents(tokens);

    expect(result.ids).toHaveLength(tokens.length);
    expect(result.underIds).toHaveLength(tokens.length);
    ACCENT_REGISTRY.forEach((accent) => {
      expect(result.counts).toHaveProperty(accent.id);
      expect(result.spans).toHaveProperty(accent.id);
    });
  });

  it("gives every unseen registry id a 0 count and [] spans", () => {
    const result = scanAccents([token(word())]);
    ACCENT_REGISTRY.forEach((accent) => {
      expect(result.counts[accent.id]).toBe(0);
      expect(result.spans[accent.id]).toEqual([]);
    });
  });

  it("tolerates empty input and missing hebrew", () => {
    expect(scanAccents([]).ids).toEqual([]);
    const result = scanAccents([{ chapter: 1, verse: 1 } as AccentToken]);
    expect(result.ids[0]).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Bare singles
// ════════════════════════════════════════════════════════════════════════════

describe("bare single-mark accents", () => {
  it("classifies Sof Pasuq → L1", () => {
    const r = scanAccents([token(word(C.SOF_PASUQ))]);
    expect(r.ids[0]).toContain("sof-pasuq");
    expect(r.counts["sof-pasuq"]).toBe(1);
    expect(tokenCategory(r.ids[0])).toBe(1);
  });

  it("classifies Etnachta → L2, Tsinnor → L3, Dechi → L3, Pazer → L4", () => {
    const r = scanAccents([
      token(word(C.ETNACHTA)),
      token(word(C.ZINOR)),
      token(word(C.DEHI)),
      token(word(C.PAZER)),
    ]);
    expect(r.counts["etnachta"]).toBe(1);
    expect(tokenCategory(r.ids[0])).toBe(2);
    expect(r.counts["tsinnor"]).toBe(1);
    expect(tokenCategory(r.ids[1])).toBe(3);
    expect(r.counts["dechi"]).toBe(1);
    expect(tokenCategory(r.ids[2])).toBe(3);
    expect(r.counts["pazer"]).toBe(1);
    expect(tokenCategory(r.ids[3])).toBe(4);
  });

  it("treats lone conjunctive marks as conjunctive", () => {
    const marks: Array<[number, string]> = [
      [C.MUNACH, "munach"],
      [C.MERKHA, "merkha"],
      [C.TARCHA, "tarcha"],
      [C.QADMA, "azla"],
      [C.MAHAPAKH, "mahpakh"],
      [C.ILUY, "illuy"],
      [C.TSINNORIT, "sinnorit"],
      [C.OLE, "ole"],
      [C.GALGAL, "galgal"],
    ];
    const r = scanAccents(marks.map(([cp]) => token(word(cp), 1)));
    marks.forEach(([, id], t) => {
      expect(r.counts[id]).toBe(1);
      expect(tokenCategory(r.ids[t])).toBe("conjunctive");
    });
  });

  it("returns null category for a word with no accents", () => {
    const r = scanAccents([token(word())]);
    expect(r.ids[0]).toEqual([]);
    expect(tokenCategory(r.ids[0])).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Revia Mugrash
// ════════════════════════════════════════════════════════════════════════════

describe("Revia Mugrash", () => {
  it("Geresh Muqdam + Revia on one token → one revia-mugrash, both claimed", () => {
    const r = scanAccents([token(word(C.GERESH_MUQDAM, C.REVIA))]);
    expect(r.counts["revia-mugrash"]).toBe(1);
    expect(r.counts["geresh"]).toBe(0);
    // The Revia is consumed by Revia Mugrash — NOT re-counted as a bare revi'i.
    expect(r.counts["revia"]).toBe(0);
    expect(r.ids[0]).toContain("revia-mugrash");
    expect(tokenCategory(r.ids[0])).toBe(2);
    // both marks consumed by a single occurrence
    expect(r.spans["revia-mugrash"][0].claims).toHaveLength(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3b. Revia (revi'i) — bare Level 3 disjunctive
// ════════════════════════════════════════════════════════════════════════════

describe("Revia (revi'i)", () => {
  it("classifies a standalone Revia → revi'i (L3)", () => {
    const r = scanAccents([token(word(C.REVIA))]);
    expect(r.counts["revia"]).toBe(1);
    expect(r.ids[0]).toContain("revia");
    expect(tokenCategory(r.ids[0])).toBe(3);
  });

  it("does NOT tag a Revia bound into Revia Mugrash or a Dechi compound", () => {
    // word 1: Geresh Muqdam + Revia (revia-mugrash); word 2: Dechi + Revia (dechi);
    // word 3: a lone Revia (revi'i).
    const r = scanAccents([
      token(word(C.GERESH_MUQDAM, C.REVIA), 1),
      token(word(C.DEHI, C.REVIA), 2),
      token(word(C.REVIA), 3),
    ]);
    expect(r.counts["revia-mugrash"]).toBe(1);
    expect(r.counts["dechi"]).toBe(1);
    expect(r.counts["revia"]).toBe(1); // only the standalone one
    expect(tokenCategory(r.ids[2])).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Dechi absorption
// ════════════════════════════════════════════════════════════════════════════

describe("Dechi compound absorption", () => {
  it.each([
    ["Munach", C.MUNACH, "munach"],
    ["Merkha", C.MERKHA, "merkha"],
    ["Revia", C.REVIA, "revia"],
  ])("Dechi + %s on the same word → one dechi, following mark absorbed", (_label, cp, id) => {
    const r = scanAccents([token(word(C.DEHI, cp))]);
    expect(r.counts["dechi"]).toBe(1);
    expect(r.spans["dechi"][0].claims).toHaveLength(2);
    // The absorbed mark (incl. a Revia) is never re-counted on its own.
    expect(r.counts[id]).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Legarmeh family
// ════════════════════════════════════════════════════════════════════════════

describe("Legarmeh family (Paseq ownership)", () => {
  it("Qadma + word-final Paseq → azla-legarmeh (L4); paseq/azla not counted", () => {
    const r = scanAccents([token(word(C.QADMA, C.PASEQ))]);
    expect(r.counts["azla-legarmeh"]).toBe(1);
    expect(r.counts["paseq"]).toBe(0);
    expect(r.counts["azla"]).toBe(0);
    expect(tokenCategory(r.ids[0])).toBe(4);
  });

  it("Mahpakh Qadma Paseq → azla-legarmeh + bare mahpakh (last former owns paseq)", () => {
    const r = scanAccents([token(word(C.MAHAPAKH, C.QADMA, C.PASEQ))]);
    expect(r.counts["azla-legarmeh"]).toBe(1);
    expect(r.counts["mahpakh"]).toBe(1);
    expect(r.counts["azla"]).toBe(0);
    expect(r.counts["paseq"]).toBe(0);
    expect(r.counts["mahpakh-legarmeh"]).toBe(0);
  });

  it("Shalshelet + word-final Paseq → shalshelet-gedolah (L2); paseq not counted", () => {
    const r = scanAccents([token(word(C.SHALSHELET, C.PASEQ))]);
    expect(r.counts["shalshelet-gedolah"]).toBe(1);
    expect(r.counts["shalshelet"]).toBe(0);
    expect(r.counts["paseq"]).toBe(0);
    expect(tokenCategory(r.ids[0])).toBe(2);
  });

  it("Mahpakh + word-final Paseq → mahpakh-legarmeh (L4)", () => {
    const r = scanAccents([token(word(C.MAHAPAKH, C.PASEQ))]);
    expect(r.counts["mahpakh-legarmeh"]).toBe(1);
    expect(r.counts["mahpakh"]).toBe(0);
    expect(r.counts["paseq"]).toBe(0);
  });

  it("Tsinnorit + Mahpakh (+ Paseq) same word → sinnorit-mahpakh, NOT mahpakh-legarmeh", () => {
    const r = scanAccents([token(word(C.TSINNORIT, C.MAHAPAKH, C.PASEQ))]);
    expect(r.counts["sinnorit-mahpakh"]).toBe(1);
    expect(r.counts["mahpakh-legarmeh"]).toBe(0);
    expect(r.counts["mahpakh"]).toBe(0);
    expect(tokenCategory(r.ids[0])).toBe("conjunctive");
  });

  it("Legarmeh across two words: former on word 1, Paseq on word 2", () => {
    const r = scanAccents([token(word(C.QADMA), 1), token(word(C.PASEQ), 1)]);
    expect(r.counts["azla-legarmeh"]).toBe(1);
    const occ = r.spans["azla-legarmeh"][0];
    expect(occ.lead).toEqual([0]);
    expect(occ.head).toEqual([1]);
    expect(r.underIds[0]).toContain("azla-legarmeh");
    expect(r.ids[1]).toContain("azla-legarmeh");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Sinnorit Merkha
// ════════════════════════════════════════════════════════════════════════════

describe("Sinnorit Merkha", () => {
  it("Tsinnorit + Merkha same word → sinnorit-merkha (L3)", () => {
    const r = scanAccents([token(word(C.TSINNORIT, C.MERKHA))]);
    expect(r.counts["sinnorit-merkha"]).toBe(1);
    expect(r.counts["merkha"]).toBe(0);
    expect(r.counts["sinnorit"]).toBe(0);
    expect(tokenCategory(r.ids[0])).toBe(3);
  });

  it("two adjacent words, same verse → one sinnorit-merkha with lead/head", () => {
    const r = scanAccents([token(word(C.TSINNORIT), 1), token(word(C.MERKHA), 1)]);
    expect(r.counts["sinnorit-merkha"]).toBe(1);
    const occ = r.spans["sinnorit-merkha"][0];
    expect(occ.lead).toEqual([0]);
    expect(occ.head).toEqual([1]);
    expect(r.underIds[0]).toContain("sinnorit-merkha");
    expect(r.ids[1]).toContain("sinnorit-merkha");
  });

  it("one-word Sinnorit Merkha + word-final Paseq → labeled paseq only", () => {
    const r = scanAccents([token(word(C.TSINNORIT, C.MERKHA, C.PASEQ))]);
    expect(r.counts["paseq"]).toBe(1);
    expect(r.counts["sinnorit-merkha"]).toBe(0);
    expect(r.counts["merkha"]).toBe(0);
    expect(r.counts["sinnorit"]).toBe(0);
    expect(r.spans["paseq"][0].claims).toHaveLength(3);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Ole VeYored
// ════════════════════════════════════════════════════════════════════════════

describe("Ole VeYored", () => {
  it("Ole + Merkha same word → ole-veyored (L2); merkha not counted", () => {
    const r = scanAccents([token(word(C.OLE, C.MERKHA))]);
    expect(r.counts["ole-veyored"]).toBe(1);
    expect(r.counts["merkha"]).toBe(0);
    expect(tokenCategory(r.ids[0])).toBe(2);
  });

  it("cross-word Ole (word1) + Merkha (word2) → ole-veyored with lead/head", () => {
    const r = scanAccents([token(word(C.OLE), 1), token(word(C.MERKHA), 1)]);
    expect(r.counts["ole-veyored"]).toBe(1);
    const occ = r.spans["ole-veyored"][0];
    expect(occ.lead).toEqual([0]);
    expect(occ.head).toEqual([1]);
  });

  it("Ole with no Merkha in reach → bare ole", () => {
    const r = scanAccents([token(word(C.OLE))]);
    expect(r.counts["ole"]).toBe(1);
    expect(r.counts["ole-veyored"]).toBe(0);
    expect(tokenCategory(r.ids[0])).toBe("conjunctive");
  });

  it("Ole's Yored Merkha is not also counted as bare merkha or sinnorit-merkha", () => {
    const r = scanAccents([token(word(C.OLE, C.MERKHA))]);
    expect(r.counts["merkha"]).toBe(0);
    expect(r.counts["sinnorit-merkha"]).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Pair chaining
// ════════════════════════════════════════════════════════════════════════════

describe("pair scan chaining", () => {
  it("three Munachs across three adjacent words → one munach-munach + one bare munach", () => {
    const r = scanAccents([
      token(word(C.MUNACH), 1),
      token(word(C.MUNACH), 1),
      token(word(C.MUNACH), 1),
    ]);
    expect(r.counts["munach-munach"]).toBe(1);
    expect(r.counts["munach"]).toBe(1);
  });

  it("Tarcha + Munach + Munach across adjacent words → tarcha-munach + bare munach", () => {
    const r = scanAccents([
      token(word(C.TARCHA), 1),
      token(word(C.MUNACH), 1),
      token(word(C.MUNACH), 1),
    ]);
    expect(r.counts["tarcha-munach"]).toBe(1);
    expect(r.counts["munach-munach"]).toBe(0);
    expect(r.counts["munach"]).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Verse boundary
// ════════════════════════════════════════════════════════════════════════════

describe("verse boundary", () => {
  it("a compound does not span a verse change", () => {
    const r = scanAccents([token(word(C.TSINNORIT), 1), token(word(C.MERKHA), 2)]);
    expect(r.counts["sinnorit-merkha"]).toBe(0);
    expect(tokenCategory(r.ids[0])).toBe("conjunctive"); // bare sinnorit
    expect(tokenCategory(r.ids[1])).toBe("conjunctive"); // bare merkha
  });

  it("a compound does not span a chapter change", () => {
    const r = scanAccents([token(word(C.QADMA), 1, 1), token(word(C.PASEQ), 1, 2)]);
    expect(r.counts["azla-legarmeh"]).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Sorting / strongest & maqqef grouping
// ════════════════════════════════════════════════════════════════════════════

describe("strongest-first ordering", () => {
  it("lists a disjunctive before a conjunctive on the same word", () => {
    const r = scanAccents([token(word(C.MUNACH, C.ETNACHTA))]);
    expect(r.ids[0][0]).toBe("etnachta");
    expect(tokenCategory(r.ids[0])).toBe(2);
    expect(r.counts["etnachta"]).toBe(1);
    expect(r.counts["munach"]).toBe(1);
  });
});

describe("maqqef-joined prosodic words", () => {
  it("treats maqqef-joined tokens as one prosodic word for a same-word compound", () => {
    // Tsinnorit on token 0 (ends with maqqef) + Merkha on token 1 → one word,
    // so this is a single-word Sinnorit Merkha (lead empty, head both tokens).
    const r = scanAccents([
      token(word(C.TSINNORIT) + String.fromCharCode(C.MAQQEF), 1),
      token(word(C.MERKHA), 1),
    ]);
    expect(r.counts["sinnorit-merkha"]).toBe(1);
    const occ = r.spans["sinnorit-merkha"][0];
    expect(occ.lead).toEqual([]);
    expect(occ.head).toEqual([0, 1]);
    // Structure's maqqef coloring relies on claims naming the marked tokens:
    // Tsinnorit on token 0 + Merkha on token 1 → the accent straddles the maqqef.
    expect(occ.claims.map((c) => c.t).sort()).toEqual([0, 1]);
  });
});

describe("getAccentLevel", () => {
  it("maps disjunctive ids to their level and conjunctives / unknowns to null", () => {
    expect(getAccentLevel("sof-pasuq")).toBe(1);
    expect(getAccentLevel("etnachta")).toBe(2);
    expect(getAccentLevel("dechi")).toBe(3);
    expect(getAccentLevel("pazer")).toBe(4);
    expect(getAccentLevel("munach")).toBeNull();
    expect(getAccentLevel("not-a-real-id")).toBeNull();
  });
});
