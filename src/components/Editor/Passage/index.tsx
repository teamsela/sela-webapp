import { HebWord, PassageData } from '@/lib/data';

const ParagraphContent = ({ isHebrew, paragraphIndex, verseNumber, content } : { 
  isHebrew: boolean;
  paragraphIndex: number;
  verseNumber: number;
  content: HebWord[];
}) => {
  return (
    content.map((word, index) => (
        <span key={word.id} className="flex items-center justify-center rounded border select-none px-2 py-1 text-center hover:opacity-60">
          {/*paragraphIndex === 0 &&*/ index === 0 ? <sup className="font-features sups">{verseNumber}&nbsp;</sup> : "" }
          {!isHebrew ? word.gloss : word.wlcWord}
        </span>
    ))
  );
};

const Passage = ({ 
    content, isHebrew, zoomLevel
  }: {
    content: PassageData;
    isHebrew: boolean;
    zoomLevel: number;
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
            <div key={chapter.id + "." + verse.id + "-" + p_index} {...styles.container}>
              <ParagraphContent isHebrew={isHebrew} paragraphIndex={p_index} verseNumber={verse.id} content={paragraph.words} />
            </div>
          ))
        ))
      ))
    }
    </div>
  );
};

export default Passage;