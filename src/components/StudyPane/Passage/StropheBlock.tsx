import React, { useState, useEffect, useContext } from 'react';
import { LuTextSelect } from "react-icons/lu";
import { DEFAULT_COLOR_FILL, FormatContext } from '../index';
import { WordBlock } from './WordBlock';
import { ColorActionType } from "@/lib/types";
import { StropheData } from '@/lib/data';

export const StropheBlock = ({
    strophe, id
  }: {
    strophe: StropheData, id: number
  }) => {
  
    const { ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
      ctxSetNumSelectedWords, ctxColorAction, ctxColorFill, ctxSetColorFill
    } = useContext(FormatContext);
  
    const [selected, setSelected] = useState(false);
  
    const [colorFillLocal, setColorFillLocal] = useState(strophe.colorFill || DEFAULT_COLOR_FILL);
  
    if (ctxColorAction != ColorActionType.none) {
      if (selected) {
        if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxColorFill) {
          setColorFillLocal(ctxColorFill);
        }
      }
    }
  
    const handleStropheBlockClick = (index: number) => {
      setSelected(prevState => !prevState);
      //(!selected) ? ctxSelectedWords.push(id) : ctxSelectedWords.splice(ctxSelectedWords.indexOf(id), 1);
      //ctxSetSelectedWords(ctxSelectedWords);
      //ctxSetNumSelectedWords(ctxSelectedWords.length);
      (!selected) ? ctxSelectedStrophes.push(id) : ctxSelectedStrophes.splice(ctxSelectedStrophes.indexOf(id), 1);
      ctxSetSelectedStrophes(ctxSelectedStrophes);
      ctxSetNumSelectedStrophes(ctxSelectedStrophes.length);
      if (ctxSelectedStrophes.length === 1) {
        ctxSetColorFill(colorFillLocal);
      }
    }
    
  
    useEffect(() => {
      setSelected(ctxSelectedStrophes.includes(id));
      ctxSetNumSelectedStrophes(ctxSelectedStrophes.length);
      //ctxSetNumSelectedWords(ctxSelectedStrophes.length);
    }, [ctxSelectedStrophes]);
  
    return(
      <div 
        key={"strophe" + id}
        className={`relative flex-column p-5 m-5 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300]' : 'rounded border'}`}
        style={
          {
            background: `${colorFillLocal}`
          }
        }
      >
        <button
          key={"strophe" + id + "Selector"}
          className={`z-1 absolute bottom-0 right-0 p-2 m-2 bg-white hover:bg-theme active:bg-transparent`}
          onClick={() => handleStropheBlockClick(id)}
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
                line.words.map((word, wordId) => {
                  return (
                    <div
                      className={`mt-1 mb-1`}
                      key={wordId}
                    >
                      <WordBlock
                        key={"word_" + wordId}
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