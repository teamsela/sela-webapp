import { MdClose } from "react-icons/md";

import Structure from "./Structure";
import Motif from "./Motif/index";
import Syntax from "./Syntax/index";
import Sounds from "./Sounds";
import Notes from "./Notes";
import { InfoPaneActionType } from "@/lib/types";

const InfoPane = ({
    infoPaneAction,
    setInfoPaneAction,
}: {
    infoPaneAction: InfoPaneActionType;
    setInfoPaneAction: (arg: InfoPaneActionType) => void;
}) => {

    const handleClick = () => {
        setInfoPaneAction(InfoPaneActionType.none)
    }

    return (
        <aside
            className={`h-full overflow-y-auto flex-col bg-white transition-all duration-300 ${
                infoPaneAction !== InfoPaneActionType.none ? "w-1/4" : "w-0"
            } right-0 top-0 border-l-2`}
            style={{ borderColor: "rgb(203 213 225)" }}
        >
            {/* Fixed close button */}
            <button
                className="absolute top-36 right-8"
                onClick={handleClick}
                style={{ zIndex: 1000 }} // Keep z-index for the close button
            >
                <MdClose size="24px" />
            </button>

            {/* Conditionally render the content based on infoPaneAction */}
            <div className="h-full">
                {infoPaneAction === InfoPaneActionType.notes && <Notes />}
                {infoPaneAction === InfoPaneActionType.structure && <Structure />}
                {infoPaneAction === InfoPaneActionType.motif && <Motif />}
                {infoPaneAction === InfoPaneActionType.syntax && <Syntax />}
                {infoPaneAction === InfoPaneActionType.sounds && <Sounds />}
            </div>
            
        </aside>
    );
};
export default InfoPane;
