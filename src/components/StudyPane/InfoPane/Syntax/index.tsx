import React, { useContext, useMemo, useState } from "react";

import { PassageProps, WordProps } from "@/lib/data";
import { SyntaxType } from "@/lib/types";

import { FormatContext } from "../..";
import AccordionToggleIcon from "../common/AccordionToggleIcon";
import SyntaxLabel, { LabelPalette } from "./SyntaxLabel";
import SyntaxSmartHighlight from "./SmartHighlight";

type PersonCode = "1" | "2" | "3";
type GenderCode = "M" | "F" | "C";
type NumberCode = "S" | "D" | "P";

type MorphFeatures = {
  tokens: Set<string>;
  normalizedSegments: string[];
  persons: Set<PersonCode>;
  genders: Set<GenderCode>;
  numbers: Set<NumberCode>;
  genderNumberCombos: Set<string>;
};

type SyntaxLabelDefinition = {
  id: string;
  label: string;
  palette?: LabelPalette;
  predicate: (features: MorphFeatures) => boolean;
};

type SyntaxSubSection = {
  id: string;
  title: string;
  labels: SyntaxLabelDefinition[];
};

type SyntaxSectionDefinition = {
  id: string;
  type: SyntaxType;
  title: string;
  labels?: SyntaxLabelDefinition[];
  subSections?: SyntaxSubSection[];
  highlightable?: boolean;
};

const DEFAULT_BORDER_COLOR = "#D9D9D9";
const DEFAULT_TEXT_COLOR = "#656565";
const DEFAULT_FILL_COLOR = "#FFFFFF";

