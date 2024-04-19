import { HebWord, PassageData } from '@/lib/data';

const VerseContent = ({ isHebrew, verseNumber, verseContent } : { 
  isHebrew: boolean;
  verseNumber: number;
  verseContent: HebWord[];
}) => {
  return (
    verseContent.map((word, index) => (
        <span key={word.id} className="flex items-center justify-center rounded border select-none px-2 py-1 text-center hover:opacity-60">
          {index === 0 ? <sup className="font-features sups">{verseNumber}&nbsp;</sup> : "" }
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

  console.log(blockTextSize);

  const styles = {
    container: {
      className: `flex flex-wrap gap-2 mb-2 ${isHebrew ? "hbFont " : ""} ${blockTextSize}`
    }
  }

  return (
    <div>
    {
      content.chapters.map((chapter) => (
        chapter.verses.map((verse) => (
          <div key={chapter.id + "." + verse.id} {...styles.container}>
            <VerseContent isHebrew={isHebrew} verseNumber={verse.id} verseContent={verse.words} />
          </div>
        ))
      ))
    }
    </div>
  );
};

export default Passage;