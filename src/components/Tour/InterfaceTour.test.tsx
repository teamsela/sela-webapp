import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/StudyPane", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

import { FormatContext } from "@/components/StudyPane";
import { InfoPaneActionType, LanguageMode, NonEnglishDisplayMode, BoxDisplayStyle } from "@/lib/types";
import { INTERFACE_TOUR_ID, INTERFACE_TOUR_STEPS } from "@/lib/tutorials/interfaceTour";
import InterfaceTour from "./InterfaceTour";

const KEY = `sela.tour.${INTERFACE_TOUR_ID}.rec_t`;
const stepIndex = (id: string) => INTERFACE_TOUR_STEPS.findIndex((s) => s.id === id);

const baseCtx = {
  ctxLanguageMode: LanguageMode.English,
  ctxNonEnglishDisplayMode: NonEnglishDisplayMode.Hebrew,
  ctxPassageProps: { stanzaProps: [], stanzaCount: 1, stropheCount: 1 },
  ctxSelectedWords: [],
  ctxStudyMetadata: { words: {} },
  ctxBoxDisplayConfig: { style: BoxDisplayStyle.box },
  ctxStropheNoteBtnOn: false,
  ctxStudyNotes: "",
  ctxLayers: [{ id: 0 }],
  ctxActiveLayerId: 0,
};

const Harness = ({ ctx, setCloneStudyOpen = vi.fn() }: { ctx: Record<string, unknown>; setCloneStudyOpen?: (o: boolean) => void }) => (
  <FormatContext.Provider value={{ ...baseCtx, ...ctx } as any}>
    <div data-strophe-line="true">line one</div>
    <div data-tour="language-switcher">A</div>
    <div data-tour="group-format">Format</div>
    <InterfaceTour studyId="rec_t" infoPaneAction={InfoPaneActionType.none} setCloneStudyOpen={setCloneStudyOpen} />
  </FormatContext.Provider>
);

describe("InterfaceTour", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("starts with the welcome card, then a read-and-continue step", () => {
    render(<Harness ctx={{}} />);
    expect(screen.getByRole("dialog", { name: "Welcome to Sela" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("dialog", { name: "A word-by-word English" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  });

  it("waits for the action, confirms it, then continues on click", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ step: stepIndex("lang-hebrew"), open: true }));
    const { rerender } = render(<Harness ctx={{}} />);
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();

    rerender(<Harness ctx={{ ctxLanguageMode: LanguageMode.Hebrew }} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByRole("status").textContent).toMatch(/that.s it/i);

    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByRole("dialog", { name: "Switch to the Hebrew" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("dialog", { name: "See the transliteration" })).toBeTruthy();
  });

  it("ticks checklist items one by one", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ step: stepIndex("colors"), open: true }));
    const { rerender } = render(<Harness ctx={{}} />);
    expect(screen.getAllByText("(to do)")).toHaveLength(3);

    rerender(<Harness ctx={{ ctxStudyMetadata: { words: { 1: { color: { fill: "#ff0" } } } } }} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getAllByText("(to do)")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    rerender(<Harness ctx={{ ctxStudyMetadata: { words: { 1: { color: { fill: "#ff0", text: "#f00", border: "#00f" } } } } }} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.queryAllByText("(to do)")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("closes to a resume pill and remembers where it was", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ step: 3, open: true }));
    render(<Harness ctx={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Close tour" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual({ step: 3, open: false });
    fireEvent.click(screen.getByRole("button", { name: /resume tutorial/i }));
    expect(screen.getByRole("dialog", { name: INTERFACE_TOUR_STEPS[3].title })).toBeTruthy();
  });

  it("offers Copy to My Studies at the end", () => {
    const setCloneStudyOpen = vi.fn();
    window.localStorage.setItem(KEY, JSON.stringify({ step: INTERFACE_TOUR_STEPS.length - 1, open: true }));
    render(<Harness ctx={{}} setCloneStudyOpen={setCloneStudyOpen} />);
    expect(screen.getByRole("dialog", { name: "That concludes the basic tutorial" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy to My Studies" }));
    expect(setCloneStudyOpen).toHaveBeenCalledWith(true);
  });
});
