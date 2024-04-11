import { HebWord, ChapterData, VerseData } from '@/lib/data';

const Passage = ({ 
    content, isHebrew
  }: {
    content: HebWord[];
    isHebrew: boolean;
  }) => {

  //type ChapterMap = Record<number, ChapterData>;
  let chapterMap = new Map<number, ChapterData>();
  //let chapterMap : ChapterMap;
  let currentChapter = 0;
  let currentVerse = 0;
  let currentVerseData = { verse: 0 } as VerseData;
  //console.log(content);

//  console.log(content[0].verse);
  content.forEach((word, key) => {

    let chapterData = chapterMap.get(word.chapter);    
    if (chapterData === undefined) {
      chapterMap.set(word.chapter, {chapter: word.chapter, numOfVerses: 0, verseMap: new Map<number, HebWord[]>()} as ChapterData);
      chapterData = chapterMap.get(word.chapter);
    }

    if (chapterData) {
      chapterData.numOfVerses = word.verse;
    }

    let verseData = chapterData?.verseMap.get(word.verse);    
    if (verseData === undefined) {
      chapterData?.verseMap.set(word.verse, [] as HebWord[]);
      verseData = chapterData?.verseMap.get(word.verse);
    }

    verseData?.push(word);
  }) 

  console.log(chapterMap);

  // for (let word in content) {
  //   if (currentVerse != word.verse) {
  //     let hebWord = {} as HebWord;

  //   }
  // }

  return (
      <div>
        <div className={`flex flex-wrap justify-end gap-4 lg:flex-row ${isHebrew ? 'rtlDirection hbFont' : 'enFont'}`}>
        {content.map((word) => (
          <>
            <button className="flex items-center justify-center rounded border border-primary px-8 py-2.5 text-center font-medium text-primary hover:opacity-90">
              {!isHebrew ? word.gloss : word.wlcWord}
            </button>
            {/*(currentVerse !== word.verse) ? <span className="verseNumber">{word.verse}</span> : ''*/}
            
            {/*<span key={word.id}>{!isHebrew ? word.gloss : word.wlcWord}</span>*/}
          </>
        ))}
        </div>
      </div>
  );    
};

export default Passage;