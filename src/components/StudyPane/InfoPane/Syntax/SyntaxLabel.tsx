import React from "react";

import { ColorData } from "@/lib/data";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR } from "@/lib/colors";

export type LabelPalette = Omit<ColorData, "source">;

const KEYBOARD_ACTIVATION_KEYS = new Set(["Enter", " "]);

const SyntaxLabel = ({
    label,
    wordCount,
    palette,
    isActive,
    onToggleHighlight,
}: {
    label: string;
    wordCount: number;
    palette?: LabelPalette;
    isActive: boolean;
    onToggleHighlight?: () => void;
}) => {
    const disabled = wordCount === 0 || !onToggleHighlight;

    const handleClick = () => {
        if (disabled) {
            return;
        }
        onToggleHighlight?.();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
        if (KEYBOARD_ACTIVATION_KEYS.has(event.key)) {
            event.preventDefault();
            if (!disabled) {
                onToggleHighlight?.();
            }
        }
    };

    const fill = palette?.fill || DEFAULT_COLOR_FILL;
    const border = palette?.border || DEFAULT_BORDER_COLOR;
    const text = palette?.text || DEFAULT_TEXT_COLOR;

    const containerClassName = [
        "wordBlock",
        "mx-1",
        "ClickBlock",
        "rounded",
        "border",
        disabled ? "opacity-60 cursor-default" : "cursor-pointer",
        isActive
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
                        {wordCount}
                    </span>
                </span>
            </div>
        </div>
    );
};

export default SyntaxLabel;

