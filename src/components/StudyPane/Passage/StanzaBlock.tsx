import { StanzaData } from "@/lib/data"
import { useContext } from "react"
import { FormatContext } from ".."
import { StropheBlock } from "./StropheBlock"

export const  StanzaBlock = ({
    stanza 
}: {
    stanza: StanzaData 
}) => {

    const { ctxStudyId } = useContext(FormatContext);

    return(
        <div
        key={"stanza_" + stanza.id}
        className={`relative flex-column w-1/2 flex-shrink-0  px-1 py-2 my-1`} 
        >
        {
            stanza.strophes.map((strophe) => {
                return (
                    <StropheBlock 
                    strophe={strophe}
                    key={strophe.id}
                    stanzaNumber={stanza.id}
                    />
                )
            })
        }
        </div>
    )
}