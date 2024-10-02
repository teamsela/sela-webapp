import { StanzaData } from "@/lib/data"
import { useContext, useEffect, useState } from "react"
import { FormatContext } from ".."
import { StropheBlock } from "./StropheBlock"
import { BiSolidArrowFromLeft, BiSolidArrowFromRight, BiSolidArrowFromTop } from "react-icons/bi";
import { updateStanzaState } from "@/lib/actions"

export const  StanzaBlock = ({
    stanza
}: {
    stanza: StanzaData
}) => {

    const { ctxIsHebrew, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxStudyId } = useContext(FormatContext);
    const [expanded, setExpanded] = useState(stanza.expanded != undefined ? stanza.expanded : true);

    const handleCollapseBlockClick = () => {
      setExpanded(prevState => !prevState);
      updateStanzaState(ctxStudyId, stanza.id, !expanded);
      if (expanded) {
        // remove any selected word blocks if strophe block is collapsed
        ctxSetSelectedHebWords([]);
        ctxSetNumSelectedWords(0);
        
      }
    }

    return(
        <div
        key={"stanza_" + stanza.id}
        className={`relative flex-column pt-10 flex-shrink-0 mr-1 px-1 py-2 my-1 rounded border`} 
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
          { (!expanded && ctxIsHebrew) && <BiSolidArrowFromLeft style={{pointerEvents:'none'}} /> }
          { (!expanded && !ctxIsHebrew) && <BiSolidArrowFromRight style={{pointerEvents:'none'}} /> }
          { expanded && <BiSolidArrowFromTop style={{pointerEvents:'none'}} /> }
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