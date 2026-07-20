import { StanzaProps } from "@/lib/data";
import { useContext, useEffect, useState } from "react";
import { CounterStropheBlock } from "./CounterStropheBlock";
import { FormatContext } from "../index";

export const CounterStanzaBlock = ({
  stanzaProps,
  isFirstStanza,
}: {
  stanzaProps: StanzaProps;
  isFirstStanza: boolean;
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

  const labelText = ctxCounterMode === "units" ? "Units" : "Words";

  return (
    // Mirrors StanzaBlock's root so the counter column tracks each stanza's
    // vertical extent (flex-1 + border) and its strophes stay row-aligned.
    <div className={`relative flex flex-col ${expanded ? "flex-1" : ""} rounded border`}>
      {/* Title row — mirrors the stanza title row (always present when expanded so
          every stanza reserves the same space). Only the FIRST stanza shows the
          visible Words/Units label — a blue pill (bg-primary, like the study
          toolbar buttons), centered. The rest reserve the same row invisibly
          (transparent text) so there is a single label aligned to the first
          stanza title. `py-1 text-base` keeps the pill at the stanza-title row
          height so the strophes below stay row-aligned with the passage. */}
      {expanded && stanzaProps.strophes.length > 0 && (
        // Fixed h-8 (32px) matches the stanza-title row height, so the small
        // text-[10px] pill (same size as the single-language counter label) no
        // longer drives the row height and the strophes below stay row-aligned.
        // No `mx-1`/`w-full`: combined they overflow the w-fit stanza and shift
        // the pill ~4px right of the count column; a plain centered flex row
        // keeps the pill on the same axis as the numbers below.
        <div className="flex h-8 items-center justify-center">
          <span
            className={`select-none whitespace-nowrap rounded px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isFirstStanza ? "bg-primary text-white" : ""
            }`}
            style={isFirstStanza ? undefined : { color: "transparent" }}
            aria-hidden={!isFirstStanza}
          >
            {labelText}
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
