import { StanzaData } from "@/lib/data"
import { useContext, useState } from "react"
import { FormatContext } from ".."
import { StropheBlock } from "./StropheBlock"
import { TbArrowBarLeft, TbArrowBarRight } from "react-icons/tb";
import { updateStanzaState } from "@/lib/actions"

export const  StanzaBlock = ({
    stanza
}: {
    stanza: StanzaData
}) => {

    const { ctxIsHebrew, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxStudyId, ctxInViewMode } = useContext(FormatContext);
    const [expanded, setExpanded] = useState(stanza.expanded != undefined ? stanza.expanded : true);

    const handleCollapseBlockClick = () => {
      setExpanded(prevState => !prevState);
      if (!ctxInViewMode) {
        updateStanzaState(ctxStudyId, stanza.id, !expanded);
      }
      if (expanded) {
        // remove any selected word blocks if strophe block is collapsed
        ctxSetSelectedHebWords([]);
        ctxSetNumSelectedWords(0);
      }
    }

    return(
        <div
        key={"stanza_" + stanza.id}
        className={`relative flex-column pt-10 ${expanded ? 'flex-1' : ''} mr-1 px-1 py-2 my-1 rounded border`} 
        >
        <div
          className={`z-1 absolute top-0 p-[0.5] m-[0.5] bg-transparent ${ctxIsHebrew ? 'left-0' : 'right-0'}`}
          >
        <button
          key={"strophe" + stanza.id + "Selector"}
          className={`p-2 m-1 hover:bg-theme active:bg-transparent`}
          onClick={() => handleCollapseBlockClick()}
          data-clicktype={'clickable'}
        >
          { ((!expanded && ctxIsHebrew) || (expanded && !ctxIsHebrew)) && <TbArrowBarLeft fontSize="1.1em" style={{pointerEvents:'none'}} /> }
          { ((!expanded && !ctxIsHebrew) || (expanded && ctxIsHebrew)) && <TbArrowBarRight fontSize="1.1em" style={{pointerEvents:'none'}} /> }
        </button>
        </div>
        {
            stanza.strophes.map((strophe) => {
                return (
                    <StropheBlock 
                    strophe={strophe}
                    key={strophe.id}
                    stanzaExpanded={expanded}
                    />
                )
            })
        }
        </div>
    )
}