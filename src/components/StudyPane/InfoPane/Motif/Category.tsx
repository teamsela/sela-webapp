import { useContext, useState } from "react";
import { HebWord, PassageData } from "@/lib/data";
import { CategoryBlock } from "./CategoryBlock";
import { FormatContext } from "../..";

const Category = ({
    content
}: {
    content: PassageData;
}) => {
    let categoryCount = new Map<String, { strongNumbers: number[], count: number }>();
    let [selectedCategory, setSelectedCategory] = useState<String>("");

    content.stanzas.forEach(stanza => {
        stanza.strophes.forEach(strophe => {
            strophe.lines.forEach(line => {
                line.words.forEach(word => {
                    if (word.categories && word.strongNumber) {
                        word.categories.forEach(category => {
                            // Initialize category data if not in map
                            if (!categoryCount.has(category)) {
                                categoryCount.set(category, {
                                    strongNumbers: [],
                                    count: 0
                                });
                            }
                            
                            const categoryData = categoryCount.get(category)!;
                            
                            // Add strongNumber if not already present
                            if (!categoryData.strongNumbers.includes(word.strongNumber)) {
                                categoryData.strongNumbers.push(word.strongNumber);
                            }
                            
                            // Increment the overall count for this category
                            categoryData.count++;
                        });
                    }
                });
            });
        });
    });
    
    return (
        <div className="flex-col h-full">
            <div
                style={{ height: '70%' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className="flex flex-wrap">
                    {Array.from(categoryCount.entries()).map(([key, value], index) => (
                        (value.strongNumbers.length > 1) && (
                            <div key={index}>
                                <CategoryBlock category={key} index={index} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} value={value}/>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
};
export default Category;
