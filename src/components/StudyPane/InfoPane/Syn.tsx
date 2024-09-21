const Syn = ({

}: {

    }) => {
    const synonymsGroups = [
        {
            words: ["law", "testimony", "statues", "commandments"],
            highlighted: true, // To apply custom styling for yellow border
        },
        {
            words: ["honey", "honeycomb"],
            highlighted: false, // Default border for this group
        },
        {
            words: ["gold", "fine gold"],
            highlighted: false, // Default border for this group
        },
    ];

    return (
        <div className="w-full h-full">
            {/* Synonyms Header */}
            <h2 className="text-lg text-black font-bold mb-2 mt-2">Synonyms</h2>
            {/* List of Synonym Groups */}
            <div className="flex flex-col gap-4">
                {synonymsGroups.map((group, index) => (
                    <div key={index} className="flex flex-col gap-4">
                        {/* Synonym words */}
                        <div className="flex flex-wrap gap-2">
                            {group.words.map((word, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        border: "2px solid",
                                        borderColor: group.highlighted ? "#FFD700" : "#888", // Explicit colors for border
                                        borderRadius: "8px",
                                        textAlign: "center",
                                        backgroundColor: group.highlighted ? "#FFFACD" : "#FFF", // Light yellow background for highlighted words
                                        color: group.highlighted ? "#FFD700" : "#000", // Text color for highlighted words
                                      }}
                                >
                                    {word}
                                </div>
                            ))}
                        </div>

                        {/* Divider between groups, except for the last group */}
                        {index < synonymsGroups.length - 1 && (
                            <div style={{ width: "100%", height: "2px", backgroundColor: "#888", marginTop: "0.5rem" }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Syn;
