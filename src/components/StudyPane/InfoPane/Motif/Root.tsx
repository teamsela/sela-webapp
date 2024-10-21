import { RootBlock } from "./RootBlock";
import { PassageData, HebWord } from "@/lib/data";
import { ColorType } from "@/lib/types";
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';

const Root = ({
    content
}: {
    content: PassageData;
}) => {

    type HebWordProps = {
        word: HebWord,
        count: number,
        sameColor: boolean
    }
    const { ctxRootsColorMap, ctxSetRootsColorMap, ctxSelectedRoots, ctxSetSelectedRoots, ctxSelectedHebWords, ctxSetSelectedHebWords } = useContext(FormatContext);


    const [clickToDeSelect, setClickToDeSelect] = useState(true);

    let rootWordsMap = new Map<number, HebWordProps>();
    content.stanzas.map((stanzas) => {
        stanzas.strophes.map((strophe) => {
            strophe.lines.map((line) => {
                line.words.map((word) => {
                    const currentWord = rootWordsMap.get(word.strongNumber);
                    if (currentWord !== undefined) {
                        currentWord.count += 1;
                        currentWord.sameColor = currentWord.sameColor && 
                            (currentWord.word.colorFill == word.colorFill && currentWord.word.textColor == word.textColor && currentWord.word.borderColor == word.borderColor);
                    }
                    else {
                        rootWordsMap.set(word.strongNumber, { word: word, count: 1, sameColor: true });
                    }
                })
            })
        });
    })

    let rootWords: HebWordProps[] = [];
    rootWordsMap.forEach((wordProps) => {
        if (wordProps.count > 1 && wordProps.word.ETCBCgloss) {
            rootWords.push(wordProps);
            if (!ctxRootsColorMap.has(wordProps.word.strongNumber)) {
                // Only set the default color if it doesn't already exist
                let color: ColorType = {
                    colorFill: (wordProps.sameColor) ? wordProps.word.colorFill : DEFAULT_COLOR_FILL,
                    textColor: (wordProps.sameColor) ? wordProps.word.textColor : DEFAULT_TEXT_COLOR,
                    borderColor: (wordProps.sameColor) ? wordProps.word.borderColor : DEFAULT_BORDER_COLOR
                };
                ctxRootsColorMap.set(wordProps.word.strongNumber, color);
            }
        }
    });
    rootWords.sort((a, b) => b.count - a.count);

    const handleClick = () => {
        let newMap = new Map<number, ColorType>([...Array.from(ctxRootsColorMap.entries())].map(([key, value]) => [key, { ...value }]));
        ctxRootsColorMap.forEach((value, key) => {
                let color: ColorType = {
                    colorFill: generateRandomHexColor(),
                    textColor: generateRandomHexColor(),
                    borderColor: generateRandomHexColor()
                }
                newMap.set(key, color);
            });
        ctxSetRootsColorMap(newMap);
    }

    const generateRandomHexColor = (): string => {
        const randomColor = Math.floor(Math.random() * 16777215);
        return `#${randomColor.toString(16).padStart(6, '0')}`;
    };
    return (
        <div>
            <div className="flex flex-wrap pb-8">
                {
                    rootWords.map((root, index) => (
                        <RootBlock key={index} id={index} rootWord={root.word.ETCBCgloss} count={root.count} strongNumber={root.word.strongNumber} hebWord={root.word} sameColor={root.sameColor} />
                    ))
                }
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center">
                <button
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    onClick={() => handleClick()}
                >
                    Smart Highlight
                </button>
            </div>
        </div>
    );
};
export default Root;
