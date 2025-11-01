import React, { useContext } from "react";

import { updateMetadataInDb } from "@/lib/actions";
import { ColorData, WordProps } from "@/lib/data";

import { FormatContext } from "../../index";
import { LabelPalette } from "./SyntaxLabel";

type SmartHighlightGroup = {
  label: string;
  words: WordProps[];
  palette?: LabelPalette;
};

interface SyntaxSmartHighlightProps {
  groups: SmartHighlightGroup[];
  buttonLabel?: string;
}

const SyntaxSmartHighlight: React.FC<SyntaxSmartHighlightProps> = ({
  groups,
  buttonLabel = "Smart Highlight",
}) => {
  const {
    ctxStudyId,
    ctxWordsColorMap,
    ctxSetWordsColorMap,
    ctxStudyMetadata,
    ctxAddToHistory,
  } = useContext(FormatContext);

  const handleClick = () => {
    const updatedMetadata = structuredClone(ctxStudyMetadata);
    updatedMetadata.words ??= {};
    const updatedMap = new Map(ctxWordsColorMap);

    groups.forEach((group) => {
      if (!group.palette) {
        return;
      }

      const palette: ColorData = {};
      if (group.palette.fill) {
        palette.fill = group.palette.fill;
      }
      if (group.palette.border) {
        palette.border = group.palette.border;
      }
      if (group.palette.text) {
        palette.text = group.palette.text;
      }

      group.words.forEach((word) => {
        const wordId = word.wordId;
        const existingMetadata = updatedMetadata.words[wordId] ?? {};

        existingMetadata.color = {
          ...(existingMetadata.color ?? {}),
          ...palette,
        };

        updatedMetadata.words[wordId] = existingMetadata;
        updatedMap.set(wordId, { ...palette });
      });
    });

    ctxSetWordsColorMap(updatedMap);
    ctxAddToHistory(updatedMetadata);
    updateMetadataInDb(ctxStudyId, updatedMetadata);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
    >
      {buttonLabel}
    </button>
  );
};

export default SyntaxSmartHighlight;
