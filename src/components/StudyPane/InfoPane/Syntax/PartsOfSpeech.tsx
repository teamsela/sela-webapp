import { useContext, useState } from 'react';

import { WordProps } from "@/lib/data";
import { extractPartsOfSpeechFromPassage } from "@/lib/utils";

import { FormatContext } from '../../index';
import { PartsOfSpeechBlock } from "./PartsOfSpeechBlock";

import SmartHighlight from '@/components/StudyPane/InfoPane/Motif/SmartHighlight';

export type PartsOfSpeechProps = {
    label: string,
    posWords: WordProps[]    
};

const PartsOfSpeech = () => {
    const { ctxPassageProps } = useContext(FormatContext)

    let [selectedPartsOfSpeech, setSelectedPartsOfSpeech] = useState<string>("");
    let [lastSelectedWords, setLastSelectedWords] = useState<WordProps[]>([]);

    // get a map of strong number to an array of WordProps with the same strong number
    const partsOfSpeechToWordsMap = extractPartsOfSpeechFromPassage(ctxPassageProps);
    const partsOfSpeechArray: PartsOfSpeechProps[] = Array.from(partsOfSpeechToWordsMap.entries()).map(
        ([label, posWords]) => ({
            label,
            posWords,
        })
    );

    return (
        <div className="flex flex-col h-full">
            <div
                style={{ height: 'fit-content' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className ="flex flex-wrap">
                    {partsOfSpeechArray.map((partsOfSpeech, index) => (
                        <PartsOfSpeechBlock key={index} name={partsOfSpeech.label} posWords={partsOfSpeech.posWords} 
                            selectedPartsOfSpeech={selectedPartsOfSpeech} setSelectedPartsOfSpeech={setSelectedPartsOfSpeech}
                            lastSelectedWords={lastSelectedWords} setLastSelectedWords={setLastSelectedWords}
                        />
                    ))
                    }
                </div>
            </div>
        </div>
    );
};
export default PartsOfSpeech;
