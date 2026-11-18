"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IconArrowDown, IconArrowUp, IconCircle, IconCircleCheckFilled, IconX } from "@tabler/icons-react";

/*
  Highlight-and-bubble for a guided tour, in the app's own style.

  With a target: everything but the target is dimmed (a ring with a large
  box-shadow), and a bubble sits below the target, or above it when there is
  no room. Clicks pass through, so the user works the real control.
  Without a target: a dimmed backdrop with the bubble centered.

  The target is looked up by selector and re-measured every 200 ms, so the
  highlight follows scrolling, resizing and layout changes. Each part of a
  selector list ("a, b") lights up its first visible match, and the lit area
  covers all of them, so a control and the panel it opens (a dropdown, a
  popover) can be lit together while the rest of the screen stays dimmed.

  Visibility is measured inside every scrolling panel the target sits in (the
  passage scrolls on its own, not with the page), so only the part the user
  can actually see is lit. When a step begins, a target that is out of view
  is scrolled to the middle of its panel. If the user later scrolls it out of
  view, the ring is dropped and the bubble says which way to scroll, with a
  "Show me" button that brings it back.
*/

const BUBBLE_WIDTH = 340;
const GAP = 14;
const EDGE = 16;
const PAD = 6;
const Z = 10000; // above the study header (z-9999)

type Rect = { top: number; left: number; width: number; height: number };
type Box = { top: number; left: number; bottom: number; right: number };
type Offscreen = "above" | "below" | "aside";
type Measured = { rect: Rect | null; offscreen: Offscreen | null; partlyHidden: boolean };

const NOTHING: Measured = { rect: null, offscreen: null, partlyHidden: false };

const intersect = (a: Box, b: Box): Box => ({
  top: Math.max(a.top, b.top),
  left: Math.max(a.left, b.left),
  bottom: Math.min(a.bottom, b.bottom),
  right: Math.min(a.right, b.right),
});

/** The window, cut down by every scrolling or clipping panel around `el`. */
const visibleArea = (el: Element): Box => {
  let box: Box = { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth };
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const st = window.getComputedStyle(p);
    if (/(auto|scroll|hidden|clip)/.test(`${st.overflowX} ${st.overflowY}`)) {
      const r = p.getBoundingClientRect();
      box = intersect(box, { top: r.top, left: r.left, bottom: r.bottom, right: r.right });
    }
  }
  return box;
};

const findTargets = (selector: string): Element[] =>
  selector
    .split(",")
    .map((part) => document.querySelector(part.trim()))
    .filter((el): el is Element => !!el);

