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

  const { ctxIsHebrew, ctxColorAction, ctxSelectedColor, ctxRootsColorMap,
    ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords } = useContext(FormatContext)



  const matchFillColor = () => {
    let match = descendants.every((dsd) => {
      return !dsd.colorFill || dsd.colorFill === descendants[0].colorFill;
    });
    return match;
  }

  const matchTextColor = () => {
    let match = descendants.every((dsd) => {
      return !dsd.textColor || dsd.textColor === descendants[0].textColor;
    });
    return match;
  }
  
  const matchBorderColor = () => {
    let match = descendants.every((dsd) => {
      return !dsd.borderColor || dsd.borderColor === descendants[0].borderColor;
    });
    return match;
  }
  const rootsColorMap = ctxRootsColorMap.get(descendants[0].strongNumber);
  const [colorFillLocal, setColorFillLocal] = useState(rootsColorMap? rootsColorMap.colorFill: matchFillColor()? descendants[0].colorFill: DEFAULT_COLOR_FILL);
  const [textColorLocal, setTextColorLocal] = useState(rootsColorMap? rootsColorMap.textColor: matchTextColor()? descendants[0].textColor: DEFAULT_TEXT_COLOR);
  const [borderColorLocal, setBorderColorLocal] = useState(matchBorderColor()? descendants[0].textColor: DEFAULT_BORDER_COLOR);
  const [selected, setSelected] = useState(false);


  useEffect(() => {
    let hasChildren = true;
    descendants.forEach((dsd) => {
      //hasChildren = hasChildren && ctxSelectedWords.includes(dsd);
    })

    setSelected(hasChildren);
  }, [ctxSelectedWords, descendants]);

  useEffect(() => {
    const rootsColorMap = ctxRootsColorMap.get(descendants[0].strongNumber)
    if (rootsColorMap) {
      descendants.forEach(dsd => {
        dsd.colorFill = rootsColorMap.colorFill;
        dsd.textColor = rootsColorMap.textColor;
        dsd.borderColor = rootsColorMap.borderColor;
      });
      setColorFillLocal(rootsColorMap.colorFill);
      setTextColorLocal(rootsColorMap.textColor);
      setBorderColorLocal(rootsColorMap.borderColor);
    }
  }, [ctxRootsColorMap])

  useEffect(() => {
    if (ctxSelectedWords.length == 0 || ctxColorAction === ColorActionType.none) { return; }

    if (selected) {
      if (ctxColorAction === ColorActionType.colorFill && ctxSelectedColor) {
        setColorFillLocal(ctxSelectedColor);
        descendants.forEach((word) => {
          word.colorFill = ctxSelectedColor;
        });
      } else if (ctxColorAction === ColorActionType.borderColor && ctxSelectedColor) {
        setBorderColorLocal(ctxSelectedColor);
        descendants.forEach((word) => {
          word.borderColor = ctxSelectedColor;
        });
      } else if (ctxColorAction === ColorActionType.textColor && ctxSelectedColor) {
        setTextColorLocal(ctxSelectedColor);
        descendants.forEach((word) => {
          word.textColor = ctxSelectedColor;
        });
      } else if (ctxColorAction === ColorActionType.resetColor) {
        setColorFillLocal(DEFAULT_COLOR_FILL);
        setBorderColorLocal(DEFAULT_BORDER_COLOR);
        setTextColorLocal(DEFAULT_TEXT_COLOR);
        descendants.forEach((word) => {
          word.colorFill = DEFAULT_COLOR_FILL;
          word.textColor = DEFAULT_TEXT_COLOR;
          word.borderColor = DEFAULT_BORDER_COLOR;
        });
      }
    }
    else {
      if (ctxSelectedWords.some(word => word.strongNumber == descendants[0].strongNumber)) {
        const selectedDescendants = ctxSelectedWords.filter(word => word.strongNumber == descendants[0].strongNumber);
        selectedDescendants.forEach(word => {
          descendants.forEach((dsd) => {
            if (dsd.id === word.wordId) {
              dsd.colorFill = ctxColorAction === ColorActionType.colorFill && ctxSelectedColor? ctxSelectedColor: dsd.colorFill;
              dsd.borderColor = ctxColorAction === ColorActionType.borderColor && ctxSelectedColor? ctxSelectedColor: dsd.borderColor;
              dsd.textColor = ctxColorAction === ColorActionType.textColor && ctxSelectedColor? ctxSelectedColor: dsd.textColor;
            }
          })
        })
        setColorFillLocal(matchFillColor()? descendants[0].colorFill: DEFAULT_COLOR_FILL);
        setTextColorLocal(matchTextColor()? descendants[0].textColor: DEFAULT_TEXT_COLOR);
        setBorderColorLocal(matchBorderColor()? descendants[0].borderColor: DEFAULT_BORDER_COLOR);
      }
    }
  }, [ctxSelectedColor, ctxColorAction, ctxSelectedWords]);

  const handleClick = (e: React.MouseEvent) => {
      setSelected(prevState => !prevState);
      let updatedSelectedWords = [...ctxSelectedWords];
      if (!selected) {
        //updatedSelectedWords = ctxSelectedWords.concat(descendants);
      } else {
        descendants.forEach((dsd) => {
        //  ctxSetSelectedWords.splice(updatedSelectedWords.indexOf(dsd), 1)
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
          >{ctxIsHebrew ? descendants[0].lemma : descendants[0].ETCBCgloss}</span>
          <span className="flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-black text-sm">{count}</span>
        </span>
      </div>
    </div>
  );

}
