import { useContext, useState } from "react";
import { HebWord, PassageData } from "@/lib/data";
import { SynBlock } from "./SynBlock";
import { FormatContext } from "../..";

const Syn = ({
    rootWordsMap
}: {
    rootWordsMap: Map<number, HebWord[]>;
}) => {
    const { ctxSynonymMap } = useContext(FormatContext)
    let synonymCount = new Map<String, number[]>();
    let [selectedCategory, setSelectedCategory] = useState<String>("");

    rootWordsMap.forEach((words, key) => {
        words.forEach((word) => {
            if (word.categories) {
                word.categories.forEach((category) => {
                    // Initialize the array if this category is not yet in the map
                    if (!synonymCount.has(category)) {
                        synonymCount.set(category, []);
                    }
                    // Get the current array and add `key` if it's not already present
                    const currentKeys = synonymCount.get(category);
                    if (currentKeys && !currentKeys.includes(key)) {
                        currentKeys.push(key);
                    }
                });
            }
        });
    });

    return (
        <div className="flex-col h-full">
            <div
                style={{ height: '70%' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className="flex flex-wrap">
                    {Array.from(synonymCount.entries()).map(([key, value], index) => (
                        (value.length > 1) && (
                            <div key={index}>
                                <SynBlock category={key} index={index} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} value={value}/>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
};
export default Syn;
