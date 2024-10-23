import React, { useContext } from 'react';
import randomColor from 'randomcolor';

import { PassageData, HebWord } from "@/lib/data";
import { ColorActionType } from "@/lib/types";
import { updateWordColor } from "@/lib/actions";

import { RootBlock } from "./RootBlock";
import { FormatContext } from '../../index';

const Root = ({
    content
}: {
    content: PassageData;
}) => {

    const { ctxStudyId, ctxSetRootsColorMap } = useContext(FormatContext);

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

        let newMap = new Map<number, string>();

        rootWords.forEach((rootWord, index) => {
            let wordIds : number[] = [];
            rootWord.descendants.forEach((word) => {
              wordIds.push(word.id)
            });
            const randomNum = Math.floor(Math.random() * 16777215);
            const randomHue = `#${randomNum.toString(16).padStart(6, '0')}`;

            const randomWordColor = randomColor({
                luminosity: 'light',
                hue: randomHue,
                format: 'hex'
            })
            updateWordColor(ctxStudyId, wordIds, ColorActionType.colorFill, randomWordColor);
            newMap.set(rootWord.descendants[0].strongNumber, randomWordColor);
        })
        ctxSetRootsColorMap(newMap);
    }
  
    return (
        <div>
            <div className="flex flex-wrap pb-8">
                {
                    rootWords.map((root, index) => (
                        <RootBlock key={index} id={index} count={root.count} descendants={root.descendants} />
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
