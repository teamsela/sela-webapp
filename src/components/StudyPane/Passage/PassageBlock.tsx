import { useContext, createContext } from "react"
import { FormatContext } from ".."
import { useState, useEffect } from "react";
import { StanzaBlock } from './StanzaBlock';

export const LanguageContext = createContext({
  ctxIsHebrew: false
})

export const PassageBlock = ( {isHeb}: {isHeb: boolean} ) => {

  const { ctxStudyId, ctxPassageProps, ctxSetPassageProps, ctxStudyMetadata, 
    ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords, 
    ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxStructureUpdateType, ctxSetStructureUpdateType, ctxAddToHistory, ctxLanguageMode
  } = useContext(FormatContext);

  const [isHebrew, setHebrew] = useState(false);
  useEffect(() => {
    isHeb ? setHebrew(true) : setHebrew(false);
  }, [isHeb])

  const languageContextValue = {
    ctxIsHebrew: isHebrew
  }
  
  return (
    <LanguageContext.Provider value={languageContextValue}>
    <div id={`selaPassage_${isHebrew ? 'heb' : 'eng'}`} className={`${isHebrew ? "hbFont w-[70%]" : "w-[100%]"} flex relative pl-2 py-4`}>
        <div className={`flex ${ctxLanguageMode.Parallel ? 'flex-col w-[100%] max-w-[100%]' : 'flex-row max-w-[600px]'}`}>
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