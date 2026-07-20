import React, { useContext } from "react";
import { FormatContext, DEFAULT_COLOR_FILL } from "../index";
import { StropheProps } from "@/lib/data";
import { BoxDisplayStyle } from "@/lib/types";
import { countLineUnits, readStropheNoteTitle } from "@/lib/counter";

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
}: {
  stropheProps: StropheProps;
  stanzaExpanded: boolean;
}) => {
  const { ctxBoxDisplayConfig, ctxCounterMode, ctxStudyNotes, ctxActiveLayerId } =
    useContext(FormatContext);

  const expanded = stropheProps.metadata?.expanded ?? true;
  const shouldRender = expanded && stanzaExpanded;

  // Reserve the same vertical space the passage gives a strophe-note title so a
  // titled strophe's counts don't drift up relative to its words. Same bold/size
  // styling as the real title (see StropheBlock), painted in the fill color.
  const hasStropheTitle = Boolean(
    readStropheNoteTitle(ctxStudyNotes, ctxActiveLayerId, stropheProps.stropheId)
  );

  const cell = buildCellGeometry(ctxBoxDisplayConfig.style);

  return (
    <div
      // Horizontal margin (mx-2) insets the count box from the column edges so it
      // gets a little breathing room from the neighbouring language columns.
      // Margin is horizontal-only, so the vertical row alignment with the words
      // is unaffected.
      className="relative flex flex-col px-2 py-2 mx-2 my-1 min-h-[45px] rounded border"
      style={{
        background: DEFAULT_COLOR_FILL,
        // White border (same as the fill) so the box is invisible but keeps its
        // 2px footprint — the numbers just sit on the white column background.
        border: `2px solid ${DEFAULT_COLOR_FILL}`,
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
                  <div className="mb-2 flex w-full items-center justify-center">
                    <span
                      className="block text-base font-semibold"
                      style={{ color: DEFAULT_COLOR_FILL }}
                      aria-hidden="true"
                    >
                      {TITLE_PLACEHOLDER}
                    </span>
                  </div>
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
