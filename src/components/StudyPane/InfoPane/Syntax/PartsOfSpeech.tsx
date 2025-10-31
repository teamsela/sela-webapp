import { useContext, useState } from 'react';

import { WordProps, ColorData } from "@/lib/data";
import { extractPartsOfSpeechFromPassage } from "@/lib/utils";

import { FormatContext } from '../../index';
import { PartsOfSpeechBlock } from "./PartsOfSpeechBlock";
import SyntaxSmartHighlight from './SmartHighlight';

//import SmartHighlight from '@/components/StudyPane/InfoPane/Motif/SmartHighlight';

export type SyntaxProps = {
    label: string,
    wordProps: WordProps[]
};

const PartsOfSpeech = () => {
    const { ctxPassageProps } = useContext(FormatContext)

    let [selectedPartsOfSpeech, setSelectedPartsOfSpeech] = useState<string>("");
    let [lastSelectedWords, setLastSelectedWords] = useState<WordProps[]>([]);

    // get a map of strong number to an array of WordProps with the same strong number
    const partsOfSpeechToWordsMap = extractPartsOfSpeechFromPassage(ctxPassageProps);
    const partsOfSpeechArray: SyntaxProps[] = Array.from(partsOfSpeechToWordsMap.entries()).map(
        ([label, wordProps]) => ({
            label,
            wordProps,
        })
    );

    return (
        <div className="flex flex-col h-full">
            <div
                style={{ height: 'fit-content' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className ="flex flex-wrap">
                    {partsOfSpeechArray.map((partsOfSpeech, index) => (
                        <PartsOfSpeechBlock key={index} name={partsOfSpeech.label} posWords={partsOfSpeech.wordProps} 
                            selectedPartsOfSpeech={selectedPartsOfSpeech} setSelectedPartsOfSpeech={setSelectedPartsOfSpeech}
                            lastSelectedWords={lastSelectedWords} setLastSelectedWords={setLastSelectedWords}
                        />
                    ))
                    }
                </div>
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center mt-3">
                <SyntaxSmartHighlight syntaxProps={partsOfSpeechArray} />
            </div>            
        </div>
    );
};
export default PartsOfSpeech;
