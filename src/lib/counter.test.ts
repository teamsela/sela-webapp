import { describe, it, expect } from "vitest";

import { StropheProps, WordProps } from "@/lib/data";
import {
  countLineUnits,
  countSelectedLines,
  countSelectedWords,
  endsWithMaqqef,
} from "@/lib/counter";

type WordOpts = { wordId: number; wlcWord?: string; stanzaId?: number; stropheId?: number; lineId?: number };

const mkWord = ({ wordId, wlcWord = "x", stanzaId = 0, stropheId = 0, lineId = 0 }: WordOpts): WordProps =>
  ({ wordId, wlcWord, stanzaId, stropheId, lineId } as WordProps);

const MAQQEF = String.fromCharCode(0x05be);
const leaner = String.fromCharCode(0x05d1) + MAQQEF; // a word ending in a maqqef

const mkStrophe = (stropheId: number, lines: WordProps[][]): StropheProps =>
  ({ stropheId, metadata: {}, lines: lines.map((words, lineId) => ({ lineId, words })) } as StropheProps);

describe("endsWithMaqqef", () => {
  it("detects a trailing maqqef, ignoring whitespace", () => {
    expect(endsWithMaqqef(leaner)).toBe(true);
    expect(endsWithMaqqef(leaner + "  ")).toBe(true);
  });
  it("is false for a plain word / empty / undefined", () => {
    expect(endsWithMaqqef("x")).toBe(false);
    expect(endsWithMaqqef("")).toBe(false);
    expect(endsWithMaqqef(undefined)).toBe(false);
  });
});

describe("countLineUnits", () => {
  const line = [
    mkWord({ wordId: 1, wlcWord: leaner }), // joins forward
    mkWord({ wordId: 2 }),
    mkWord({ wordId: 3 }),
  ];

  it("word mode counts one per box", () => {
    expect(countLineUnits(line, "words")).toBe(3);
  });

  it("units mode omits a maqqef leaner", () => {
    expect(countLineUnits(line, "units")).toBe(2);
  });

  it("units mode collapses a chain of more than two words to one", () => {
    const chain = [
      mkWord({ wordId: 1, wlcWord: leaner }),
      mkWord({ wordId: 2, wlcWord: leaner }),
      mkWord({ wordId: 3 }),
    ];
    expect(countLineUnits(chain, "units")).toBe(1);
  });

  it("handles an empty line", () => {
    expect(countLineUnits([], "words")).toBe(0);
    expect(countLineUnits([], "units")).toBe(0);
  });
});

describe("countSelectedWords", () => {
  it("counts individually selected words", () => {
    expect(countSelectedWords([mkWord({ wordId: 1 }), mkWord({ wordId: 2 })], [])).toBe(2);
  });

  it("counts every word inside selected strophes", () => {
    const strophe = mkStrophe(0, [
      [mkWord({ wordId: 1 }), mkWord({ wordId: 2 })],
      [mkWord({ wordId: 3 })],
    ]);
    expect(countSelectedWords([], [strophe])).toBe(3);
  });

  it("deduplicates a word selected both directly and via a strophe", () => {
    const shared = mkWord({ wordId: 1 });
    const strophe = mkStrophe(0, [[shared, mkWord({ wordId: 2 })]]);
    expect(countSelectedWords([shared], [strophe])).toBe(2);
  });

  it("is zero with no selection", () => {
    expect(countSelectedWords([], [])).toBe(0);
  });
});

describe("countSelectedLines", () => {
  it("counts a line even when only partly selected", () => {
    const words = [mkWord({ wordId: 1, lineId: 0 }), mkWord({ wordId: 2, lineId: 0 })];
    expect(countSelectedLines(words, [])).toBe(1);
  });

  it("counts distinct lines across strophes and stanzas", () => {
    const words = [
      mkWord({ wordId: 1, stanzaId: 0, stropheId: 0, lineId: 0 }),
      mkWord({ wordId: 2, stanzaId: 0, stropheId: 0, lineId: 1 }),
      mkWord({ wordId: 3, stanzaId: 1, stropheId: 0, lineId: 0 }), // different stanza, same local indices
    ];
    expect(countSelectedLines(words, [])).toBe(3);
  });

  it("counts every line of a selected strophe", () => {
    const strophe = mkStrophe(0, [
      [mkWord({ wordId: 1, lineId: 0 })],
      [mkWord({ wordId: 2, lineId: 1 })],
    ]);
    expect(countSelectedLines([], [strophe])).toBe(2);
  });
});
