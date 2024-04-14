import { HebWord, PassageData } from '@/lib/data';
import { table } from 'console';

const VerseNumber = ({ verseNumber } : { verseNumber: number }) => {
  return (
    <span key={verseNumber} className="verseNumber">{verseNumber}</span>
  );
};

const VerseContent = ({ isHebrew, verseContent } : { isHebrew: boolean; verseContent: HebWord[]; }) => {
  return (
    verseContent.map((word) => (
        <span key={word.id} className="flex items-center justify-center rounded border select-none px-4 py-2 text-center font-medium hover:opacity-60">
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
          <>
            <div className={`flex flex-wrap gap-4 mb-4 ${isHebrew ? 'rtlDirection hbFont' : 'enFont'}`}>
              <VerseNumber verseNumber={verse.id} />
              <VerseContent isHebrew={isHebrew} verseContent={verse.words} />
            </div>
          </>
        ))
      ))
    }
    </div>
  );    
};

export default Passage;