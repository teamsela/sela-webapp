import { StropheData } from '@/lib/data';
import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { WordBlock } from './WordBlock';
import { ColorActionType } from "@/lib/types";
import { LuTextSelect } from "react-icons/lu";

export const StropheBlock = ({
    strophe, id
  }: {
    strophe: StropheData, id: number
  }) => {
  
    const { ctxSelectedWords, ctxSetSelectedWords, 
      ctxSetNumSelectedWords, ctxColorAction, ctxColorFill, 
    } = useContext(FormatContext);
  
    const [selected, setSelected] = useState(false);
  
    const [colorFillLocal, setColorFillLocal] = useState(DEFAULT_COLOR_FILL);
  
  
    if (ctxColorAction != ColorActionType.none) {
      if (selected) {
        if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxColorFill) {
          setColorFillLocal(ctxColorFill);
        }
      }
    }
  
    const handleStropheBlockClick = (index:string) => {
      console.log(`strophe`+index);
      setSelected(prevState => !prevState);
      (!selected) ? ctxSelectedWords.push(id) : ctxSelectedWords.splice(ctxSelectedWords.indexOf(id), 1);
      ctxSetSelectedWords(ctxSelectedWords);
      ctxSetNumSelectedWords(ctxSelectedWords.length);
    }
    
  
    useEffect(() => {
      setSelected(ctxSelectedWords.includes(id));
      ctxSetNumSelectedWords(ctxSelectedWords.length);
    }, [ctxSelectedWords]);
  
    return(
      <div 
        key={`strophe`+String(id)}
        className={`relative flex-column p-5 m-5 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300]' : 'rounded border'}`}
        style={
          {
            background: `${colorFillLocal}`
          }
        }
      >
        <button
          key={`strophe`+String(id)+`Selector`}
          className={`z-1 absolute bottom-0 right-0 p-2 m-2 bg-white hover:bg-theme active:bg-transparent`}
          onClick={() => handleStropheBlockClick(String(id))}
          data-clickType={'clickable'}
        >
          <LuTextSelect
            style={{pointerEvents:'none'}}
          />
        </button>
        {
          strophe.lines.map((line, lineId) => {
            return (
              <div
                key={`line`+String(lineId)}
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
                        key={`word`+String(wordId)}
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