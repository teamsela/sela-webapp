import { StanzaProps } from "@/lib/data";
import { useContext, useEffect, useState } from "react";
import { CounterStropheBlock } from "./CounterStropheBlock";
import { FormatContext } from "../index";

export const CounterStanzaBlock = ({
  stanzaProps,
  showLabel,
}: {
  stanzaProps: StanzaProps;
  // Whether this stanza's counter column shows the visible WORDS/UNITS pill.
  // True only for the first expanded stanza (see PassageBlock) so a collapsed
  // first stanza doesn't hide the label; the rest reserve the row invisibly.
  showLabel: boolean;
}) => {
  const [expanded, setExpanded] = useState(
    stanzaProps.metadata?.expanded ?? true,
  );

  // Mirror expansion state from the sibling language columns
  useEffect(() => {
    stanzaProps.metadata?.expanded
      ? setExpanded(true)
      : setExpanded(false);
    if (stanzaProps.metadata?.expanded === undefined) {
      setExpanded(true);
    }
  }, [stanzaProps.metadata?.expanded]);

  const { ctxInTextCounterOn, ctxCounterMode } = useContext(FormatContext);

  // When counter is off, render nothing so the language columns sit together
  if (!ctxInTextCounterOn) {
    return null;
  }

  const showsUnits = ctxCounterMode === "units";

  return (
    // Mirrors StanzaBlock's root so the counter column tracks each stanza's
    // vertical extent (flex-1 + border) and its strophes stay row-aligned.
    <div className={`relative flex flex-col ${expanded ? "flex-1" : ""} rounded border bg-white`}>
      {/* Title row — mirrors the stanza title row (always present when expanded so
          every stanza reserves the same space). Only the first EXPANDED stanza
          shows the visible Words/Units label — a blue pill (bg-primary, like the
          study toolbar buttons), centered. The rest reserve the same row
          invisibly (transparent text) so there is a single label aligned to the
          first visible stanza title. `py-1 text-base` keeps the pill at the
          stanza-title row height so the strophes below stay row-aligned. */}
      {expanded && stanzaProps.strophes.length > 0 && (
        // Fixed h-8 (32px) matches the stanza-title row height, so the small
        // text-[10px] pill (same size as the single-language counter label) no
        // longer drives the row height and the strophes below stay row-aligned.
        // No `mx-1`/`w-full`: combined they overflow the w-fit stanza and shift
        // the pill ~4px right of the count column; a plain centered flex row
        // keeps the pill on the same axis as the numbers below.
        <div className="flex h-8 items-center justify-center">
          <span
            // h-8 (32px) matches the stanza-title button height so the pill's
            // background covers the same vertical space as the title's hover
            // highlight; grid + place-items-center keeps the small label centered.
            // Both labels share one grid cell so the pill always sizes to the
            // wider word (WORDS) and its width stays fixed when toggling
            // Words/Units; only the active mode is visible.
            className={`select-none rounded-sm px-2.5 h-8 grid place-items-center text-[10px] font-semibold uppercase tracking-wide ${
              showLabel ? "bg-primary text-white" : ""
            }`}
            style={showLabel ? undefined : { color: "transparent" }}
            aria-hidden={!showLabel}
          >
            <span className={`col-start-1 row-start-1 whitespace-nowrap ${showsUnits ? "" : "invisible"}`}>Units</span>
            <span className={`col-start-1 row-start-1 whitespace-nowrap ${showsUnits ? "invisible" : ""}`}>Words</span>
          </span>
        </div>
      )}
      {/* Strophe container — mirrors StanzaBlock; each strophe is its own box. */}
      <div className="flex flex-col w-full min-w-0">
        {stanzaProps.strophes.map((strophe) => (
          <CounterStropheBlock
            stropheProps={strophe}
            key={strophe.stropheId}
            stanzaExpanded={expanded}
          />
        ))}
      </div>
    </div>
  );
};
