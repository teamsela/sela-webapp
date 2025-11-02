import React, { useMemo } from "react";

import { IdenticalWordProps } from "./IdenticalWord";
import { DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR } from "../../index";
import { HighlightGroup, useHighlightManager } from "../useHighlightManager";

const IdenticalWordColorPalette = [
    '#e57373', '#64b5f6', '#81c784', '#ffeb3b', '#ffb74d', '#90a4ae', '#9575cd', '#00bcd4', '#f06292', '#a1887f',
    '#ffccbc', '#bbdefb', '#c8e6c9', '#fff9c4', '#ffe0b2', '#cfd8dc', '#d1c4e9', '#b2ebf2', '#f8bbd0', '#d7ccc8',
    '#b71c1c', '#1976d2', '#388e3c', '#afb42b', '#ff6f00', '#607d8b', '#673ab7', '#0097a7', '#e91e63', '#795548'
];

interface SmartHighlightProps {
    identicalWords: IdenticalWordProps[]; // Property with a type of an empty array
}

const SmartHighlight: React.FC<SmartHighlightProps> = ({ identicalWords }) => {
  const { toggleHighlight, activeHighlightId } = useHighlightManager("motif");
  const highlightId = "motif-identical";

  const groups: HighlightGroup[] = useMemo(
    () =>
      identicalWords
        .map((idWordProps, index) => {
          const fillColor =
            index < IdenticalWordColorPalette.length
              ? IdenticalWordColorPalette[index]
              : DEFAULT_COLOR_FILL;
          const textColor =
            index < 10
              ? "#000000"
              : index < 20 || index >= IdenticalWordColorPalette.length
                ? DEFAULT_TEXT_COLOR
                : "#FFFFFF";

          return {
            label: `motif-${idWordProps.wordId}-${index}`,
            words: idWordProps.identicalWords,
            palette: {
              fill: fillColor,
              text: textColor,
            },
          };
        })
        .filter((group) => group.words.length > 0),
    [identicalWords],
  );

  const isActive = activeHighlightId === highlightId;
  const disabled = groups.length === 0;

  const handleClick = () => {
    if (disabled) {
      return;
    }
    toggleHighlight(highlightId, groups);
  };

  return (
    <>

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={isActive}
        className={`inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-center font-medium lg:px-8 xl:px-10 ${
          disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : isActive
              ? "bg-slate-300 text-slate-800 hover:bg-slate-200"
              : "bg-primary text-white hover:bg-opacity-90"
        }`}
      >
        Smart Highlight
      </button>


    </>
  );
};

export default SmartHighlight;
