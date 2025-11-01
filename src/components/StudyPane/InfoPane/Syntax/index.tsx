import React, { useContext, useMemo, useRef, useState } from "react";

import { ColorData, PassageProps, StudyMetadata, WordProps } from "@/lib/data";
import { updateMetadataInDb } from "@/lib/actions";
import { SyntaxType } from "@/lib/types";

import { FormatContext } from "../..";
import AccordionToggleIcon from "../common/AccordionToggleIcon";
import SyntaxLabel, { LabelPalette } from "./SyntaxLabel";
import SyntaxSmartHighlight, { SmartHighlightGroup } from "./SmartHighlight";

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
  highlightable?: boolean;
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
  "pos-verb": { fill: "#F79AC2", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-noun": { fill: "#7FC6F5", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-adjective": { fill: "#CDE7AE", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-negative-particle": { fill: "#B80F3A", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" },
  "pos-adverb": { fill: "#D42E86", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" },
  "pos-object-marker": { fill: "#1831d6ff", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" },
  "pos-pronoun": { fill: "#77D9D9", border: DEFAULT_BORDER_COLOR, text: "#0C4A4A" },
  "pos-preposition": { border: "#3A9320", text: DEFAULT_TEXT_COLOR },
  "pos-interjection": { fill: "#FBEA8C", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-interrogative": { fill: "#F7C06F", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-conjunction": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
  "pos-proper-noun": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR },
};

const verbConjugationPalette: Record<string, LabelPalette> = {
  "vc-perfect": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: "#C13A7B" },
  "vc-imperfect": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: "#2034ebff" },
  "vc-participle": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: "#5CB46F" },
  "vc-infinitive": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: "#a257e9ff" },
  "vc-imperative": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: "#D88E2E" },
  "vc-cohortative": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: "#C06B25" },
  "vc-jussive": { fill: DEFAULT_FILL_COLOR, border: DEFAULT_BORDER_COLOR, text: "#C06B25" },
};

