import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/StudyPane", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

import { FormatContext } from "@/components/StudyPane";
import { InfoPaneActionType } from "@/lib/types";
import { INTERFACE_TOUR_STEPS } from "@/lib/tutorials/interfaceTour";
import InterfaceTour from "./InterfaceTour";

const renderTour = (selectedWords: unknown[] = [], setCloneStudyOpen = vi.fn()) =>
  render(
    <FormatContext.Provider value={{ ctxSelectedWords: selectedWords, ctxStudyMetadata: { words: {} } } as any}>
      <div data-strophe-line="true">line one</div>
      <InterfaceTour studyId="rec_t" infoPaneAction={InfoPaneActionType.none} setCloneStudyOpen={setCloneStudyOpen} />
    </FormatContext.Provider>
  );

describe("InterfaceTour", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("starts with the welcome card and moves to the first step", () => {
    renderTour();
    expect(screen.getByRole("dialog", { name: INTERFACE_TOUR_STEPS[0].title })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Select a word" })).toBeTruthy();
  });

  it("moves on by itself once the step's goal is met", () => {
    window.localStorage.setItem("sela.tour.interface-v1.rec_t", JSON.stringify({ step: 1, open: true }));
    renderTour([{ wordId: 1 }]);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByRole("status").textContent).toMatch(/that.s it/i);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole("dialog", { name: "See what it means" })).toBeTruthy();
  });

  it("closes to a resume pill and remembers where it was", () => {
    window.localStorage.setItem("sela.tour.interface-v1.rec_t", JSON.stringify({ step: 2, open: true }));
    renderTour();
    fireEvent.click(screen.getByRole("button", { name: "Close tour" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(JSON.parse(window.localStorage.getItem("sela.tour.interface-v1.rec_t")!)).toEqual({ step: 2, open: false });
    fireEvent.click(screen.getByRole("button", { name: /resume tour/i }));
    expect(screen.getByRole("dialog", { name: "See what it means" })).toBeTruthy();
  });

  it("offers Copy to My Studies at the end", () => {
    const setCloneStudyOpen = vi.fn();
    window.localStorage.setItem(
      "sela.tour.interface-v1.rec_t",
      JSON.stringify({ step: INTERFACE_TOUR_STEPS.length - 1, open: true })
    );
    renderTour([], setCloneStudyOpen);
    fireEvent.click(screen.getByRole("button", { name: "Copy to My Studies" }));
    expect(setCloneStudyOpen).toHaveBeenCalledWith(true);
  });
});
