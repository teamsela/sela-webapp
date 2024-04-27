import { HebWord, PassageData } from '@/lib/data';
import { useState, useEffect } from "react";

type ZoomLevel = {
  [level: number]: { fontSize: string, verseNumMr: string };
}
const zoomLevelMap : ZoomLevel = {
  0:  { fontSize: "text-4xs",  verseNumMr: "mr-0.5" },
  1:  { fontSize: "text-4xs",  verseNumMr: "mr-0.5" },
  2:  { fontSize: "text-3xs",  verseNumMr: "mr-0.5" },
  3:  { fontSize: "text-2xs",  verseNumMr: "mr-0.5" },
  4:  { fontSize: "text-xs",   verseNumMr: "mr-0.5" },
  5:  { fontSize: "text-sm",   verseNumMr: "mr-1"   },
  6:  { fontSize: "text-base", verseNumMr: "mr-1" },
  7:  { fontSize: "text-lg",   verseNumMr: "mr-1" },
  8:  { fontSize: "text-xl",   verseNumMr: "mr-1" },
  9:  { fontSize: "text-2xl",  verseNumMr: "mr-2" },
  10: { fontSize: "text-3xl",  verseNumMr: "mr-2" },
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

  const [colorFillLocal,setColorFillLocal] = useState({r:0, g:0, b:0, a:0});
  const [selected, setSelected] = useState(false);

  if(colorFillLocal != colorFill && selected && colorPanelActive){
    setColorFillLocal(colorFill);
  }

  useEffect(() => {
    if(!selectedWords.includes(word.id) && selected){
      setSelected(false);
    }
  },[selectedWords]);

  const handleClick = () => {
    setSelected(prevState => !prevState);
    if(!selected){
      selectedWords.push(word.id);
      setSelectedWords(selectedWords);
    }
    else{
      selectedWords.splice(selectedWords.indexOf(word.id), 1);
      setSelectedWords(selectedWords);
    }
  }

  const verseNumStyles = {
    container: {
      className: `font-features sups ${isHebrew ? "w-1 ml-2" : "w-1 " + zoomLevelMap[zoomLevel].verseNumMr}`
    }
  } 

  return (
    <div key={word.id} className={ selected ? "border-2 border-black" : "" }>
      <span
        className="flex items-center justify-center rounded border select-none px-2 py-1 text-center hover:opacity-60" 
        onClick={handleClick}
        style={
            { 
              background:`rgba(${colorFillLocal.r},${colorFillLocal.g},${colorFillLocal.b},${colorFillLocal.a})`, 
            }
        }
      >
        {index === 0 ? <sup {...verseNumStyles.container}>{verseNumber}</sup> : "" }
        {!isHebrew ? word.gloss : word.wlcWord}
      </span>
    </div>
  );

}


const Passage = ({ 
    content, isHebrew, zoomLevel, colorFill, colorPanelActive, selectedWords, setSelectedWords
  }: {
    content: PassageData;
    isHebrew: boolean;
    zoomLevel: number;
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

  const styles = {
    container: {
      className: `flex gap-1.5 mb-1.5 ${isHebrew ? "hbFont " : ""}${zoomLevelMap[zoomLevel].fontSize}`
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
                      zoomLevel={zoomLevel}
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