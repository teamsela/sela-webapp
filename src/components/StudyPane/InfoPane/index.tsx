import React, { useEffect } from "react";
import Structure from "./Structure";
import Motif from "./Motif";
import Syntax from "./Syntax";
import Sounds from "./Sounds";

const InfoPane = ({
    infoPaneOpen,
    structureOpen,
    motifOpen,
    syntaxOpen,
    soundsOpen,
    setAllInfoPaneClose
}: {
    infoPaneOpen: boolean;
    structureOpen: boolean;
    motifOpen: boolean;
    syntaxOpen: boolean;
    soundsOpen: boolean;
    setAllInfoPaneClose: () => void;
}) => {
    useEffect(() => {
        console.log(infoPaneOpen)
    }, [infoPaneOpen]);
    return (

        <aside
            className={`h-screen flex-col overflow-y-auto bg-white lg:static flex-1 transition-all duration-300 ${infoPaneOpen ? 'mr-1/6' : 'w-full'}  mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6 overflow-y-auto`}
        >
            <div className="flex flex-col justify-between h-full">
            <button
                    className="absolute top-0 right-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300"
                    onClick={setAllInfoPaneClose}
                >
                    &#10005;
                </button>
                {structureOpen && <Structure/>}
                {motifOpen && <Motif/>}
                {syntaxOpen && <Syntax/>}
                {soundsOpen && <Sounds/>}
            </div>
        </aside>
    );
};
export default InfoPane;
