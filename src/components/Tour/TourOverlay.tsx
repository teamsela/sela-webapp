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

  A selector part written "all:<selector>" lights every match instead of the
  first (the same line in the English and Hebrew panes, several lines).

  Toolbar tooltips ([data-tooltip] inside a target) join the lit area only
  while they are showing, so the highlight hugs the button and grows to take
  in its tooltip on hover. The bubble always leaves room for a tooltip below
  a toolbar control, so it doesn't move when one appears.

  The bubble gives way to the study screen's side panel (Layer, Structure,
  Motif...): while the panel is open the bubble stays to its left, and for a
  target inside the panel it sits beside the panel, level with the target.

  `target` is what the user acts on; it anchors the bubble. `highlight`
  (default: the target) is what is lit, e.g. the result of the action once a
  step is done. The bubble stays where it was while the highlight moves.

  While the overlay is up, clicks and key presses outside the target, the
  `allow` areas and the bubble are blocked (the bubble nudges instead), so the
  user can't knock the tutorial off course. Scrolling is never blocked. On a
  read-only card (`interactive={false}`) the target is only pointed at, not
  clickable, and a lit result is never clickable: once a step is done the
  next move is Continue.

  `tone="result"` draws a slightly heavier ring around what an action did.
  `docked` (phones): the bubble spans the screen, less 12px each side, and
  docks above the bottom bar, or under the header when what it points at is
  in the lower part of the screen (the bottom bar, its menus, a tool panel).
  The bottom bar's selection tools, menus and color panel stay usable on
  every step the user acts in, since on a phone that is where the tools are.
  `touch`: "tap" rather than "click" in the bubble's own words.
*/

const BUBBLE_WIDTH = 340;
const GAP = 14;
const EDGE = 16;
const PAD = 6;
const Z = 10000; // above the study header (z-9999)
// The theme's primary color, for both "do this" and "here's the result".
const RING = "#3C50E0";
const TOOLTIP_ROOM = 40; // space reserved below a toolbar control for its tooltip

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
    // Each direction separately: a box that only clips sideways (phones'
    // passage) doesn't hide what is above or below it.
    const clipsX = /(auto|scroll|hidden|clip)/.test(st.overflowX);
    const clipsY = /(auto|scroll|hidden|clip)/.test(st.overflowY);
    if (clipsX || clipsY) {
      const r = p.getBoundingClientRect();
      box = intersect(box, {
        top: clipsY ? r.top : -Infinity,
        left: clipsX ? r.left : -Infinity,
        bottom: clipsY ? r.bottom : Infinity,
        right: clipsX ? r.right : Infinity,
      });
    }
  }
  return box;
};

const isRendered = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 || r.height > 0;
};

/**
  Each part's first rendered match (hidden copies, e.g. in a collapsed
  strophe, are skipped), or every match for "all:" parts.
*/
const findTargets = (selector: string): Element[] =>
  selector
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      if (part.startsWith("all:")) return Array.from(document.querySelectorAll(part.slice(4)));
      const matches = Array.from(document.querySelectorAll(part));
      const first = matches.find(isRendered) ?? matches[0];
      return first ? [first] : [];
    });

/** The selector list as plain CSS (for matching), without "all:" prefixes. */
const plainSelector = (selector: string) =>
  selector
    .split(",")
    .map((part) => part.trim().replace(/^all:/, ""))
    .filter(Boolean)
    .join(", ");

const isShowing = (el: Element) => Number(window.getComputedStyle(el).opacity) > 0.5;

