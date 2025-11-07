import { MouseEvent } from "react";
import { MdClose } from "react-icons/md";

import Structure from "./Structure";
import Motif from "./Motif/index";
import Syntax from "./Syntax";
import Sounds from "./Sounds";
import { InfoPaneActionType } from "@/lib/types";
import Notes from "./Notes";

const InfoPane = ({
  infoPaneAction,
  setInfoPaneAction,
  infoPaneWidth,
  setInfoPaneWidth,
}: {
  infoPaneAction: InfoPaneActionType;
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneWidth: number;
  setInfoPaneWidth: (width: number) => void;
}) => {
  const MIN_WIDTH = 260;
  const MAX_WIDTH = 640;

  const handleClick = () => {
    setInfoPaneAction(InfoPaneActionType.none);
  };

  const handleResizeStart = (event: MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = infoPaneWidth;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidth - deltaX)
      );
      setInfoPaneWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <aside
      className="relative right-0 top-0 flex h-full flex-col overflow-y-auto bg-white"
      style={{
        borderColor: "rgb(203 213 225)",
        borderLeftStyle: "solid",
        borderLeftWidth: 2,
        flexShrink: 0,
        minWidth: MIN_WIDTH,
        maxWidth: MAX_WIDTH,
        width: infoPaneWidth,
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-slate-200"
        onMouseDown={handleResizeStart}
        role="presentation"
        aria-hidden
      />

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
