import { useContext, createContext } from "react"
import { FormatContext } from ".."
import { useState, useEffect } from "react";
import { StanzaBlock } from './StanzaBlock';
import { CounterStanzaBlock } from './CounterStanzaBlock';
import { LanguageMode } from '@/lib/types';

export type PassageDisplayMode = "gloss" | "hebrew" | "transliteration" | "counter";

export const LanguageContext = createContext({
  ctxIsHebrew: false,
  ctxDisplayMode: "gloss" as PassageDisplayMode,
})

export const PassageBlock = ({
  displayMode,
  columnRef,
  sharedMinWidth,
}: {
  displayMode: PassageDisplayMode;
  // Set by Passage on the two parallel language columns: a callback ref to the
  // stanza container (for measuring its natural width) and the shared min-width
  // to apply so both language columns are the same width and a strophe-note
  // title wraps identically in each. Undefined for single-language columns.
  columnRef?: (node: HTMLDivElement | null) => void;
  sharedMinWidth?: number | null;
}) => {

  const { ctxPassageProps, ctxLanguageMode, ctxStropheNoteBtnOn, ctxReadmeBtnOn, ctxInTextCounterOn } = useContext(FormatContext);

  const [isNarrow, setIsNarrow] = useState(false);
  const isHebrew = displayMode === "hebrew";
  const isNonEnglish = displayMode === "hebrew" || displayMode === "transliteration";

  //check window size of passage
  useEffect(() => {
    const primaryWindow = document.querySelector('#selaPassage')?.parentElement;
    if (!primaryWindow) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < 1350);
      }
    });

    resizeObserver.observe(primaryWindow);

    return () => resizeObserver.disconnect();
  }, []);

  const languageContextValue = {
    ctxIsHebrew: isNonEnglish,
    ctxDisplayMode: displayMode,
  }

  const isParallel = ctxLanguageMode == LanguageMode.Parallel;
  const shouldStackStanzas = ctxStropheNoteBtnOn || isParallel || ctxReadmeBtnOn;
  const allowPassageGrowth = ctxStropheNoteBtnOn && !ctxReadmeBtnOn;
  const stackedWidthClass = allowPassageGrowth
    ? 'w-fit min-w-full max-w-none'
    : isParallel
      ? 'w-fit max-w-none'
      : 'w-[100%] max-w-[100%]';
  const stanzaLayoutClass = shouldStackStanzas
    ? `flex-col ${stackedWidthClass} gap-2`
    : `flex-row max-w-[600px]`;
  const passageWidthClass = ctxReadmeBtnOn && !isParallel
    ? `w-full min-w-0 ${isNonEnglish ? 'hbFont' : ''}`
    : isNonEnglish
    ? `hbFont ${allowPassageGrowth ? 'w-fit min-w-full max-w-none' : isParallel ? 'w-fit max-w-none shrink-0' : shouldStackStanzas ? 'w-[100%]' : 'w-[70%]'}`
    : allowPassageGrowth ? 'w-fit min-w-full max-w-none' : isParallel ? 'w-fit max-w-none shrink-0' : 'w-[100%]';

  // The counter column auto-sizes (w-fit via passageWidthClass) to its widest
  // content — the one-line "Words" / "Units" label — so there is no dead space
  // and the count boxes fill to that width. shrink-0 keeps it from collapsing.
  const counterWrapperClass = displayMode === "counter"
    ? (ctxInTextCounterOn ? "shrink-0" : "hidden")
    : "";

  // Single-language in-text counter: when the stanzas stack vertically (reader
  // mode or the strophe-notes view), every stanza's counter column lines up in
  // the same left gutter, so repeating the WORDS/UNITS pill on each is
  // redundant — show it only on the first non-collapsed stanza. When the
  // stanzas sit side by side (normal single mode) each keeps its own pill.
  // The parallel-mode counter column (CounterStanzaBlock) also uses this index
  // so the single visible pill lands on the first expanded stanza — otherwise a
  // collapsed first stanza would hide the label entirely.
  const stanzasStacked = !isParallel && (ctxStropheNoteBtnOn || ctxReadmeBtnOn);
  const firstExpandedStanzaIdx = ctxPassageProps.stanzaProps.findIndex(
    (stanza) => (stanza.metadata?.expanded ?? true) !== false
  );

  return (
    <LanguageContext.Provider value={languageContextValue}>
    {/* In parallel mode each column uses half the horizontal padding (px-1) so
        the gap between two adjacent columns is 8px instead of a doubled 16px; the
        parallel wrapper adds a matching px-1 so the outer edges stay at 8px too. */}
    <div id={`selaPassage_${displayMode}`} className={`${passageWidthClass} max-w-full flex relative ${isParallel ? 'px-1' : 'px-2'} py-4 ${counterWrapperClass}`}>
        {/* min-width equalizes the two parallel language columns. Both the
            measuring ref and the min-width live on THIS shrink-to-content (w-fit)
            container so measure and constraint use the same box (converges instead
            of drifting); its StanzaBlock children stretch, so the strophe boxes
            widen and a strophe-note title wraps at the same width in both. */}
        <div ref={columnRef} className={`flex ${stanzaLayoutClass}`} style={sharedMinWidth ? { minWidth: sharedMinWidth } : undefined}>
        {
            displayMode === 'counter'
              ? ctxPassageProps.stanzaProps.map((stanza, stanzaIdx) => (
                  <CounterStanzaBlock
                    key={stanza.stanzaId}
                    stanzaProps={stanza}
                    showLabel={stanzaIdx === firstExpandedStanzaIdx}
                  />
                ))
              : ctxPassageProps.stanzaProps.map((stanza, stanzaIdx) => {
                  return (
                      <StanzaBlock
                        stanzaProps={stanza}
                        key={stanza.stanzaId}
                        showCounterLabel={!stanzasStacked || stanzaIdx === firstExpandedStanzaIdx}
                      />
                  )
                })
        }
        </div>
    </div>
    </LanguageContext.Provider>
  )

}
