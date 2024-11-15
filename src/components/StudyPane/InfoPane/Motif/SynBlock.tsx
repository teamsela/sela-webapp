import { useContext } from "react";
import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, FormatContext } from "../..";

export const SynBlock = ({
    category,
    index,
    selectedCategory,
    setSelectedCategory,
    value
}: {
    category: String,
    index: number,
    selectedCategory: String,
    setSelectedCategory: React.Dispatch<React.SetStateAction<String>>,
    value: number[]
}) => {
    const { ctxSetSynonymRoots } = useContext(FormatContext);

    const handleClick = () => {
        if(category == selectedCategory){
            setSelectedCategory("");
            ctxSetSynonymRoots([]);
        }else{
            setSelectedCategory(category);
            ctxSetSynonymRoots(value);
            console.log(value)
        }
    };
    return (
        <div className="flex my-1">
            <div
                key={index}
                className={`wordBlock mx-1 ClickBlock ${selectedCategory === category ? 'rounded border outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
                data-clicktype="clickable"
                style={
                    {
                        background: `${DEFAULT_COLOR_FILL}`,
                        border: `2px solid ${DEFAULT_BORDER_COLOR}`,
                        color: `${DEFAULT_TEXT_COLOR}`,
                    }
                }>
                <span
                    className="flex mx-1 my-1"
                    onClick={handleClick}
                >
                    <span
                        className={`flex select-none px-2 py-1 items-center justify-center text-center hover:opacity-60 leading-none text-lg`}
                    >{category}</span>
                </span>
            </div>
        </div>
    )
}