import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import React from "react";
import EsvPopover from "./EsvPopover";

const { TestLanguageContext } = vi.hoisted(() => {
  const R = require("react");
  return { TestLanguageContext: R.createContext({ ctxIsHebrew: false }) };
});
vi.mock("./PassageBlock", () => ({ LanguageContext: TestLanguageContext }));
vi.mock("@/lib/actions", () => ({
  fetchESVTranslation: vi.fn(() => Promise.resolve("The LORD is my shepherd")),
}));

const popover = () => document.querySelector('[data-tour="esv-popover"]');

function setup() {
  const utils = render(
    <div>
      <EsvPopover chapterNumber={23} verseNumber={1} verseNumStyles={{ className: "" }} bookName="psalms" />
      <button type="button">elsewhere</button>
      <div data-tour-ui>
        <button type="button">Continue</button>
      </div>
    </div>,
  );
  return utils;
}

describe("EsvPopover", () => {
  it("closes on a click elsewhere on the page", async () => {
    const { getByText } = setup();
    await act(async () => fireEvent.click(getByText("1")));
    expect(popover()?.getAttribute("data-open")).toBe("true");
    await act(async () => fireEvent.click(getByText("elsewhere")));
    expect(popover()?.getAttribute("data-open")).toBe("false");
  });

  it("stays open when the tutorial bubble is clicked", async () => {
    const { getByText } = setup();
    await act(async () => fireEvent.click(getByText("1")));
    await act(async () => fireEvent.click(getByText("Continue")));
    expect(popover()?.getAttribute("data-open")).toBe("true");
  });
});
