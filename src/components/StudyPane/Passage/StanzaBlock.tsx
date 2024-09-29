import { StanzaData } from "@/lib/data"
import { useContext, useEffect, useState } from "react"
import { FormatContext } from ".."
import { StropheBlock } from "./StropheBlock"
import { LuTextSelect } from "react-icons/lu"

export const  StanzaBlock = ({
    stanza 
}: {
    stanza: StanzaData 
}) => {

    const { ctxIsHebrew, ctxSetSelectedStanzas, ctxSelectedStanzas, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctx } = useContext(FormatContext);
    const [selected, setSelected] = useState(false);

    const handleStanzaBlockClick = () => {
        setSelected(prevState => !prevState);
        (!selected) ? ctxSelectedStanzas.push((stanza)) : ctxSelectedStanzas.splice(ctxSelectedStanzas.indexOf(stanza), 1);
        ctxSetSelectedStanzas(ctxSelectedStanzas);
        ctxSetSelectedStrophes([]);
        ctxSetNumSelectedStrophes(0);
        ctxSetSelectedHebWords([]);
        ctxSetNumSelectedWords(0);

    }

    useEffect(() => {
        setSelected(ctxSelectedStanzas.includes(stanza));
    }, [ctxSelectedStanzas])

    return(
        <div
        key={"stanza_" + stanza.id}
        className={`relative flex-column pt-10 flex-shrink-0 mr-1 px-1 py-2 my-1 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300] drop-shadow-md' : 'rounded border'}`} 
        >
        <div
          className={`z-1 absolute top-0 p-[0.5] m-[0.5] bg-transparent ${ctxIsHebrew ? 'left-0' : 'right-0'}`}
          >
        <button
          key={"strophe" + stanza.id + "CollapseButton"}
          className={`p-2 m-1 hover:bg-theme active:bg-transparent`}
          onClick={() => handleStanzaBlockClick()}
          data-clicktype={'clickable'}
        >
          <LuTextSelect
            style={{pointerEvents:'none'}}
          />
        </button>
        </div>
        {
            // expanded?
            stanza.strophes.map((strophe) => {
                return (
                    <StropheBlock 
                    strophe={strophe}
                    key={strophe.id}
                    />
                )
            })
        }
        </div>
    )
}