import { describe, it, expect } from "vitest";
import {
  normalizeHexColor,
  plainTextToDoc,
  toRichDoc,
  mergeRichDocs,
  firstLineText,
  combineNoteDoc,
  sanitizeRichDoc,
  sanitizeStudyNotes,
  isRichDoc,
  RICH_TEXT_VERSION,
} from "./richText";

describe("normalizeHexColor", () => {
  it("normalizes shorthand and lowercase hex to #RRGGBB uppercase", () => {
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
    expect(normalizeHexColor("#ff9800")).toBe("#FF9800");
    expect(normalizeHexColor("  #FfF  ")).toBe("#FFFFFF");
  });

  it("rejects anything that is not a plain hex color (CSS-injection guard)", () => {
    expect(normalizeHexColor("red")).toBeNull();
    expect(normalizeHexColor("url(javascript:alert(1))")).toBeNull();
    expect(normalizeHexColor("rgb(1,2,3)")).toBeNull();
    expect(normalizeHexColor("#ff9800; background: url(x)")).toBeNull();
    expect(normalizeHexColor("expression(alert(1))")).toBeNull();
    expect(normalizeHexColor(42)).toBeNull();
    expect(normalizeHexColor(undefined)).toBeNull();
  });
});

describe("plainTextToDoc / toRichDoc migration", () => {
  it("splits plain text into one paragraph per line", () => {
    const doc = plainTextToDoc("line one\nline two");
    expect(doc).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "line one" }] },
        { type: "paragraph", content: [{ type: "text", text: "line two" }] },
      ],
    });
  });

  it("produces at least one empty paragraph for empty input", () => {
    expect(plainTextToDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("passes existing docs through and migrates strings/undefined", () => {
    const doc = { type: "doc" as const, content: [{ type: "paragraph" }] };
    expect(toRichDoc(doc)).toBe(doc);
    expect(isRichDoc(toRichDoc("hello"))).toBe(true);
    expect(isRichDoc(toRichDoc(undefined))).toBe(true);
  });
});

describe("mergeRichDocs (strophe/stanza note merge)", () => {
  it("concatenates doc and legacy-string bodies into one doc", () => {
    const a: import("./richText").RichDoc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }],
    };
    expect(mergeRichDocs([a, "B"]).content).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "A" }] },
      { type: "paragraph", content: [{ type: "text", text: "B" }] },
    ]);
  });

  it("returns a single empty paragraph when there is nothing to merge", () => {
    expect(mergeRichDocs([])).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });
});

describe("firstLineText / combineNoteDoc (strophe title = first line)", () => {
  it("firstLineText returns the plain text of the first block", () => {
    const doc = {
      type: "doc" as const,
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Title here" }] },
        { type: "paragraph", content: [{ type: "text", text: "body" }] },
      ],
    };
    expect(firstLineText(doc)).toBe("Title here");
    expect(firstLineText("legacy first\nsecond")).toBe("legacy first");
    expect(firstLineText(undefined)).toBe("");
  });

  it("combineNoteDoc prepends a legacy separate title as the first line", () => {
    const combined = combineNoteDoc("My Title", "body text");
    expect(firstLineText(combined)).toBe("My Title");
    expect(combined.content).toHaveLength(2); // title line + body line
  });

  it("combineNoteDoc does not duplicate a title already on the first line", () => {
    const doc = {
      type: "doc" as const,
      content: [{ type: "paragraph", content: [{ type: "text", text: "Same" }] }],
    };
    const combined = combineNoteDoc("Same", doc);
    expect(combined.content).toHaveLength(1);
    expect(firstLineText(combined)).toBe("Same");
  });
});

