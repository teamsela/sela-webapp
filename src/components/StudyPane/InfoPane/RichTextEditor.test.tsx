import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RichTextEditor from "./RichTextEditor";
import { toRichDoc, type RichDoc } from "@/lib/richText";

const sampleDoc: RichDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Hello notes" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "bullet one" }] }] },
      ],
    },
  ],
};

describe("RichTextEditor", () => {
  it("renders the stored document to the DOM (the read/view path)", async () => {
    render(<RichTextEditor value={sampleDoc} onChange={() => {}} editable={false} />);
    expect(await screen.findByText("Hello notes")).toBeInTheDocument();
    // Bullet list structure survives to the DOM.
    await waitFor(() => expect(document.querySelector(".tiptap-prose ul li")).not.toBeNull());
    expect(screen.getByText("bullet one")).toBeInTheDocument();
  });

  it("exposes formatting via a floating menu opened from the corner icon", async () => {
    const { rerender } = render(
      <RichTextEditor value={sampleDoc} onChange={() => {}} editable />,
    );
    // The menu is closed initially — the corner trigger is present, Bold is not.
    expect(await screen.findByLabelText("Formatting options")).toBeInTheDocument();
    expect(screen.queryByLabelText("Bold")).toBeNull();

    fireEvent.click(screen.getByLabelText("Formatting options"));
    expect(await screen.findByLabelText("Bold")).toBeInTheDocument();
    expect(screen.getByLabelText("Bullet list")).toBeInTheDocument();
    expect(screen.getByLabelText("Highlight")).toBeInTheDocument();
    expect(screen.getByLabelText("Font size")).toBeInTheDocument();

    // View mode: no trigger, no menu, but content still renders.
    rerender(<RichTextEditor value={sampleDoc} onChange={() => {}} editable={false} />);
    await waitFor(() => expect(screen.queryByLabelText("Formatting options")).toBeNull());
    expect(screen.queryByLabelText("Bold")).toBeNull();
    expect(screen.getByText("Hello notes")).toBeInTheDocument();
  });

  it("opens the formatting menu on right-click inside the editor", async () => {
    render(<RichTextEditor value={sampleDoc} onChange={() => {}} editable />);
    await screen.findByText("Hello notes");
    const area = document.querySelector(".tiptap-prose");
    expect(area).not.toBeNull();
    fireEvent.contextMenu(area as Element);
    expect(await screen.findByLabelText("Bold")).toBeInTheDocument();
  });

  it("shows a placeholder when the document is empty and editable", async () => {
    render(<RichTextEditor value={undefined} onChange={() => {}} editable placeholder="Your notes here..." />);
    expect(await screen.findByText("Your notes here...")).toBeInTheDocument();
  });

  it("applies content that arrives via `value` AFTER mount (the re-open/hydration path)", async () => {
    // Mirrors StropheNotes on re-open: value starts empty, then the parent
    // hydrates it to the saved doc a tick after mount (no typing involved).
    function Wrapper() {
      const [val, setVal] = React.useState<RichDoc>(toRichDoc(""));
      React.useEffect(() => {
        setVal({
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Hydrated Title" }] },
            { type: "paragraph", content: [{ type: "text", text: "hydrated body" }] },
          ],
        });
      }, []);
      return <RichTextEditor value={val} onChange={() => {}} editable fill />;
    }
    render(<Wrapper />);
    expect(await screen.findByText("Hydrated Title")).toBeInTheDocument();
    expect(screen.getByText("hydrated body")).toBeInTheDocument();
  });

  it("migrates and renders a legacy plain-text (string) value", async () => {
    render(
      <RichTextEditor value={"legacy line one\nlegacy line two"} onChange={() => {}} editable={false} />,
    );
    expect(await screen.findByText("legacy line one")).toBeInTheDocument();
    expect(screen.getByText("legacy line two")).toBeInTheDocument();
  });
});
