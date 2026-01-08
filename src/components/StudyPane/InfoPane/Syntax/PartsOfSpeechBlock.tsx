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

  const { ctxColorAction, ctxSelectedColor, ctxStudyMetadata,
    ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords } = useContext(FormatContext);
 
  const matchColorProperty = (property: 'fill' | 'text' | 'border') : boolean => {
      return posWords.every(dsd =>
        dsd.metadata?.color &&
        (dsd.metadata.color[property] && dsd.metadata.color[property] === posWords[0].metadata.color?.[property])
      );
  };    

  const [colorFillLocal, setColorFillLocal] = useState(() => {
    if (posWords.length === 0) {
      return DEFAULT_COLOR_FILL;
    }

    const fill = posWords[0].metadata?.color?.fill;
    return matchColorProperty('fill') ? fill || DEFAULT_COLOR_FILL : DEFAULT_COLOR_FILL;
  });

  const [textColorLocal, setTextColorLocal] = useState(() => {
    if (posWords.length === 0) {
      return DEFAULT_TEXT_COLOR;
    }

    const text = posWords[0].metadata?.color?.text;
    return matchColorProperty('text') ? text || DEFAULT_TEXT_COLOR : DEFAULT_TEXT_COLOR;
  });

  const [borderColorLocal, setBorderColorLocal] = useState(() => {
    if (posWords.length === 0) {
      return DEFAULT_BORDER_COLOR;
    }

    const border = posWords[0].metadata?.color?.border;
    return matchColorProperty('border') ? border || DEFAULT_BORDER_COLOR : DEFAULT_BORDER_COLOR;
  });

  const [selected, setSelected] = useState(false);

  useEffect(() => {
      let hasChildren = posWords.length > 0;
      posWords.forEach((word) => {
          hasChildren = hasChildren && ctxSelectedWords.includes(word);
      })
      setSelected(hasChildren);
  }, [ctxSelectedWords, posWords]);

  useEffect(() => {
      if (ctxSelectedWords.length == 0 || ctxColorAction === ColorActionType.none) { return; }
  
      if (selected) {
          if (ctxColorAction === ColorActionType.colorFill && ctxSelectedColor) {
              setColorFillLocal(ctxSelectedColor);
          } else if (ctxColorAction === ColorActionType.borderColor && ctxSelectedColor) {
              setBorderColorLocal(ctxSelectedColor);
          } else if (ctxColorAction === ColorActionType.textColor && ctxSelectedColor) {
              setTextColorLocal(ctxSelectedColor);
          } else if (ctxColorAction === ColorActionType.resetColor) {
              setColorFillLocal(DEFAULT_COLOR_FILL);
              setBorderColorLocal(DEFAULT_BORDER_COLOR);
              setTextColorLocal(DEFAULT_TEXT_COLOR);
          }
      }
  }, [ctxSelectedColor, ctxColorAction, ctxSelectedWords])

  useEffect(() => {
      if (posWords.length > 0)
      {
        setColorFillLocal(matchColorProperty('fill') ? posWords[0].metadata?.color?.fill || DEFAULT_COLOR_FILL : DEFAULT_COLOR_FILL);
        setTextColorLocal(matchColorProperty('text') ? posWords[0].metadata?.color?.text || DEFAULT_TEXT_COLOR : DEFAULT_TEXT_COLOR);
        setBorderColorLocal(matchColorProperty('border') ? posWords[0].metadata?.color?.border || DEFAULT_BORDER_COLOR : DEFAULT_BORDER_COLOR);
      }
  }, [posWords, ctxStudyMetadata]);

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