describe("sanitizeRichDoc", () => {
  it("keeps allowed nodes, marks and validated attributes", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "styled",
              marks: [
                { type: "bold" },
                { type: "textStyle", attrs: { color: "#ff9800", fontSize: "1.25rem" } },
                { type: "highlight", attrs: { color: "#fff176" } },
              ],
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "item" }] }] },
          ],
        },
      ],
    };
    const out = sanitizeRichDoc(input);
    const marks = out.content[0].content![0].marks!;
    expect(marks).toContainEqual({ type: "bold" });
    expect(marks).toContainEqual({ type: "textStyle", attrs: { color: "#FF9800", fontSize: "1.25rem" } });
    expect(marks).toContainEqual({ type: "highlight", attrs: { color: "#FFF176" } });
    expect(out.content[1].type).toBe("bulletList");
  });

  it("strips disallowed node types", () => {
    const input = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: "x", onerror: "alert(1)" } },
        { type: "paragraph", content: [{ type: "text", text: "safe" }] },
      ],
    };
    const out = sanitizeRichDoc(input);
    expect(out.content).toHaveLength(1);
    expect(out.content[0].type).toBe("paragraph");
  });

  it("strips disallowed marks (e.g. injected link) but keeps the text", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    };
    const out = sanitizeRichDoc(input);
    expect(out.content[0].content![0]).toEqual({ type: "text", text: "click" });
  });

  it("drops invalid color and font-size attribute values", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [
                { type: "textStyle", attrs: { color: "url(x)", fontSize: "999px" } },
              ],
            },
          ],
        },
      ],
    };
    const out = sanitizeRichDoc(input);
    // textStyle had no valid attrs left, so the whole mark is dropped.
    expect(out.content[0].content![0].marks).toBeUndefined();
  });

  it("falls back to an empty doc for non-doc input", () => {
    expect(sanitizeRichDoc(null)).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(sanitizeRichDoc(123)).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });
});

describe("sanitizeStudyNotes (API payload gate)", () => {
  it("sanitizes a rich-doc main and normalizes strophes, stamping the version", () => {
    const raw = JSON.stringify({
      main: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "hi", marks: [{ type: "script" }] }],
          },
        ],
      },
      strophes: [{ title: "T", text: "B", firstWordId: 3, lastWordId: 9, junk: "x" }],
    });
    const out = JSON.parse(sanitizeStudyNotes(raw));
    expect(out.version).toBe(RICH_TEXT_VERSION);
    expect(out.main.content[0].content[0]).toEqual({ type: "text", text: "hi" }); // bad mark stripped
    expect(out.strophes[0]).toEqual({ title: "T", text: "B", firstWordId: 3, lastWordId: 9 });
    expect(out.strophes[0].junk).toBeUndefined();
  });

  it("keeps legacy plain-text main as a string", () => {
    const out = JSON.parse(sanitizeStudyNotes(JSON.stringify({ main: "plain notes", strophes: [] })));
    expect(out.main).toBe("plain notes");
  });

  it("derives the strophe title from the rich body's first line (ignoring client title) and sanitizes it", () => {
    const raw = JSON.stringify({
      main: "",
      strophes: [
        {
          title: "spoofed client title", // must be ignored — title is derived from the body
          text: {
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "My Heading", marks: [{ type: "evil" }] }] },
              { type: "paragraph", content: [{ type: "text", text: "and the body" }] },
            ],
          },
          firstWordId: 1,
          lastWordId: 2,
        },
      ],
    });
    const out = JSON.parse(sanitizeStudyNotes(raw));
    expect(out.strophes[0].title).toBe("My Heading"); // derived from first line, not the client value
    expect(out.strophes[0].text.content[0].content[0]).toEqual({ type: "text", text: "My Heading" }); // bad mark stripped
  });

  it("keeps a legacy plain-text strophe body as a string", () => {
    const out = JSON.parse(
      sanitizeStudyNotes(JSON.stringify({ main: "", strophes: [{ title: "T", text: "legacy body" }] })),
    );
    expect(out.strophes[0].text).toBe("legacy body");
  });

  it("coerces bad strophe id fields to -1", () => {
    const out = JSON.parse(
      sanitizeStudyNotes(JSON.stringify({ main: "", strophes: [{ title: 1, firstWordId: "nope" }] })),
    );
    expect(out.strophes[0]).toEqual({ title: "", text: "", firstWordId: -1, lastWordId: -1 });
  });

  it("throws on unparseable or wrong-shape input", () => {
    expect(() => sanitizeStudyNotes("not json")).toThrow();
    expect(() => sanitizeStudyNotes("null")).toThrow();
    expect(() => sanitizeStudyNotes("42")).toThrow();
  });
});
