import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { withControlChips } from "./controlChips";

const chips = (text: string, layout: "phone" | "tablet" | "desktop" = "desktop") => {
  const { container } = render(<p>{withControlChips(text, layout)}</p>);
  return {
    names: Array.from(container.querySelectorAll("span.inline-flex")).map((el) => el.textContent),
    text: container.textContent,
    icons: container.querySelectorAll("span.inline-flex svg").length,
  };
};

describe("control names drawn as the controls", () => {
  it("draws toolbar buttons with their icons, keeping the words", () => {
    const r = chips("In the bar at the bottom, open Strophe. Then tap New strophe. Merge with previous line joins it.", "phone");
    expect(r.names).toEqual(["Strophe", "New strophe", "Merge with previous line"]);
    expect(r.icons).toBe(3);
    expect(r.text).toBe("In the bar at the bottom, open Strophe. Then tap New strophe. Merge with previous line joins it.");
  });

  it("draws tabs as the bar's icons on phones and as pills elsewhere", () => {
    expect(chips("Tap Motif.", "phone")).toMatchObject({ names: ["Motif"], icons: 1 });
    expect(chips("Click Motif.", "desktop")).toMatchObject({ names: ["Motif"], icons: 0 });
  });

  it("draws the selection bar's and panel's buttons", () => {
    expect(chips("Tap Select repeats, then Done to close the colors.", "phone").names).toEqual(["Select repeats", "Done"]);
    expect(chips("Click Smart Highlight.").names).toEqual(["Smart Highlight"]);
    expect(chips("Try the Smart Highlighter. Smart Highlight replaces the colors.").names).toEqual([]);
    expect(chips("Click Fill color and pick a color.").names).toEqual(["Fill color"]);
  });

  it("leaves ordinary words alone", () => {
    expect(chips("Word boxes can be toggled. A strophe is a group of lines. Each word has a gloss.").names).toEqual([]);
    expect(chips("Open Word Information to see that data.").names).toEqual(["Word Information"]);
  });

  it("draws the language letters only where they name the buttons", () => {
    expect(chips("Click א to show the Hebrew. Click Aא for both.").names).toEqual(["א", "Aא"]);
    expect(chips("A line is one row.").names).toEqual([]);
  });
});
