import { useState } from "react";
import { RootBlock } from "./RootBlock";

const Root = ({

}: {
    }) => {

        const rootWords = [
        { word: "LORD", count: 7 },
        { word: "Many", count: 3 },
        { word: "None", count: 3 },
        { word: "Day", count: 2 },
        { word: "Heart", count: 2 },
        { word: "Heaven", count: 2 },
        { word: "Servant", count: 2 },
        { word: "Night", count: 2 },
        { word: "Hide", count: 2 },
        { word: "End", count: 2 },
        { word: "Word", count: 2 },
        { word: "Clear", count: 2 },
        { word: "LORD", count: 7 },
        { word: "Many", count: 3 },
        { word: "None", count: 3 },
        { word: "Day", count: 2 },
        { word: "Heart", count: 2 },
        { word: "Heaven", count: 2 },
        { word: "Servant", count: 2 },
        { word: "Night", count: 2 },
        { word: "Hide", count: 2 },
        { word: "End", count: 2 },
        { word: "Word", count: 2 },
        { word: "Clear", count: 2 },
    ];

    return (
        <>
            <div className="flex flex-wrap pb-8">
                {rootWords.map((root, index) => (
                    <RootBlock id={index} rootWord={root.word} count={root.count} />
                ))}
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center">
                <button
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    onClick={() => console.log("Smart Highlight Clicked")}
                >
                    Smart Highlight
                </button>
            </div>            
        </>
    );
};
export default Root;
