import { StanzaProps } from "@/lib/data"
import { useContext, useState } from "react"
import { FormatContext } from ".."
import { StropheBlock } from "./StropheBlock"
import { TbArrowBarLeft, TbArrowBarRight } from "react-icons/tb";
import { updateMetadataInDb } from "@/lib/actions"

export const StanzaBlock = ({
  stanzaProps
}: {
  stanzaProps: StanzaProps
}) => {

  const { ctxIsHebrew, ctxStudyMetadata, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxStudyId, ctxInViewMode } = useContext(FormatContext);
  const [expanded, setExpanded] = useState(stanzaProps.metadata?.expanded ?? true);

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
  
  return(
      <div
      key={"stanza_" + stanzaProps.stanzaId}
      className={`relative flex-column pt-10 ${expanded ? 'flex-1' : ''} mr-1 px-1 py-2 my-1 rounded border`} 
      >
      <div
        className={`z-1 absolute top-0 p-[0.5] m-[0.5] bg-transparent ${ctxIsHebrew ? 'left-0' : 'right-0'}`}
        >
      <button
        key={"strophe" + stanzaProps.stanzaId + "Selector"}
        className={`p-2 m-1 hover:bg-theme active:bg-transparent`}
        onClick={() => handleCollapseBlockClick()}
        data-clicktype={'clickable'}
      >
        { ((!expanded && ctxIsHebrew) || (expanded && !ctxIsHebrew)) && <TbArrowBarLeft fontSize="1.1em" style={{pointerEvents:'none'}} /> }
        { ((!expanded && !ctxIsHebrew) || (expanded && ctxIsHebrew)) && <TbArrowBarRight fontSize="1.1em" style={{pointerEvents:'none'}} /> }
      </button>
      </div>
      {
          stanzaProps.strophes.map((strophe) => {
              return (
                  <StropheBlock
                  stropheProps={strophe}
                  key={strophe.stropheId}
                  stanzaExpanded={expanded}
                  />
              )
          })
      }
      </div>
  )
}