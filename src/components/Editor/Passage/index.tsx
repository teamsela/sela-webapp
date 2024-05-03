import { HebWord, PassageData } from '@/lib/data';
import { useState, useEffect, useContext } from "react";
import { FormatContext } from '../index';
import { ActiveColorType } from "@/lib/types";

type ZoomLevel = {
  [level: number]: { fontSize: string, verseNumMl: string, verseNumMr: string };
}
const zoomLevelMap : ZoomLevel = {
  0:  { fontSize: "text-4xs",  verseNumMl: "ml-0.5", verseNumMr: "mr-0.5" },
  1:  { fontSize: "text-3xs",  verseNumMl: "ml-1",   verseNumMr: "mr-0.5" },
  2:  { fontSize: "text-2xs",  verseNumMl: "ml-1",   verseNumMr: "mr-0.5" },
  3:  { fontSize: "text-xs",   verseNumMl: "ml-2",   verseNumMr: "mr-1" },
  4:  { fontSize: "text-sm",   verseNumMl: "ml-2",   verseNumMr: "mr-1" },
  5:  { fontSize: "text-base", verseNumMl: "ml-3",   verseNumMr: "mr-1.5" },
  6:  { fontSize: "text-lg",   verseNumMl: "ml-3",   verseNumMr: "mr-2" },
  7:  { fontSize: "text-xl",   verseNumMl: "ml-3",   verseNumMr: "mr-2" },
  8:  { fontSize: "text-2xl",  verseNumMl: "ml-4",   verseNumMr: "mr-2.5" },
  9:  { fontSize: "text-3xl",  verseNumMl: "ml-5",   verseNumMr: "mr-3" },
  10: { fontSize: "text-4xl",  verseNumMl: "ml-6",   verseNumMr: "mr-4" },
}

const Word = ({
  verseNumber, hebWord, index
}: {
  verseNumber: number;
  hebWord: HebWord;
  index: number;
}) => {

  const { ctxZoomLevel, ctxIsHebrew, ctxSelectedWords, ctxSetSelectedWords, ctxSetHasSelectedWords, ctxColorPickerOpened, ctxColorFill, ctxBorderColor } = useContext(FormatContext)

  const [colorFillLocal, setColorFillLocal] = useState("#FFFFFF");
  const [borderColorLocal, setBorderColorLocal] = useState("#656565")
  const [selected, setSelected] = useState(false);

  if (ctxColorPickerOpened != ActiveColorType.none) {
    if (selected) {
      if (colorFillLocal != ctxColorFill) {
        setColorFillLocal(ctxColorFill);
      }
      if (borderColorLocal != ctxBorderColor) {
        setBorderColorLocal(ctxBorderColor);
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
          border: `2px solid ${borderColorLocal}`
        }
    }>
      <span
        className="flex items-center justify-center select-none px-2 py-1 text-center hover:opacity-60" 
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