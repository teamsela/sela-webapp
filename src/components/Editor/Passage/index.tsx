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
    content, isHebrew
  }: {
    content: PassageData;
    isHebrew: boolean;
  }) => {

  return (
    <div>
    {
      content.chapters.map((chapter) => (
        chapter.verses.map((verse) => (
          <div key={chapter.id + "." + verse.id} className={`flex flex-wrap gap-4 mb-4 ${isHebrew ? 'rtlDirection hbFont' : 'enFont'}`}>
            <VerseContent isHebrew={isHebrew} verseNumber={verse.id} verseContent={verse.words} />
          </div>
        ))
      ))
    }
    </div>
  );    
};

export default Passage;