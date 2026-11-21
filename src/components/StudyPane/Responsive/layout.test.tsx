import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { layoutForSize, modeForWidth, ToolbarVariantContext } from "./layout";
import { ToolbarButton } from "../Toolbar/ToolbarButton";

describe("layout mode", () => {
  it("picks phone, tablet, wide tablet or desktop by width", () => {
    expect(modeForWidth(344)).toBe("phone");
    expect(modeForWidth(639)).toBe("phone");
    expect(modeForWidth(640)).toBe("tablet");
    expect(modeForWidth(884)).toBe("tablet");
    expect(modeForWidth(1180)).toBe("tabletWide");
    expect(modeForWidth(1280)).toBe("desktop");
  });
});

describe("a phone on its side", () => {
  it("gets the phone layout, arranged for landscape", () => {
    expect(layoutForSize(844, 390)).toEqual({ mode: "phone", landscape: true });
    expect(layoutForSize(932, 430)).toEqual({ mode: "phone", landscape: true });
    expect(layoutForSize(667, 375)).toEqual({ mode: "phone", landscape: true });
  });
  it("leaves tablets, upright phones and laptops alone", () => {
    expect(layoutForSize(390, 844)).toEqual({ mode: "phone", landscape: false });
    expect(layoutForSize(1180, 820)).toEqual({ mode: "tabletWide", landscape: false });
    expect(layoutForSize(1024, 768)).toEqual({ mode: "tabletWide", landscape: false });
    expect(layoutForSize(1440, 480)).toEqual({ mode: "desktop", landscape: false });
  });
});

describe("toolbar buttons in the phone's menus", () => {
  it("draw as a labelled row that writes out why they can't be used", () => {
    const run = vi.fn();
    render(
      <ToolbarVariantContext.Provider value={{ variant: "row" }}>
        <ToolbarButton label="Merge with previous strophe" availability={{ enabled: false, reason: "Strophes only merge within a stanza." }} onClick={run}>
          <span>icon</span>
        </ToolbarButton>
      </ToolbarVariantContext.Provider>,
    );
    const button = screen.getByRole("button", { name: /Merge with previous strophe/ });
    expect(button.textContent).toContain("Strophes only merge within a stanza.");
    fireEvent.click(button);
    expect(run).not.toHaveBeenCalled();
  });

  it("run their action, then tell the menu to close", () => {
    const run = vi.fn();
    const close = vi.fn();
    render(
      <ToolbarVariantContext.Provider value={{ variant: "row", onAction: close }}>
        <ToolbarButton label="New strophe" availability={{ enabled: true }} onClick={run}>
          <span>icon</span>
        </ToolbarButton>
      </ToolbarVariantContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /New strophe/ }));
    expect(run).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
