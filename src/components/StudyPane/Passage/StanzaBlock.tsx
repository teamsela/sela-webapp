import { LanguageMode } from "@/lib/types";
import { StanzaProps } from "@/lib/data";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FormatContext } from ".."
import { StropheBlock } from "./StropheBlock";
import { TbArrowBarLeft, TbArrowBarRight } from "react-icons/tb";
import { updateMetadataInDb } from "@/lib/actions";
import { LanguageContext } from "./PassageBlock";

export const StanzaBlock = ({
  stanzaProps, isForNotes
}: {
  stanzaProps: StanzaProps, isForNotes: boolean
}) => {

  const { ctxStudyMetadata, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxStudyId, ctxInViewMode, ctxLanguageMode, ctxStropheNotesActive } = useContext(FormatContext);
  const { ctxIsHebrew } = useContext(LanguageContext);
  const [expanded, setExpanded] = useState(stanzaProps.metadata?.expanded ?? true);
  const [stropheWidths, setStropheWidths] = useState<Record<number, number>>({});

  const handleStropheWidthChange = useCallback((stropheId: number, width: number) => {
    setStropheWidths((prev) => {
      const previousWidth = prev[stropheId];
      if (previousWidth === width) {
        return prev;
      }
      return { ...prev, [stropheId]: width };
    });
  }, []);

  const maxStropheNoteWidth = useMemo(() => {
    const widths = Object.values(stropheWidths);
    if (!widths.length) {
      return undefined;
    }
    return Math.max(...widths);
  }, [stropheWidths]);
  

  const handleCollapseBlockClick = () => {
    setExpanded(prevState => !prevState);

    stanzaProps.metadata.expanded = !expanded;
    const firstWordIdinStanza = stanzaProps.strophes[0].lines[0].words[0].wordId;
    if (ctxStudyMetadata.words[firstWordIdinStanza]) {
      ctxStudyMetadata.words[firstWordIdinStanza].stanzaMd ??= {};
      ctxStudyMetadata.words[firstWordIdinStanza].stanzaMd.expanded = stanzaProps.metadata.expanded;  
    }

    if (!ctxInViewMode) {
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    }

    // remove any selected word blocks if stanza block is collapsed or expanded
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
  }
  
  useEffect(() => {
    stanzaProps.metadata?.expanded ? setExpanded(true) : setExpanded(false)
    if(stanzaProps.metadata?.expanded === undefined) {
      setExpanded(true)
    }
  }, [stanzaProps.metadata?.expanded])

  const renderArrow = () => {
    if ((ctxLanguageMode == LanguageMode.Parallel) || ctxStropheNotesActive) {
      if (expanded) {
        return (
            <TbArrowBarLeft className="rotate-[-90deg]" fontSize="1.1em" style={{pointerEvents:'none'}} />
        )
      }
      else {
        return (
          <>
          { 
            ctxIsHebrew ? <TbArrowBarRight fontSize="1.1em" style={{pointerEvents:'none'}} /> : <TbArrowBarLeft fontSize="1.1em" style={{pointerEvents:'none'}} />
          } 
          </>
        )  
      }
   
    }
    else {
      return (
        <>
          { ((!expanded && ctxIsHebrew) || (expanded && !ctxIsHebrew)) && <TbArrowBarLeft fontSize="1.1em" style={{pointerEvents:'none'}} /> }
          { ((!expanded && !ctxIsHebrew) || (expanded && ctxIsHebrew)) && <TbArrowBarRight fontSize="1.1em" style={{pointerEvents:'none'}} /> }        
        </>
      )        
    }
  }

  return(
      <div
      key={"stanza_" + stanzaProps.stanzaId}
      className={`relative ${(ctxLanguageMode == LanguageMode.Parallel) || ctxStropheNotesActive ? 'flex flex-row-reverse' : 'pt-10'} grow-0 ${expanded ? 'flex-1' : ''} mr-1 px-1 py-2 my-1 rounded border`} 
      >
      <div
        className={`z-1 ${ctxLanguageMode == LanguageMode.Parallel || ctxStropheNotesActive ? 'relative' : 'absolute'} top-0 p-[0.5] m-[0.5] bg-transparent ${ctxIsHebrew ? 'left-0' : 'right-0'}`}
        >
      <button
        key={"strophe" + stanzaProps.stanzaId + "Selector"}
        className={`p-2 m-1 hover:bg-theme active:bg-transparent`}
        onClick={() => handleCollapseBlockClick()}
        data-clicktype={'clickable'}
      >
        
        { renderArrow() }

      </button>
      </div>
      <div className={`flex-column ${(ctxLanguageMode == LanguageMode.Parallel) || ctxStropheNotesActive ? 'w-full' : ''}`}>
      {
          stanzaProps.strophes.map((strophe) => {
              return (
                  <StropheBlock
                  stropheProps={strophe}
                  key={strophe.stropheId}
                  stanzaExpanded={expanded}
                  onWordAreaWidthChange={handleStropheWidthChange}
                  maxStanzaNoteWidth={maxStropheNoteWidth}
                  isForNotes={isForNotes}
                  />
              )
          })
      }
      </div>
      </div>
  )
}
