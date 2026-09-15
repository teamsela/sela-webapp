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
  const border = palette?.border || (gloss ? "#B7B7B7" : DEFAULT_BORDER_COLOR);
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
    gloss ? "rounded-lg" : "rounded",
    "border",
    disabled ? (gloss ? "cursor-default" : "opacity-60 cursor-default") : "cursor-pointer",
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
          border: `${gloss ? 1 : 2}px solid ${border}`,
          color: text,
        }}
      >
        <span
          className="flex items-center mx-1 my-1"
        >
          <span className="flex flex-1 flex-col select-none px-2 py-1 items-center justify-center text-center leading-none text-base">
            {gloss && <span className="whitespace-nowrap text-xs leading-4">{gloss}</span>}
            <span className={gloss ? "text-lg font-bold leading-5" : undefined}>{label}</span>
          </span>
          <span className={`flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-sm ${gloss ? "text-[#666666]" : "text-black"}`}>
            {wordCount}
          </span>
        </span>
      </button>
    </div>
  );
};

export default SyntaxLabel;
