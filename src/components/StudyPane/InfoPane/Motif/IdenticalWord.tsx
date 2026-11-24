import { useContext } from 'react';

import { WordProps } from "@/lib/data";
import { disambiguateGroupLabels, extractIdenticalWordsFromPassage, groupLabel } from "@/lib/utils";

import { FormatContext } from '../../index';
import { IdenticalWordBlock } from "./IdenticalWordBlock";
import NameRootSwitcher from "./NameRootSwitcher";

import SmartHighlight from '@/components/StudyPane/InfoPane/Motif/SmartHighlight';

export type IdenticalWordProps = {
    wordId: number,
    count: number,
    identicalWords: WordProps[],
    /** Hebrew chip text, unpointed: the root letters (ישׁב), or the word's letters (כי) */
    label: string,
    /** English chip text: the root's sense, or the word's gloss */
    gloss: string,
    /** A pointed word from the group (יָשַׁב) for the tooltip */
    word?: string,
};

const IdenticalWord = () => {
    const { ctxPassageProps, ctxIncludeNameRoots, ctxSetIncludeNameRoots } = useContext(FormatContext)

    // map of root group (or Strong's number for exact-match words) to the passage's words in it
    const groups = extractIdenticalWordsFromPassage(ctxPassageProps, ctxIncludeNameRoots);
    const repeated = Array.from(groups.entries()).filter(([, words]) => words.length > 1);
    const labels = disambiguateGroupLabels(repeated.map(([groupKey, words]) => groupLabel(groupKey, words)));
    const identicalWordPropsArray: IdenticalWordProps[] = repeated.map(([, words], i) => ({
        wordId: words[0].wordId,
        count: words.length,
        identicalWords: words,
        label: labels[i].hebrew,
        gloss: labels[i].english,
        word: labels[i].word,
    }));
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
                            label={idWordProps.label} gloss={idWordProps.gloss} word={idWordProps.word}/>
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
