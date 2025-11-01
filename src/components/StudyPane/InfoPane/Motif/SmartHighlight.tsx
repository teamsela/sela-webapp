import { updateMetadataInDb } from '@/lib/actions';
import { ColorData } from "@/lib/data";
import React, { useContext, useRef, useState } from "react";
import { IdenticalWordProps } from "./IdenticalWord";
import { DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';

const IdenticalWordColorPalette = [
    '#e57373', '#64b5f6', '#81c784', '#ffeb3b', '#ffb74d', '#90a4ae', '#9575cd', '#00bcd4', '#f06292', '#a1887f',
    '#ffccbc', '#bbdefb', '#c8e6c9', '#fff9c4', '#ffe0b2', '#cfd8dc', '#d1c4e9', '#b2ebf2', '#f8bbd0', '#d7ccc8',
    '#b71c1c', '#1976d2', '#388e3c', '#afb42b', '#ff6f00', '#607d8b', '#673ab7', '#0097a7', '#e91e63', '#795548'
];

interface SmartHighlightProps {
    identicalWords: IdenticalWordProps[]; // Property with a type of an empty array
}

const SmartHighlight: React.FC<SmartHighlightProps> = ({identicalWords}) => {

  const { ctxStudyId, ctxSetRootsColorMap, ctxStudyMetadata, ctxAddToHistory } = useContext(FormatContext);

  const trigger = useRef<any>(null);

  const handleClick = () => {

    let newMap = new Map<number, ColorData>();

    identicalWords.forEach((idWordProps, index) => {

      let idWordBlockColor: ColorData = {
        fill: (index < IdenticalWordColorPalette.length) ? IdenticalWordColorPalette[index] : DEFAULT_COLOR_FILL,
        text: (index < 10) ? '#000000' : (index < 20 || index >= IdenticalWordColorPalette.length) ? DEFAULT_TEXT_COLOR : '#FFFFFF',
        border: "" // not used for identicalWord block
      };

//      let descendantWordIds: number[] = [];
      idWordProps.identicalWords.forEach((word) => {
        const wordId = word.wordId;
        const wordMetadata = ctxStudyMetadata.words[wordId];
    
        if (!wordMetadata) {
          ctxStudyMetadata.words[wordId] = { color: idWordBlockColor };
          return;
        }
    
        if (!wordMetadata.color) {
          wordMetadata.color = idWordBlockColor;
          return;
        }
    
        wordMetadata.color.fill = idWordBlockColor.fill;
        wordMetadata.color.text = idWordBlockColor.text;

//        descendantWordIds.push(word.wordId)
      });

        //updateWordColor(ctxStudyId, descendantWordIds, ColorActionType.colorFill, idWordBlockColor.colorFill);
        //updateWordColor(ctxStudyId, descendantWordIds, ColorActionType.textColor, idWordBlockColor.textColor);
      newMap.set(idWordProps.identicalWords[0].strongNumber, idWordBlockColor);
    });

    ctxSetRootsColorMap(newMap);
    ctxAddToHistory(ctxStudyMetadata);
    updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
}

  
  return (
    <>

      <button
        ref={trigger}
        //onClick={() => setModalOpen(!modalOpen)}
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
      >
        Smart Highlight
      </button>


    </>
  );
};

export default SmartHighlight;
