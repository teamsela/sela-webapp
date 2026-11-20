"use client";

import { createContext, useContext, useEffect, useState } from "react";

/*
  Which layout the study screen uses, from the window size and, on foldables,
  the screen's fold:

    phone        under 640px wide    bottom tab bar, selection bar, sheets
    tablet       640-1023px          ribbon toolbar, tools as a drawer
    tabletWide   1024-1279px         ribbon toolbar, tools docked at the side
    desktop      1280px and up       unchanged

  fold "book": a foldable opened flat with a vertical fold (two side-by-side
  screen segments): the tools take the segment beside the passage.
  fold "tabletop": half-folded with a horizontal fold (segments stacked):
  on a phone the tools sheet fills the lower segment, below the fold.
*/

export type LayoutMode = "phone" | "tablet" | "tabletWide" | "desktop";
export type FoldPosture = "none" | "book" | "tabletop";
export type StudyLayout = { mode: LayoutMode; fold: FoldPosture };

export const PHONE_MAX = 639;
export const TABLET_MAX = 1023;
export const TABLET_WIDE_MAX = 1279;

export const modeForWidth = (width: number): LayoutMode =>
  width <= PHONE_MAX ? "phone" : width <= TABLET_MAX ? "tablet" : width <= TABLET_WIDE_MAX ? "tabletWide" : "desktop";

const matches = (query: string) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;

const readLayout = (): StudyLayout => {
  if (typeof window === "undefined") return { mode: "desktop", fold: "none" };
  const fold: FoldPosture = matches("(horizontal-viewport-segments: 2)")
    ? "book"
    : matches("(vertical-viewport-segments: 2)")
      ? "tabletop"
      : "none";
  return { mode: modeForWidth(window.innerWidth), fold };
};

/** The current layout; desktop until mounted, so server and first render agree. */
export const useStudyLayout = (): StudyLayout => {
  const [layout, setLayout] = useState<StudyLayout>({ mode: "desktop", fold: "none" });
  useEffect(() => {
    const update = () => {
      const next = readLayout();
      setLayout((prev) => (prev.mode === next.mode && prev.fold === next.fold ? prev : next));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return layout;
};

export const LayoutContext = createContext<StudyLayout>({ mode: "desktop", fold: "none" });
export const useLayout = () => useContext(LayoutContext);

/*
  How toolbar buttons draw themselves. The same buttons (and the same rules
  for when they work) are used everywhere; only the drawing changes:

    icon     desktop toolbar: icon, tooltip with the name or the reason
    ribbon   tablet ribbon: icon with its label under it
    row      phone menus and sheets: a full-width row, icon, label, and the
             reason it can't be used written under the label
*/
export type ToolbarVariant = "icon" | "ribbon" | "row";
export type ToolbarVariantValue = { variant: ToolbarVariant; onAction?: () => void };
export const ToolbarVariantContext = createContext<ToolbarVariantValue>({ variant: "icon" });
export const useToolbarVariant = () => useContext(ToolbarVariantContext);

/** Where the phone's color sheet wants the color swatches drawn (see ColorActionBtn). */
export const SwatchSlotContext = createContext<HTMLElement | null>(null);
