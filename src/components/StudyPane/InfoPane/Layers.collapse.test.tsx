/**
 * Regression tests for the expanded layer-note collapse behaviour.
 *
 * The expanded note used to collapse on ANY mousedown outside the note wrapper,
 * which meant:
 *   - clicking a colour control (highlight / text colour) in the toolbar or the
 *     note's floating format menu closed the note (bug 1), and
 *   - clicking passage content (strophes / words / stanzas) closed it (bug 2).
 *
 * The note must now stay open for clicks anywhere OUTSIDE the layers sidebar
 * (passage, toolbar, portaled format menu) and only collapse when the user
 * clicks elsewhere inside the sidebar (e.g. the layer header).
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { DEFAULT_LAYER_FILL, DEFAULT_LAYER_BORDER, DEFAULT_LAYER_TEXT } from "@/lib/colors";

// Mock the heavy StudyPane index so importing FormatContext is cheap.
vi.mock("..", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

// The confirmation modal pulls in unrelated deps; render nothing.
vi.mock("@/components/Modals/DeleteLayer", () => ({ default: () => null }));

// Stub the Tiptap editor: we only need a recognisable marker for "expanded".
vi.mock("./RichTextEditor", () => ({
  default: () => <div data-testid="rich-editor">note editor</div>,
}));

import Layers from "./Layers";
import { FormatContext } from "..";

const LAYER = { id: 0, name: "Default", fill: DEFAULT_LAYER_FILL, border: DEFAULT_LAYER_BORDER, text: DEFAULT_LAYER_TEXT };
const NOTE_PEEK = "My layer note";

function renderLayers() {
  const ctx: any = {
    ctxColorAction: 0,
    ctxSelectedColor: "",
    ctxSetColorAction: vi.fn(),
    ctxSetSelectedColor: vi.fn(),
    ctxSetColorFill: vi.fn(),
    ctxSetBorderColor: vi.fn(),
    ctxSetTextColor: vi.fn(),
    ctxNumSelectedLayers: 0,
    ctxSetNumSelectedLayers: vi.fn(),
    ctxNumSelectedWords: 0,
    ctxSetSelectedWords: vi.fn(),
    ctxSetNumSelectedWords: vi.fn(),
    ctxNumSelectedStrophes: 0,
    ctxSetSelectedStrophes: vi.fn(),
    ctxSetNumSelectedStrophes: vi.fn(),
    ctxStudyId: "study-1",
    ctxStudyNotes: JSON.stringify({ layerNotes: { "0": NOTE_PEEK } }),
    ctxSetStudyNotes: vi.fn(),
    ctxLayers: [LAYER],
    ctxSetLayers: vi.fn(),
    ctxActiveLayerId: 0,
    ctxSwitchLayer: vi.fn(),
    ctxCreateLayer: vi.fn(),
    ctxDeleteLayer: vi.fn(),
    ctxInViewMode: false,
  };

  return render(
    <FormatContext.Provider value={ctx}>
      <Layers />
    </FormatContext.Provider>,
  );
}

/** Expand the note by clicking its one-line peek. */
function expandNote() {
  fireEvent.click(screen.getByText(NOTE_PEEK));
  expect(screen.getByTestId("rich-editor")).toBeInTheDocument();
}

const isExpanded = () => screen.queryByTestId("rich-editor") !== null;

describe("Layers expanded-note collapse", () => {
  let outside: HTMLElement;

  beforeEach(() => {
    outside = document.createElement("div");
    document.body.appendChild(outside);
  });

  it("stays open when clicking a colour control outside the sidebar (bug 1: toolbar)", () => {
    renderLayers();
    expandNote();

    // A toolbar colour swatch lives above the panes — outside the sidebar.
    fireEvent.mouseDown(outside);

    expect(isExpanded()).toBe(true);
  });

  it("stays open when clicking the note's floating colour menu (bug 1: role=menu)", () => {
    renderLayers();
    expandNote();

    // The rich-text format menu is portaled to <body> with role="menu".
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    const swatch = document.createElement("button");
    menu.appendChild(swatch);
    document.body.appendChild(menu);

    fireEvent.mouseDown(swatch);

    expect(isExpanded()).toBe(true);
  });

  it("stays open when clicking passage content — strophes / words / stanzas (bug 2)", () => {
    renderLayers();
    expandNote();

    // The passage pane is a sibling of the sidebar, outside it.
    fireEvent.mouseDown(outside);

    expect(isExpanded()).toBe(true);
  });

  it("still collapses when clicking the layer header inside the sidebar", () => {
    renderLayers();
    expandNote();

    // The layer name sits in the header row, inside the sidebar but outside the note.
    fireEvent.mouseDown(screen.getByText("Default"));

    expect(isExpanded()).toBe(false);
    expect(screen.getByText(NOTE_PEEK)).toBeInTheDocument();
  });
});
