import { useContext, useState, useEffect } from "react";
import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from "../..";
import { HebWord } from "@/lib/data";
import { ColorActionType } from "@/lib/types";

export const CategoryBlock = ({
    category,
    index,
    selectedCategory,
    setSelectedCategory,
    value,
    lastSelectedHebWords,
    setLastSelectedHebWords
}: {
    category: String,
    index: number,
    selectedCategory: String,
    setSelectedCategory: React.Dispatch<React.SetStateAction<String>>,
    value: { strongNumbers: number[], count: number, hebWords: HebWord[] },
    lastSelectedHebWords: HebWord[],
    setLastSelectedHebWords: React.Dispatch<React.SetStateAction<HebWord[]>>
}) => {

    const matchFillColor = () => {
        let match = value.hebWords.every((dsd) => {
          return !dsd.colorFill || dsd.colorFill === value.hebWords[0].colorFill;
        });
        return match;
      }
    
      const matchTextColor = () => {
        let match = value.hebWords.every((dsd) => {
          return !dsd.textColor || dsd.textColor === value.hebWords[0].textColor;
        });
        return match;
      }
      
      const matchBorderColor = () => {
        let match = value.hebWords.every((dsd) => {
          return !dsd.borderColor || dsd.borderColor === value.hebWords[0].borderColor;
        });
        return match;
    }
    const { ctxSelectedHebWords, ctxSetSelectedHebWords, ctxSetNumSelectedWords, ctxColorAction, ctxSelectedColor } = useContext(FormatContext);
    const [colorFillLocal, setColorFillLocal] = useState(matchFillColor()? value.hebWords[0].colorFill: DEFAULT_COLOR_FILL);
    const [textColorLocal, setTextColorLocal] = useState(matchTextColor()? value.hebWords[0].textColor: DEFAULT_TEXT_COLOR);
    const [borderColorLocal, setBorderColorLocal] = useState(matchBorderColor()? value.hebWords[0].textColor: DEFAULT_BORDER_COLOR);
    const [selected, setSelected] = useState(false);

    useEffect(() => {
        let hasChildren = true;
        value.hebWords.forEach((eachWord) => {
            hasChildren = hasChildren && ctxSelectedHebWords.includes(eachWord);
        })
        setSelected(hasChildren);
        console.log(hasChildren)
    }, [ctxSelectedHebWords, value.hebWords]);

    useEffect(() => {
        if (ctxSelectedHebWords.length == 0 || ctxColorAction === ColorActionType.none) { return; }
    
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
    }, [ctxSelectedColor, ctxColorAction, ctxSelectedHebWords])

    const handleClick = () => {
        console.log(value);
        setSelected(prevState => !prevState);
        if (category === selectedCategory) {
            const newSelectedHebWords = ctxSelectedHebWords.filter(
                word => !lastSelectedHebWords.some(categoryWord => categoryWord.id === word.id)
            );
            ctxSetSelectedHebWords(newSelectedHebWords);
            ctxSetNumSelectedWords(newSelectedHebWords.length);
            setLastSelectedHebWords([]);
        } else {
            const wordsWithoutPrevCategory = ctxSelectedHebWords.filter(
                word => !lastSelectedHebWords.some(categoryWord => categoryWord.id === word.id)
            );
            
            const newSelectedHebWords = Array.from(new Set([...wordsWithoutPrevCategory, ...value.hebWords]));
            
            ctxSetSelectedHebWords(newSelectedHebWords);
            ctxSetNumSelectedWords(newSelectedHebWords.length);
            setLastSelectedHebWords(value.hebWords);
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