import React, { useContext, useEffect, useState } from 'react';

import { WordProps } from '@/lib/data';
import { ColorActionType, LanguageMode } from "@/lib/types";
import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';
import { deriveUniformWordPalette } from '@/lib/utils';

export const IdenticalWordBlock = ({
  id, count, identicalWords, relatedWords, selectRelated
}: {
  id: number,
  count: number,
  identicalWords: WordProps[],
  relatedWords: WordProps[],
  selectRelated: boolean
}) => {

  const { ctxColorAction, ctxSelectedColor,
    ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxLanguageMode, ctxWordsColorMap, ctxStudyMetadata } = useContext(FormatContext)

  const toSelect = selectRelated ? [...identicalWords, ...relatedWords] : identicalWords;

  const uniformPalette = deriveUniformWordPalette(toSelect, {
    colorMap: ctxWordsColorMap,
    metadataMap: ctxStudyMetadata.words,
  });

  const [colorFillLocal, setColorFillLocal] = useState(uniformPalette?.fill ?? DEFAULT_COLOR_FILL);
  const [textColorLocal, setTextColorLocal] = useState(uniformPalette?.text ?? DEFAULT_TEXT_COLOR);
  const [borderColorLocal, setBorderColorLocal] = useState(uniformPalette?.border ?? DEFAULT_BORDER_COLOR);

  const [selected, setSelected] = useState(false);

  const isHebrew = (ctxLanguageMode == LanguageMode.Hebrew);

  // select the block if all toSelect words are selected in the studyPane, otherwise unselect it
  useEffect(() => {
    const allSelected = toSelect.every(word => ctxSelectedWords.includes(word));
    setSelected(allSelected);
  }, [ctxSelectedWords, toSelect]);

  useEffect(() => {
    if (uniformPalette) {
      setColorFillLocal(uniformPalette.fill ?? DEFAULT_COLOR_FILL);
      setTextColorLocal(uniformPalette.text ?? DEFAULT_TEXT_COLOR);
      setBorderColorLocal(uniformPalette.border ?? DEFAULT_BORDER_COLOR);
    } else {
      setColorFillLocal(DEFAULT_COLOR_FILL);
      setTextColorLocal(DEFAULT_TEXT_COLOR);
      setBorderColorLocal(DEFAULT_BORDER_COLOR);
    }
  }, [uniformPalette]);

;

  const handleClick = (e: React.MouseEvent) => {
      setSelected(prevState => !prevState);
      let updatedSelectedWords = [...ctxSelectedWords];
      if (!selected) {
        updatedSelectedWords = ctxSelectedWords.concat(toSelect);
      } else {
        toSelect.forEach((dsd) => {
          updatedSelectedWords.splice(updatedSelectedWords.indexOf(dsd), 1)
        })
      }
      ctxSetSelectedWords(updatedSelectedWords);
      ctxSetNumSelectedWords(updatedSelectedWords.length);
  };

  return (
    <div className="flex my-1">
      <div
        id={id.toString()}
        key={id}
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
            // TODO: remove motifData.relatedWords, this might be a typo, we should display the Hebrew of the identical word, 
            // not the related words of the identical word. Plus, may also consider refactor identicalWords[0].ETCBCgloss,
            // i.e. use motifData.lexicon.lemma / motifData.lexicon.gloss
          >
            {isHebrew ? identicalWords[0].motifData?.lemma : identicalWords[0].ETCBCgloss}</span>
          <span className="flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-black text-sm">{count}</span>
        </span>
      </div>
    </div>
  );

}
