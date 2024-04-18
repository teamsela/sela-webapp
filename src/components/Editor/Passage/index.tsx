import { HebWord, PassageData } from '@/lib/data';

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
        ${zoomLevel === 20 && "text-xs"}
        ${zoomLevel === 40 && "text-sm"}
        ${zoomLevel === 60 && "text-base"}
        ${zoomLevel === 80 && "text-lg"}
        ${zoomLevel === 100 && "text-xl"}
        ${zoomLevel === 120 && "text-2xl"}
        ${zoomLevel === 140 && "text-3xl"}
        ${zoomLevel === 160 && "text-4xl"}
        ${zoomLevel === 180 && "text-5xl"}
        ${zoomLevel === 200 && "text-6xl"}
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