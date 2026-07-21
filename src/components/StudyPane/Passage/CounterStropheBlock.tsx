import React, { useContext } from "react";
import { FormatContext, DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR } from "../index";
import { StropheProps } from "@/lib/data";
import { BoxDisplayStyle } from "@/lib/types";
import { countLineUnits, readStropheNoteTitle } from "@/lib/counter";
import { StropheAlignContext } from "./stropheAlign";

// Vertical geometry of a single word cell, mirrored from WordBlock + StropheBlock
// so a count sits at exactly the same height as the word row beside it. The count
// isn't a real word box, so we reproduce the box's margins / padding / border /
// line-height (all transparent) and only show the number. This keeps the counter
// column in lockstep with the passage as the box-display mode changes (boxless
// removes padding + shrinks line-height; uniform pins every box to h-10).
const buildCellGeometry = (style: BoxDisplayStyle) => {
  const isNoBox = style === BoxDisplayStyle.noBox;
  const isUniform = style === BoxDisplayStyle.uniformBoxes;
  return {
    // renderWords() wrapper spacing
    wordWrapperClass: isNoBox ? "mt-0.5 mb-0.5" : "mt-1 mb-1",
    // WordBlock outer box (transparent, so only geometry shows through)
    boxStyle: {
      boxSizing: "border-box" as const,
      border: "2px solid transparent",
      padding: isNoBox ? "0px" : "2px",
      lineHeight: isNoBox ? "0.8" : "inherit",
    },
    // WordBlock inner text span
    innerClass: [
      "flex select-none items-center justify-center text-center leading-none text-base text-body",
      isNoBox ? "px-0 py-0.5" : "px-2 py-1",
      isUniform ? "h-10" : "",
    ].join(" "),
  };
};

// A blank line the color of the strophe fill, sized like a real strophe-note
// title, used to reserve the extra vertical space a titled strophe takes so its
// counts stay row-aligned with its words.
const TITLE_PLACEHOLDER = "\u00A0";

export const CounterStropheBlock = ({
  stropheProps,
  stanzaExpanded,
  bordered = false,
}: {
  stropheProps: StropheProps;
  stanzaExpanded: boolean;
  // When true (single-language side-by-side counter stack) the box gets a
  // visible neutral border so it reads as a strophe box matching the language
  // stack. When false (parallel counter column) the border matches the fill and
  // is invisible — the numbers just float on the white column.
  bordered?: boolean;
}) => {
  const { ctxBoxDisplayConfig, ctxCounterMode, ctxStudyNotes, ctxActiveLayerId } =
    useContext(FormatContext);
  const stropheAlign = useContext(StropheAlignContext);

  const expanded = stropheProps.metadata?.expanded ?? true;
  const shouldRender = expanded && stanzaExpanded;

  // Reserve the same vertical space the passage gives a strophe-note title so a
  // titled strophe's counts don't drift up relative to its words. Same bold/size
  // styling as the real title (see StropheBlock), painted in the fill color.
  const hasStropheTitle = Boolean(
    readStropheNoteTitle(ctxStudyNotes, ctxActiveLayerId, stropheProps.stropheId)
  );
  // The real, measured title height reported by the language StropheBlock. When
  // available we reserve exactly that (a long title can wrap to several lines);
  // until it arrives, fall back to a single placeholder line.
  const measuredTitleHeight = stropheAlign?.titleHeights[stropheProps.stropheId];

  const cell = buildCellGeometry(ctxBoxDisplayConfig.style);

  return (
    <div
      // Horizontal padding/margin here only inset the box; they are horizontal so
      // the vertical row alignment with the words is unaffected. The bordered
      // variant matches StropheBlock's px-5/mx-1 so it looks like a strophe box;
      // the parallel variant keeps the tighter px-2/mx-2 float.
      className={`relative flex flex-col py-2 my-1 min-h-[45px] rounded border ${
        bordered ? "px-5 mx-1" : "px-2 mx-2"
      }`}
      style={{
        background: DEFAULT_COLOR_FILL,
        // Bordered: a light neutral border (DEFAULT_BORDER_COLOR) so the box reads
        // like an uncolored strophe. Parallel: border matches the fill so the box
        // is invisible but keeps its 2px footprint for row alignment.
        border: `2px solid ${bordered ? DEFAULT_BORDER_COLOR : DEFAULT_COLOR_FILL}`,
      }}
    >
      {shouldRender && (
        // Mirror StropheBlock's content nesting exactly. The innermost div is a
        // plain BLOCK: the passage renders its line rows in a block container
        // where adjacent `my-1` margins COLLAPSE (4px between rows). If the rows
        // were direct children of the flex-col strophe box instead, flex-item
        // margins would not collapse (8px between rows) and every count would
        // drift ~4px lower than its word, worsening down the column. Keeping the
        // same block wrapper makes the collapse — and thus the row rhythm —
        // identical to the words.
        <div className="w-full min-w-0 flex flex-col gap-5">
          <div className="relative">
            <div className="min-w-0 overflow-x-auto">
              <div>
                {hasStropheTitle && (
                  measuredTitleHeight ? (
                    <div
                      className="mb-2 w-full"
                      style={{ height: measuredTitleHeight }}
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="mb-2 flex w-full items-center justify-center">
                      <span
                        className="block text-base font-semibold"
                        style={{ color: DEFAULT_COLOR_FILL }}
                        aria-hidden="true"
                      >
                        {TITLE_PLACEHOLDER}
                      </span>
                    </div>
                  )
                )}
                {stropheProps.lines.map((line, lineId) => {
                  const lineKey = `counter-strophe-${stropheProps.stropheId}-line-${lineId}`;
                  return (
                    <React.Fragment key={lineKey}>
                      {line.paragraphBreakBefore && <div className="h-6" aria-hidden="true" />}
                      {/* Row wrapper mirrors renderWordRow (flex my-1) */}
                      <div className="flex my-1 justify-center">
                        {/* WordBlock wrapper + box + inner span, geometry only */}
                        <div className={cell.wordWrapperClass}>
                          <div className="rounded border" style={cell.boxStyle}>
                            <span className={cell.innerClass}>
                              {countLineUnits(line.words, ctxCounterMode)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
