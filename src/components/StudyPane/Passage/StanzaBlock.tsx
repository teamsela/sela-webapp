import { StanzaData } from "@/lib/data"
import { useContext, useEffect, useState } from "react"
import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, FormatContext } from ".."
import { StropheBlock } from "./StropheBlock"
import { LuTextSelect } from "react-icons/lu"
import { stanzaHasSameColor } from "@/lib/utils"
import { ColorActionType } from "@/lib/types"
import { IoIosArrowBack, IoIosArrowDown, IoIosArrowForward } from "react-icons/io"
import { updateStanzaState } from "@/lib/actions"

export const  StanzaBlock = ({
    stanza 
}: {
    stanza: StanzaData 
}) => {

    const { ctxIsHebrew, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxColorAction, ctxSelectedColor, ctxStudyId } = useContext(FormatContext);
    const [selected, setSelected] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const [colorFillLocal, setColorFillLocal] = useState(stanza.colorFill || DEFAULT_COLOR_FILL);
    const [borderColorLocal, setBorderColorLocal] = useState(stanza.borderColor || DEFAULT_BORDER_COLOR);

    useEffect(() => {
        if (ctxColorAction != ColorActionType.none && selected) {
          if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxSelectedColor && ctxSelectedColor != "") {
            setColorFillLocal(ctxSelectedColor);
            stanza.colorFill = ctxSelectedColor;
          }
          else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxSelectedColor && ctxSelectedColor != "") {
            setBorderColorLocal(ctxSelectedColor);
            stanza.borderColor = ctxSelectedColor;
          }
          else if (ctxColorAction === ColorActionType.resetColor) {
            if (colorFillLocal != DEFAULT_COLOR_FILL) {
              setColorFillLocal(DEFAULT_COLOR_FILL);
              stanza.colorFill = DEFAULT_COLOR_FILL;
            }
            if (borderColorLocal != DEFAULT_BORDER_COLOR) {
              setBorderColorLocal(DEFAULT_BORDER_COLOR);
              stanza.borderColor = DEFAULT_BORDER_COLOR;  
            }
          }
        }
        if (stanza.colorFill != colorFillLocal) { setColorFillLocal(stanza.colorFill || DEFAULT_COLOR_FILL) }
        if (stanza.borderColor != borderColorLocal) { setBorderColorLocal(stanza.borderColor || DEFAULT_BORDER_COLOR) }
      });

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
        className={`relative flex-column pt-10 flex-shrink-0 mr-1 px-1 py-2 my-1 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300] drop-shadow-md' : 'rounded border'}`} 
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
          { (!expanded && ctxIsHebrew) && <IoIosArrowForward style={{pointerEvents:'none'}} /> }
          { (!expanded && !ctxIsHebrew) && <IoIosArrowBack style={{pointerEvents:'none'}} /> }
          { expanded && <IoIosArrowDown style={{pointerEvents:'none'}} /> }
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