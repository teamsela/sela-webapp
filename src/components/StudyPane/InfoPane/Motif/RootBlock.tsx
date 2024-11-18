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

  const { ctxRootsColorMap, ctxColorAction, ctxSelectedColor, ctxSelectedHebWords,
    ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetRootsColorMap, 
    ctxExpandedStanzas, ctxExpandedStrophes, ctxSelectedRoots, ctxSetSelectedRoots } = useContext(FormatContext)
  

  const matchedColorScheme = descendants.every((dsd) => {
    const matchesBorderColor = !dsd.borderColor || dsd.borderColor === descendants[0].borderColor;
    const matchesColorFill = !dsd.colorFill || dsd.colorFill === descendants[0].colorFill;
    const matchesTextColor = !dsd.textColor || dsd.textColor === descendants[0].textColor;

    return matchesBorderColor && matchesColorFill && matchesTextColor;
  });

  const [colorFillLocal, setColorFillLocal] = useState(matchedColorScheme? descendants[0].colorFill: DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(matchedColorScheme? descendants[0].borderColor: DEFAULT_BORDER_COLOR);
  const [textColorLocal, setTextColorLocal] = useState(matchedColorScheme? descendants[0].textColor: DEFAULT_TEXT_COLOR);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const rootBlockColor = ctxRootsColorMap.get(descendants[0].strongNumber);
    const matchedColorScheme = descendants.every((dsd) => {
      const matchesBorderColor = !dsd.borderColor || dsd.borderColor === descendants[0].borderColor;
      const matchesColorFill = !dsd.colorFill || dsd.colorFill === descendants[0].colorFill;
      const matchesTextColor = !dsd.textColor || dsd.textColor === descendants[0].textColor;

      return matchesBorderColor && matchesColorFill && matchesTextColor;
    });
    if (rootBlockColor) {
      setColorFillLocal(rootBlockColor.colorFill);
      setBorderColorLocal(rootBlockColor.borderColor);
      setTextColorLocal(rootBlockColor.textColor);
    }
    else if (matchedColorScheme) {
      setColorFillLocal(descendants[0].colorFill);
      setBorderColorLocal(descendants[0].borderColor);
      setTextColorLocal(descendants[0].textColor);
    }
    else {
      setColorFillLocal(DEFAULT_COLOR_FILL);
      setBorderColorLocal(DEFAULT_BORDER_COLOR);
      setTextColorLocal(DEFAULT_TEXT_COLOR);
    }
  },[ctxColorAction, ctxRootsColorMap, ctxSelectedHebWords])

  
  useEffect(() => {
    let hasChildren = true;
    descendants.forEach((dsd) => {
      hasChildren = hasChildren && ctxSelectedHebWords.includes(dsd);
    })

    setSelected(hasChildren);
  }, [ctxSelectedHebWords, descendants]);

  useEffect(() => {
    if (selected) {
      if (!ctxSelectedRoots.has(descendants[0].strongNumber)) {
        ctxSelectedRoots.add(descendants[0].strongNumber);
        const updatedSelectedRoots = new Set(ctxSelectedRoots);
        // const matchedColorScheme = descendants.every((dsd) => {
        //   const matchesBorderColor = !dsd.borderColor || dsd.borderColor === descendants[0].borderColor;
        //   const matchesColorFill = !dsd.colorFill || dsd.colorFill === descendants[0].colorFill;
        //   const matchesTextColor = !dsd.textColor || dsd.textColor === descendants[0].textColor;
    
        //   return matchesBorderColor && matchesColorFill && matchesTextColor;
        // });
        // const rootBlockColor: ColorType = {
        //   colorFill: matchedColorScheme? descendants[0].colorFill && descendants[0].colorFill: DEFAULT_COLOR_FILL,
        //   textColor: matchedColorScheme? descendants[0].textColor && descendants[0].textColor: DEFAULT_TEXT_COLOR,
        //   borderColor: matchedColorScheme? descendants[0].borderColor && descendants[0].borderColor: DEFAULT_BORDER_COLOR
        // };
        // if (!ctxRootsColorMap.has(descendants[0].strongNumber) && matchedColorScheme){
        //   ctxRootsColorMap.set(descendants[0].strongNumber, rootBlockColor);
        //   const newRootsColorMap = new Map(ctxRootsColorMap);
        //   ctxSetRootsColorMap(newRootsColorMap);
        // }
        ctxSetSelectedRoots(updatedSelectedRoots);
      }
    }
    else {
      ctxRootsColorMap.delete(descendants[0].strongNumber);
      const newRootsColorMap = new Map(ctxRootsColorMap);
      ctxSetRootsColorMap(newRootsColorMap);
      ctxSelectedRoots.delete(descendants[0].strongNumber);
      const updatedSelectedRoots = new Set(ctxSelectedRoots);
      ctxSetSelectedRoots(updatedSelectedRoots);
    }
  }, [selected, ctxSelectedHebWords])

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
