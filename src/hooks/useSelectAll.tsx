
export const useSelectAll = (array:[]) => {
    const findWordsArrays = (item: any): any[] => {
        if (Array.isArray(item)) {
            const nestedWords = item.flatMap(findWordsArrays);
            console.log(nestedWords)
            return nestedWords.length > 0 ? nestedWords : [];
        }
        
        if (item !== null) {
            if (item.words && Array.isArray(item.Words)) {
                console.log(item.words )
                return [item.words];
            }
            return Object.values(item)
                .flatMap(findWordsArrays)
                .filter(Boolean);
        }
        return [];
    };
    return array.flatMap(findWordsArrays);
}