import React, { useState, useEffect, useContext } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';
import { ColorActionType, ColorType } from "@/lib/types";
import { HebWord } from '@/lib/data';
import { updateWordColor } from '@/lib/actions';

export const RootBlock = ({
    id, count, descendants
}: {
    id: number,
    count: number,
    descendants: HebWord[]
}) => {

  const { ctxStudyId, ctxRootsColorMap, ctxColorAction, ctxSelectedColor, ctxSelectedHebWords,
    ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetRootsColorMap } = useContext(FormatContext)

  const [colorFillLocal, setColorFillLocal] = useState(descendants[0].colorFill? descendants[0].colorFill: DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(descendants[0].borderColor? descendants[0].colorFill: DEFAULT_BORDER_COLOR);
  const [textColorLocal, setTextColorLocal] = useState(descendants[0].textColor? descendants[0].colorFill: DEFAULT_TEXT_COLOR);
  const [selected, setSelected] = useState(false);

  const matchExpandedWordsColorScheme = () => {
    let match = descendants.every((dsd) => {
      return !dsd.colorFill || dsd.colorFill === descendants[0].colorFill;
    });
    return match;
  }

  useEffect(() => {
    const rootBlockColor = ctxRootsColorMap.get(descendants[0].strongNumber);
    const matchedColorScheme = matchExpandedWordsColorScheme();

    if (rootBlockColor || matchedColorScheme) {
      setColorFillLocal(rootBlockColor? rootBlockColor.colorFill: descendants[0].colorFill);
      setBorderColorLocal(rootBlockColor? rootBlockColor.borderColor: descendants[0].borderColor);
      setTextColorLocal(rootBlockColor? rootBlockColor.textColor: descendants[0].textColor);
    }
    if (!matchedColorScheme) {
      setColorFillLocal(DEFAULT_COLOR_FILL);
      setBorderColorLocal(DEFAULT_BORDER_COLOR);
      setTextColorLocal(DEFAULT_TEXT_COLOR);
    }
  },[ ctxRootsColorMap, ctxSelectedColor, ctxColorAction, ctxSelectedHebWords])
  
  useEffect(() => {
    let hasChildren = true;
    descendants.forEach((dsd) => {
      hasChildren = hasChildren && ctxSelectedHebWords.includes(dsd);
    })

    setSelected(hasChildren);
  }, [ctxSelectedHebWords, descendants]);

  useEffect(() => {
    if (selected){
      const matchedColorScheme = matchExpandedWordsColorScheme()
      let colorObject: ColorType = {} as ColorType;
      colorObject.colorFill = matchedColorScheme && descendants[0].colorFill || DEFAULT_COLOR_FILL;
      if (ctxColorAction !== ColorActionType.none && selected) {
        if (ctxColorAction === ColorActionType.colorFill && ctxSelectedColor) {
          setColorFillLocal(ctxSelectedColor);
          colorObject.colorFill = ctxSelectedColor;
        } else if (ctxColorAction === ColorActionType.borderColor && ctxSelectedColor) {
          setBorderColorLocal(ctxSelectedColor);
          colorObject.borderColor = ctxSelectedColor;
        } else if (ctxColorAction === ColorActionType.textColor && ctxSelectedColor) {
          setTextColorLocal(ctxSelectedColor);
          colorObject.textColor = ctxSelectedColor;
        } else if (ctxColorAction === ColorActionType.resetColor) {
          setColorFillLocal(DEFAULT_COLOR_FILL);
          setBorderColorLocal(DEFAULT_BORDER_COLOR);
          setTextColorLocal(DEFAULT_TEXT_COLOR);
          colorObject.colorFill = DEFAULT_COLOR_FILL;
          colorObject.borderColor = DEFAULT_BORDER_COLOR;
          colorObject.textColor = DEFAULT_TEXT_COLOR;
        }
        ctxRootsColorMap.set(descendants[0].strongNumber, colorObject);
        const newRootsColorMap = new Map(ctxRootsColorMap);
        ctxSetRootsColorMap(newRootsColorMap);
        let descendantWordIds: number[] = [];
        descendants.forEach((word) => {
          word.colorFill = colorObject.colorFill;
          word.textColor = colorObject.textColor;
          word.borderColor = colorObject.borderColor;
          descendantWordIds.push(word.id)
        });
        updateWordColor(ctxStudyId, descendantWordIds, ColorActionType.colorFill, colorObject.colorFill);
        updateWordColor(ctxStudyId, descendantWordIds, ColorActionType.textColor, colorObject.textColor);
        updateWordColor(ctxStudyId, descendantWordIds, ColorActionType.borderColor, colorObject.borderColor);
      }
    }
  }, [ctxSelectedColor, ctxColorAction]);

  const handleClick = (e: React.MouseEvent) => {
      setSelected(prevState => !prevState);
      let updatedSelectedHebWords = [...ctxSelectedHebWords];
      if (!selected) {
        updatedSelectedHebWords = ctxSelectedHebWords.concat(descendants);
      } else {
        descendants.forEach((dsd) => {
          updatedSelectedHebWords.splice(updatedSelectedHebWords.indexOf(dsd), 1)
        })
      }
      ctxSetSelectedHebWords(updatedSelectedHebWords);
      ctxSetNumSelectedWords(updatedSelectedHebWords.length);
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
          >{descendants[0].ETCBCgloss}</span>
          <span className="flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-black text-sm">{count}</span>
        </span>
      </div>
    </div>
  );

}
