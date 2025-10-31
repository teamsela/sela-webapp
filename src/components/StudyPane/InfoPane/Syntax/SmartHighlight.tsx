import { updateMetadataInDb } from '@/lib/actions';
import { ColorData } from "@/lib/data";
import React, { useContext, useRef, useState } from "react";
import { DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, DEFAULT_BORDER_COLOR, FormatContext } from '../../index';

import { SyntaxProps } from "./PartsOfSpeech";

type SyntaxColorMapping = {
  [key: string]: ColorData;
};

interface SyntaxSmartHighlightProps {
    syntaxProps: SyntaxProps[]; // Property with a type of an empty array
}

const SyntaxSmartHighlight: React.FC<SyntaxSmartHighlightProps> = (syntaxHighlightProps) => {

  const colorMap: SyntaxColorMapping = {
    "Verb":              { fill: "#f8bdd0", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Noun":              { fill: "#4fc3f7", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Adjective":         { fill: "#dcedc8", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Negative Particle": { fill: "#c2185b", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Adverb":            { fill: "#f06292", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Pronoun":           { fill: "#b2ebf2", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Interjection":      { fill: "#fff9cf", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Interrogative":     { fill: "#ffe0b2", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Conjunction":       { fill: DEFAULT_COLOR_FILL, border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Object Marker":     { fill: "#4458e1", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
    "Preposition":       { fill: DEFAULT_COLOR_FILL, border: "#388e3f", text: DEFAULT_TEXT_COLOR },
    "Proper Noun":       { fill: DEFAULT_COLOR_FILL, border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR }
  };

  const { ctxStudyId, ctxWordsColorMap, ctxSetWordsColorMap, ctxStudyMetadata, ctxAddToHistory } = useContext(FormatContext);

  const trigger = useRef<any>(null);

  const handleClick = () => {

    let newMap = new Map<number, ColorData>();

    syntaxHighlightProps.syntaxProps.forEach((syntaxProp) => {
      syntaxProp.wordProps.forEach((word) => {
        const wordId = word.wordId;
        const wordMetadata = ctxStudyMetadata.words[wordId];
    
        if (!wordMetadata) {
          ctxStudyMetadata.words[wordId] = { color: colorMap[syntaxProp.label] };
        }
        else {
          wordMetadata.color = colorMap[syntaxProp.label];
        }
        newMap.set(wordId, colorMap[syntaxProp.label]);
        console.log("Set color to word", wordId, colorMap[syntaxProp.label]);
      });
    });

    ctxSetWordsColorMap(newMap);
    ctxAddToHistory(ctxStudyMetadata);
    updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
  }

  
  return (
    <>

      <button
        ref={trigger}
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
      >
        Smart Highlight
      </button>
    </>
  );
};

export default SyntaxSmartHighlight;
