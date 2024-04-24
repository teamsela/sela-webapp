import { HebWord, PassageData } from '@/lib/data';
import { useState } from "react";

const ParagraphContent = ({ isHebrew, paragraphIndex, verseNumber, content, colorFill, colorPanelActive } : { 
  isHebrew: boolean;
  paragraphIndex: number;
  verseNumber: number;
  content: HebWord[];
  colorFill: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  colorPanelActive: boolean;
}) => {

  //relocated under the Word component
  /////
  /////
  // const [colorFillLocal,setColorFillLocal] = useState({r:0, g:0, b:0, a:0});
  // const [selected, setSelected] = useState(false);

  // if(colorFillLocal != colorFill && selected && colorPanelActive){
  //   setColorFillLocal(colorFill);
  // }

  // const handleClick = () => {
  //   setSelected(prevState => !prevState);
  // }

  return (
    content.map((word, index) => (

        <Word 
          isHebrew={isHebrew}
          paragraphIndex={paragraphIndex}
          verseNumber={verseNumber}
          colorFill={colorFill}
          colorPanelActive={colorPanelActive}
          word={word}
          index={index}
        />
        
        //relocated under the Word component
        /////
        /////
        /* <span 
          key={word.id} 
          className="flex items-center justify-center rounded border select-none px-2 py-1 text-center hover:opacity-60" 
          onClick={handleClick}
          style={
            { 
              background:`rgba(${colorFillLocal.r},${colorFillLocal.g},${colorFillLocal.b},${colorFillLocal.a})`, 
            }
        }
        >
          { index === 0 ? <sup className="font-features sups">{verseNumber}&nbsp;</sup> : "" }
          {!isHebrew ? word.gloss : word.wlcWord}
        </span> */

    ))
  );
};

const Word = ({
  isHebrew, paragraphIndex, verseNumber, colorFill, colorPanelActive, word, index
}: {
  isHebrew: boolean;
  paragraphIndex: number;
  verseNumber: number;
  colorFill: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  colorPanelActive: boolean;
  word: object;
  index: number;
}) => {

  const [colorFillLocal,setColorFillLocal] = useState({r:0, g:0, b:0, a:0});
  const [selected, setSelected] = useState(false);

  if(colorFillLocal != colorFill && selected && colorPanelActive){
    setColorFillLocal(colorFill);
  }

  const handleClick = () => {
    setSelected(prevState => !prevState);
  }

  return (
    <div style={ {border: selected ? "3px solid black" : "none"} }>
      <span 
        key={word.id} 
        className="flex items-center justify-center rounded border select-none px-2 py-1 text-center hover:opacity-60" 
        onClick={handleClick}
        style={
            { 
              background:`rgba(${colorFillLocal.r},${colorFillLocal.g},${colorFillLocal.b},${colorFillLocal.a})`, 
            }
        }
      >
        {/*paragraphIndex === 0 &&*/ index === 0 ? <sup className="font-features sups">{verseNumber}&nbsp;</sup> : "" }
        {!isHebrew ? word.gloss : word.wlcWord}
      </span>
    </div>
  );

}


const Passage = ({ 
    content, isHebrew, zoomLevel, colorFill, colorPanelActive
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
    colorPanelActive: boolean;
  }) => {

  let blockTextSize : string;

  switch (zoomLevel) {
    case 1: {
      blockTextSize = "text-3xs";
      break;
    }
    case 2: {
      blockTextSize = "text-2xs";
      break;
    }
    case 3: {
      blockTextSize = "text-xs";
      break;
    }
    case 4: {
      blockTextSize = "text-sm";
      break;
    }
    case 5: {
      blockTextSize = "text-base";
      break;
    }
    case 6: {
      blockTextSize = "text-lg";
      break;
    }
    case 7: {
      blockTextSize = "text-2xl";
      break;
    }
    default: {
      blockTextSize = "text-base";
      break;
    }
  }

  const styles = {
    container: {
      className: `flex gap-2 mb-2 ${isHebrew ? "hbFont " : ""}${blockTextSize}`
    }
  }

  return (
    <div>
    {
      content.chapters.map((chapter) => (
        chapter.verses.map((verse, v_index) => (
          verse.paragraphs.map((paragraph, p_index) => (
            <div key={chapter.id + "." + verse.id + "-" + p_index} {...styles.container} >
              {/* 2024-04-23 considering: move the map function for ParagraphContent here and create a new component for each individual words */}
              <ParagraphContent isHebrew={isHebrew} paragraphIndex={p_index} verseNumber={verse.id} content={paragraph.words} colorFill={colorFill} colorPanelActive={colorPanelActive}/>
            </div>
          ))
        ))
      ))
    }
    </div>
  );
};

export default Passage;