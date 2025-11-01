import React, { useContext, useEffect, useState } from "react";

import { WordProps } from "@/lib/data";
import { FormatContext } from "../..";

export type LabelPalette = {
    fill?: string;
    border?: string;
    text?: string;
};

const DEFAULT_FILL = "#FFFFFF";
const DEFAULT_BORDER = "#E2E8F0";
const DEFAULT_TEXT = "#1F2937";

const KEYBOARD_ACTIVATION_KEYS = new Set(["Enter", " "]);

const SyntaxLabel = ({
    label,
    words,
    palette,
}: {
    label: string;
    words: WordProps[];
    palette?: LabelPalette;
}) => {
    const { ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords } =
        useContext(FormatContext);

    const [isSelected, setIsSelected] = useState(false);

    useEffect(() => {
        if (!words.length) {
            setIsSelected(false);
            return;
        }

        const allSelected = words.every((word) =>
            ctxSelectedWords.includes(word),
        );
        setIsSelected(allSelected);
    }, [ctxSelectedWords, words]);

    const updateSelection = () => {
        if (!words.length) {
            return;
        }

        if (!isSelected) {
            const existingIds = new Set(ctxSelectedWords.map((word) => word.wordId));
            const mergedSelection = [
                ...ctxSelectedWords,
                ...words.filter((word) => !existingIds.has(word.wordId)),
            ];
            ctxSetSelectedWords(mergedSelection);
            ctxSetNumSelectedWords(mergedSelection.length);
            return;
        }

        const idsToRemove = new Set(words.map((word) => word.wordId));
        const filtered = ctxSelectedWords.filter(
            (word) => !idsToRemove.has(word.wordId),
        );
        ctxSetSelectedWords(filtered);
        ctxSetNumSelectedWords(filtered.length);
    };

    const handleClick = () => {
        updateSelection();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
        if (KEYBOARD_ACTIVATION_KEYS.has(event.key)) {
            event.preventDefault();
            updateSelection();
        }
    };

    const fill = palette?.fill || DEFAULT_FILL;
    const border = palette?.border || DEFAULT_BORDER;
    const text = palette?.text || DEFAULT_TEXT;
    const disabled = words.length === 0;

    const containerClassName = [
        "wordBlock",
        "mx-1",
        "ClickBlock",
        "rounded",
        "border",
        disabled ? "opacity-60 cursor-default" : "cursor-pointer",
        isSelected
            ? "outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md"
            : "outline-offset-[-4px]",
    ].join(" ");

    return (
        <div className="flex my-1">
            <div
                className={containerClassName}
                style={{
                    background: fill,
                    border: `2px solid ${border}`,
                    color: text,
                }}
            >
                <span
                    className="flex mx-1 my-1"
                    onClick={disabled ? undefined : handleClick}
                    onKeyDown={disabled ? undefined : handleKeyDown}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                >
                    <span className="flex select-none px-2 py-1 items-center justify-center text-center leading-none text-base hover:opacity-80">
                        {label}
                    </span>
                    <span className="flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-black text-sm">
                        {words.length}
                    </span>
                </span>
            </div>
        </div>
    );
};

export default SyntaxLabel;

