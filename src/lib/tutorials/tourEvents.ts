import { useEffect, useRef } from "react";

/*
  The tour announces each step's target as the step begins, so the screen
  can bring it into view where it would otherwise be tucked away:

    tablet ribbon   switches to the group holding the button
    phone           opens the bottom bar's menu (or the color panel) holding
                    it, when something is selected; closes the ⋯ menu unless
                    the step is about it

  (The desktop toolbar shows every button, so it ignores this.)
*/

export const TOUR_STEP_EVENT = "sela:tour-step";

export const announceTourStep = (target: string | undefined) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_STEP_EVENT, { detail: { target } }));
};

/** Run `handler` with each announced step's target. */
export const useTourStep = (handler: (target: string | undefined) => void) => {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const listener = (event: Event) => ref.current((event as CustomEvent<{ target?: string }>).detail?.target);
    window.addEventListener(TOUR_STEP_EVENT, listener);
    return () => window.removeEventListener(TOUR_STEP_EVENT, listener);
  }, []);
};

export type ToolGroup = "format" | "word" | "line" | "strophe" | "stanza";

const GROUP_MARKERS: [ToolGroup, RegExp][] = [
  ["format", /data-tour="(fill-color|border-color|font-color|clear-format|clear-all)"/],
  ["word", /data-tour="(boxes|uniform-width|indent-add|indent-remove|edit-gloss)"/],
  ["line", /data-tour="structure-[A-Za-z]*Line"/],
  ["strophe", /data-tour="structure-[A-Za-z]*Strophe"/],
  ["stanza", /data-tour="structure-[A-Za-z]*Stanza"/],
];

/** Which toolbar group holds the control a selector points at, if any. */
export const toolGroupOf = (target: string | undefined): ToolGroup | undefined =>
  target ? GROUP_MARKERS.find(([, re]) => re.test(target))?.[0] : undefined;

export type ColorKind = "fill" | "border" | "font";

/** Which color button a selector points at (the first, for a list of them). */
export const colorKindOf = (target: string | undefined): ColorKind | undefined => {
  const m = target?.match(/data-tour="(fill|border|font)-color"/);
  return m ? (m[1] as ColorKind) : undefined;
};
