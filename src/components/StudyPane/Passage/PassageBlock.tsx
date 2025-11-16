import { useContext, createContext } from "react"
import { FormatContext } from ".."
import { useState, useEffect } from "react";
import { StanzaBlock } from './StanzaBlock';
import { LanguageMode } from '@/lib/types';

export const LanguageContext = createContext({
  ctxIsHebrew: false
})

export const PassageBlock = ( {isHebrew, isForNotes}: {isHebrew: boolean, isForNotes: boolean} ) => {

  const { ctxPassageProps, ctxLanguageMode, ctxStropheNotesActive } = useContext(FormatContext);

  // const [isHebrew, setHebrew] = useState(false);
  // useEffect(() => {
  //   setHebrew(isHeb);
  // }, [isHeb])
  
  const languageContextValue = {
    ctxIsHebrew: isHebrew
  }

  return (
    <LanguageContext.Provider value={languageContextValue}>
    <div id={`selaPassage_${isHebrew ? 'heb' : 'eng'}`} className={`${isHebrew ? "hbFont w-[70%]" : "w-[100%]"} flex relative pl-2 py-4`}>
        <div className={`flex ${(ctxLanguageMode == LanguageMode.Parallel) || ctxStropheNotesActive ? 'flex-col' : 'flex-row max-w-[600px]'}`}>
        {
            ctxPassageProps.stanzaProps.map((stanza) => {
            return (
                <StanzaBlock stanzaProps={stanza} key={stanza.stanzaId} isForNotes={isForNotes} />
            )
            })
        }
        </div>
    </div>
    </LanguageContext.Provider>
  )

}