import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import { StropheNotes } from "./StropheNotes";

// Test-local contexts shared between the mocked modules and the harness.
const { TestFormatContext, TestLanguageContext } = vi.hoisted(() => {
  const R = require("react");
  return {
    TestFormatContext: R.createContext({}),
    TestLanguageContext: R.createContext({ ctxIsHebrew: false }),
  };
});

// Mock only the heavy StudyPane index + PassageBlock. NOTE: the real
// RichTextEditor (Tiptap) is used here on purpose — this test exercises the
// real re-open/hydration path.
vi.mock("..", () => ({
  FormatContext: TestFormatContext,
  DEFAULT_COLOR_FILL: "#FFFFFF",
  DEFAULT_BORDER_COLOR: "#D9D9D9",
  DEFAULT_TEXT_COLOR: "#525252",
}));
vi.mock("./PassageBlock", () => ({ LanguageContext: TestLanguageContext }));

const savedNotes = JSON.stringify({
  version: 2,
  main: "",
  strophes: [
    {
      title: "My Title",
      text: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "My Title" }] },
          { type: "paragraph", content: [{ type: "text", text: "body line one" }] },
        ],
      },
      firstWordId: 0,
      lastWordId: 5,
    },
    { title: "", text: "", firstWordId: -1, lastWordId: -1 },
  ],
});

let latestNotes = "";

function Harness() {
  // Simulates re-opening the pane: notes already exist in context.
  const [studyNotes, setStudyNotes] = useState(savedNotes);
  const [activeNotesPane, setActiveNotesPane] = useState<"heb" | "eng" | null>(null);
  const [noteMerge, setNoteMerge] = useState(false);
  latestNotes = studyNotes;

  const ctx: any = {
    ctxStudyId: "study-1",
    ctxStudyNotes: studyNotes,
    ctxSetStudyNotes: (v: string) => {
      latestNotes = v;
      setStudyNotes(v);
    },
    ctxPassageProps: { stropheCount: 2, stanzaCount: 1, stanzaProps: [] },
    ctxNoteMerge: noteMerge,
    ctxSetNoteMerge: setNoteMerge,
    ctxActiveNotesPane: activeNotesPane,
    ctxSetActiveNotesPane: setActiveNotesPane,
    ctxInViewMode: false,
  };

  return (
    <TestFormatContext.Provider value={ctx}>
      <TestLanguageContext.Provider value={{ ctxIsHebrew: false }}>
        <StropheNotes firstWordId={0} lastWordId={5} stropheId={0} />
      </TestLanguageContext.Provider>
    </TestFormatContext.Provider>
  );
}

describe("StropheNotes re-open (existing note in context)", () => {
  beforeEach(() => {
    latestNotes = "";
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    ) as any;
  });

  it("displays the saved title + body and does not wipe the note", async () => {
    render(<Harness />);

    // The real editor should render the previously-saved content.
    expect(await screen.findByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("body line one")).toBeInTheDocument();

    // And the note must not have been overwritten to empty behind our backs.
    await new Promise((r) => setTimeout(r, 50));
    expect(latestNotes).toContain("body line one");
  });
});
