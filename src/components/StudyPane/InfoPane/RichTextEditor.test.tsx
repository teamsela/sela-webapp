import { describe, it, expect, vi } from "vitest";
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
    fireEvent.contextMenu(area as Element, { clientX: 120, clientY: 90 });
    const menu = await screen.findByRole("menu");
    // Opens at the cursor when there is room.
    expect(menu.style.left).toBe("120px");
    expect(menu.style.top).toBe("90px");
  });

  it("nudges the menu back inside the viewport when opened near an edge", async () => {
    // jsdom has no layout, so give the menu a measured size and a small window.
    const rect = { width: 248, height: 200, top: 0, left: 0, right: 248, bottom: 200, x: 0, y: 0, toJSON: () => {} };
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(rect as DOMRect);
    const origW = window.innerWidth;
    const origH = window.innerHeight;
    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 400, configurable: true });

    try {
      render(<RichTextEditor value={sampleDoc} onChange={() => {}} editable />);
      const area = document.querySelector(".tiptap-prose");
      // Right-click in the bottom-right corner.
      fireEvent.contextMenu(area as Element, { clientX: 495, clientY: 395 });
      const menu = await screen.findByRole("menu");
      // Whole 248x200 menu must fit within 500x400 (8px margin): left<=244, top<=192.
      expect(parseFloat(menu.style.left)).toBeLessThanOrEqual(500 - 248 - 8);
      expect(parseFloat(menu.style.top)).toBeLessThanOrEqual(400 - 200 - 8);
      expect(parseFloat(menu.style.left)).toBeGreaterThanOrEqual(8);
      expect(parseFloat(menu.style.top)).toBeGreaterThanOrEqual(8);
    } finally {
      rectSpy.mockRestore();
      Object.defineProperty(window, "innerWidth", { value: origW, configurable: true });
      Object.defineProperty(window, "innerHeight", { value: origH, configurable: true });
    }
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
