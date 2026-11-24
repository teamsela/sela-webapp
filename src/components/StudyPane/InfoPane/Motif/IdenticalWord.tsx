import { useContext } from 'react';

import { WordProps } from "@/lib/data";
import { extractIdenticalWordsFromPassage } from "@/lib/utils";

import { FormatContext } from '../../index';
import { IdenticalWordBlock } from "./IdenticalWordBlock";
import NameRootSwitcher from "./NameRootSwitcher";

import SmartHighlight from '@/components/StudyPane/InfoPane/Motif/SmartHighlight';

export type IdenticalWordProps = {
    wordId: number,
    count: number,
    identicalWords: WordProps[],
    /** Hebrew label: root consonants, or the lemma for exact-match groups */
    label: string,
    /** English label: root sense, or the word's gloss */
    gloss: string,
};

const blockLabels = (groupKey: string, words: WordProps[]) => {
    // Prefer a word that belongs to the group by root (not a proper name joining via its name roots)
    const rootWord = words.find(w => w.motifData?.rootId === groupKey);
    const lead = rootWord ?? words[0];
    return {
        label: rootWord?.motifData?.rootLabel || lead.motifData?.lemma || lead.wlcWord,
        gloss: rootWord?.motifData?.rootGloss || lead.ETCBCgloss || lead.gloss,
    };
};

const IdenticalWord = () => {
    const { ctxPassageProps, ctxIncludeNameRoots, ctxSetIncludeNameRoots } = useContext(FormatContext)

    // map of root group (or Strong's number for exact-match words) to the passage's words in it
    const groups = extractIdenticalWordsFromPassage(ctxPassageProps, ctxIncludeNameRoots);
    const identicalWordPropsArray: IdenticalWordProps[] = [];
    groups.forEach((words, groupKey) => {
        if (words.length > 1) {
            identicalWordPropsArray.push({
                wordId: words[0].wordId,
                count: words.length,
                identicalWords: words,
                ...blockLabels(groupKey, words),
            });
        }
    });
    identicalWordPropsArray.sort((a, b) => b.count - a.count);

    return (
        <div className="flex flex-col h-full">
            <div>
                <NameRootSwitcher selectRelated={ctxIncludeNameRoots} setSelectRelated={ctxSetIncludeNameRoots}/>
            </div>
            <div
                style={{ height: 'fit-content' }}
                className=" gap-4 pb-8 overflow-y-auto">
                <div className ="flex flex-wrap">
                    {identicalWordPropsArray.map((idWordProps, index) => (
                        <IdenticalWordBlock key={index} id={idWordProps.wordId}
                            count={idWordProps.count} identicalWords={idWordProps.identicalWords}
                            label={idWordProps.label} gloss={idWordProps.gloss}/>
                    ))
                    }
                </div>
            </div>
            <div className="w-full bottom-0 left-0 flex justify-center mt-3">
                <SmartHighlight identicalWords={identicalWordPropsArray} />
            </div>
        </div>
    );
};
export default IdenticalWord;