const partsOfSpeechPalette: Record<string, LabelPalette> = {
  "pos-verb": { fill: "#f8bdd0", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-noun": { fill: "#4fc3f7", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-adjective": { fill: "#dcedc8", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-negative-particle": { fill: "#c2185b", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-adverb": { fill: "#f06292", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-pronoun": { fill: "#b2ebf2", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-interjection": { fill: "#fff9cf", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-interrogative": { fill: "#ffe0b2", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-conjunction": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-object-marker": { fill: "#4458e1", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-preposition": { fill: DEFAULT_FILL_COLOR, border: "#388e3f", text: DEFAULT_TEXT_COLOR },
  "pos-proper-noun": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
};

const verbConjugationPalette: Record<string, LabelPalette> = {
  "vc-perfect": { fill: "#FEEAE6", border: "#FB8C00", text: "#E65100" },
  "vc-imperfect": { fill: "#E8EAF6", border: "#5C6BC0", text: "#1A237E" },
  "vc-participle": { fill: "#EDE7F6", border: "#9575CD", text: "#4527A0" },
  "vc-infinitive": { fill: "#E0F2F1", border: "#26A69A", text: "#004D40" },
  "vc-imperative": { fill: "#FFF3E0", border: "#FFA726", text: "#E65100" },
  "vc-cohortative": { fill: "#F3E5F5", border: "#AB47BC", text: "#6A1B9A" },
  "vc-jussive": { fill: "#E1F5FE", border: "#64B5F6", text: "#0D47A1" },
};

const verbalStemPalette: Record<string, LabelPalette> = {
  "vs-qal": { fill: "#FFF9C4", border: "#FBC02D", text: "#8D6E63" },
  "vs-niphal": { fill: "#E1F5FE", border: "#29B6F6", text: "#01579B" },
  "vs-piel": { fill: "#F8BBD0", border: "#F06292", text: "#880E4F" },
  "vs-pual": { fill: "#E1BEE7", border: "#BA68C8", text: "#6A1B9A" },
  "vs-hifil": { fill: "#FFE0B2", border: "#FFB74D", text: "#E65100" },
  "vs-hofal": { fill: "#E0F7FA", border: "#26C6DA", text: "#006064" },
  "vs-hitpael": { fill: "#DCEDC8", border: "#8BC34A", text: "#33691E" },
};

const personPalette: Record<string, LabelPalette> = {
  "pgn-person-1": { fill: "#E0F2FE", border: "#42A5F5", text: "#0D47A1" },
  "pgn-person-2": { fill: "#E8F5E9", border: "#66BB6A", text: "#1B5E20" },
  "pgn-person-3": { fill: "#F3E5F5", border: "#BA68C8", text: "#4A148C" },
};

const genderPalette: Record<string, LabelPalette> = {
  "pgn-gender-m": { fill: "#E0F2F1", border: "#4DB6AC", text: "#004D40" },
  "pgn-gender-f": { fill: "#FCE4EC", border: "#F48FB1", text: "#880E4F" },
  "pgn-gender-c": { fill: "#FFF8E1", border: "#FFE082", text: "#8D6E63" },
};

const numberPalette: Record<string, LabelPalette> = {
  "pgn-number-s": { fill: "#F1F8E9", border: "#AED581", text: "#33691E" },
  "pgn-number-d": { fill: "#EDE7F6", border: "#9575CD", text: "#4527A0" },
  "pgn-number-p": { fill: "#E3F2FD", border: "#64B5F6", text: "#0D47A1" },
};

const partsOfSpeechLabels: SyntaxLabelDefinition[] = [
  {
    id: "pos-verb",
    label: "Verb",
    palette: partsOfSpeechPalette["pos-verb"],
    predicate: (features) => features.tokens.has("V"),
  },
  {
    id: "pos-noun",
    label: "Noun",
    palette: partsOfSpeechPalette["pos-noun"],
    predicate: (features) => features.tokens.has("N"),
  },
  {
    id: "pos-adjective",
    label: "Adjective",
    palette: partsOfSpeechPalette["pos-adjective"],
    predicate: (features) => features.tokens.has("ADJ"),
  },
  {
    id: "pos-negative-particle",
    label: "Negative Particle",
    palette: partsOfSpeechPalette["pos-negative-particle"],
    predicate: (features) =>
      features.tokens.has("ADV") &&
      features.tokens.has("NEGPRT") &&
      features.normalizedSegments.some((segment) => segment === "ADV-NEGPRT"),
  },
  {
    id: "pos-adverb",
    label: "Adverb",
    palette: partsOfSpeechPalette["pos-adverb"],
    predicate: (features) =>
      features.tokens.has("ADV") &&
      !features.normalizedSegments.some((segment) => segment === "ADV-NEGPRT"),
  },
  {
    id: "pos-pronoun",
    label: "Pronoun",
    palette: partsOfSpeechPalette["pos-pronoun"],
    predicate: (features) =>
      ["PRO", "PRON", "PRONOUN", "PRONOMINAL"].some((token) =>
        features.tokens.has(token),
      ),
  },
  {
    id: "pos-interjection",
    label: "Interjection",
    palette: partsOfSpeechPalette["pos-interjection"],
    predicate: (features) =>
      features.tokens.has("INTERJECTION") || features.tokens.has("INTERJ"),
  },
  {
    id: "pos-interrogative",
    label: "Interrogative",
    palette: partsOfSpeechPalette["pos-interrogative"],
    predicate: (features) =>
      features.tokens.has("INTERROG") || features.tokens.has("INTERROGATIVE"),
  },
  {
    id: "pos-conjunction",
    label: "Conjunction",
    palette: partsOfSpeechPalette["pos-conjunction"],
    predicate: (features) =>
      features.tokens.has("CONJ") || features.tokens.has("CONSEC"),
  },
  {
    id: "pos-object-marker",
    label: "Object Marker",
    palette: partsOfSpeechPalette["pos-object-marker"],
    predicate: (features) => features.tokens.has("DIROBM"),
  },
  {
    id: "pos-preposition",
    label: "Preposition",
    palette: partsOfSpeechPalette["pos-preposition"],
    predicate: (features) => features.tokens.has("PREP"),
  },
  {
    id: "pos-proper-noun",
    label: "Proper Noun",
    palette: partsOfSpeechPalette["pos-proper-noun"],
    predicate: (features) => features.tokens.has("PROPER"),
  },
];

const verbConjugationLabels: SyntaxLabelDefinition[] = [
  {
    id: "vc-perfect",
    label: "Perfect",
    palette: verbConjugationPalette["vc-perfect"],
    predicate: (features) =>
      features.tokens.has("PERF") || features.tokens.has("PERFECT"),
  },
  {
    id: "vc-imperfect",
    label: "Imperfect",
    palette: verbConjugationPalette["vc-imperfect"],
    predicate: (features) => features.tokens.has("IMPERF"),
  },
  {
    id: "vc-participle",
    label: "Participle",
    palette: verbConjugationPalette["vc-participle"],
    predicate: (features) =>
      features.tokens.has("PRTCPL") || features.tokens.has("PARTICIPLE"),
  },
  {
    id: "vc-infinitive",
    label: "Infinitive",
    palette: verbConjugationPalette["vc-infinitive"],
    predicate: (features) =>
      features.tokens.has("INF") || features.tokens.has("INFINITIVE"),
  },
  {
    id: "vc-imperative",
    label: "Imperative",
    palette: verbConjugationPalette["vc-imperative"],
    predicate: (features) => features.tokens.has("IMP"),
  },
  {
    id: "vc-cohortative",
    label: "Cohortative",
    palette: verbConjugationPalette["vc-cohortative"],
    predicate: (features) =>
      features.tokens.has("COHORT") || features.tokens.has("COHORTATIVE"),
  },
  {
    id: "vc-jussive",
    label: "Jussive",
    palette: verbConjugationPalette["vc-jussive"],
    predicate: (features) =>
      features.tokens.has("JUS") || features.tokens.has("JUSSIVE"),
  },
];

const verbalStemLabels: SyntaxLabelDefinition[] = [
  {
    id: "vs-qal",
    label: "Qal",
    palette: verbalStemPalette["vs-qal"],
    predicate: (features) => features.tokens.has("QAL"),
  },
  {
    id: "vs-niphal",
    label: "Niphal",
    palette: verbalStemPalette["vs-niphal"],
    predicate: (features) =>
      features.tokens.has("NIPHAL") || features.tokens.has("NIFAL"),
  },
  {
    id: "vs-piel",
    label: "Piel",
    palette: verbalStemPalette["vs-piel"],
    predicate: (features) => features.tokens.has("PIEL"),
  },
  {
    id: "vs-pual",
    label: "Pual",
    palette: verbalStemPalette["vs-pual"],
    predicate: (features) => features.tokens.has("PUAL"),
  },
  {
    id: "vs-hifil",
    label: "Hifil",
    palette: verbalStemPalette["vs-hifil"],
    predicate: (features) =>
      features.tokens.has("HIFIL") || features.tokens.has("HIPHIL"),
  },
  {
    id: "vs-hofal",
    label: "Hofal",
    palette: verbalStemPalette["vs-hofal"],
    predicate: (features) => features.tokens.has("HOFAL"),
  },
  {
    id: "vs-hitpael",
    label: "Hitpael",
    palette: verbalStemPalette["vs-hitpael"],
    predicate: (features) =>
      features.tokens.has("HITPAEL") || features.tokens.has("HITHPAEL"),
  },
];

const personLabels: SyntaxLabelDefinition[] = [
  {
    id: "pgn-person-1",
    label: "1st Person",
    palette: personPalette["pgn-person-1"],
    predicate: (features) => features.persons.has("1"),
  },
  {
    id: "pgn-person-2",
    label: "2nd Person",
    palette: personPalette["pgn-person-2"],
    predicate: (features) => features.persons.has("2"),
  },
  {
    id: "pgn-person-3",
    label: "3rd Person",
    palette: personPalette["pgn-person-3"],
    predicate: (features) => features.persons.has("3"),
  },
];

const genderLabels: SyntaxLabelDefinition[] = [
  {
    id: "pgn-gender-m",
    label: "Masculine",
    palette: genderPalette["pgn-gender-m"],
    predicate: (features) =>
      features.genders.has("M") ||
      Array.from(features.genderNumberCombos).some((value) => value.startsWith("M")),
  },
  {
    id: "pgn-gender-f",
    label: "Feminine",
    palette: genderPalette["pgn-gender-f"],
    predicate: (features) =>
      features.genders.has("F") ||
      Array.from(features.genderNumberCombos).some((value) => value.startsWith("F")),
  },
  {
    id: "pgn-gender-c",
    label: "Common",
    palette: genderPalette["pgn-gender-c"],
    predicate: (features) =>
      features.genders.has("C") ||
      Array.from(features.genderNumberCombos).some((value) => value.startsWith("C")),
  },
];

const numberLabels: SyntaxLabelDefinition[] = [
  {
    id: "pgn-number-s",
    label: "Singular",
    palette: numberPalette["pgn-number-s"],
    predicate: (features) =>
      features.numbers.has("S") ||
      features.genderNumberCombos.has("MS") ||
      features.genderNumberCombos.has("FS") ||
      features.genderNumberCombos.has("CS"),
  },
  {
    id: "pgn-number-d",
    label: "Dual",
    palette: numberPalette["pgn-number-d"],
    predicate: (features) =>
      features.numbers.has("D") ||
      features.genderNumberCombos.has("MD") ||
      features.genderNumberCombos.has("FD"),
  },
  {
    id: "pgn-number-p",
    label: "Plural",
    palette: numberPalette["pgn-number-p"],
    predicate: (features) =>
      features.numbers.has("P") ||
      features.genderNumberCombos.has("MP") ||
      features.genderNumberCombos.has("FP") ||
      features.genderNumberCombos.has("CP"),
  },
];

const syntaxSections: SyntaxSectionDefinition[] = [
  {
    id: "parts-of-speech",
    type: SyntaxType.partsOfSpeech,
    title: "Parts of Speech",
    labels: partsOfSpeechLabels,
    highlightable: true,
  },
  {
    id: "verb-conjugations",
    type: SyntaxType.verbalConjugations,
    title: "Verb Conjugations",
    labels: verbConjugationLabels,
  },
  {
    id: "verbal-stems",
    type: SyntaxType.verbalStems,
    title: "Verbal Stems",
    labels: verbalStemLabels,
  },
  {
    id: "person-gender-number",
    type: SyntaxType.personsGenderNumber,
    title: "Person, Gender, Number",
    subSections: [
      {
        id: "person",
        title: "Person",
        labels: personLabels,
      },
      {
        id: "gender",
        title: "Gender",
        labels: genderLabels,
      },
      {
        id: "number",
        title: "Number",
        labels: numberLabels,
      },
    ],
  },
];

const allLabelDefinitions: SyntaxLabelDefinition[] = syntaxSections.flatMap((section) =>
  section.subSections
    ? section.subSections.flatMap((subSection) => subSection.labels)
    : section.labels ?? [],
);

const flattenWords = (passageProps?: PassageProps): WordProps[] => {
  if (!passageProps) {
    return [];
  }

  const words: WordProps[] = [];
  passageProps.stanzaProps.forEach((stanza) => {
    stanza.strophes.forEach((strophe) => {
      strophe.lines.forEach((line) => {
        line.words.forEach((word) => {
          words.push(word);
        });
      });
    });
  });

  return words;
};

const buildMorphFeatures = (morphology?: string | null): MorphFeatures | null => {
  if (!morphology) {
    return null;
  }

  const segments = morphology
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return null;
  }

  const tokens = new Set<string>();
  const normalizedSegments: string[] = [];
  const persons = new Set<PersonCode>();
  const genders = new Set<GenderCode>();
  const numbers = new Set<NumberCode>();
  const genderNumberCombos = new Set<string>();

  segments.forEach((segment) => {
    const trimmed = segment.trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.replace(/\s+/g, "");
    normalizedSegments.push(normalized.toUpperCase());

    const sanitized = trimmed.replace(/[(),]/g, "");
    const rawTokens = sanitized
      .split(/[-./\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    rawTokens.forEach((token) => {
      const upperToken = token.toUpperCase();
      tokens.add(upperToken);

      const personMatch = upperToken.match(/^([123])(ST|ND|RD)?([MFC])?([SPD])?/);
      if (personMatch) {
        const person = personMatch[1] as PersonCode;
        persons.add(person);

        const gender = personMatch[3] as GenderCode | undefined;
        const number = personMatch[4] as NumberCode | undefined;

        if (gender) {
          genders.add(gender);
        }
        if (number) {
          numbers.add(number);
        }
        if (gender && number) {
          genderNumberCombos.add(`${gender}${number}`);
        }
      }

      const genderNumberMatch = upperToken.match(/^([MFC])([SPD])/);
      if (genderNumberMatch) {
        const gender = genderNumberMatch[1] as GenderCode;
        const number = genderNumberMatch[2] as NumberCode;
        genders.add(gender);
        numbers.add(number);
        genderNumberCombos.add(`${gender}${number}`);
      }
    });
  });

  return {
    tokens,
    normalizedSegments,
    persons,
    genders,
    numbers,
    genderNumberCombos,
  };
};

const Syntax = () => {
  const { ctxPassageProps } = useContext(FormatContext);
  const [openSection, setOpenSection] = useState<SyntaxType | null>(SyntaxType.partsOfSpeech);

  const allWords = useMemo(() => flattenWords(ctxPassageProps), [ctxPassageProps]);

  const labelWordMap = useMemo(() => {
    const map = new Map<string, WordProps[]>();
    allLabelDefinitions.forEach((definition) => {
      map.set(definition.id, []);
    });

    allWords.forEach((word) => {
      const features = buildMorphFeatures(word.morphology);
      if (!features) {
        return;
      }

      allLabelDefinitions.forEach((definition) => {
        if (definition.predicate(features)) {
          map.get(definition.id)?.push(word);
        }
      });
    });

    return map;
  }, [allWords]);

  const toggleSection = (section: SyntaxType) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        {syntaxSections.map((section) => {
          const isOpen = openSection === section.type;
          const sectionGroups =
            section.labels?.map((label) => ({
              label: label.label,
              words: labelWordMap.get(label.id) || [],
              palette: label.palette,
            })) ?? [];

          return (
            <div
              key={section.id}
              className="mx-4 border-b border-stroke dark:border-strokedark"
            >
              <button
                type="button"
                className="ClickBlock flex w-full items-center gap-2 py-4 px-2 text-left text-sm font-medium md:text-base"
                onClick={() => toggleSection(section.type)}
              >
                <AccordionToggleIcon isOpen={isOpen} />
                <span className={isOpen ? "text-primary" : "text-black dark:text-white"}>
                  {section.title}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-4 p-4">
                  {section.subSections ? (
                    section.subSections.map((subSection) => (
                      <div key={subSection.id}>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          {subSection.title}
                        </h3>
                        <div className="flex flex-wrap">
                          {subSection.labels.map((label) => (
                            <SyntaxLabel
                              key={label.id}
                              label={label.label}
                              words={labelWordMap.get(label.id) || []}
                              palette={label.palette}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex flex-wrap">
                        {section.labels?.map((label) => (
                          <SyntaxLabel
                            key={label.id}
                            label={label.label}
                            words={labelWordMap.get(label.id) || []}
                            palette={label.palette}
                          />
                        ))}
                      </div>
                      {section.highlightable && (
                        <div className="flex justify-center pt-2">
                          <SyntaxSmartHighlight groups={sectionGroups} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Syntax;