const measure = (selector?: string): Measured => {
  if (!selector) return NOTHING;
  const visible: Box[] = [];
  let offscreen: Offscreen | null = null;
  let partlyHidden = false;

  for (const el of findTargets(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue; // not rendered (a closed popover)
    const area = visibleArea(el);
    const seen = intersect({ top: r.top, left: r.left, bottom: r.bottom, right: r.right }, area);
    if (seen.bottom - seen.top < 1 || seen.right - seen.left < 1) {
      offscreen = r.top >= area.bottom ? "below" : r.bottom <= area.top ? "above" : "aside";
      continue;
    }
    if (seen.top > r.top + 1 || seen.bottom < r.bottom - 1) partlyHidden = true;
    visible.push(seen);
  }

  if (visible.length === 0) return { rect: null, offscreen, partlyHidden: false };
  const top = Math.min(...visible.map((b) => b.top));
  const left = Math.min(...visible.map((b) => b.left));
  const bottom = Math.max(...visible.map((b) => b.bottom));
  const right = Math.max(...visible.map((b) => b.right));
  return { rect: { top, left, width: right - left, height: bottom - top }, offscreen: null, partlyHidden };
};

/** Scroll the (first) target to the middle of its panel. */
const reveal = (selector?: string) => {
  const el = selector ? findTargets(selector)[0] : undefined;
  el?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
};

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

const sameMeasure = (a: Measured, b: Measured) =>
  sameRect(a.rect, b.rect) && a.offscreen === b.offscreen && a.partlyHidden === b.partlyHidden;

export type TourOverlayProps = {
  target?: string;
  title: string;
  body: string;
  /** Several things to do, each ticked off as it is done. */
  checklist?: { label: string; done: boolean }[];
  /** e.g. "Strophes · Task 2 of 30"; omitted on welcome/finish cards. */
  progress?: string;
  done?: boolean;
  /** Extra space between target and bubble (see TourStep.clearance). */
  clearance?: number;
  /** Dim everything but the target (default true). */
  dim?: boolean;
  /** "corner": bubble at the bottom right, clear of the passage (see TourStep.placement). */
  placement?: "near" | "corner";
  onClose: () => void;
  /** Buttons in the bubble's footer, right-aligned. */
  actions: ReactNode;
};

const TourOverlay = ({ target, title, body, checklist, progress, done, clearance = 0, dim = true, placement = "near", onClose, actions }: TourOverlayProps) => {
  const [measured, setMeasured] = useState<Measured>(NOTHING);
  const { rect, offscreen } = measured;
  const [bubbleHeight, setBubbleHeight] = useState(180);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) {
      setMeasured(NOTHING);
      return;
    }
    // When a step begins, bring a hidden or half-hidden target into view.
    const first = measure(target);
    if (first.offscreen || first.partlyHidden) reveal(target);

    const update = () => setMeasured((prev) => {
      const next = measure(target);
      return sameMeasure(prev, next) ? prev : next;
    });
    update();
    const id = window.setInterval(update, 200);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
    };
  }, [target]);

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleHeight(bubbleRef.current.offsetHeight);
  }, [title, body, rect, offscreen, done, checklist]);

  let bubbleStyle: React.CSSProperties;
  if ((rect && placement === "corner") || offscreen) {
    // Above the study footer (about 64px tall), at the right edge.
    bubbleStyle = { position: "fixed", right: EDGE, bottom: 80, width: BUBBLE_WIDTH, zIndex: Z + 1 };
  } else if (rect) {
    const gap = GAP + clearance;
    const roomBelow = window.innerHeight - (rect.top + rect.height + PAD + gap);
    const below = roomBelow >= bubbleHeight + EDGE || rect.top < bubbleHeight + gap + EDGE;
    const top = below
      ? Math.min(rect.top + rect.height + PAD + gap, window.innerHeight - bubbleHeight - EDGE)
      : rect.top - PAD - gap - bubbleHeight;
    const centered = rect.left + rect.width / 2 - BUBBLE_WIDTH / 2;
    const left = Math.min(Math.max(centered, EDGE), window.innerWidth - BUBBLE_WIDTH - EDGE);
    bubbleStyle = { position: "fixed", top: Math.max(top, EDGE), left, width: BUBBLE_WIDTH, zIndex: Z + 1 };
  } else {
    bubbleStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: BUBBLE_WIDTH + 100,
      zIndex: Z + 1,
    };
  }

  return (
    <>
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            position: "fixed",
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: dim ? "0 0 0 9999px rgba(15, 23, 42, 0.45)" : undefined,
            zIndex: Z,
          }}
        />
      ) : offscreen ? (
        // Target scrolled away: dim lightly, but let the wheel reach the page.
        dim && <div aria-hidden className="pointer-events-none fixed inset-0 bg-black/40" style={{ zIndex: Z }} />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-black/60" style={{ zIndex: Z }} />
      )}

      <div
        ref={bubbleRef}
        role="dialog"
        aria-label={title}
        style={bubbleStyle}
        className="rounded-2xl bg-white p-5 text-left text-sm text-gray-700 shadow-2xl dark:bg-gray-900 dark:text-gray-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconX size={16} stroke={2} />
        </button>

        {progress && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{progress}</p>
        )}
        <h3 className="mt-1 pr-8 text-lg font-semibold text-black dark:text-white">{title}</h3>
        <p className="mt-2 leading-relaxed">{body}</p>

        {offscreen && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary" role="status">
            <span className="flex items-center gap-1.5">
              {offscreen === "above" ? <IconArrowUp size={16} stroke={2.2} aria-hidden /> : <IconArrowDown size={16} stroke={2.2} aria-hidden />}
              {offscreen === "above" ? "It\u2019s further up. Scroll up to find it." : offscreen === "below" ? "It\u2019s further down. Scroll down to find it." : "It\u2019s out of view."}
            </span>
            <button
              type="button"
              onClick={() => reveal(target)}
              className="whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Show me
            </button>
          </div>
        )}

        {checklist && (
          <ul className="mt-3 space-y-1.5">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                {item.done ? (
                  <IconCircleCheckFilled size={18} className="shrink-0 text-primary" aria-hidden />
                ) : (
                  <IconCircle size={18} stroke={1.8} className="shrink-0 text-slate-400" aria-hidden />
                )}
                <span className={item.done ? "text-black dark:text-white" : ""}>
                  {item.label}
                  <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {done && (
          <p className="mt-3 text-sm font-medium text-primary" role="status">Nice, that&rsquo;s it. Take a look, then click Continue.</p>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">{actions}</div>
      </div>
    </>
  );
};

export default TourOverlay;

export const tourPrimaryButton =
  "whitespace-nowrap rounded-lg bg-primary py-2 px-4 text-center text-sm text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
export const tourSecondaryButton =
  "whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
