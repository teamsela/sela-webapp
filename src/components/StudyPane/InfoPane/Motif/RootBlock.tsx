import React, { useState, useEffect, useContext } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';
import { ColorActionType } from "@/lib/types";
import { HebWord } from '@/lib/data';

export const RootBlock = ({
  id, count, descendants
}: {
  id: number,
  count: number,
  descendants: HebWord[]
}) => {

  let defaultColorFill = descendants[0].colorFill || DEFAULT_COLOR_FILL;
  descendants.forEach((dsd) => {
     if (dsd.colorFill !== defaultColorFill) { defaultColorFill = DEFAULT_COLOR_FILL; }
  });
  let defaultBorderColor = descendants[0].borderColor || DEFAULT_BORDER_COLOR;
  descendants.forEach((dsd) => {
     if (dsd.borderColor !== defaultBorderColor) { defaultBorderColor = DEFAULT_BORDER_COLOR; }
  });
  let defaultTextColor = descendants[0].textColor || DEFAULT_TEXT_COLOR;
  descendants.forEach((dsd) => {
     if (dsd.textColor !== defaultTextColor) { defaultTextColor = DEFAULT_TEXT_COLOR; }
  });

  const { ctxRootsColorMap, ctxColorAction, ctxSelectedColor, ctxSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedHebWords } = useContext(FormatContext)
  const [colorFillLocal, setColorFillLocal] = useState(defaultColorFill);
  const [borderColorLocal, setBorderColorLocal] = useState(defaultBorderColor);
  const [textColorLocal, setTextColorLocal] = useState(defaultTextColor);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const rootBlockColor = ctxRootsColorMap.get(descendants[0].strongNumber);
    if (rootBlockColor) {
      setColorFillLocal(rootBlockColor.colorFill);
      setTextColorLocal(rootBlockColor.textColor);
    }
    descendants.forEach((dsd) => {
      if (dsd.colorFill !== colorFillLocal) { setColorFillLocal(DEFAULT_COLOR_FILL); }
      if (dsd.textColor !== textColorLocal) { setTextColorLocal(DEFAULT_TEXT_COLOR); }
   });    
  }, [ctxRootsColorMap, descendants]);
  
  useEffect(() => {
    let hasChildren = true;
    descendants.forEach((dsd) => {
      hasChildren = hasChildren && ctxSelectedHebWords.includes(dsd);
    })

    setSelected(hasChildren);
  }, [ctxSelectedHebWords, descendants]);

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

  useEffect(() => {
    if (ctxColorAction !== ColorActionType.none && selected) {
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
  }, [ctxColorAction, ctxSelectedColor, selected]);

  return (
    <div className="flex my-1">
      <div
        id={id.toString()}
        key={id}
        className={`wordBlock mx-1 ClickBlock ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
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
