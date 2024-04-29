import { PassageData } from '@/lib/data';
import { useState, useEffect, useContext } from "react";
import { FormatContext } from '../index';

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
  isHebrew, paragraphIndex, verseNumber, colorFill, colorPanelActive, word, index, zoomLevel, selectedWords, setSelectedWords
}: {
  isHebrew: boolean;
  paragraphIndex: number;
  verseNumber: number;
  zoomLevel: number;
  colorFill: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  //TBD: borderColor, textColor...
  //
  selectedWords: number[];
  setSelectedWords: (arg: number[]) => void;
  colorPanelActive: boolean;
  //
  word: any;
  index: number;
}) => {

  const { ctxSetHasSelectedWords } = useContext(FormatContext)

  const [colorFillLocal,setColorFillLocal] = useState({r:0, g:0, b:0, a:0});
  const [selected, setSelected] = useState(false);

  if (colorFillLocal != colorFill && selected && colorPanelActive) {
    setColorFillLocal(colorFill);
  }

  useEffect(() => {
    if (!selectedWords.includes(word.id) && selected) {
      setSelected(false);
    }
  },[selectedWords]);

  const handleClick = () => {
    setSelected(prevState => !prevState);
    (!selected) ? selectedWords.push(word.id) : selectedWords.splice(selectedWords.indexOf(word.id), 1);
    setSelectedWords(selectedWords);
    ctxSetHasSelectedWords(selectedWords.length > 0);
  }

  const verseNumStyles = {
      className: `font-features sups w-1 ${isHebrew ? zoomLevelMap[zoomLevel].verseNumMl : zoomLevelMap[zoomLevel].verseNumMr}`
  } 

  return (
    <div 
      key={word.id}
      className={ selected ? "rounded border outline outline-offset-1 outline-2 outline-black" : "rounded border" }
      style={
        { 
          background:`rgba(${colorFillLocal.r},${colorFillLocal.g},${colorFillLocal.b},${colorFillLocal.a})`, 
        }
    }>
      <span
        className="flex items-center justify-center select-none px-2 py-1 text-center hover:opacity-60" 
        onClick={handleClick}
      >
        {index === 0 ? <sup {...verseNumStyles}>{verseNumber}</sup> : "" }
        {!isHebrew ? word.gloss : word.wlcWord}
      </span>
    </div>
  );

}


const Passage = ({ 
    content, isHebrew, colorFill, colorPanelActive, selectedWords, setSelectedWords
  }: {
    content: PassageData;
    isHebrew: boolean;
    colorFill: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    //borderColor, textColor...
    selectedWords: number[];
    setSelectedWords: (arg: number[]) => void;
    colorPanelActive: boolean;
  }) => {

  const { ctxZoomLevel } = useContext(FormatContext)

  const styles = {
    container: {
      className: `flex gap-2 mb-2 ${isHebrew ? "hbFont " : ""}${zoomLevelMap[ctxZoomLevel].fontSize}`
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
                      isHebrew={isHebrew}
                      paragraphIndex={p_index}
                      verseNumber={verse.id}
                      colorFill={colorFill}
                      colorPanelActive={colorPanelActive}
                      word={word}
                      index={index}
                      zoomLevel={ctxZoomLevel}
                      selectedWords={selectedWords}
                      setSelectedWords={setSelectedWords}
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