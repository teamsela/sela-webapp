import { MouseEvent, useEffect, useState } from "react";
import { MdClose } from "react-icons/md";

import Structure from "./Structure";
import Motif from "./Motif/index";
import Syntax from "./Syntax/index";
import Sounds from "./Sounds";
import Layers from "./Layers";
import { InfoPaneActionType } from "@/lib/types";

/*
  variant:
    side     desktop: beside the passage, resizable (the original)
    drawer   tablet portrait: slides over the right of the passage
    docked   tablet landscape: beside the passage at a fixed width; on a
             foldable opened flat, exactly the screen segment right of the fold
    sheet    phone: just the content (the phone's bottom sheet draws the rest)
*/
export type InfoPaneVariant = "side" | "drawer" | "docked" | "sheet";

const InfoPane = ({
  infoPaneAction,
  setInfoPaneAction,
  infoPaneWidth,
  setInfoPaneWidth,
  variant = "side",
  fold = false,
  top = 0,
}: {
  infoPaneAction: InfoPaneActionType;
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneWidth: number;
  setInfoPaneWidth: (width: number) => void;
  variant?: InfoPaneVariant;
  fold?: boolean;
  /** Drawer only: where the passage area starts (below the header). */
  top?: number;
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

  const content = (
    <>
      {infoPaneAction === InfoPaneActionType.layers && <Layers />}
      {infoPaneAction === InfoPaneActionType.structure && <Structure />}
      {infoPaneAction === InfoPaneActionType.motif && <Motif />}
      {infoPaneAction === InfoPaneActionType.syntax && <Syntax />}
      {infoPaneAction === InfoPaneActionType.sounds && <Sounds />}
    </>
  );

  if (variant === "sheet") {
    return <div className="pt-2" data-tour="info-pane">{content}</div>;
  }

  if (variant === "drawer" || variant === "docked") {
    const drawer = variant === "drawer";
    return (
      <aside
        data-tour="info-pane"
        className={`${drawer ? "absolute bottom-0 right-0 z-30 shadow-[-16px_0_40px_rgba(15,23,42,0.16)]" : "relative h-full shrink-0"} flex flex-col overflow-hidden border-l-2 border-slate-300 bg-white`}
        style={{ width: fold ? "env(viewport-segment-width 1 0, 50%)" : drawer ? "min(380px, 90vw)" : 360, top: drawer ? top : undefined }}
      >
        <button className="absolute right-4 top-4" onClick={handleClick} aria-label="Close tools" style={{ zIndex: 1000 }}>
          <MdClose size="24px" />
        </button>
        <div className="h-full overflow-y-auto pt-4">{content}</div>
      </aside>
    );
  }

  return (
    <aside
      data-tour="info-pane"
      className="relative right-0 top-0 flex h-full flex-col overflow-hidden bg-white"
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
        className="group absolute left-0 top-0 z-999 flex h-full w-3 cursor-col-resize items-center justify-start"
        onMouseDown={handleResizeStart}
        role="presentation"
        aria-hidden
      >
        {/* Slim drag handle indicator */}
        <div className="h-12 w-1 ml-1 rounded-full bg-bodydark transition-colors group-hover:bg-bodydark2" />
      </div>

      {/* Fixed close button */}
      <button
        className="absolute right-6 top-6 md:right-8"
        onClick={handleClick}
        style={{ zIndex: 1000 }} // Keep z-index for the close button
      >
        <MdClose size="24px" />
      </button>

      {/* Scrollable content — kept separate from the aside so the resize handle
          and close button stay static and don't scroll off screen. */}
      <div className="h-full overflow-y-auto pt-4">
        {content}
      </div>
    </aside>
  );
};
export default InfoPane;
