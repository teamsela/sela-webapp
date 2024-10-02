import { RootBlock } from "./RootBlock";
import { PassageData, HebWord, RootColor } from "@/lib/data";
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../../index';

const Root = ({
    content
}: {
    content: PassageData;
}) => {

    type HebWordCount = {
        word: HebWord,
        count: number
    }
    const { ctxRootsColorMap, ctxSetRootsColorMap, ctxSelectedRoots, ctxSetSelectedRoots, ctxSelectedHebWords, ctxSetSelectedHebWords } = useContext(FormatContext);

    const [clickToDeSelect, setClickToDeSelect] = useState(true);

    let rootWordsMap = new Map<number, HebWordCount>();
    content.stanzas.map((stanzas) => {
        stanzas.strophes.map((strophe) => {
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
    })
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        document.addEventListener('mouseup', handleMouseUp);
        const target = event.target as HTMLElement;
        const clickedTarget = target.getAttribute('data-clickType');
        clickedTarget == "clickable" ? setClickToDeSelect(false) : setClickToDeSelect(true);
      };

      const handleMouseUp = useCallback((event: MouseEvent) => {
        //document.body.style.userSelect = 'text';
        if (clickToDeSelect) {
          ctxSetSelectedRoots([]);
          const filteredHebWords = ctxSelectedHebWords.filter(hebWord => 
            !ctxSelectedRoots.includes(hebWord.strongNumber)
          );
          ctxSetSelectedHebWords(filteredHebWords)
          console.log(filteredHebWords)
        }
      }, [clickToDeSelect]);

    let rootWords: HebWordCount[] = [];
    rootWordsMap.forEach((value, key) => {
        if (value.count > 1 && value.word.ETCBCgloss) {
            rootWords.push(value);
            if (!ctxRootsColorMap.has(value.word.strongNumber)) {
                // Only set the default color if it doesn't already exist
                let color: RootColor = {
                    colorFill: DEFAULT_COLOR_FILL,
                    colorBorder: DEFAULT_BORDER_COLOR,
                    colorText: DEFAULT_TEXT_COLOR
                };
                ctxRootsColorMap.set(value.word.strongNumber, color);
            }
        }
    });

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }, [handleMouseUp]);
    const handleClick = () => {
        let newMap = new Map<number, RootColor>([...Array.from(ctxRootsColorMap.entries())].map(([key, value]) => [key, { ...value }]));
        ctxRootsColorMap.forEach((value, key) => {
                let color: RootColor = {
                    colorFill: generateRandomHexColor(),
                    colorBorder: generateRandomHexColor(),
                    colorText: generateRandomHexColor()
                }
                newMap.set(key, color);
            });
        ctxSetRootsColorMap(newMap);
    }
    useEffect(() => {
        //console.log("Updated ctxRootsColorMap:", ctxRootsColorMap);
    }, [ctxRootsColorMap, ctxSetSelectedRoots, ctxSelectedRoots]);
    const generateRandomHexColor = (): string => {
        const randomColor = Math.floor(Math.random() * 16777215);
        return `#${randomColor.toString(16).padStart(6, '0')}`;
    };
    return (
        <div onMouseDown={handleMouseDown}>
            <div className="flex flex-wrap pb-8">
                {
                    rootWords.map((root, index) => (
                        <RootBlock key={index} id={index} rootWord={root.word.ETCBCgloss} count={root.count} strongNumber={root.word.strongNumber} hebWord={root.word} />
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
