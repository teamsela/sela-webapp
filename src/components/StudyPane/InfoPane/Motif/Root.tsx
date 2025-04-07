import React, { useState, useContext } from 'react';

import { WordProps } from "@/lib/data";
import { extractIdenticalWordsFromPassage } from "@/lib/utils";

import { RootBlock } from "./RootBlock";
import RelatedWordSwitcher from "./RelatedWordSwitcher";
import { FormatContext } from '../../index';

import SmartHighlight from '@/components/Modals/SmartHighlight';

export const RootColorPalette = [
    '#e57373', '#64b5f6', '#81c784', '#ffeb3b', '#ffb74d', '#90a4ae', '#9575cd', '#00bcd4', '#f06292', '#a1887f',
    '#ffccbc', '#bbdefb', '#c8e6c9', '#fff9c4', '#ffe0b2', '#cfd8dc', '#d1c4e9', '#b2ebf2', '#f8bbd0', '#d7ccc8',
    '#b71c1c', '#1976d2', '#388e3c', '#afb42b', '#ff6f00', '#607d8b', '#673ab7', '#0097a7', '#e91e63', '#795548'
];

export type RootWordProps = {
    wordId: number,
    count: number,
    descendants: WordProps[],
    relatedWords: WordProps[]
};

const Root = () => {
    const { ctxPassageProps } = useContext(FormatContext)
    const [selectRelated, setSelectRelated] = useState(false);

    const rootWordsMap = extractIdenticalWordsFromPassage(ctxPassageProps);
    const rootWords: RootWordProps[] = [];
    rootWordsMap.forEach((rootWord) => {
        const leadWord = rootWord[0]; 
        if (rootWord.length > 1 && leadWord.strongNumber) {
            const relatedWords:WordProps[] = [];
            if (leadWord.motifData.relatedStrongNums && leadWord.motifData.relatedStrongNums.length > 0) {
                leadWord.motifData.relatedStrongNums.forEach(strongNum => {
                    rootWordsMap.get(strongNum)?.forEach(word => relatedWords.push(word));
                });
            }
            rootWords.push({ wordId: rootWord[0].wordId, count: rootWord.length, descendants: rootWord, relatedWords: relatedWords });
        }
    });
    rootWords.sort((a, b) => b.count - a.count);

    return (
        <div className="flex flex-col h-full">
            <div>
                <RelatedWordSwitcher selectRelated={selectRelated} setSelectRelated={setSelectRelated}/>
            </div>
            <div
                style={{ height: 'fit-content' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className ="flex flex-wrap">
                    {rootWords.map((root, index) => (
                        <RootBlock key={index} id={root.wordId} 
                            count={root.count} descendants={root.descendants} relatedWords={root.relatedWords} 
                            selectRelated={selectRelated}/>
                    ))
                    }
                </div>
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center mt-3">
                <SmartHighlight rootWords={rootWords} />
            </div>
        </div>
    );
};
export default Root;
