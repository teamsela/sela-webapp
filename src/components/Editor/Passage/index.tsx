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
        <span key={word.id} className={`flex items-center justify-center rounded border px-8 py-2.5 text-center font-medium hover:opacity-80`}>
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
            <div className={`flex flex-wrap gap-4 mb-5 ${isHebrew ? 'rtlDirection hbFont' : 'enFont'}`}>
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