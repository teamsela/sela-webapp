"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IconCircle, IconCircleCheckFilled, IconX } from "@tabler/icons-react";

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
*/

const BUBBLE_WIDTH = 340;
const GAP = 14;
const EDGE = 16;
const PAD = 6;
const Z = 10000; // above the study header (z-9999)

type Rect = { top: number; left: number; width: number; height: number };

const measure = (selector?: string): Rect | null => {
  if (!selector) return null;
  const rects = selector
    .split(",")
    .map((part) => document.querySelector(part.trim()))
    .filter((el): el is Element => !!el)
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 || r.height > 0);
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  // Clamp to the viewport so a very tall target (a scaled passage) still
  // leaves room for the bubble.
  const top = Math.max(Math.min(...rects.map((r) => r.top)), 0);
  const bottom = Math.min(Math.max(...rects.map((r) => r.bottom)), window.innerHeight);
  return { top, left, width: right - left, height: Math.max(bottom - top, 0) };
};

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

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
  const [rect, setRect] = useState<Rect | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState(180);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(target);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
    const update = () => setRect((prev) => {
      const next = measure(target);
      return sameRect(prev, next) ? prev : next;
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
  }, [title, body, rect, done, checklist]);

  let bubbleStyle: React.CSSProperties;
  if (rect && placement === "corner") {
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
