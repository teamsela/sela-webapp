import React, { useMemo } from "react";

import SyntaxSmartHighlight from "../Syntax/SmartHighlight";
import { IdenticalWordProps } from "./IdenticalWord";
import { DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, USER_SWATCH_COLORS } from "@/lib/colors";
import { HighlightGroup, useHighlightManager } from "../useHighlightManager";

const IdenticalWordColorPalette = USER_SWATCH_COLORS;

const getPaletteColor = (index: number): string => {
  if (IdenticalWordColorPalette.length === 0) {
    return DEFAULT_COLOR_FILL;
  }
  return (
    IdenticalWordColorPalette[index % IdenticalWordColorPalette.length] ||
    DEFAULT_COLOR_FILL
  );
};

const hexToRgb = (hex: string) => {
  const normalized = hex?.trim().toUpperCase();
  if (!normalized || !/^#?[0-9A-F]{6}$/.test(normalized.replace("#", ""))) {
    return null;
  }
  const value = normalized.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

const getContrastingTextColor = (fill: string) => {
  const rgb = hexToRgb(fill);
  if (!rgb) {
    return DEFAULT_TEXT_COLOR;
  }
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
};

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
          const fillColor = getPaletteColor(index);
          const textColor = getContrastingTextColor(fillColor);

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

  return (
    <SyntaxSmartHighlight
      highlightId={highlightId}
      groups={groups}
      activeHighlightId={activeHighlightId}
      onToggle={toggleHighlight}
    />
  );
};

export default SmartHighlight;
