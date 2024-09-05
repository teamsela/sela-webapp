import React, { useState, useEffect, useContext } from 'react';
import { LuTextSelect } from "react-icons/lu";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, FormatContext } from '../index';
import { WordBlock } from './WordBlock';
import { ColorActionType } from "@/lib/types";
import { StropheData } from '@/lib/data';
import { strophesHasSameColor } from "@/lib/utils";

export const StropheBlock = ({
    strophe
  }: {
    strophe: StropheData
  }) => {
  
    const { ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
      ctxSetNumSelectedWords, ctxIsHebrew, ctxColorAction, ctxSelectedColor, ctxSetColorFill, ctxSetBorderColor
    } = useContext(FormatContext);
  
    const [selected, setSelected] = useState(false);
  
    const [colorFillLocal, setColorFillLocal] = useState(strophe.colorFill || DEFAULT_COLOR_FILL);
    const [borderColorLocal, setBorderColorLocal] = useState(strophe.borderColor || DEFAULT_BORDER_COLOR);
  
    if (ctxColorAction != ColorActionType.none && selected) {
      if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxSelectedColor && ctxSelectedColor != "") {
        setColorFillLocal(ctxSelectedColor);
        strophe.colorFill = ctxSelectedColor;
      }
      else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxSelectedColor && ctxSelectedColor != "") {
        setBorderColorLocal(ctxSelectedColor);
        strophe.borderColor = ctxSelectedColor;
      }
      else if (ctxColorAction === ColorActionType.resetColor) {
        if (colorFillLocal != DEFAULT_COLOR_FILL) {
          setColorFillLocal(DEFAULT_COLOR_FILL);
          strophe.colorFill = DEFAULT_COLOR_FILL;
        }
        if (borderColorLocal != DEFAULT_BORDER_COLOR) {
          setBorderColorLocal(DEFAULT_BORDER_COLOR);
          strophe.borderColor = DEFAULT_BORDER_COLOR;  
        }
      }
    }
  
    const handleStropheBlockClick = () => {
      setSelected(prevState => !prevState);
      (!selected) ? ctxSelectedStrophes.push(strophe) : ctxSelectedStrophes.splice(ctxSelectedStrophes.indexOf(strophe), 1);
      ctxSetSelectedStrophes(ctxSelectedStrophes);
      ctxSetNumSelectedStrophes(ctxSelectedStrophes.length);

      ctxSetColorFill(DEFAULT_COLOR_FILL);
      ctxSetBorderColor(DEFAULT_BORDER_COLOR);
      if (ctxSelectedStrophes.length >= 1) {
        const lastSelectedStrophe = ctxSelectedStrophes.at(ctxSelectedStrophes.length-1);
        if (lastSelectedStrophe) {
          strophesHasSameColor(ctxSelectedStrophes, ColorActionType.colorFill) && ctxSetColorFill(lastSelectedStrophe.colorFill || DEFAULT_COLOR_FILL);
          strophesHasSameColor(ctxSelectedStrophes, ColorActionType.borderColor) && ctxSetBorderColor(lastSelectedStrophe.borderColor || DEFAULT_BORDER_COLOR);
        }
      }
    }
  
    useEffect(() => {
      setSelected(ctxSelectedStrophes.includes(strophe));
      ctxSetNumSelectedStrophes(ctxSelectedStrophes.length);
    }, [ctxSelectedStrophes]);
  
    return(
      <div 
        key={"strophe_" + strophe.id}
        className={`relative flex-column p-5 m-5 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300]' : 'rounded border'}`}
        style={
          {
            background: `${colorFillLocal}`,
            border: `2px solid ${borderColorLocal}`
          }
        }
      >
        <button
          key={"strophe" + strophe.id + "Selector"}
          className={`z-1 absolute top-0 p-2 m-2 bg-white hover:bg-theme active:bg-transparent ${ctxIsHebrew ? 'left-0' : 'right-0'}`}
          onClick={() => handleStropheBlockClick()}
          data-clicktype={'clickable'}
        >
          <LuTextSelect
            style={{pointerEvents:'none'}}
          />
        </button>
        {
          strophe.lines.map((line, lineId) => {
            return (
              <div
                key={"line_" + lineId}
                className={`flex`}
              >
              {
                line.words.map((word) => {
                  return (
                    <div
                      className={`mt-1 mb-1`}
                      key={word.id}
                    >
                      <WordBlock
                        key={"word_" + word.id}
                        hebWord={word}
                      />
                    </div>           
                  )
                })
              }
              </div>
            )
          })
        }
      </div>
    )
  }