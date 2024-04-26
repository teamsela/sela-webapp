import { HebWord, PassageData } from '@/lib/data';

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

const ParagraphContent = ({ isHebrew, zoomLevel, verseNumber, content } : { 
  isHebrew: boolean;
  zoomLevel: number;
  verseNumber: number;
  content: HebWord[];
}) => {

  const verseNumStyles = {
    container: {
      className: `font-features sups ${isHebrew ? "w-1 ml-2" : "w-1 " + zoomLevelMap[zoomLevel].verseNumMr}`
    }
  }  
  return (
    content.map((word, index) => (
        <span key={word.id} className="flex items-center justify-center rounded border select-none px-2 py-1 text-center hover:opacity-60">
          {index === 0 ? <sup {...verseNumStyles.container}>{verseNumber}</sup> : "" }
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
              <ParagraphContent isHebrew={isHebrew} zoomLevel={zoomLevel} verseNumber={verse.id} content={paragraph.words} />
            </div>
          ))
        ))
      ))
    }
    </div>
  );
};

export default Passage;