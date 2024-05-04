import { HebWord, PassageData } from '@/lib/data';
import { useState, useEffect, useContext } from "react";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType } from "@/lib/types";

type ZoomLevel = {
  [level: number]: { fontSize: string, verseNumMl: string, verseNumMr: string, width: string, height: string };
}
const zoomLevelMap : ZoomLevel = {
  0:  { fontSize: "text-4xs",  verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", width: "w-15", height: "h-5"},
  1:  { fontSize: "text-3xs",  verseNumMl: "ml-1",   verseNumMr: "mr-0.5", width: "w-15", height: "h-10"},
  2:  { fontSize: "text-2xs",  verseNumMl: "ml-1",   verseNumMr: "mr-0.5", width: "w-20", height: "h-10"},
  3:  { fontSize: "text-xs",   verseNumMl: "ml-2",   verseNumMr: "mr-0.5", width: "w-25", height: "h-12"},
  4:  { fontSize: "text-sm",   verseNumMl: "ml-2",   verseNumMr: "mr-0.5", width: "w-30", height: "h-15"},
  5:  { fontSize: "text-base", verseNumMl: "ml-3",   verseNumMr: "mr-1",   width: "w-35", height: "h-15"},
  6:  { fontSize: "text-lg",   verseNumMl: "ml-3",   verseNumMr: "mr-1",   width: "w-40", height: "h-15" },
  7:  { fontSize: "text-xl",   verseNumMl: "ml-3",   verseNumMr: "mr-1",   width: "w-45", height: "h-15" },
  8:  { fontSize: "text-2xl",  verseNumMl: "ml-4",   verseNumMr: "mr-1",   width: "w-50", height: "h-15" },
  9:  { fontSize: "text-3xl",  verseNumMl: "ml-5",   verseNumMr: "mr-2",   width: "w-60", height: "h-20" },
  10: { fontSize: "text-4xl",  verseNumMl: "ml-6",   verseNumMr: "mr-2",   width: "w-70", height: "h-20"},
}

const Word = ({
  verseNumber, hebWord, index
}: {
  verseNumber: number;
  hebWord: HebWord;
  index: number;
}) => {

  const { ctxZoomLevel, ctxIsHebrew, ctxSelectedWords, ctxSetSelectedWords, ctxSetHasSelectedWords, ctxColorAction, ctxColorFill, ctxBorderColor, ctxTextColor, ctxUniformWidth } = useContext(FormatContext)

  const [colorFillLocal, setColorFillLocal] = useState(hebWord.colorFill || DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(hebWord.borderColor || DEFAULT_BORDER_COLOR);
  const [textColorLocal, setTextColorLocal] = useState(hebWord.textColor || DEFAULT_TEXT_COLOR);
  const [selected, setSelected] = useState(false);

  if (ctxColorAction != ColorActionType.none) {
    if (selected) {
      if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxColorFill) {
        setColorFillLocal(ctxColorFill);
      }
      else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxBorderColor) {
        setBorderColorLocal(ctxBorderColor);
      }
      else if (ctxColorAction === ColorActionType.textColor && textColorLocal != ctxTextColor) {
        setTextColorLocal(ctxTextColor);
      }
      else if (ctxColorAction === ColorActionType.resetColor) {
        (colorFillLocal != ctxColorFill) && setColorFillLocal(ctxColorFill);
        (borderColorLocal != ctxBorderColor) && setBorderColorLocal(ctxBorderColor);
        (textColorLocal != ctxTextColor) && setTextColorLocal(ctxTextColor);
      }
    }
  }

  useEffect(() => {
    if (!ctxSelectedWords.includes(hebWord.id) && selected) {
      setSelected(false);
    }
  },[ctxSelectedWords, hebWord.id, selected]);

  const handleClick = () => {
    setSelected(prevState => !prevState);
    (!selected) ? ctxSelectedWords.push(hebWord.id) : ctxSelectedWords.splice(ctxSelectedWords.indexOf(hebWord.id), 1);
    ctxSetSelectedWords(ctxSelectedWords);
    ctxSetHasSelectedWords(ctxSelectedWords.length > 0);
  }

  const verseNumStyles = {
      className: `font-features sups w-1 ${ctxIsHebrew ? zoomLevelMap[ctxZoomLevel].verseNumMl : zoomLevelMap[ctxZoomLevel].verseNumMr}`
  } 

  return (
    <div 
      key={hebWord.id}
      className={ selected ? "rounded border outline outline-offset-1 outline-2 outline-[#FFC300]" : "rounded border" }
      style={
        { 
          background: `${colorFillLocal}`, 
          border: `2px solid ${borderColorLocal}`,
          color: `${textColorLocal}`
        }
    }>
      <span
        className={`flex items-center justify-center select-none px-2 py-1 text-center hover:opacity-60 
        ${ctxUniformWidth ? `${zoomLevelMap[ctxZoomLevel].width} ${zoomLevelMap[ctxZoomLevel].height} text-wrap` : ""}`}
        onClick={handleClick}
      >
        {index === 0 ? <sup {...verseNumStyles}>{verseNumber}</sup> : "" }
        {!ctxIsHebrew ? hebWord.gloss : hebWord.wlcWord}
      </span>
    </div>
  );

}


const Passage = ({ 
    content
  }: {
    content: PassageData;
  }) => {

  const { ctxZoomLevel, ctxIsHebrew } = useContext(FormatContext)

  const styles = {
    container: {
      className: `flex gap-2 mb-2 ${ctxIsHebrew ? "hbFont " : ""}${zoomLevelMap[ctxZoomLevel].fontSize}`
    }
  }

  return (
    <div>
    {
      content.chapters.map((chapter) => (
        chapter.verses.map((verse) => (
          verse.paragraphs.map((paragraph, p_index) => (
            <div key={chapter.id + "." + verse.id + "-" + p_index} {...styles.container}>
              {
                paragraph.words.map((word, index) => (
                    <Word 
                      key={word.id} 
                      verseNumber={verse.id}
                      hebWord={word}
                      index={index}
                    />
                  )
                )
              }
            </div>
          ))
        ))
      ))
    }
    </div>
  );
};

export default Passage;