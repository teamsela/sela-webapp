import React, { useContext } from 'react';

import { PassageData, HebWord } from "@/lib/data";
import { ColorActionType, ColorType } from "@/lib/types";
import { updateWordColor } from "@/lib/actions";

import { RootBlock } from "./RootBlock";
import { DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';

const RootColorPalette = [
    '#e57373', '#64b5f6', '#81c784', '#ffeb3b', '#ffb74d', '#90a4ae', '#9575cd', '#00bcd4', '#f06292', '#a1887f',
    '#ffccbc', '#bbdefb', '#c8e6c9', '#fff9c4', '#ffe0b2', '#cfd8dc', '#d1c4e9', '#b2ebf2', '#f8bbd0', '#d7ccc8',
    '#b71c1c', '#1976d2', '#388e3c', '#afb42b', '#ff6f00', '#607d8b', '#673ab7', '#0097a7', '#e91e63', '#795548'
];

const Root = ({
    content
}: {
    content: PassageData;
}) => {

    const { ctxStudyId, ctxSetRootsColorMap, ctxInViewMode } = useContext(FormatContext);

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

    type HebWordProps = {
        count: number,
        descendants: HebWord[]
    };
    let rootWords: HebWordProps[] = [];
    rootWordsMap.forEach((rootWord) => {
        if (rootWord.length > 1 && rootWord[0].strongNumber) {
            rootWords.push({ count: rootWord.length, descendants: rootWord });
        }
    });
    rootWords.sort((a, b) => b.count - a.count);

    const handleClick = () => {
        let newMap = new Map<number, ColorType>();

        rootWords.forEach((rootWord, index) => {
            
            let rootBlockColor: ColorType = {
                colorFill: (index < RootColorPalette.length) ? RootColorPalette[index] : DEFAULT_COLOR_FILL,
                textColor: (index < 10) ? '#000000' : (index < 20 || index >= RootColorPalette.length) ? DEFAULT_TEXT_COLOR : '#FFFFFF',
                borderColor: "" // not used for root block
            };
            let descendantWordIds: number[] = [];
            rootWord.descendants.forEach((word) => {
                descendantWordIds.push(word.id)
                word.colorFill = rootBlockColor.colorFill;
                word.textColor = rootBlockColor.textColor;
                word.borderColor = word.borderColor;
            });
            if (!ctxInViewMode) {
                updateWordColor(ctxStudyId, descendantWordIds, ColorActionType.colorFill, rootBlockColor.colorFill);
                updateWordColor(ctxStudyId, descendantWordIds, ColorActionType.textColor, rootBlockColor.textColor);
            }
            newMap.set(rootWord.descendants[0].strongNumber, rootBlockColor);
        })
        ctxSetRootsColorMap(newMap);
    }

    return (
        <div className="flex flex-col h-full">
            <div
                style={{ height: '70%' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className ="flex flex-wrap">
                    {rootWords.map((root, index) => (
                        <RootBlock key={index} id={index} count={root.count} descendants={root.descendants} />
                    ))

                    }
                </div>
            </div>
            <div className="relative">
                <button
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    onClick={() => handleClick()}
                >
                    Smart Highlight
                </button>
            </div>
        </div>
    );
};
export default Root;
