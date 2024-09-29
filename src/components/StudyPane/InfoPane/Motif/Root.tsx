import { RootBlock } from "./RootBlock";
import { PassageData, HebWord } from "@/lib/data";

const Root = ({
    content
  }: {
    content: PassageData;
  }) => {

    type HebWordCount = {
        word: HebWord,
        count: number
    }

    let rootWordsMap = new Map<number, HebWordCount>();

    content.strophes.map((strophe) => {
        strophe.lines.map((line) => {
            line.words.map((word) => {
                const currentWord = rootWordsMap.get(word.strongNumber);
                if (currentWord !== undefined) {
                    currentWord.count += 1;
                }
                else {
                    rootWordsMap.set(word.strongNumber, { word: word, count: 1 });
                }
            })
        })
    });

    let rootWords : HebWordCount[] = [];
    rootWordsMap.forEach((value, key) => {
        if (value.count > 1 && value.word.ETCBCgloss) {
            rootWords.push(value);
        }
    });

    return (
        <>
            <div className="flex flex-wrap pb-8">
                {
                    rootWords.map((root, index) => (
                        <RootBlock key={index} id={index} rootWord={root.word.ETCBCgloss} count={root.count} />
                    ))
                }
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center">
                <button
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    onClick={() => console.log("Smart Highlight Clicked")}
                >
                    Smart Highlight
                </button>
            </div>            
        </>
    );
};
export default Root;
