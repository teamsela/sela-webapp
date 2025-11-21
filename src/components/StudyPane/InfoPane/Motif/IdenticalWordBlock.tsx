import React, { useContext, useEffect, useState } from 'react';

import { WordProps } from '@/lib/data';
import { ColorActionType, LanguageMode } from "@/lib/types";
import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';

export const IdenticalWordBlock = ({
  id, count, identicalWords, relatedWords, selectRelated
}: {
  id: number,
  count: number,
  identicalWords: WordProps[],
  relatedWords: WordProps[],
  selectRelated: boolean
}) => {

  const { ctxColorAction, ctxSelectedColor, ctxStudyMetadata,
    ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxLanguageMode } = useContext(FormatContext)

  const toSelect = selectRelated ? [...identicalWords, ...relatedWords] : identicalWords;
  
  const matchColorProperty = (property: 'fill' | 'text' | 'border') : boolean => {
    return toSelect.every(dsd =>
      dsd.metadata?.color &&
      (!dsd.metadata.color[property] || dsd.metadata.color[property] === toSelect[0].metadata.color?.[property])
    );
  };

  const initialColorFill =
    (matchColorProperty("fill") ? toSelect[0]?.metadata.color?.fill : DEFAULT_COLOR_FILL) ||
    DEFAULT_COLOR_FILL;
  const initialTextColor =
    (matchColorProperty("text") ? toSelect[0]?.metadata.color?.text : DEFAULT_TEXT_COLOR) ||
    DEFAULT_TEXT_COLOR;
  const initialBorderColor =
    (matchColorProperty("border") ? toSelect[0]?.metadata.color?.border : DEFAULT_BORDER_COLOR) ||
    DEFAULT_BORDER_COLOR;

  const [colorFillLocal, setColorFillLocal] = useState(initialColorFill);
  const [textColorLocal, setTextColorLocal] = useState(initialTextColor);
  const [borderColorLocal, setBorderColorLocal] = useState(initialBorderColor);

  const [selected, setSelected] = useState(false);

  const isHebrew = (ctxLanguageMode == LanguageMode.Hebrew);

  // select the block if all toSelect words are selected in the studyPane, otherwise unselect it
  useEffect(() => {
    const allSelected = toSelect.every(word => ctxSelectedWords.includes(word));
    setSelected(allSelected);
  }, [ctxSelectedWords, toSelect]);

  useEffect(() => {
    const metadataColor =
      ctxStudyMetadata.words[toSelect[0].wordId]?.color || toSelect[0]?.metadata.color;

    if (metadataColor) {
      metadataColor.fill && setColorFillLocal(metadataColor.fill);
      metadataColor.text && setTextColorLocal(metadataColor.text);
      metadataColor.border && setBorderColorLocal(metadataColor.border);
    } else {
      setColorFillLocal(DEFAULT_COLOR_FILL);
      setTextColorLocal(DEFAULT_TEXT_COLOR);
      setBorderColorLocal(DEFAULT_BORDER_COLOR);
    }
  }, [ctxStudyMetadata, toSelect])

  useEffect(() => {
    if (ctxSelectedWords.length == 0 || ctxColorAction === ColorActionType.none) { return; }

    if (selected) {
      if (ctxColorAction === ColorActionType.colorFill && ctxSelectedColor) {
        setColorFillLocal(ctxSelectedColor);
        toSelect.forEach((word) => {
          word.metadata.color ??= {};
          word.metadata.color.fill = ctxSelectedColor;
        });
      } else if (ctxColorAction === ColorActionType.borderColor && ctxSelectedColor) {
        setBorderColorLocal(ctxSelectedColor);
        toSelect.forEach((word) => {
          word.metadata.color ??= {};
          word.metadata.color.border = ctxSelectedColor;
        });
      } else if (ctxColorAction === ColorActionType.textColor && ctxSelectedColor) {
        setTextColorLocal(ctxSelectedColor);
        toSelect.forEach((word) => {
          word.metadata.color ??= {};
          word.metadata.color.text = ctxSelectedColor;
        });
      } else if (ctxColorAction === ColorActionType.resetColor) {
        setColorFillLocal(DEFAULT_COLOR_FILL);
        setBorderColorLocal(DEFAULT_BORDER_COLOR);
        setTextColorLocal(DEFAULT_TEXT_COLOR);
        toSelect.forEach((word) => {
          delete word.metadata.color;
        });
      }
    }
    else {
      if (ctxSelectedWords.some(word => word.strongNumber == toSelect[0].strongNumber)) {
        const selectedDescendants = ctxSelectedWords.filter(word => word.strongNumber == toSelect[0].strongNumber);
        selectedDescendants.forEach(word => {
          toSelect.forEach((dsd) => {
            if (dsd.wordId === word.wordId) {
              dsd.metadata.color ??= {};
              dsd.metadata.color.fill = (ctxColorAction === ColorActionType.colorFill && ctxSelectedColor) ? ctxSelectedColor : dsd.metadata.color.fill;
              dsd.metadata.color.border = ctxColorAction === ColorActionType.borderColor && ctxSelectedColor? ctxSelectedColor: dsd.metadata.color.border;
              dsd.metadata.color.text = ctxColorAction === ColorActionType.textColor && ctxSelectedColor? ctxSelectedColor: dsd.metadata.color.text;
            }
          })
        })

        setColorFillLocal(matchColorProperty('fill') ? toSelect[0]?.metadata.color?.fill || DEFAULT_COLOR_FILL : DEFAULT_COLOR_FILL);
        setTextColorLocal(matchColorProperty('text') ? toSelect[0]?.metadata.color?.text || DEFAULT_TEXT_COLOR : DEFAULT_TEXT_COLOR);
        setTextColorLocal(matchColorProperty('border') ? toSelect[0]?.metadata.color?.border || DEFAULT_BORDER_COLOR : DEFAULT_BORDER_COLOR);
      }
    }
  }, [ctxSelectedColor, ctxColorAction, ctxSelectedWords]);

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
