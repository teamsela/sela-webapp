import { describe, it, expect } from "vitest";

import type { AccentOccurrence } from "@/lib/poeticAccents";
import {
  AccentSpans,
  PausalToken,
  computePsalmOffsets,
  parsePausalCatalogue,
  selectPausalTokens,
} from "@/lib/pausalForms";
import { PAUSAL_FORMS_RAW } from "@/lib/pausalFormsData";

// Build an accent occurrence from the token indices whose marks it claims.
// By default the last claimed token is the head (word it resolves on) and any
// earlier claimed tokens are the lead — with an optional extra `lead` for maqqef
// leaner tokens that carry no mark of their own.
const occ = (claims: number[], head?: number[], lead?: number[]): AccentOccurrence => ({
  lead: lead ?? claims.slice(0, -1),
  head: head ?? claims.slice(-1),
  claims: claims.map((t) => ({ t, i: 0 })),
});

// ════════════════════════════════════════════════════════════════════════════
// parsePausalCatalogue

describe("parsePausalCatalogue", () => {
  it("maps accent names to detector ids and groups multiple records per verse", () => {
    const cat = parsePausalCatalogue(
      ["Ps 1:1 Etnachta", "Ps 1:1 Sof Pasuq", "Ps 1:3 Ole VeYored"].join("\n"),
    );
    expect(cat.get("1:1")).toEqual(new Set(["etnachta", "sof-pasuq"]));
    expect(cat.get("1:3")).toEqual(new Set(["ole-veyored"]));
  });

  it("strips trailing editorial markers (* ? !) before matching", () => {
    const cat = parsePausalCatalogue(
      ["Ps 2:7 Etnachta*", "Ps 3:7 Etnachta?", "Ps 20:4 Etnachta!"].join("\n"),
    );
    expect(cat.get("2:7")).toEqual(new Set(["etnachta"]));
    expect(cat.get("3:7")).toEqual(new Set(["etnachta"]));
    expect(cat.get("20:4")).toEqual(new Set(["etnachta"]));
  });

  it("maps every accent name that occurs in the catalogue", () => {
    const cat = parsePausalCatalogue(
      [
        "Ps 5:12 Pazer",
        "Ps 5:12 Dechi",
        "Ps 119:175 Merkha",
        "Ps 1:1 Revia Mugrash",
        "Ps 1:1 Azla Legarmeh",
        "Ps 1:1 Tsinnor",
        "Ps 1:1 Munach",
        "Ps 1:1 Tarcha",
        "Ps 1:1 Revia",
      ].join("\n"),
    );
    expect(cat.get("5:12")).toEqual(new Set(["pazer", "dechi"]));
    expect(cat.get("119:175")).toEqual(new Set(["merkha"]));
    expect(cat.get("1:1")).toEqual(
      new Set(["revia-mugrash", "azla-legarmeh", "tsinnor", "munach", "tarcha", "revia"]),
    );
  });

  it("skips blank lines and unknown accent names", () => {
    const cat = parsePausalCatalogue(
      ["", "  ", "Ps 1:1 Etnachta", "Ps 1:2 Nonsense", "garbage line", "Ps 1:3 "].join("\n"),
    );
    expect(cat.size).toBe(1);
    expect(cat.get("1:1")).toEqual(new Set(["etnachta"]));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// computePsalmOffsets — data-driven per-psalm verse alignment (spec §6)

describe("computePsalmOffsets", () => {
  it("recovers a shift where the app text runs one verse behind (offset 1)", () => {
    const cat = parsePausalCatalogue(
      ["Ps 5:2 Revia", "Ps 5:3 Pazer", "Ps 5:12 Etnachta"].join("\n"),
    );
    const tokens: PausalToken[] = [
      { chapter: 5, verse: 1 }, // ↔ Masoretic 5:2
      { chapter: 5, verse: 2 }, // ↔ Masoretic 5:3
      { chapter: 5, verse: 11 }, // ↔ Masoretic 5:12
    ];
    const spans: AccentSpans = {
      revia: [occ([0])],
      pazer: [occ([1])],
      etnachta: [occ([2])],
    };
    expect(computePsalmOffsets(tokens, spans, cat).get(5)).toBe(1);
  });

  it("recovers a two-verse superscription shift (offset 2)", () => {
    const cat = parsePausalCatalogue(["Ps 51:3 Revia", "Ps 51:4 Pazer"].join("\n"));
    const tokens: PausalToken[] = [
      { chapter: 51, verse: 1 }, // ↔ Masoretic 51:3
      { chapter: 51, verse: 2 }, // ↔ Masoretic 51:4
    ];
    const spans: AccentSpans = { revia: [occ([0])], pazer: [occ([1])] };
    expect(computePsalmOffsets(tokens, spans, cat).get(51)).toBe(2);
  });

  it("leaves aligned psalms at offset 0 (no entry recorded)", () => {
    const cat = parsePausalCatalogue(["Ps 1:1 Etnachta", "Ps 1:2 Sof Pasuq"].join("\n"));
    const tokens: PausalToken[] = [
      { chapter: 1, verse: 1 },
      { chapter: 1, verse: 2 },
    ];
    const spans: AccentSpans = { etnachta: [occ([0])], "sof-pasuq": [occ([1])] };
    expect(computePsalmOffsets(tokens, spans, cat).has(1)).toBe(false);
  });

  it("breaks ties toward the smaller offset", () => {
    // Only the ubiquitous Sof Pasuq matches, at both offset 0 and offset 1.
    const cat = parsePausalCatalogue(["Ps 2:2 Sof Pasuq"].join("\n"));
    const tokens: PausalToken[] = [
      { chapter: 2, verse: 1 },
      { chapter: 2, verse: 2 },
    ];
    const spans: AccentSpans = { "sof-pasuq": [occ([0]), occ([1])] };
    // offset 0 (v2) and offset 1 (v1) both score 1 hit → smaller offset wins → no entry.
    expect(computePsalmOffsets(tokens, spans, cat).has(2)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// selectPausalTokens — claim-based matching (spec §5)

describe("selectPausalTokens", () => {
  it("selects only words whose resolved accent is catalogued for the offset-corrected verse", () => {
    const cat = parsePausalCatalogue(
      ["Ps 5:2 Revia", "Ps 5:3 Pazer", "Ps 5:12 Etnachta"].join("\n"),
    );
    const tokens: PausalToken[] = [
      { chapter: 5, verse: 1 }, // ✓ revia matches 5:2 at offset 1
      { chapter: 5, verse: 2 }, // ✓ pazer matches 5:3 at offset 1
      { chapter: 5, verse: 2 }, // ✗ merkha not catalogued for 5:3
      { chapter: 5, verse: 11 }, // ✓ etnachta matches 5:12 at offset 1
      { chapter: 5, verse: 20 }, // ✗ no catalogue entry for 5:21
    ];
    const spans: AccentSpans = {
      revia: [occ([0])],
      pazer: [occ([1])],
      merkha: [occ([2])],
      etnachta: [occ([3]), occ([4])],
    };
    const { indices, offsets } = selectPausalTokens(tokens, spans, cat);
    expect(offsets.get(5)).toBe(1);
    expect(indices).toEqual([0, 1, 3]);
  });

  it("fills both words of a cross-word compound but not a maqqef leaner", () => {
    // Ps 1:3 Ole VeYored over `עַל־פַּלְגֵי מָיִם`: the Ole is on פַּלְגֵי (token 1),
    // the Yored/Merkha on מָיִם (token 2); עַל־ (token 0) is a maqqef leaner.
    const cat = parsePausalCatalogue("Ps 1:3 Ole VeYored");
    const tokens: PausalToken[] = [
      { chapter: 1, verse: 3 }, // עַל־  (leaner, no mark)
      { chapter: 1, verse: 3 }, // פַּלְגֵי (Ole)
      { chapter: 1, verse: 3 }, // מָיִם  (Merkha)
    ];
    const spans: AccentSpans = {
      "ole-veyored": [occ([1, 2], [2], [0, 1])], // claims tokens 1 & 2; lead includes leaner 0
    };
    expect(selectPausalTokens(tokens, spans, cat).indices).toEqual([1, 2]);
  });

  it("matches a word that carries any one of several catalogued accents", () => {
    const cat = parsePausalCatalogue(["Ps 1:1 Etnachta", "Ps 1:1 Sof Pasuq"].join("\n"));
    const tokens: PausalToken[] = [
      { chapter: 1, verse: 1 }, // ✓ via sof-pasuq
      { chapter: 1, verse: 1 }, // ✗ munach not catalogued
    ];
    const spans: AccentSpans = { "sof-pasuq": [occ([0])], munach: [occ([1])] };
    expect(selectPausalTokens(tokens, spans, cat).indices).toEqual([0]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Integration — the real shipped catalogue embedded in @/lib/pausalFormsData

describe("PAUSAL_FORMS_RAW (shipped catalogue)", () => {
  const cat = parsePausalCatalogue(PAUSAL_FORMS_RAW);

  it("parses every non-empty line into a mapped accent id", () => {
    const nonEmptyLines = PAUSAL_FORMS_RAW.split("\n").filter((line) => line.trim().length > 0).length;
    const totalRecords = Array.from(cat.values()).reduce((sum, set) => sum + set.size, 0);
    // Multiple accents on one verse collapse into a Set, so records ≤ lines; the
    // real catalogue has no same-accent duplicates per verse, so they are equal.
    expect(nonEmptyLines).toBe(1244);
    expect(totalRecords).toBe(1244);
  });

  it("spot-checks known verses", () => {
    expect(cat.get("1:1")).toEqual(new Set(["etnachta", "sof-pasuq"]));
    expect(cat.get("1:3")).toEqual(new Set(["ole-veyored"]));
    expect(cat.get("5:12")?.has("pazer")).toBe(true);
    expect(cat.get("119:175")?.has("merkha")).toBe(true);
  });
});
