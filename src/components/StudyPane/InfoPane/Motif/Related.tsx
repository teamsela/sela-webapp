import React, { useContext } from 'react';

import { WordProps, LexiconData } from "@/lib/data";
import { FormatContext } from "../..";
import { RelatedWordBlock } from "./RelatedBlock";

const RelatedWord = () => {  
    /** 
     * RelatedWords is extracted from the related_words section in the StepBible heb word dictionary
     * if word H0001, H0007, H0008, ... are related, 
     * then H0001, the word with the smallest strongNumber is the "root" word of all the related words
     * the root word is not necessarily the real root word of others in hebrew 
    **/
    const { ctxPassageProps } = useContext(FormatContext);

    let rootWordMap = new Map<string, WordProps[]>();   
    ctxPassageProps.stanzaProps.forEach((stanzas) => {
        stanzas.strophes.forEach((strophe) => {
            strophe.lines.forEach((line) => {
                line.words.forEach((word) => {
                    if (word.motifData.relatedWords?.strongCode) {
                        const currentWord = rootWordMap.get(word.motifData.relatedWords.strongCode);
                        if (currentWord !== undefined) {
                            currentWord.push(word);
                        } else {
                            rootWordMap.set(word.motifData.relatedWords.strongCode, [word]);
                        }
                    }
                });
            });
        });
    });

    type RelatedWordGroupProp = {
        rootData: LexiconData,
        count: number,
        words: WordProps[]
    };
    let relWordGroups: RelatedWordGroupProp[] = [];
    rootWordMap.forEach((groupedWords) => {
        // exclude identical words
        const distinctWords = new Set(groupedWords.map(word => word.strongNumber));
        if (distinctWords.size > 1 && groupedWords[0].motifData.relatedWords) {
            relWordGroups.push({ rootData: groupedWords[0].motifData.relatedWords, count: groupedWords.length, words: groupedWords });
        }
    });
    relWordGroups.sort((a, b) => b.count - a.count);

    return (
        <div className="flex-col h-full">
            <div
                style={{ height: '70%' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className ="flex flex-wrap">
                    { relWordGroups.map((group, index) => (
                        <RelatedWordBlock key={index} id={index} count={group.count} rootData={group.rootData} relatedWords={group.words} />
                    )) }
                </div>
            </div>
        </div>
    );
};
export default RelatedWord;
