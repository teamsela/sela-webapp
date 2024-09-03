import React, { useEffect } from "react";
import Structure from "./Structure";
import Motif from "./Motif";
import Syntax from "./Syntax";
import Sounds from "./Sounds";
import { InfoPaneActionType } from "@/lib/types";

const InfoPane = ({
    infoPaneAction,
    setInfoPaneAction
}: {
    infoPaneAction: InfoPaneActionType;
    setInfoPaneAction: (arg: InfoPaneActionType) => void;
}) => {
    useEffect(() => {
        console.log(infoPaneAction)
    }, [infoPaneAction]);
    const handleClick = () => {
        setInfoPaneAction(InfoPaneActionType.none)
        console.log("Close clicked");
    }
    return (
        <aside
            className={`h-full flex-col overflow-y-auto bg-white lg:static flex-1 transition-all duration-300 ${infoPaneAction != InfoPaneActionType.none ? 'mr-1/4' : 'w-full'}  mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-8 overflow-y-auto border-l-2`} style={{borderColor: 'rgb(203 213 225)'}}
        >
            <div className="fixed w-1/5 flex flex-col h-full">
            <button
                    className="absolute top-0 right-0 rounded-full "
                    onClick={handleClick}
                    style={{ zIndex: 1000 }} // Explicitly setting z-index for debugging
                >
                    &#10005;
                </button>
                <div className="flex">
                    {infoPaneAction == InfoPaneActionType.structure && <Structure />}
                    {infoPaneAction == InfoPaneActionType.motif && <Motif />}
                    {infoPaneAction == InfoPaneActionType.syntax && <Syntax />}
                    {infoPaneAction == InfoPaneActionType.sounds && <Sounds />}
                </div>
            </div>
        </aside>
    );
};
export default InfoPane;
