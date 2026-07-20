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
}: {
  displayMode: PassageDisplayMode;
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

  return (
    <LanguageContext.Provider value={languageContextValue}>
    <div id={`selaPassage_${displayMode}`} className={`${passageWidthClass} max-w-full flex relative px-2 py-4 ${counterWrapperClass}`}>
        <div className={`flex ${stanzaLayoutClass}`}>
        {
            displayMode === 'counter'
              ? ctxPassageProps.stanzaProps.map((stanza, stanzaIdx) => (
                  <CounterStanzaBlock
                    key={stanza.stanzaId}
                    stanzaProps={stanza}
                    isFirstStanza={stanzaIdx === 0}
                  />
                ))
              : ctxPassageProps.stanzaProps.map((stanza) => {
                  return (
                      <StanzaBlock stanzaProps={stanza} key={stanza.stanzaId} />
                  )
                })
        }
        </div>
    </div>
    </LanguageContext.Provider>
  )

}
