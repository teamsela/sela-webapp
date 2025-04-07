import { useContext, useState, useEffect } from "react";
import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from "../..";
import { WordProps } from "@/lib/data";
import { ColorActionType } from "@/lib/types";

export const CategoryBlock = ({
    category,
    index,
    selectedCategory,
    setSelectedCategory,
    value,
    lastSelectedWords,
    setLastSelectedWords
}: {
    category: String,
    index: number,
    selectedCategory: String,
    setSelectedCategory: React.Dispatch<React.SetStateAction<String>>,
    value: { strongNumbers: number[], count: number, wordProps: WordProps[] },
    lastSelectedWords: WordProps[],
    setLastSelectedWords: React.Dispatch<React.SetStateAction<WordProps[]>>
}) => {
    const { ctxStudyMetadata, ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords, ctxColorAction, ctxSelectedColor } = useContext(FormatContext);

    const matchColorProperty = (property: 'fill' | 'text' | 'border') : boolean => {
        return value.wordProps.every(dsd =>
          dsd.metadata?.color &&
          (!dsd.metadata.color[property] || dsd.metadata.color[property] === value.wordProps[0].metadata.color?.[property])
        );
      };

    const [colorFillLocal, setColorFillLocal] = useState(matchColorProperty('fill') ? value.wordProps[0].metadata?.color?.fill || DEFAULT_COLOR_FILL : DEFAULT_COLOR_FILL);
    const [textColorLocal, setTextColorLocal] = useState(matchColorProperty('text') ? value.wordProps[0].metadata?.color?.text || DEFAULT_TEXT_COLOR : DEFAULT_TEXT_COLOR);
    const [borderColorLocal, setBorderColorLocal] = useState(matchColorProperty('border') ? value.wordProps[0].metadata?.color?.border || DEFAULT_BORDER_COLOR : DEFAULT_BORDER_COLOR);
    const [selected, setSelected] = useState(false);

    useEffect(() => {
        let hasChildren = true;
        value.wordProps.forEach((word) => {
            hasChildren = hasChildren && ctxSelectedWords.includes(word);
        })
        setSelected(hasChildren);
    }, [ctxSelectedWords, value.wordProps]);

    useEffect(() => {
        if (ctxSelectedWords.length == 0 || ctxColorAction === ColorActionType.none) { return; }
    
        if (selected) {
            if (ctxColorAction === ColorActionType.colorFill && ctxSelectedColor) {
                setColorFillLocal(ctxSelectedColor);
            } else if (ctxColorAction === ColorActionType.borderColor && ctxSelectedColor) {
                setBorderColorLocal(ctxSelectedColor);
            } else if (ctxColorAction === ColorActionType.textColor && ctxSelectedColor) {
                setTextColorLocal(ctxSelectedColor);
            } else if (ctxColorAction === ColorActionType.resetColor) {
                setColorFillLocal(DEFAULT_COLOR_FILL);
                setBorderColorLocal(DEFAULT_BORDER_COLOR);
                setTextColorLocal(DEFAULT_TEXT_COLOR);
            }
        }
    }, [ctxSelectedColor, ctxColorAction, ctxSelectedWords])

    useEffect(() => {
        setColorFillLocal(matchColorProperty('fill') ? value.wordProps[0].metadata?.color?.fill || DEFAULT_COLOR_FILL : DEFAULT_COLOR_FILL);
        setTextColorLocal(matchColorProperty('text') ? value.wordProps[0].metadata?.color?.text || DEFAULT_TEXT_COLOR : DEFAULT_TEXT_COLOR);
        setBorderColorLocal(matchColorProperty('border') ? value.wordProps[0].metadata?.color?.border || DEFAULT_BORDER_COLOR : DEFAULT_BORDER_COLOR);
    }, [value, ctxStudyMetadata]);

    const handleClick = () => {
        setSelected(prevState => !prevState);
        if (category === selectedCategory) {
            const newSelectedHebWords = ctxSelectedWords.filter(
                word => !lastSelectedWords.some(categoryWord => categoryWord.wordId === word.wordId)
            );
            ctxSetSelectedWords(newSelectedHebWords);
            ctxSetNumSelectedWords(newSelectedHebWords.length);
            setLastSelectedWords([]);
        } else {
            const wordsWithoutPrevCategory = ctxSelectedWords.filter(
                word => !lastSelectedWords.some(categoryWord => categoryWord.wordId === word.wordId)
            );
            
            const newSelectedHebWords = Array.from(new Set([...wordsWithoutPrevCategory, ...value.wordProps]));           
            
            //setSelectedCategory(category);
            ctxSetSelectedWords(newSelectedHebWords);
            ctxSetNumSelectedWords(newSelectedHebWords.length);            
            setLastSelectedWords(value.wordProps);
        }
    };
    return (
        <div className="flex my-1">
            <div
                className={`wordBlock mx-1 ClickBlock ${selected ? 'rounded border outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
                data-clicktype="clickable"
                style={
                    {
                        background: `${colorFillLocal}`,
                        border: `2px solid ${borderColorLocal}`,
                        color: `${textColorLocal}`,
                    }
                }>
                <span
                    className="flex mx-1 my-1"
                    onClick={handleClick}
                >
                    <span
                        className={`flex select-none px-2 py-1 items-center justify-center text-center hover:opacity-60 leading-none text-lg`}
                    >{category}</span>
                    <span className="flex h-6.5 w-full min-w-6.5 max-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] text-black text-sm">{value.count}</span>
                </span>
            </div>
        </div>
    )
}