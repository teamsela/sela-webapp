import { useContext, createContext } from "react"
import { FormatContext } from ".."
import { useState, useEffect } from "react";
import { StanzaBlock } from './StanzaBlock';
import { LanguageMode } from '@/lib/types';

export const LanguageContext = createContext({
  ctxIsHebrew: false
})

export const PassageBlock = ( {isHebrew}: {isHebrew: boolean} ) => {

  const { ctxPassageProps, ctxLanguageMode, ctxStropheNoteBtnOn } = useContext(FormatContext);

  // const [isHebrew, setHebrew] = useState(false);
  // useEffect(() => {
  //   setHebrew(isHeb);
  // }, [isHeb])
  
  const languageContextValue = {
    ctxIsHebrew: isHebrew
  }

  const shouldStackStanzas = ctxStropheNoteBtnOn || ctxLanguageMode == LanguageMode.Parallel;
  const stanzaLayoutClass = shouldStackStanzas
    ? 'flex-col w-[100%] max-w-[100%] gap-2'
    : 'flex-row max-w-[600px]';
  const passageWidthClass = isHebrew
    ? `hbFont ${shouldStackStanzas ? 'w-[100%]' : 'w-[70%]'}`
    : 'w-[100%]';

  return (
    <LanguageContext.Provider value={languageContextValue}>
    <div id={`selaPassage_${isHebrew ? 'heb' : 'eng'}`} className={`${passageWidthClass} flex relative pl-2 py-4`}>
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
