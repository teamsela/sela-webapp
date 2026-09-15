import React from "react";

import { ColorData } from "@/lib/data";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR } from "@/lib/colors";

export type LabelPalette = Omit<ColorData, "source">;

const SyntaxLabel = ({
  label,
  gloss,
  wordCount,
  palette,
  isActive,
  isSelected,
  isDisabled = false,
  onToggleSelection,
}: {
  label: string;
  gloss?: string;
  wordCount: number;
  palette?: LabelPalette;
  isActive: boolean;
  isSelected: boolean;
  isDisabled?: boolean;
  onToggleSelection?: (isMultiSelect: boolean) => void;
}) => {
  const disabled = isDisabled || wordCount === 0 || !onToggleSelection;

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    const isMultiSelect = event.ctrlKey || event.metaKey || event.shiftKey;
    onToggleSelection?.(isMultiSelect);
  };

  const fill = palette?.fill || DEFAULT_COLOR_FILL;
  const border = palette?.border || DEFAULT_BORDER_COLOR;
  const text = palette?.text || (gloss ? "#666666" : DEFAULT_TEXT_COLOR);

  const statusClassName = isActive
    ? "outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md"
    : isSelected
      ? "outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-sm"
      : "outline-offset-[-4px]";

  const containerClassName = [
    "wordBlock",
    gloss ? "w-full" : "mx-1",
    "ClickBlock",
    "rounded",
    "border",
    disabled ? (gloss && wordCount > 0 ? "cursor-default" : "opacity-60 cursor-default") : "cursor-pointer",
    statusClassName,
  ].join(" ");

  return (
    <div className={gloss ? "flex" : "flex my-1"}>
      <button
        type="button"
        className={containerClassName}
        onClick={handleToggle}
        disabled={disabled}
        aria-pressed={isSelected}
        aria-label={gloss ? `${label} ${gloss}, ${wordCount} occurrences` : undefined}
        style={{
          background: fill,
          border: `2px solid ${border}`,
          color: text,
        }}
      >
        <span
          className={`flex items-center my-1 ${gloss ? "mx-0.5 gap-0.5" : "mx-1"}`}
        >
          <span className={`flex flex-1 flex-col select-none py-1 items-center justify-center text-center leading-none text-base ${gloss ? "min-w-0" : "px-2"}`}>
            {gloss && <span className="whitespace-nowrap text-xs leading-4">{gloss}</span>}
            <span className={gloss ? "text-lg font-bold leading-5" : undefined}>{label}</span>
          </span>
          <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#EFEFEF] ${gloss ? "h-5 min-w-5 px-0.5 text-xs text-[#666666]" : "h-6.5 w-full min-w-6.5 max-w-6.5 text-sm text-black"}`}>
            {wordCount}
          </span>
        </span>
      </button>
    </div>
  );
};

export default SyntaxLabel;
