import React, { useContext, useEffect, useState } from 'react';

import { WordProps } from '@/lib/data';
import { ColorActionType, LanguageMode } from "@/lib/types";
import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';

export const PartsOfSpeechBlock = ({
  name, posWords, selectedPartsOfSpeech, setSelectedPartsOfSpeech, lastSelectedWords, setLastSelectedWords
}: {
  name: string,
  posWords: WordProps[],
  selectedPartsOfSpeech: string,
  setSelectedPartsOfSpeech: React.Dispatch<React.SetStateAction<string>>,
  lastSelectedWords: WordProps[],
  setLastSelectedWords: React.Dispatch<React.SetStateAction<WordProps[]>>  
}) => {

  const { ctxColorAction, ctxSelectedColor, ctxRootsColorMap, ctxStudyMetadata,
    ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxLanguageMode } = useContext(FormatContext);
 
  // const matchColorProperty = (property: 'fill' | 'text' | 'border') : boolean => {
  //     return posWords.every(dsd =>
  //       dsd.metadata?.color &&
  //       (!dsd.metadata.color[property] || dsd.metadata.color[property] === posWords[0].metadata.color?.[property])
  //     );
  // };    

  const [colorFillLocal, setColorFillLocal] = useState(DEFAULT_COLOR_FILL);
  const [textColorLocal, setTextColorLocal] = useState(DEFAULT_TEXT_COLOR);
  const [borderColorLocal, setBorderColorLocal] = useState(DEFAULT_BORDER_COLOR);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
      let hasChildren = posWords.length > 0;
      posWords.forEach((word) => {
          hasChildren = hasChildren && ctxSelectedWords.includes(word);
      })
      setSelected(hasChildren);
  }, [ctxSelectedWords, posWords]);
    
  const handleClick = () => {
      setSelected(prevState => !prevState);

      if (name === selectedPartsOfSpeech) {
          const newSelectedHebWords = ctxSelectedWords.filter(
              word => !lastSelectedWords.some(posWord => posWord.wordId === word.wordId)
          );
          ctxSetSelectedWords(newSelectedHebWords);
          ctxSetNumSelectedWords(newSelectedHebWords.length);
          setLastSelectedWords([]);
      } else if (posWords.length > 0) {
          const wordsWithoutPrevPartsOfSpeech = ctxSelectedWords.filter(
              word => !lastSelectedWords.some(posWord => posWord.wordId === word.wordId)
          );
          
          const newSelectedHebWords = Array.from(new Set([...wordsWithoutPrevPartsOfSpeech, ...posWords]));           
          
          ctxSetSelectedWords(newSelectedHebWords);
          ctxSetNumSelectedWords(newSelectedHebWords.length);            
          setLastSelectedWords(posWords);
      }      
  };

  return (
    <div className="flex my-1">
      <div
          className={`wordBlock mx-1 ClickBlock ${selected ? 'rounded border outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
          data-clicktype="clickable"
          style={
              {
                  background: `${colorFillLocal}`,
                  border: `2px solid ${borderColorLocal}`,
                  color: `${textColorLocal}`,
              }
          }>
          <span
              className="flex mx-1 my-1"
              onClick={handleClick}
          >
              <span
                  className={`flex select-none px-2 py-1 items-center justify-center text-center hover:opacity-60 leading-none text-lg`}
              >{name}</span>
              <span className="flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-black text-sm">{posWords.length}</span>
          </span>
      </div>
    </div>
  );

}
