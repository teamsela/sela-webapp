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

  it("dims the whole page for a card with no target", () => {
    render(<TourOverlay title="Welcome" body="Hello" onClose={() => {}} actions={null} />);
    expect(document.querySelector(".bg-black\\/60")).not.toBeNull();
  });
});
