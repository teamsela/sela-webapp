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
    const handleClick = () => {
        setAllInfoPaneClose();
        console.log("Close clicked");
    }
    return (
        <aside
            className={`h-screen flex-col overflow-y-auto bg-white lg:static flex-1 transition-all duration-300 ${infoPaneOpen ? 'mr-1/4' : 'w-full'}  mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-8 overflow-y-auto`}
        >
            <div className="relative flex flex-col h-full">
            <button
                    className="absolute top-0 right-0 rounded-full "
                    onClick={handleClick}
                    style={{ zIndex: 1000 }} // Explicitly setting z-index for debugging
                >
                    &#10005;
                </button>
                <div className="flex">
                    {structureOpen && <Structure />}
                    {motifOpen && <Motif />}
                    {syntaxOpen && <Syntax />}
                    {soundsOpen && <Sounds />}
                </div>
            </div>
        </aside>
    );
};
export default InfoPane;
