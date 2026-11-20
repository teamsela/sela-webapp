import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { modeForWidth, ToolbarVariantContext } from "./layout";
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
