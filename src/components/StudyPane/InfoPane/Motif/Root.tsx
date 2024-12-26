import React, { useState } from 'react';

import { PassageData, HebWord } from "@/lib/data";

import { RootBlock } from "./RootBlock";
import RelatedWordSwitcher from "./RelatedWordSwitcher";
import SmartHighlight from '@/components/Modals/SmartHighlight';

export const RootColorPalette = [
    '#e57373', '#64b5f6', '#81c784', '#ffeb3b', '#ffb74d', '#90a4ae', '#9575cd', '#00bcd4', '#f06292', '#a1887f',
    '#ffccbc', '#bbdefb', '#c8e6c9', '#fff9c4', '#ffe0b2', '#cfd8dc', '#d1c4e9', '#b2ebf2', '#f8bbd0', '#d7ccc8',
    '#b71c1c', '#1976d2', '#388e3c', '#afb42b', '#ff6f00', '#607d8b', '#673ab7', '#0097a7', '#e91e63', '#795548'
];

export type HebWordProps = {
    count: number,
    descendants: HebWord[],
    relatedWords: HebWord[]
};

const Root = ({
    content
}: {
    content: PassageData;
}) => {
    const [selectRelated, setSelectRelated] = useState(false);

    let rootWordsMap = new Map<number, HebWord[]>();
    content.stanzas.map((stanzas) => {
        stanzas.strophes.map((strophe) => {
            strophe.lines.map((line) => {
                line.words.map((word) => {
                    const currentWord = rootWordsMap.get(word.strongNumber);
                    if (currentWord !== undefined) {
                        currentWord.push(word);
                    }
                    else {
                        rootWordsMap.set(word.strongNumber, [word]);
                    }
                })
            })
        });
    })

    let rootWords: HebWordProps[] = [];
    rootWordsMap.forEach((rootWord) => {
        const leadWord = rootWord[0]; 
        if (rootWord.length > 1 && leadWord.strongNumber) {
            const relatedWords:HebWord[] = [];
            if (leadWord.relatedStrongNums && leadWord.relatedStrongNums.length > 0) {
                leadWord.relatedStrongNums.forEach(strongNum => {
                    rootWordsMap.get(strongNum)?.forEach(word => relatedWords.push(word));
                });
            }
            rootWords.push({ count: rootWord.length, descendants: rootWord, relatedWords: relatedWords });
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
                        <RootBlock key={index} id={index} 
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
