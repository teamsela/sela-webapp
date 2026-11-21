import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToolbarButton } from "./ToolbarButton";

describe("ToolbarButton", () => {
  afterEach(() => vi.useRealTimers());

  it("runs its action when it can be used", () => {
    const run = vi.fn();
    render(<ToolbarButton label="New strophe" availability={{ enabled: true }} onClick={run}><span>icon</span></ToolbarButton>);
    fireEvent.click(screen.getByRole("button", { name: "New strophe" }));
    expect(run).toHaveBeenCalled();
  });

  it("when disabled, says why: in the tooltip, to screen readers, and for a moment on click", () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const reason = "Strophes only merge within a stanza.";
    render(<ToolbarButton label="Merge with previous strophe" availability={{ enabled: false, reason }} onClick={run}><span>icon</span></ToolbarButton>);
    const button = screen.getByRole("button", { name: "Merge with previous strophe" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    const tip = document.getElementById(button.getAttribute("aria-describedby")!);
    expect(tip?.textContent).toContain(reason);
    expect(tip?.classList.contains("opacity-0")).toBe(true);

    fireEvent.click(button);
    expect(run).not.toHaveBeenCalled();
    expect(tip?.classList.contains("opacity-100")).toBe(true);
    act(() => { vi.advanceTimersByTime(2600); });
    expect(tip?.classList.contains("opacity-100")).toBe(false);
  });

  it("shows a pressed state for toggles", () => {
    render(<ToolbarButton label="Disable boxes" pressed onClick={() => {}}><span>icon</span></ToolbarButton>);
    expect(screen.getByRole("button", { name: "Disable boxes" }).getAttribute("aria-pressed")).toBe("true");
  });
});
