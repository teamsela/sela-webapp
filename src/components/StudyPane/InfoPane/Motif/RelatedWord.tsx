import React, { useContext } from 'react';

import { PassageData, HebWord, LexiconData } from "@/lib/data";
import { ColorActionType, ColorType } from "@/lib/types";
import { updateWordColor } from "@/lib/actions";

import { RelatedWordBlock } from "./RelatedWordBlock";
import { DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';

const RelWordColorPalette = [
    '#e57373', '#64b5f6', '#81c784', '#ffeb3b', '#ffb74d', '#90a4ae', '#9575cd', '#00bcd4', '#f06292', '#a1887f',
    '#ffccbc', '#bbdefb', '#c8e6c9', '#fff9c4', '#ffe0b2', '#cfd8dc', '#d1c4e9', '#b2ebf2', '#f8bbd0', '#d7ccc8',
    '#b71c1c', '#1976d2', '#388e3c', '#afb42b', '#ff6f00', '#607d8b', '#673ab7', '#0097a7', '#e91e63', '#795548'
];

const RelatedWord = ({
    content
}: {
    content: PassageData;
}) => {

    const { ctxStudyId, ctxSetRelWordsColorMap } = useContext(FormatContext);

    /** 
     * RootData is extracted from the related_words section in the StepBible heb word dictionary
     * if word H0001, H0007, H0008, ... are related, then H0001 is the "root" word of all the words in the relation group
     * notice that the root word is not necessarily the real root word of other words in hebrew 
    **/
    let rootWordMap = new Map<string, HebWord[]>();
    content.stanzas.forEach((stanzas) => {
        stanzas.strophes.forEach((strophe) => {
            strophe.lines.forEach((line) => {
                line.words.forEach((word) => {
                    if (word.rootData?.strongCode) {
                        const currentWord = rootWordMap.get(word.rootData.strongCode);
                        if (currentWord !== undefined) {
                            currentWord.push(word);
                        } else {
                            rootWordMap.set(word.rootData.strongCode, [word]);
                        }
                    }
                });
            });
        });
    });

    type RelatedWordGroupProp = {
        rootData: LexiconData,
        count: number,
        words: HebWord[]
    };
    let relWordGroups: RelatedWordGroupProp[] = [];
    rootWordMap.forEach((groupedWords) => {
        // exclude identical words
        const distinctWords = new Set(groupedWords.map(word => word.strongNumber));
        if (distinctWords.size > 1 && groupedWords[0].rootData) {
            relWordGroups.push({ rootData: groupedWords[0].rootData, count: groupedWords.length, words: groupedWords });
        }
    });
    relWordGroups.sort((a, b) => b.count - a.count);

    const handleSmartHighlightClick = () => {

        let newMap = new Map<string, ColorType>();

        relWordGroups.forEach((group, index) => {
            let wordIds: number[] = [];
            group.words.forEach((word) => {
                wordIds.push(word.id)
            });

            let relWordBlockColor: ColorType = {
                colorFill: (index < RelWordColorPalette.length) ? RelWordColorPalette[index] : DEFAULT_COLOR_FILL,
                textColor: (index < 10) ? '#000000' : (index < 20 || index >= RelWordColorPalette.length) ? DEFAULT_TEXT_COLOR : '#FFFFFF',
                borderColor: "" // not used for root block
            };

            updateWordColor(ctxStudyId, wordIds, ColorActionType.colorFill, relWordBlockColor.colorFill);
            updateWordColor(ctxStudyId, wordIds, ColorActionType.textColor, relWordBlockColor.textColor);
            newMap.set(group.rootData.strongCode, relWordBlockColor);
        })
        ctxSetRelWordsColorMap(newMap);
    }

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
            <div className="w-full bottom-0 left-0 flex justify-center mt-3">
                <button
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    onClick={() => handleSmartHighlightClick()}
                >
                    Smart Highlight
                </button>
            </div>
        </div>
    );
};
export default RelatedWord;
