import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/StudyPane", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

import { FormatContext } from "@/components/StudyPane";
import { ColorActionType, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode, BoxDisplayStyle } from "@/lib/types";
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

const practice = { capture: vi.fn(() => ({ metadata: { words: {} }, notes: "", notesOn: false, infoPaneAction: InfoPaneActionType.none })), restore: vi.fn() };

const Harness = ({ ctx, setCloneStudyOpen = vi.fn() }: { ctx: Record<string, unknown>; setCloneStudyOpen?: (o: boolean) => void }) => (
  <FormatContext.Provider value={{ ...baseCtx, ...ctx } as any}>
    <div data-strophe-line="true">line one</div>
    <div data-tour="language-switcher"><span data-tour="lang-English">A</span><span data-tour="lang-Hebrew">א</span></div>
    <div data-tour="group-format">Format</div>
    <InterfaceTour studyId="rec_t" infoPaneAction={InfoPaneActionType.none} setCloneStudyOpen={setCloneStudyOpen} practice={practice as any} />
  </FormatContext.Provider>
);

describe("InterfaceTour", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    practice.capture.mockClear();
    practice.restore.mockClear();
  });

  const checkpoint = (n: number) => ({ metadata: { words: { [n]: {} } }, notes: `cp${n}`, notesOn: false, infoPaneAction: InfoPaneActionType.none });

  /** Start the tour at `step`, with a saved starting passage for it. */
  const startAt = (step: number, open = true) => {
    window.localStorage.setItem(KEY, JSON.stringify({ step, open }));
    window.localStorage.setItem(`${KEY}.checkpoints`, JSON.stringify({ "0": checkpoint(0), [String(step)]: checkpoint(step) }));
  };
  afterEach(() => vi.useRealTimers());

  it("starts with the welcome card, then a read-and-continue step", () => {
    render(<Harness ctx={{}} />);
    expect(screen.getByRole("dialog", { name: "Welcome to Sela" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("dialog", { name: "A word-by-word English" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  });

  it("waits for the action, confirms it, then continues on click", () => {
    startAt(stepIndex("lang-hebrew"));
    const { rerender } = render(<Harness ctx={{}} />);
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();

    act(() => { vi.advanceTimersByTime(200); });
    rerender(<Harness ctx={{ ctxLanguageMode: LanguageMode.Hebrew }} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByRole("status").textContent).toMatch(/that.s it/i);

    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByRole("dialog", { name: "Switch to the Hebrew" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("dialog", { name: "See the transliteration" })).toBeTruthy();
  });

  it("colors go one button at a time", () => {
    startAt(stepIndex("color-fill"));
    const { rerender } = render(<Harness ctx={{}} />);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole("dialog", { name: "Fill color" })).toBeTruthy();
    // Color picked, picker still open: not done yet.
    rerender(<Harness ctx={{ ctxStudyMetadata: { words: { 1: { color: { fill: "#ff0" } } } }, ctxColorAction: ColorActionType.colorFill }} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getAllByText("(to do)")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    // Picker closed: done.
    rerender(<Harness ctx={{ ctxStudyMetadata: { words: { 1: { color: { fill: "#ff0" } } } }, ctxColorAction: ColorActionType.none }} />);
    act(() => { vi.advanceTimersByTime(400); });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("dialog", { name: "Font color" })).toBeTruthy();
  });

  it("ticks checklist items one by one", () => {
    startAt(stepIndex("layers-edit"));
    const { rerender } = render(<Harness ctx={{}} />);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getAllByText("(to do)")).toHaveLength(2);

    rerender(<Harness ctx={{ ctxStudyMetadata: { words: { 1: { color: { fill: "#ff0" } } } } }} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getAllByText("(to do)")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    rerender(<Harness ctx={{
      ctxStudyMetadata: { words: { 1: { color: { fill: "#ff0" } } } },
      ctxPassageProps: { stanzaProps: [], stanzaCount: 1, stropheCount: 2 },
    }} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.queryAllByText("(to do)")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("closes to a resume pill and remembers where it was", () => {
    startAt(3);
    render(<Harness ctx={{}} />);
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.click(screen.getByRole("button", { name: "Close tour" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual({ step: 3, open: false });
    fireEvent.click(screen.getByRole("button", { name: /resume tutorial/i }));
    expect(screen.getByRole("dialog", { name: INTERFACE_TOUR_STEPS[3].title })).toBeTruthy();
  });

  it("offers Copy to My Studies at the end", () => {
    const setCloneStudyOpen = vi.fn();
    startAt(INTERFACE_TOUR_STEPS.length - 1);
    render(<Harness ctx={{}} setCloneStudyOpen={setCloneStudyOpen} />);
    expect(screen.getByRole("dialog", { name: "That concludes the basic tutorial" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy to My Studies" }));
    expect(setCloneStudyOpen).toHaveBeenCalledWith(true);
  });

  it("saves the passage at the start of each step and puts it back on Back", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ step: 1, open: true }));
    window.localStorage.setItem(`${KEY}.checkpoints`, JSON.stringify({ "0": checkpoint(0), "1": checkpoint(1) }));
    render(<Harness ctx={{}} />);
    // Resuming at step 1 restores step 1's starting passage.
    expect(practice.restore).toHaveBeenCalledWith(checkpoint(1));

    practice.capture.mockReturnValueOnce(checkpoint(2) as any);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(JSON.parse(window.localStorage.getItem(`${KEY}.checkpoints`)!)["2"]).toEqual(checkpoint(2));

    practice.restore.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(practice.restore).toHaveBeenCalledWith(checkpoint(1));
    expect(Object.keys(JSON.parse(window.localStorage.getItem(`${KEY}.checkpoints`)!))).toEqual(["0", "1"]);
  });

  it("starts over when a step's starting passage was never saved", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ step: 5, open: true }));
    render(<Harness ctx={{}} />);
    expect(practice.restore).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Welcome to Sela" })).toBeTruthy();
  });

  it("blocks clicks outside the step and nudges the bubble", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ step: stepIndex("lang-hebrew"), open: true }));
    window.localStorage.setItem(`${KEY}.checkpoints`, JSON.stringify({ "0": checkpoint(0), [String(stepIndex("lang-hebrew"))]: checkpoint(3) }));
    render(<Harness ctx={{}} />);
    act(() => { vi.advanceTimersByTime(200); });
    const outside = vi.fn();
    const inside = vi.fn();
    screen.getByText("Format").addEventListener("click", outside);
    screen.getByText("א").addEventListener("click", inside);
    fireEvent.click(screen.getByText("Format"));
    fireEvent.click(screen.getByText("A")); // the switch, but not this step's button
    fireEvent.click(screen.getByText("א"));
    expect(outside).not.toHaveBeenCalled();
    expect(inside).toHaveBeenCalledTimes(1);
  });
});
