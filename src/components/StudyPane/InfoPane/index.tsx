import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { MdClose } from "react-icons/md";

import Structure from "./Structure";
import Motif from "./Motif/index";
import Syntax from "./Syntax";
import Sounds from "./Sounds";
import { InfoPaneActionType } from "@/lib/types";
import { PassageData } from "@/lib/data";
import Notes from "./Notes";

const MIN_WIDTH = 240;
const MAX_WIDTH = 640;
const MIN_MAIN_WIDTH = 240;
const DEFAULT_WIDTH = 360;

const InfoPane = ({
    infoPaneAction,
    setInfoPaneAction,
}: {
    infoPaneAction: InfoPaneActionType;
    setInfoPaneAction: (arg: InfoPaneActionType) => void;
}) => {

    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [isResizing, setIsResizing] = useState(false);
    const paneRef = useRef<HTMLElement | null>(null);
    const resizingRef = useRef(false);

    const clampWidthWithinContainer = useCallback(
        (requestedWidth: number) => {
            const parent = paneRef.current?.parentElement;
            const parentRect = parent?.getBoundingClientRect();
            const availableWidth = parentRect
                ? parentRect.width
                : typeof window !== "undefined"
                    ? window.innerWidth
                    : MAX_WIDTH;

            const maxWidth = Math.max(
                0,
                Math.min(MAX_WIDTH, availableWidth - MIN_MAIN_WIDTH)
            );

            const minWidth = Math.min(MIN_WIDTH, maxWidth);

            return Math.max(minWidth, Math.min(maxWidth, requestedWidth));
        },
        [paneRef]
    );

    const handlePointerMove = useCallback((event: PointerEvent) => {
        if (!resizingRef.current || !paneRef.current) {
            return;
        }

        const parent = paneRef.current.parentElement;
        const parentRect = parent?.getBoundingClientRect();
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : DEFAULT_WIDTH;

        const proposedWidth = parentRect ? parentRect.right - event.clientX : viewportWidth - event.clientX;

        setWidth(clampWidthWithinContainer(proposedWidth));
    }, [clampWidthWithinContainer]);

    const stopResizing = useCallback(() => {
        if (!resizingRef.current) {
            return;
        }

        resizingRef.current = false;
        setIsResizing(false);

        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", stopResizing);
    }, [handlePointerMove]);

    const startResizing = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();

        resizingRef.current = true;
        setIsResizing(true);

        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", stopResizing);
    }, [handlePointerMove, stopResizing]);

    useEffect(() => {
        return () => {
            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", stopResizing);
        };
    }, [handlePointerMove, stopResizing]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const handleResize = () => {
            setWidth((currentWidth) => clampWidthWithinContainer(currentWidth));
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [clampWidthWithinContainer]);

    const handleClick = () => {
        setInfoPaneAction(InfoPaneActionType.none)
    }

    return (
        <aside
            ref={paneRef}
            className={`relative flex h-full flex-col overflow-y-auto bg-white right-0 top-0 border-l-2 ${
                infoPaneAction !== InfoPaneActionType.none ? "" : "pointer-events-none"
            }`}
            style={{
                borderColor: "rgb(203 213 225)",
                width: infoPaneAction !== InfoPaneActionType.none ? width : 0,
                transition: isResizing ? "none" : "width 150ms ease-in-out",
            }}
        >
            {infoPaneAction !== InfoPaneActionType.none && (
                <div
                    className="absolute top-0 left-0 z-10 h-full w-1 cursor-col-resize bg-slate-200/0 hover:bg-slate-200/50"
                    onPointerDown={startResizing}
                    role="presentation"
                />
            )}
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
