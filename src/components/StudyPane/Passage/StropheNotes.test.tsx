import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import { StropheNotes } from "./StropheNotes";

// Test-local contexts, shared between the mocked modules and the harness.
const { TestFormatContext, TestLanguageContext } = vi.hoisted(() => {
  const R = require("react");
  return {
    TestFormatContext: R.createContext({}),
    TestLanguageContext: R.createContext({ ctxIsHebrew: false }),
  };
});

// The StudyPane index ("..") pulls in the server-only Xata client; mock it.
vi.mock("..", () => ({
  FormatContext: TestFormatContext,
  DEFAULT_COLOR_FILL: "#FFFFFF",
  DEFAULT_BORDER_COLOR: "#D9D9D9",
  DEFAULT_TEXT_COLOR: "#525252",
}));
vi.mock("./PassageBlock", () => ({ LanguageContext: TestLanguageContext }));

// Mock the Tiptap editor with a plain textarea that mirrors doc <-> text so we
// can drive it in jsdom and isolate StropheNotes' save/hydrate logic.
vi.mock("../InfoPane/RichTextEditor", () => {
  const R = require("react");
  const nodeText = (n: any): string =>
    n?.type === "text" ? n.text || "" : (n?.content || []).map(nodeText).join("");
  const docToText = (doc: any): string => (doc?.content || []).map(nodeText).join("\n");
  const plainTextToDoc = (text: string) => {
    const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
    const content = lines.map((line: string) =>
      line.length ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" },
    );
    if (!content.length) content.push({ type: "paragraph" });
    return { type: "doc", content };
  };
  return {
    default: ({ value, onChange, editable }: any) =>
      R.createElement("textarea", {
        "data-testid": "editor",
        readOnly: !editable,
        value: docToText(value),
        onChange: (e: any) => onChange(plainTextToDoc(e.target.value)),
      }),
  };
});

function Harness() {
  const [studyNotes, setStudyNotes] = useState("");
  const [activeNotesPane, setActiveNotesPane] = useState<"heb" | "eng" | null>(null);
  const [noteMerge, setNoteMerge] = useState(true);
  const [mounted, setMounted] = useState(true);

  const ctx: any = {
    ctxStudyId: "study-1",
    ctxStudyNotes: studyNotes,
    ctxSetStudyNotes: setStudyNotes,
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
        <button onClick={() => setMounted((m) => !m)}>toggle</button>
        <div data-testid="notes-json">{studyNotes}</div>
        {mounted && <StropheNotes firstWordId={0} lastWordId={5} stropheId={0} />}
      </TestLanguageContext.Provider>
    </TestFormatContext.Provider>
  );
}

describe("StropheNotes persistence across toggle (unmount/remount)", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    ) as any;
  });

  it("retains the title AND body when the note pane is toggled off and back on", async () => {
    render(<Harness />);
    const editor = (await screen.findByTestId("editor")) as HTMLTextAreaElement;

    fireEvent.change(editor, { target: { value: "My Title\nbody line one\nbody line two" } });

    // Context receives the full doc (title + body).
    await waitFor(() => {
      const json = screen.getByTestId("notes-json").textContent || "";
      expect(json).toContain("My Title");
      expect(json).toContain("body line two");
    });

    // Toggle the pane off (unmount) ...
    fireEvent.click(screen.getByText("toggle"));
    await waitFor(() => expect(screen.queryByTestId("editor")).toBeNull());

    // ... and back on (remount).
    fireEvent.click(screen.getByText("toggle"));
    const editor2 = (await screen.findByTestId("editor")) as HTMLTextAreaElement;

    expect(editor2.value).toContain("My Title");
    expect(editor2.value).toContain("body line one");
    expect(editor2.value).toContain("body line two");
  });
});
