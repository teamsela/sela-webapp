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

    rootWordsMap.forEach((value, key) => {
        const syns: String[] | undefined = ctxSynonymMap.get(key);
        if (syns !== undefined) {
            syns.forEach((syn) => {
                // Initialize the array if this synonym is not yet in the map
                if (!synonymCount.has(syn)) {
                    synonymCount.set(syn, []);
                }
                // Get the current array and add `key` if it's not already present
                const currentKeys = synonymCount.get(syn);
                if (currentKeys && !currentKeys.includes(key)) {
                    currentKeys.push(key);
                }
            });
        }
    });

    return (
        <div className="flex-col h-full">
            <div
                style={{ height: '70%' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className="flex flex-wrap">
                    {Array.from(synonymCount.entries()).map(([key, value], index) => (
                        (value.length > 1) && (
                            <div>
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
