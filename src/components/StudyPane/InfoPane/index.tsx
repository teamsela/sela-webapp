import { MouseEvent, useEffect, useState } from "react";
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
  infoPaneWidth,
  setInfoPaneWidth,
}: {
  infoPaneAction: InfoPaneActionType;
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneWidth: number;
  setInfoPaneWidth: (width: number) => void;
}) => {
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  useEffect(() => {
    if (viewportWidth === null) {
      return;
    }

    const minWidth = viewportWidth / 4;
    const maxWidth = viewportWidth / 2;
    const clampedWidth = Math.min(maxWidth, Math.max(minWidth, infoPaneWidth));

    if (clampedWidth !== infoPaneWidth) {
      setInfoPaneWidth(clampedWidth);
    }
  }, [viewportWidth, infoPaneWidth, setInfoPaneWidth]);

  const minWidth = viewportWidth ? viewportWidth / 4 : undefined;
  const maxWidth = viewportWidth ? viewportWidth / 2 : undefined;

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
      const currentMinWidth = viewportWidth ? viewportWidth / 4 : 0;
      const currentMaxWidth = viewportWidth ? viewportWidth / 2 : Infinity;
      const newWidth = Math.min(
        currentMaxWidth,
        Math.max(currentMinWidth, startWidth - deltaX)
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
        minWidth,
        maxWidth,
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
        className="absolute right-6 top-4 md:right-8"
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
