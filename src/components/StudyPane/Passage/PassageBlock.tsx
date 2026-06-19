import { useContext, createContext } from "react"
import { FormatContext } from ".."
import { useState, useEffect } from "react";
import { StanzaBlock } from './StanzaBlock';
import { LanguageMode } from '@/lib/types';

export const LanguageContext = createContext({
  ctxIsHebrew: false
})

export const PassageBlock = ( {isHebrew}: {isHebrew: boolean} ) => {

  const { ctxPassageProps, ctxLanguageMode, ctxStropheNoteBtnOn, ctxReadmeBtnOn } = useContext(FormatContext);

  const [isNarrow, setIsNarrow] = useState(false);

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
    ctxIsHebrew: isHebrew
  }

  const isParallel = ctxLanguageMode == LanguageMode.Parallel;
  // Reader mode tiles stanzas vertically (full width), matching strophe and
  // line stacking, rather than the horizontal study-mode layout.
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
    ? `w-full min-w-0 ${isHebrew ? 'hbFont' : ''}`
    : isHebrew
    ? `hbFont ${allowPassageGrowth ? 'w-fit min-w-full max-w-none' : isParallel ? 'w-fit max-w-none shrink-0' : shouldStackStanzas ? 'w-[100%]' : 'w-[70%]'}`
    : allowPassageGrowth ? 'w-fit min-w-full max-w-none' : isParallel ? 'w-fit max-w-none shrink-0' : 'w-[100%]';

  return (
    <LanguageContext.Provider value={languageContextValue}>
    <div id={`selaPassage_${isHebrew ? 'heb' : 'eng'}`} className={`${passageWidthClass} max-w-full flex relative px-2 py-4`}>
        <div className={`flex ${stanzaLayoutClass}`}>
        {
            ctxPassageProps.stanzaProps.map((stanza) => {
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
