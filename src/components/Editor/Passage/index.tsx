import { HebWord, PassageData } from '@/lib/data';
import { useState, useEffect, useContext } from "react";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType } from "@/lib/types";

type ZoomLevel = {
  [level: number]: { fontSize: string, verseNumMl: string, verseNumMr: string, hbWidth: string, hbHeight: string, width: string, height: string };
}
const zoomLevelMap : ZoomLevel = {
  0:  { fontSize: "text-4xs",  verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-10", hbHeight: "h-3.5", width: "w-10", height: "h-4"  },
  1:  { fontSize: "text-3xs",  verseNumMl: "ml-1",   verseNumMr: "mr-0.5", hbWidth: "w-12", hbHeight: "h-4",   width: "w-13", height: "h-5"  },
  2:  { fontSize: "text-2xs",  verseNumMl: "ml-1",   verseNumMr: "mr-0.5", hbWidth: "w-14", hbHeight: "h-4.5", width: "w-17", height: "h-7"  },
  3:  { fontSize: "text-xs",   verseNumMl: "ml-2",   verseNumMr: "mr-0.5", hbWidth: "w-16", hbHeight: "h-5",   width: "w-20", height: "h-8"  },
  4:  { fontSize: "text-sm",   verseNumMl: "ml-2",   verseNumMr: "mr-0.5", hbWidth: "w-18", hbHeight: "h-5.5", width: "w-24", height: "h-9"  },
  5:  { fontSize: "text-base", verseNumMl: "ml-3",   verseNumMr: "mr-1",   hbWidth: "w-20", hbHeight: "h-6",   width: "w-28", height: "h-10" },
  6:  { fontSize: "text-lg",   verseNumMl: "ml-3",   verseNumMr: "mr-1",   hbWidth: "w-24", hbHeight: "h-6.5", width: "w-32", height: "h-11" },
  7:  { fontSize: "text-xl",   verseNumMl: "ml-3",   verseNumMr: "mr-1",   hbWidth: "w-30", hbHeight: "h-7",   width: "w-36", height: "h-12" },
  8:  { fontSize: "text-2xl",  verseNumMl: "ml-4",   verseNumMr: "mr-1",   hbWidth: "w-32", hbHeight: "h-8",   width: "w-40", height: "h-13" },
  9:  { fontSize: "text-3xl",  verseNumMl: "ml-5",   verseNumMr: "mr-2",   hbWidth: "w-36", hbHeight: "h-9.5", width: "w-48", height: "h-16" },
  10: { fontSize: "text-4xl",  verseNumMl: "ml-6",   verseNumMr: "mr-2",   hbWidth: "w-40", hbHeight: "h-11",  width: "w-60", height: "h-20" },
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

  let fontSize = zoomLevelMap[ctxZoomLevel].fontSize;

  if (ctxUniformWidth && !ctxIsHebrew)
  {
    let numOfRows = 1, rowSize = 7;
    let stringsInHebWord = hebWord.gloss.split(" ");
    (stringsInHebWord.length > 1) && stringsInHebWord.forEach((word) => {
      console.log("rowSize: ", rowSize);
      if (rowSize - word.length <= 0) {
        numOfRows++;
        rowSize = 7;
      }
      rowSize = rowSize - word.length;
    });
    (rowSize < 0) && numOfRows++;
    console.log("gloss: ", hebWord.gloss, "rowSize: ", rowSize, "numOfRows: ", numOfRows);
    if (hebWord.gloss.length > 14 && numOfRows > 2) {
      fontSize = (ctxZoomLevel > 0) ? zoomLevelMap[ctxZoomLevel-1].fontSize : "text-5xs";
    }
  }

  const hebBlockSizeStyle = `${zoomLevelMap[ctxZoomLevel].hbWidth} ${zoomLevelMap[ctxZoomLevel].hbHeight}`;
  const engBlockSizeStyle = `${zoomLevelMap[ctxZoomLevel].width} ${zoomLevelMap[ctxZoomLevel].height} text-wrap`;

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
        className={`flex items-center justify-center select-none px-2 py-1 text-center hover:opacity-60 leading-none 
        ${fontSize}
        ${ctxUniformWidth && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}
        onClick={handleClick}
      >
        {index === 0 ? <sup {...verseNumStyles}>{verseNumber}</sup> : "" }
        {ctxIsHebrew ? hebWord.wlcWord : hebWord.gloss}
      </span>
    </div>
  );

}


const Passage = ({ 
    content
  }: {
    content: PassageData;
  }) => {

  const { ctxIsHebrew } = useContext(FormatContext)

  const styles = {
    container: {
      className: `flex gap-2 mb-2 ${ctxIsHebrew ? "hbFont " : ""}`
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