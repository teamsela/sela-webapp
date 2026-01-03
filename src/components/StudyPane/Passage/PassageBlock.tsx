import { useContext, createContext } from "react"
import { FormatContext } from ".."
import { useState, useEffect } from "react";
import { StanzaBlock } from './StanzaBlock';
import { LanguageMode } from '@/lib/types';

export const LanguageContext = createContext({
  ctxIsHebrew: false
})

export const PassageBlock = ( {isHebrew}: {isHebrew: boolean} ) => {

  const { ctxPassageProps, ctxLanguageMode } = useContext(FormatContext);

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

  //if window <1350px, apply w-fit instead to make sure word box doesnt run out
  const widthClass = isNarrow ? "w-fit" : (isHebrew ? "w-[70%]" : "w-[100%]");

  return (
    <LanguageContext.Provider value={languageContextValue}>
    <div id={`selaPassage_${isHebrew ? 'heb' : 'eng'}`} className={`${isHebrew ? "hbFont" : ""} ${widthClass} flex relative pl-2 py-4`}>
        <div className={`flex ${ctxLanguageMode == LanguageMode.Parallel ? 'flex-col w-[100%] max-w-[100%]' : 'flex-row max-w-[600px]'}`}>
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