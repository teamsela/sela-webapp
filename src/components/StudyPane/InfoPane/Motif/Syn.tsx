import { useContext, useState } from "react";
import { HebWord, PassageData } from "@/lib/data";
import { SynBlock } from "./SynBlock";
import { FormatContext } from "../..";

const Syn = ({
    content
}: {
    content: PassageData;
}) => {
    const { ctxSynonymMap } = useContext(FormatContext)
    let synonymCount = new Map<String, number[]>();
    let [selectedCategory, setSelectedCategory] = useState<String>("");

    content.stanzas.forEach(stanza => {
        stanza.strophes.forEach(strophe => {
            strophe.lines.forEach(line => {
                line.words.forEach(word => {
                    if (word.categories && word.strongNumber) {
                        word.categories.forEach(category => {
                            // Initialize array if category not in map
                            if (!synonymCount.has(category)) {
                                synonymCount.set(category, []);
                            }
                            // Add strongNumber if not already present
                            const currentNumbers = synonymCount.get(category);
                            if (currentNumbers && !currentNumbers.includes(word.strongNumber)) {
                                currentNumbers.push(word.strongNumber);
                            }
                        });
                    }
                });
            });
        });
    });

    console.log(synonymCount);
    console.log(content);
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