const measure = (selector?: string, withTooltips = true): Measured => {
  if (!selector) return NOTHING;
  const visible: Box[] = [];
  let offscreen: Offscreen | null = null;
  let partlyHidden = false;

  const elements = findTargets(selector).flatMap((el) => [
    el,
    ...(withTooltips ? Array.from(el.querySelectorAll("[data-tooltip]")).filter(isShowing) : []),
  ]);
  for (const el of elements) {
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
  el?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
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
  /** Extra places the user may click (selector list); see the note at the top. */
  allow?: string;
  /** Whether the target can be clicked (false on read-only cards). Default true. */
  interactive?: boolean;
  /** What to light (default: the target); see the note at the top. */
  highlight?: string;
  /** "result": a slightly heavier ring, showing what the user's action did. */
  tone?: "target" | "result";
  /** Phones: dock the bubble above the bottom bar or under the header (see the note at the top). */
  docked?: boolean;
  /** Touch screens: "tap" in the bubble's own words. */
  touch?: boolean;
  onClose: () => void;
  /** Buttons in the bubble's footer, right-aligned. */
  actions: ReactNode;
};

const NAVIGATION_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab", "Escape"]);
const BLOCKED_EVENTS = ["pointerdown", "mousedown", "click", "dblclick", "contextmenu", "touchstart", "keydown"] as const;

const PHONE_TOOLS = "[data-phone-tools]";
const DOCK_EDGE = 12;

const TourOverlay = ({ target, title, body, checklist, progress, done, clearance = 0, dim = true, placement = "near", allow, interactive = true, highlight, tone = "target", docked = false, touch = false, onClose, actions }: TourOverlayProps) => {
  const [measured, setMeasured] = useState<Measured>(NOTHING);
  const { rect, offscreen } = measured;
  // Where the bubble is anchored: the target itself (no tooltips), kept while
  // the highlight moves to the result.
  const [anchor, setAnchor] = useState<Rect | null>(null);
  const [anchorHasTooltip, setAnchorHasTooltip] = useState(false);
  // The side panel's left edge, while it is open (the bubble stays left of it).
  const [panelLeft, setPanelLeft] = useState<number | null>(null);
  const [nudge, setNudge] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Block interaction outside the step (see the note at the top).
  useEffect(() => {
    const allowed = plainSelector(
      [interactive ? target : undefined, allow, docked && interactive ? PHONE_TOOLS : undefined].filter(Boolean).join(", ")
    );
    const isAllowed = (node: EventTarget | null) => {
      if (!(node instanceof Node)) return true;
      if (bubbleRef.current?.contains(node)) return true;
      if (!allowed) return false;
      return Array.from(document.querySelectorAll(allowed)).some((el) => el.contains(node));
    };
    let nudgeTimer: number | undefined;
    const block = (event: Event) => {
      if (event instanceof KeyboardEvent) {
        if (NAVIGATION_KEYS.has(event.key) && !(event.target instanceof HTMLElement && event.target.isContentEditable)) return;
        const focused = document.activeElement;
        if (focused && focused !== document.body && isAllowed(focused)) return;
      }
      if (isAllowed(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type === "pointerdown" || event.type === "touchstart") {
        setNudge(true);
        window.clearTimeout(nudgeTimer);
        nudgeTimer = window.setTimeout(() => setNudge(false), 700);
      }
    };
    BLOCKED_EVENTS.forEach((type) => window.addEventListener(type, block, true));
    return () => {
      BLOCKED_EVENTS.forEach((type) => window.removeEventListener(type, block, true));
      window.clearTimeout(nudgeTimer);
    };
  }, [target, interactive, allow, docked]);

  const [bubbleHeight, setBubbleHeight] = useState(180);
  // Phones: the bubble's full height (measured while it is full), and whether
  // the user expanded a bubble that had shrunk to one line.
  const [fullHeight, setFullHeight] = useState(180);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [title]);

  // Track the side panel (open, closed, resized) for every kind of step.
  useEffect(() => {
    const check = () => {
      const panel = document.querySelector('[data-tour="info-pane"]');
      const pr = panel && isRendered(panel) ? panel.getBoundingClientRect() : null;
      const next = pr && pr.left < window.innerWidth ? Math.round(pr.left) : null;
      setPanelLeft((prev) => (prev === next ? prev : next));
    };
    check();
    const id = window.setInterval(check, 250);
    window.addEventListener("resize", check);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", check);
    };
  }, []);

  const lit = highlight ?? target;

  useEffect(() => {
    if (!lit) {
      setMeasured(NOTHING);
      setAnchor(null);
      return;
    }
    // When a step begins (or its result appears), bring it into view.
    const first = measure(lit);
    if (first.offscreen || first.partlyHidden) reveal(lit);

    const update = () => {
      setMeasured((prev) => {
        const next = measure(lit);
        return sameMeasure(prev, next) ? prev : next;
      });
      const a = target ? measure(target, false).rect : null;
      setAnchor((prev) => (a && !sameRect(prev, a) ? a : prev));
      setAnchorHasTooltip(!!target && findTargets(target).some((el) => !!el.querySelector("[data-tooltip]")));
    };
    update();
    const id = window.setInterval(update, 200);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
    };
  }, [lit, target]);

  useLayoutEffect(() => {
    if (!bubbleRef.current) return;
    const h = bubbleRef.current.offsetHeight;
    setBubbleHeight((prev) => (prev === h ? prev : h));
    if (bubbleRef.current.dataset.compact !== "true") setFullHeight((prev) => (prev === h ? prev : h));
  });

  // The bubble sits by the target (anchor), not by the result, and never on
  // top of the side panel: `rightLimit` is how far right it may reach.
  const place = anchor ?? rect;
  const panelOpen = panelLeft !== null && panelLeft - EDGE - BUBBLE_WIDTH >= EDGE;
  const rightLimit = panelOpen ? panelLeft - EDGE : window.innerWidth - EDGE;
  const targetInPanel = panelOpen && !!place && place.left >= panelLeft;
  let bubbleStyle: React.CSSProperties;
  let compact = false;
  if (docked) {
    // Full width, above the bottom bar, or under the header when the target
    // is in the lower part of the screen.
    const header = document.getElementById("selaHeader")?.getBoundingClientRect().bottom ?? 0;
    const bar = document.querySelector("[data-bottom-bar]")?.getBoundingClientRect().top ?? window.innerHeight;
    const targetLow = !!place && place.top + place.height / 2 > window.innerHeight * 0.5;
    const common: React.CSSProperties = {
      position: "fixed",
      left: DOCK_EDGE,
      right: DOCK_EDGE,
      maxHeight: "45dvh",
      overflowY: "auto",
      zIndex: Z + 1,
    };
    bubbleStyle = !place && !lit
      ? { ...common, top: "50%", transform: "translateY(-50%)", maxHeight: "70dvh" }
      : targetLow
        ? { ...common, top: header + 8 }
        : { ...common, bottom: window.innerHeight - bar + 8 };
    // Shrink to one line when the full bubble would cover what the step
    // points at (a tall panel such as the colors), unless the user expanded it.
    const litBox = rect ?? place;
    if (litBox && !expanded) {
      compact = targetLow ? header + 8 + fullHeight > litBox.top : bar - 8 - fullHeight < litBox.top + litBox.height;
    }
  } else if (targetInPanel && place) {
    // Beside the panel, level with the target inside it.
    const top = Math.min(Math.max(place.top + place.height / 2 - bubbleHeight / 2, EDGE), window.innerHeight - bubbleHeight - EDGE);
    bubbleStyle = { position: "fixed", top, left: rightLimit - BUBBLE_WIDTH, width: BUBBLE_WIDTH, zIndex: Z + 1 };
  } else if ((place && placement === "corner") || (offscreen && !anchor)) {
    // Above the study footer (about 64px tall), at the right edge (or the panel's).
    bubbleStyle = { position: "fixed", right: window.innerWidth - rightLimit, bottom: 80, width: BUBBLE_WIDTH, zIndex: Z + 1 };
  } else if (place) {
    const rect = place;
    const gap = GAP + clearance + (anchorHasTooltip ? TOOLTIP_ROOM : 0);
    const roomBelow = window.innerHeight - (rect.top + rect.height + PAD + gap);
    const below = roomBelow >= bubbleHeight + EDGE || rect.top < bubbleHeight + gap + EDGE;
    const top = below
      ? Math.min(rect.top + rect.height + PAD + gap, window.innerHeight - bubbleHeight - EDGE)
      : rect.top - PAD - gap - bubbleHeight;
    const centered = rect.left + rect.width / 2 - BUBBLE_WIDTH / 2;
    const left = Math.min(Math.max(centered, EDGE), rightLimit - BUBBLE_WIDTH);
    bubbleStyle = { position: "fixed", top: Math.max(top, EDGE), left, width: BUBBLE_WIDTH, zIndex: Z + 1 };
  } else {
    bubbleStyle = {
      position: "fixed",
      top: "50%",
      // Centered in the space left of the side panel when it is open.
      left: panelOpen ? rightLimit / 2 : "50%",
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
          className="pointer-events-none rounded-lg transition-all duration-200"
          style={{
            position: "fixed",
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            // The ring and the dimming share one box-shadow (a separate ring
            // class would be overridden by this inline style).
            boxShadow: [
              `0 0 0 ${tone === "result" ? 3 : 2}px ${RING}`,
              dim ? "0 0 0 9999px rgba(15, 23, 42, 0.45)" : undefined,
            ].filter(Boolean).join(", "),
            zIndex: Z,
          }}
        />
      ) : offscreen ? (
        // Target scrolled away: dim lightly, but let the wheel reach the page.
        dim && <div aria-hidden className="pointer-events-none fixed inset-0 bg-black/40" style={{ zIndex: Z }} />
      ) : !lit ? (
        // A card with nothing to point at (welcome, explanations).
        <div aria-hidden className="fixed inset-0 bg-black/60" style={{ zIndex: Z }} />
      ) : (
        // The target isn't on screen yet (still rendering, or hidden): dim
        // lightly but never cover the page, so nothing becomes unclickable.
        dim && <div aria-hidden className="pointer-events-none fixed inset-0 bg-black/40" style={{ zIndex: Z }} />
      )}

      <div
        ref={bubbleRef}
        // Clicks in the bubble are tour clicks, not "outside" clicks: popovers
        // such as the ESV box ignore them, so Continue doesn't close them.
        data-tour-ui
        role="dialog"
        aria-label={title}
        style={bubbleStyle}
        data-compact={compact ? "true" : "false"}
        className={`rounded-2xl bg-white ${compact ? "px-3 py-2" : docked ? "p-4" : "p-5"} text-left text-sm text-gray-700 shadow-2xl transition-shadow dark:bg-gray-900 dark:text-gray-200 ${nudge ? "ring-4 ring-primary/50" : ""}`}
      >
        {compact ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={`${title}: show the step`}
              className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 text-left"
            >
              {done ? (
                <IconCircleCheckFilled size={20} className="shrink-0 text-primary" aria-hidden />
              ) : (
                <IconArrowDown size={18} stroke={2.2} className="shrink-0 rotate-180 text-primary" aria-hidden />
              )}
              <span className="truncate text-[15px] font-semibold text-black dark:text-white">{title}</span>
            </button>
            <div className="flex shrink-0 items-center gap-2 [&>button:not(:last-child)]:hidden">{actions}</div>
          </div>
        ) : (
        <>
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
              onClick={() => reveal(lit)}
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
          <p className="mt-3 text-sm font-medium text-primary" role="status">Nice, that&rsquo;s it.{tone === "result" ? " The result is highlighted." : ""} Take a look, then {touch ? "tap" : "click"} Continue.</p>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">{actions}</div>
        </>
        )}
      </div>
    </>
  );
};

export default TourOverlay;

export const tourPrimaryButton =
  "whitespace-nowrap rounded-lg bg-primary py-2 px-4 text-center text-sm text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
export const tourSecondaryButton =
  "whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
