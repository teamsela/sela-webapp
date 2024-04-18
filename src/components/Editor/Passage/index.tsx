import { HebWord, PassageData } from '@/lib/data';
import { zoomLevelMap } from '@/lib/utils';

const VerseContent = ({ isHebrew, verseNumber, verseContent } : { 
  isHebrew: boolean;
  verseNumber: number;
  verseContent: HebWord[];
}) => {
  return (
    verseContent.map((word, index) => (
        <span key={word.id} className="flex items-center justify-center rounded border select-none px-4 py-2 text-center font-medium hover:opacity-60">
          {index === 0 ? <span key={verseNumber} className="verseNumber">{verseNumber}</span> : "" }
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
      className: `
        flex flex-wrap gap-2 mb-2 
        ${isHebrew && "hbFont"}
        ${zoomLevelMap[zoomLevel].fontSize}
      `
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