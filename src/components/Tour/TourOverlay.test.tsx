import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TourOverlay from "./TourOverlay";

describe("TourOverlay", () => {
  it("never covers the page when its target can't be found", () => {
    const clicked = vi.fn();
    render(
      <>
        <main data-tour="passage-area"><button onClick={clicked}>Yahweh</button></main>
        <TourOverlay target='[data-word-id="404"]' allow='[data-tour="passage-area"]' title="Find a word" body="Double-click it." onClose={() => {}} actions={null} />
      </>
    );
    fireEvent.click(screen.getByText("Yahweh"));
    expect(clicked).toHaveBeenCalled();
    expect(document.querySelector(".bg-black\\/60")).toBeNull();
  });

  it("lets the user click the target of an action step, and nothing else", () => {
    const target = vi.fn();
    const other = vi.fn();
    render(
      <>
        <button data-tour="boxes" onClick={target}>Boxes</button>
        <button onClick={other}>Bold</button>
        <TourOverlay target='[data-tour="boxes"]' title="Box button" body="Click it." onClose={() => {}} actions={null} />
      </>
    );
    fireEvent.click(screen.getByText("Boxes"));
    fireEvent.click(screen.getByText("Bold"));
    expect(target).toHaveBeenCalled();
    expect(other).not.toHaveBeenCalled();
  });

  it("only points at the target of a read-only card", () => {
    const target = vi.fn();
    render(
      <>
        <button data-tour="fill-color" onClick={target}>Fill</button>
        <TourOverlay target='[data-tour="fill-color"]' interactive={false} title="Colors" body="Look." onClose={() => {}} actions={null} />
      </>
    );
    fireEvent.click(screen.getByText("Fill"));
    expect(target).not.toHaveBeenCalled();
  });

  it("never makes a lit result clickable", () => {
    const result = vi.fn();
    render(
      <>
        <button data-tour="tab-motif">Motif</button>
        <aside data-tour="info-pane"><button onClick={result}>chip</button></aside>
        <TourOverlay target='[data-tour="tab-motif"]' highlight='[data-tour="info-pane"]' tone="result" done title="Motif" body="Done." onClose={() => {}} actions={null} />
      </>
    );
    fireEvent.click(screen.getByText("chip"));
    expect(result).not.toHaveBeenCalled();
  });

  it("dims the whole page for a card with no target", () => {
    render(<TourOverlay title="Welcome" body="Hello" onClose={() => {}} actions={null} />);
    expect(document.querySelector(".bg-black\\/60")).not.toBeNull();
  });

  it("keeps the bubble left of an open side panel", () => {
    const rect = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} }) as DOMRect;
    render(
      <>
        <aside data-tour="info-pane">panel</aside>
        <button data-tour="tab-motif">Motif</button>
        <TourOverlay target='[data-tour="tab-motif"]' title="Motif" body="Open it." onClose={() => {}} actions={null} />
      </>
    );
    Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 860, configurable: true });
    (document.querySelector('[data-tour="info-pane"]') as HTMLElement).getBoundingClientRect = () => rect(1040, 170, 360, 630);
    // The target sits above the panel, near the right edge.
    (document.querySelector('[data-tour="tab-motif"]') as HTMLElement).getBoundingClientRect = () => rect(1100, 20, 80, 36);
    return new Promise<void>((done) => setTimeout(() => {
      const bubble = screen.getByRole("dialog");
      const left = parseFloat(bubble.style.left);
      expect(left + 340).toBeLessThanOrEqual(1040 - 16);
      done();
    }, 600));
  });
});
