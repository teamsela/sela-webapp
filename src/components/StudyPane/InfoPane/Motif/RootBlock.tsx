import React, { useState, useEffect, useContext } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';
import { ColorActionType, ColorType } from "@/lib/types";
import { HebWord } from '@/lib/data';

export const RootBlock = ({
  id, count, descendants
}: {
  id: number,
  count: number,
  descendants: HebWord[]
}) => {

  const { ctxRootsColorMap, ctxColorAction, ctxSelectedColor, ctxSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetRootsColorMap, ctxExpandedStanzas, ctxExpandedStrophes } = useContext(FormatContext)
  
  let defaultColorFill = descendants[0].colorFill || DEFAULT_COLOR_FILL;
  let defaultBorderColor = descendants[0].borderColor || DEFAULT_BORDER_COLOR;
  let defaultTextColor = descendants[0].textColor || DEFAULT_TEXT_COLOR;

  const rootBlockColor = ctxRootsColorMap.get(descendants[0].strongNumber);
  if (rootBlockColor) {
    defaultColorFill = rootBlockColor.colorFill;
    defaultBorderColor = rootBlockColor.borderColor;
    defaultTextColor = rootBlockColor.textColor;
  }
  useEffect(() => {
    descendants.forEach((dsd) => {
      if (ctxExpandedStrophes[Number(dsd.stropheId)] === false || ctxExpandedStanzas[Number(dsd.stanzaId)] === false ) {
        return;
      }
      if (dsd.colorFill !== defaultColorFill) { defaultColorFill = DEFAULT_COLOR_FILL; }
      if (dsd.borderColor !== defaultBorderColor) { defaultBorderColor = DEFAULT_BORDER_COLOR; }
      if (dsd.textColor !== defaultTextColor) { defaultTextColor = DEFAULT_TEXT_COLOR; }
    });
  }, [ctxRootsColorMap])

  const [colorFillLocal, setColorFillLocal] = useState(defaultColorFill);
  const [borderColorLocal, setBorderColorLocal] = useState(defaultBorderColor);
  const [textColorLocal, setTextColorLocal] = useState(defaultTextColor);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const rootBlockColor = ctxRootsColorMap.get(descendants[0].strongNumber);
    if (rootBlockColor) {
      setColorFillLocal(rootBlockColor.colorFill);
      setTextColorLocal(rootBlockColor.textColor);
      setBorderColorLocal(rootBlockColor.borderColor);
    }
  }, [ctxRootsColorMap]);
  
  // useEffect(() => {
  //   const colorFill = descendants[0].colorFill;
  //   const isSameColorFill = descendants.every((x) => x.colorFill === colorFill);
  //   if (!isSameColorFill) {
  //      setColorFillLocal(DEFAULT_COLOR_FILL);
  //   } else if (colorFill != colorFillLocal) { setColorFillLocal(colorFill); }

  //   const textColor = descendants[0].textColor;
  //   const isSameTextColor = descendants.every((x) => x.textColor === textColor);
  //   if (!isSameTextColor) {
  //      setColorFillLocal(DEFAULT_TEXT_COLOR);
  //   } else if (textColor != textColorLocal) { setTextColorLocal(textColor); }
  // }, [descendants]);

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
    let colorObject: ColorType = {} as ColorType;
    colorObject.colorFill = defaultColorFill;
    colorObject.borderColor = defaultBorderColor;
    colorObject.textColor = defaultTextColor;

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
      ctxSetRootsColorMap(ctxRootsColorMap);
    }
  }, [ctxColorAction, ctxSelectedColor, selected]);

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
