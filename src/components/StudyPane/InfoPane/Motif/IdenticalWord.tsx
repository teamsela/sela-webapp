import { useContext, useState } from 'react';

import { WordProps } from "@/lib/data";
import { extractIdenticalWordsFromPassage } from "@/lib/utils";

import { FormatContext } from '../../index';
import { IdenticalWordBlock } from "./IdenticalWordBlock";
import RelatedWordSwitcher from "./RelatedWordSwitcher";

import SmartHighlight from '@/components/StudyPane/InfoPane/Motif/SmartHighlight';

export type IdenticalWordProps = {
    wordId: number,
    count: number,
    identicalWords: WordProps[],
    relatedWords: WordProps[]
};

const IdenticalWord = () => {
    const { ctxPassageProps } = useContext(FormatContext)
    const [selectRelated, setSelectRelated] = useState(false);

    // get a map of strong number to an array of WordProps with the same strong number
    const strongNumToWordsMap = extractIdenticalWordsFromPassage(ctxPassageProps);
    const identicalWordPropsArray: IdenticalWordProps[] = [];
    strongNumToWordsMap.forEach(words => {
        const leadWord = words[0]; 
        if (words.length > 1 && leadWord.strongNumber) {
            // use wordProps.motifData.relatedStrongNums to find the related words in the study
            const relatedWords:WordProps[] = [];
            if (leadWord.motifData?.relatedStrongNums && leadWord.motifData.relatedStrongNums.length > 0) {
                leadWord.motifData.relatedStrongNums.forEach(strongNum => {
                    strongNumToWordsMap.get(strongNum)?.forEach(word => relatedWords.push(word));
                });
            }
            identicalWordPropsArray.push({ wordId: leadWord.wordId, count: words.length, identicalWords: words, relatedWords: relatedWords });
        }
    });
    identicalWordPropsArray.sort((a, b) => b.count - a.count);

    return (
        <div className="flex flex-col h-full">
            <div>
                <RelatedWordSwitcher selectRelated={selectRelated} setSelectRelated={setSelectRelated}/>
            </div>
            <div
                style={{ height: 'fit-content' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className ="flex flex-wrap">
                    {identicalWordPropsArray.map((idWordProps, index) => (
                        <IdenticalWordBlock key={index} id={idWordProps.wordId} 
                            count={idWordProps.count} identicalWords={idWordProps.identicalWords}
                            relatedWords={idWordProps.relatedWords} selectRelated={selectRelated}/>
                    ))
                    }
                </div>
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center mt-3">
                <SmartHighlight identicalWords={identicalWordPropsArray} />
            </div>
        </div>
    );
};
export default IdenticalWord;
