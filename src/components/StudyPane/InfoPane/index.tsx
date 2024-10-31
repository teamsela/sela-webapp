import React, { useEffect } from "react";
import Structure from "./Structure";
import Motif from "./Motif/index";
import Syntax from "./Syntax";
import Sounds from "./Sounds";
import { InfoPaneActionType } from "@/lib/types";
import { PassageData } from "@/lib/data";

const InfoPane = ({
    infoPaneAction,
    setInfoPaneAction,
    content
}: {
    infoPaneAction: InfoPaneActionType;
    setInfoPaneAction: (arg: InfoPaneActionType) => void;
    content: PassageData;
}) => {

    const handleClick = () => {
        setInfoPaneAction(InfoPaneActionType.none)
    }

    return (
        <aside
            className={`fixed h-full top-19 flex-col bg-white transition-all duration-300 ${
                infoPaneAction !== InfoPaneActionType.none ? "w-1/4" : "w-0"
            } fixed right-0 top-0 z-30 border-l-2`}
            style={{ borderColor: "rgb(203 213 225)" }}
        >
            {/* Fixed close button */}
            <button
                className="absolute top-2 right-4 p-2 bg-gray-200 rounded-full"
                onClick={handleClick}
                style={{ zIndex: 1000 }} // Keep z-index for the close button
            >
                &#10005;
            </button>

            {/* Conditionally render the content based on infoPaneAction */}
            <div className="mx-6 h-full">
                {infoPaneAction === InfoPaneActionType.structure && <Structure />}
                {infoPaneAction === InfoPaneActionType.motif && <Motif content={content} />}
                {infoPaneAction === InfoPaneActionType.syntax && <Syntax />}
                {infoPaneAction === InfoPaneActionType.sounds && <Sounds />}
            </div>
            
        </aside>
    );
};
export default InfoPane;