const verbalStemPalette: Record<string, LabelPalette> = {
  "vs-qal": { fill: "#F4A7C6", border: "#CC6A8C", text: DEFAULT_TEXT_COLOR },
  "vs-niphal": { fill: "#C0286A", border: "#A41F59", text: "#FFFFFF" },
  "vs-piel": { fill: "#E0619B", border: "#B64C7B", text: DEFAULT_TEXT_COLOR },
  "vs-pual": { fill: "#4A63C6", border: "#3548A0", text: "#FFFFFF" },
  "vs-hifil": { fill: "#8CCB5E", border: "#679943", text: DEFAULT_TEXT_COLOR },
  "vs-hofal": { fill: "#5FA36B", border: "#437950", text: "#FFFFFF" },
  "vs-hitpael": { fill: "#3C9C4C", border: "#2E7539", text: "#FFFFFF" },
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
    highlightable: true,
  },
  {
    id: "pos-noun",
    label: "Noun",
    palette: partsOfSpeechPalette["pos-noun"],
    predicate: (features) => features.tokens.has("N"),
    highlightable: true,
  },
  {
    id: "pos-adjective",
    label: "Adjective",
    palette: partsOfSpeechPalette["pos-adjective"],
    predicate: (features) => features.tokens.has("ADJ"),
    highlightable: true,
  },
  {
    id: "pos-negative-particle",
    label: "Negative Particle",
    palette: partsOfSpeechPalette["pos-negative-particle"],
    predicate: (features) =>
      features.tokens.has("ADV") &&
      features.tokens.has("NEGPRT") &&
      features.normalizedSegments.some((segment) => segment === "ADV-NEGPRT"),
    highlightable: true,
  },
  {
    id: "pos-adverb",
    label: "Adverb",
    palette: partsOfSpeechPalette["pos-adverb"],
    predicate: (features) =>
      features.tokens.has("ADV") &&
      !features.normalizedSegments.some((segment) => segment === "ADV-NEGPRT"),
    highlightable: true,
  },
  {
    id: "pos-object-marker",
    label: "Object Marker",
    palette: partsOfSpeechPalette["pos-object-marker"],
    predicate: (features) => features.tokens.has("DIROBM"),
    highlightable: true,
  },
  {
    id: "pos-pronoun",
    label: "Pronoun",
    palette: partsOfSpeechPalette["pos-pronoun"],
    predicate: (features) =>
      ["PRO", "PRON", "PRONOUN", "PRONOMINAL"].some((token) =>
        features.tokens.has(token),
      ),
    highlightable: true,
  },
  {
    id: "pos-preposition",
    label: "Preposition",
    palette: partsOfSpeechPalette["pos-preposition"],
    predicate: (features) => features.tokens.has("PREP"),
    highlightable: true,
  },
  {
    id: "pos-interjection",
    label: "Interjection",
    palette: partsOfSpeechPalette["pos-interjection"],
    predicate: (features) =>
      features.tokens.has("INTERJECTION") || features.tokens.has("INTERJ"),
    highlightable: true,
  },
  {
    id: "pos-interrogative",
    label: "Interrogative",
    palette: partsOfSpeechPalette["pos-interrogative"],
    predicate: (features) =>
      features.tokens.has("INTERROG") || features.tokens.has("INTERROGATIVE"),
    highlightable: true,
  },
  {
    id: "pos-conjunction",
    label: "Conjunction",
    palette: partsOfSpeechPalette["pos-conjunction"],
    predicate: (features) =>
      features.tokens.has("CONJ") || features.tokens.has("CONSEC"),
    highlightable: false,
  },
  {
    id: "pos-proper-noun",
    label: "Proper Noun",
    palette: partsOfSpeechPalette["pos-proper-noun"],
    predicate: (features) => features.tokens.has("PROPER"),
    highlightable: false,
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
    highlightable: true,
  },
  {
    id: "verbal-stems",
    type: SyntaxType.verbalStems,
    title: "Verbal Stems",
    labels: verbalStemLabels,
    highlightable: true,
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
  const {
    ctxPassageProps,
    ctxStudyMetadata,
    ctxSetStudyMetadata,
    ctxStudyId,
    ctxWordsColorMap,
    ctxSetWordsColorMap,
    ctxAddToHistory,
  } = useContext(FormatContext);

  const [openSection, setOpenSection] = useState<SyntaxType | null>(SyntaxType.partsOfSpeech);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const highlightCacheRef = useRef<Map<string, Map<number, ColorData | undefined>>>(new Map());

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

  const restoreHighlight = (
    highlightId: string,
    metadata: StudyMetadata,
    colorMap: Map<number, ColorData>,
  ) => {
    const originalColors = highlightCacheRef.current.get(highlightId);
    if (!originalColors) {
      return;
    }

    originalColors.forEach((color, wordId) => {
      const existingMetadata = metadata.words[wordId]
        ? { ...metadata.words[wordId] }
        : {};

      if (color && Object.keys(color).length > 0) {
        existingMetadata.color = { ...color };
        metadata.words[wordId] = existingMetadata;
        colorMap.set(wordId, { ...color });
      } else {
        delete existingMetadata.color;
        if (Object.keys(existingMetadata).length === 0) {
          delete metadata.words[wordId];
        } else {
          metadata.words[wordId] = existingMetadata;
        }
        colorMap.delete(wordId);
      }
    });

    highlightCacheRef.current.delete(highlightId);
  };

  const applyHighlightToMetadata = (
    highlightId: string,
    groups: SmartHighlightGroup[],
    metadata: StudyMetadata,
    colorMap: Map<number, ColorData>,
  ): boolean => {
    const originalColors = new Map<number, ColorData | undefined>();

    groups.forEach((group) => {
      const palette = group.palette;
      if (!palette) {
        return;
      }

      group.words.forEach((word) => {
        const wordId = word.wordId;
        const existingMetadata = metadata.words[wordId]
          ? { ...metadata.words[wordId] }
          : {};
        const existingColor = existingMetadata.color
          ? { ...existingMetadata.color }
          : undefined;

        if (!originalColors.has(wordId)) {
          originalColors.set(wordId, existingColor);
        }

        const updatedColor: ColorData = { ...(existingColor ?? {}) };

        if (palette.fill !== undefined) {
          updatedColor.fill = palette.fill;
        }
        if (palette.border !== undefined) {
          updatedColor.border = palette.border;
        }
        if (palette.text !== undefined) {
          updatedColor.text = palette.text;
        }

        if (Object.keys(updatedColor).length > 0) {
          existingMetadata.color = updatedColor;
          metadata.words[wordId] = existingMetadata;
          colorMap.set(wordId, { ...updatedColor, source: "syntax" });
        } else {
          delete existingMetadata.color;
          if (Object.keys(existingMetadata).length === 0) {
            delete metadata.words[wordId];
          } else {
            metadata.words[wordId] = existingMetadata;
          }
          colorMap.delete(wordId);
        }
      });
    });

    if (originalColors.size > 0) {
      highlightCacheRef.current.set(highlightId, originalColors);
      return true;
    }

    return false;
  };

  const commitHighlightState = (
    metadata: StudyMetadata,
    colorMap: Map<number, ColorData>,
    newActive: string | null,
  ) => {
    setActiveHighlight(newActive);
    ctxSetWordsColorMap(new Map(colorMap));
    ctxSetStudyMetadata(metadata);
    ctxAddToHistory(metadata);
    updateMetadataInDb(ctxStudyId, metadata);
  };

  const handleHighlightToggle = (highlightId: string, groups: SmartHighlightGroup[]) => {
    const metadataClone: StudyMetadata = structuredClone(ctxStudyMetadata);
    metadataClone.words ??= {};
    const colorMapClone = new Map<number, ColorData>(ctxWordsColorMap);

    if (activeHighlight) {
      restoreHighlight(activeHighlight, metadataClone, colorMapClone);
    }

    if (activeHighlight === highlightId) {
      commitHighlightState(metadataClone, colorMapClone, null);
      return;
    }

    const applied = applyHighlightToMetadata(
      highlightId,
      groups,
      metadataClone,
      colorMapClone,
    );

    if (!applied) {
      commitHighlightState(metadataClone, colorMapClone, null);
      return;
    }

    commitHighlightState(metadataClone, colorMapClone, highlightId);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        {syntaxSections.map((section) => {
          const isOpen = openSection === section.type;
          const sectionGroups =
            section.labels
              ?.filter((label) => label.highlightable !== false)
              .map((label) => ({
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
                          {subSection.labels.map((label) => {
                            const words = labelWordMap.get(label.id) || [];
                            const palette = label.palette;
                            const highlightId = `${section.id}__${label.id}`;
                            const canHighlight = words.length > 0 && !!palette;
                            const toggleHighlight =
                              canHighlight && palette
                                ? () =>
                                    handleHighlightToggle(highlightId, [
                                      {
                                        label: label.label,
                                        words,
                                        palette,
                                      },
                                    ])
                                : undefined;

                            return (
                              <SyntaxLabel
                                key={label.id}
                                label={label.label}
                                wordCount={words.length}
                                palette={palette}
                                isActive={activeHighlight === highlightId}
                                onToggleHighlight={toggleHighlight}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex flex-wrap">
                        {section.labels?.map((label) => {
                          const words = labelWordMap.get(label.id) || [];
                          const palette = label.palette;
                          const highlightId = `${section.id}__${label.id}`;
                          const canHighlight = words.length > 0 && !!palette;
                          const toggleHighlight =
                            canHighlight && palette
                              ? () =>
                                  handleHighlightToggle(highlightId, [
                                    {
                                      label: label.label,
                                      words,
                                      palette,
                                    },
                                  ])
                              : undefined;

                          return (
                            <SyntaxLabel
                              key={label.id}
                              label={label.label}
                              wordCount={words.length}
                              palette={palette}
                              isActive={activeHighlight === highlightId}
                              onToggleHighlight={toggleHighlight}
                            />
                          );
                        })}
                      </div>
                      {section.highlightable && (
                        <div className="flex justify-center pt-2">
                          <SyntaxSmartHighlight
                            highlightId={section.id}
                            groups={sectionGroups}
                            activeHighlightId={activeHighlight}
                            onToggle={handleHighlightToggle}
                          />
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
