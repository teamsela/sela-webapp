import React, { useState, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';
import { ColorActionType } from "@/lib/types";

export const RootBlock = ({
    id, rootWord, count, strongNumber
  }: {
    id: number,
    rootWord: string | undefined,
    count: number,
    strongNumber: number
  }) => {
    const { ctxSelectedRoots, ctxSetSelectedRoots } = useContext(FormatContext)
    const [colorFillLocal, setColorFillLocal] = useState(/*hebWord.colorFill || */DEFAULT_COLOR_FILL);
    const [borderColorLocal, setBorderColorLocal] = useState(/*hebWord.borderColor ||*/DEFAULT_BORDER_COLOR);
    const [textColorLocal, setTextColorLocal] = useState(/*hebWord.textColor || */DEFAULT_TEXT_COLOR);
    const [selected, setSelected] = useState(false);
  
    const handleClick = () => {
      setSelected(prevState => !prevState);
      const updatedSelectedRoots = !selected 
      ? [...ctxSelectedRoots, strongNumber]  // Add the strongNumber if selected
      : ctxSelectedRoots.filter(root => root !== strongNumber);  // Remove if unselected

    // Update the context with the new array
    ctxSetSelectedRoots(updatedSelectedRoots);
    }   
  
    return (
      <div className="flex my-1">
        <div
          id={id.toString()}
          key={id}
          className={`wordBlock mx-1 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
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
              data-clicktype="clickable"
            >{rootWord}</span>
              <span className="flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-black text-sm">{count}</span>
          </span>
        </div>
      </div>
    );
  
  }
