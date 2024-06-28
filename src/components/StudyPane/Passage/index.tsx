import { HebWord, PassageData } from '@/lib/data';
import { useState, useEffect, useContext } from "react";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType } from "@/lib/types";
import { wrapText } from "@/lib/utils";

type ZoomLevel = {
  [level: number]: { fontSize: string, verseNumMl: string, verseNumMr: string, hbWidth: string, hbHeight: string, width: string, height: string, fontInPx: string, maxWidthPx: number, indent: string, hebIndent: string };
}
const zoomLevelMap: ZoomLevel = {
  0: { fontSize: "text-4xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-10", hbHeight: "h-3.5", width: "w-12", height: "h-4", fontInPx: "6px", maxWidthPx: 38, indent: "ml-17.5", hebIndent: "mr-15.5" },
  1: { fontSize: "text-3xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-12", hbHeight: "h-4", width: "w-16", height: "h-6", fontInPx: "8px", maxWidthPx: 54, indent: "ml-21.5", hebIndent: "mr-17.5" },
  2: { fontSize: "text-2xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-14", hbHeight: "h-4.5", width: "w-19", height: "h-7", fontInPx: "10px", maxWidthPx: 63, indent: "ml-24.5", hebIndent: "mr-19.5" },
  3: { fontSize: "text-xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-16", hbHeight: "h-5", width: "w-22", height: "h-8", fontInPx: "12px", maxWidthPx: 72, indent: "ml-27.5", hebIndent: "mr-21.5" },
  4: { fontSize: "text-sm", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-18", hbHeight: "h-5.5", width: "w-25", height: "h-9", fontInPx: "14px", maxWidthPx: 84, indent: "ml-30.5", hebIndent: "mr-23.5" },
  5: { fontSize: "text-base", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-20", hbHeight: "h-6", width: "w-28", height: "h-10", fontInPx: "16px", maxWidthPx: 96, indent: "ml-34", hebIndent: "mr-26" },
  6: { fontSize: "text-lg", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-24", hbHeight: "h-6.5", width: "w-32", height: "h-11", fontInPx: "18px", maxWidthPx: 114, indent: "ml-38", hebIndent: "mr-30" },
  7: { fontSize: "text-xl", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-30", hbHeight: "h-8", width: "w-36", height: "h-12", fontInPx: "20px", maxWidthPx: 136, indent: "ml-42", hebIndent: "mr-36" },
  8: { fontSize: "text-2xl", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-32", hbHeight: "h-10", width: "w-40", height: "h-13", fontInPx: "24px", maxWidthPx: 148, indent: "ml-46", hebIndent: "mr-38" },
  9: { fontSize: "text-3xl", verseNumMl: "ml-2", verseNumMr: "mr-2", hbWidth: "w-36", hbHeight: "h-14", width: "w-48", height: "h-16", fontInPx: "30px", maxWidthPx: 163, indent: "ml-55", hebIndent: "mr-43" },
  10: { fontSize: "text-4xl", verseNumMl: "ml-2", verseNumMr: "mr-2", hbWidth: "w-40", hbHeight: "h-17", width: "w-60", height: "h-20", fontInPx: "36px", maxWidthPx: 218, indent: "ml-67", hebIndent: "mr-47" },
  11: { fontSize: "text-5xl", verseNumMl: "ml-2.5", verseNumMr: "mr-2.5", hbWidth: "w-42", hbHeight: "h-18", width: "w-72", height: "h-20", fontInPx: "42px", maxWidthPx: 236, indent: "ml-67", hebIndent: "mr-52" },
  12: { fontSize: "text-6xl", verseNumMl: "ml-2.5", verseNumMr: "mr-2.5", hbWidth: "w-42", hbHeight: "h-18", width: "w-72", height: "h-20", fontInPx: "42px", maxWidthPx: 236, indent: "ml-67", hebIndent: "mr-52" },
}

const WordBlock = ({
  verseNumber, hebWord, showVerseNum
}: {
  verseNumber: number;
  hebWord: HebWord;
  showVerseNum: boolean;
}) => {

  const { ctxZoomLevel, ctxIsHebrew, ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords, ctxColorAction, ctxColorFill, ctxBorderColor, ctxTextColor, ctxUniformWidth, ctxIndentWord } = useContext(FormatContext)

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
  }, [ctxSelectedWords, hebWord.id, selected, hebWord.indented]);


  const handleClick = () => {
    setSelected(prevState => !prevState);
    (!selected) ? ctxSelectedWords.push(hebWord.id) : ctxSelectedWords.splice(ctxSelectedWords.indexOf(hebWord.id), 1);
    ctxSetSelectedWords(ctxSelectedWords);
    ctxSetNumSelectedWords(ctxSelectedWords.length);
  }

  const verseNumStyles = {
    className: `${zoomLevelMap[ctxZoomLevel].fontSize} top-0 ${ctxIsHebrew ? 'right-0' : 'left-0'} sups w-1 position-absolute ${ctxIsHebrew ? zoomLevelMap[ctxZoomLevel].verseNumMr : zoomLevelMap[ctxZoomLevel].verseNumMl}`
  }

  let fontSize = zoomLevelMap[(ctxIsHebrew) ? ctxZoomLevel+2 : ctxZoomLevel].fontSize;

  if (ctxUniformWidth && !ctxIsHebrew) {
    const canvas = document.createElement('canvas');
    if (canvas) {
      // Get the 2D rendering context
      const context = canvas.getContext('2d');
      if (context) {
        context.font = zoomLevelMap[ctxZoomLevel].fontInPx + " Satoshi";
        let currentLineCount = wrapText(hebWord.gloss.trim(), context, zoomLevelMap[ctxZoomLevel].maxWidthPx /*(index === 0) ? 90 : 96*/);
        let currentZoomLevel = ctxZoomLevel - 1;
        while (currentLineCount > 2 && currentZoomLevel >= 0) {
          context.font = zoomLevelMap[currentZoomLevel].fontInPx + " Satoshi";
          currentLineCount = wrapText(hebWord.gloss.trim(), context, zoomLevelMap[ctxZoomLevel].maxWidthPx);
          fontSize = zoomLevelMap[currentZoomLevel].fontSize;
          currentZoomLevel--;
        }

        (currentLineCount > 2 && currentZoomLevel === -1) && (fontSize = "text-5xs");
      }
    }
  }

  const hebBlockSizeStyle = `${zoomLevelMap[ctxZoomLevel].hbWidth} ${zoomLevelMap[ctxZoomLevel].hbHeight}`;
  const engBlockSizeStyle = `${zoomLevelMap[ctxZoomLevel].width} ${zoomLevelMap[ctxZoomLevel].height} text-wrap`;
  const indentStyle = ctxIsHebrew ?  `${zoomLevelMap[ctxZoomLevel].hebIndent}` : `${zoomLevelMap[ctxZoomLevel].indent}`;


  return (
    <div
      key={hebWord.id}
      className={`mx-1 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300]' : 'rounded border'}
      ${ctxUniformWidth && (ctxIndentWord.includes(hebWord.id) || hebWord.indented)? indentStyle : ''}`}
      style={
        {
          background: `${colorFillLocal}`,
          border: `2px solid ${borderColorLocal}`,
          color: `${textColorLocal}`,
        }
      }>
      <span
        className="flex"
        onClick={handleClick}
      >
        {showVerseNum ? <sup {...verseNumStyles}>{verseNumber}</sup> : ctxUniformWidth ? <sup {...verseNumStyles}></sup> : ''}
        <span
          className={`flex select-none px-2 py-1 items-center justify-center text-center hover:opacity-60 leading-none
          ${fontSize}
          ${ctxUniformWidth && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}
        >
          {ctxIsHebrew ? hebWord.wlcWord : hebWord.gloss}
        </span>
      </span>
    </div>
  );

}


const Passage = ({
  content
}: {
  content: PassageData;
}) => {

  const styles = {
    container: {
      className: `flex mb-2`
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
                  paragraph.words.map((word, w_index) => (
                    <WordBlock
                      key={word.id}
                      verseNumber={verse.id}
                      hebWord={word}
                      showVerseNum={p_index === 0 && w_index === 0}
                    />)
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