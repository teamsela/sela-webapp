import { useState } from "react";

const Root = ({

}: {
    }) => {
    const [highlightedRoot, setHighlightedRoot] = useState("LORD");

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

    const handleHighlight = (root: string) => {
        setHighlightedRoot(root);
    };

    return (
        <div className="flex flex-col  w-full h-full  relative">
            <h2 className="text-lg text-black font-bold mb-2">Identical Roots</h2>
            <div className="flex flex-col gap-2 overflow-y-auto w-full max-h-[630px] px-4">
                {rootWords.map((root, index) => (
                    <button
                        key={index}
                        className={`px-4 py-2 border border-gray-300 rounded-md text-black
                  ${highlightedRoot === root.word ? "bg-purple-200" : "bg-white"}`}
                        onClick={() => handleHighlight(root.word)}
                    >
                        {root.word} x{root.count}
                    </button>
                ))}
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center">
                <button
                    className="px-4 py-2 mt-2 bg-yellow-300 text-black font-semibold rounded-md shadow"
                    onClick={() => console.log("Smart Highlight Clicked")}
                >
                    Smart Highlight
                </button>
            </div>
        </div>
    );
};
export default Root;
