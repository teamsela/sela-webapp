import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_BORDER_COLOR, DEFAULT_COLOR_FILL, DEFAULT_TEXT_COLOR, clampPaletteToUserColors } from "@/lib/colors";
import { PassageProps, WordProps } from "@/lib/data";
import { SyntaxType } from "@/lib/types";

import { FormatContext } from "../..";
import AccordionToggleIcon from "../common/AccordionToggleIcon";
import SyntaxLabel, { LabelPalette } from "./SyntaxLabel";
import SyntaxSmartHighlight from "./SmartHighlight";
import { HighlightGroup, useHighlightManager } from "../useHighlightManager";
import { PRESERVE_CUSTOM_COLORS_ON_SMART_HIGHLIGHT } from "@/lib/featureFlags";

type PersonCode = "1" | "2" | "3";
type GenderCode = "M" | "F" | "C";
type NumberCode = "S" | "D" | "P";

export type MorphFeatures = {
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

const toUserPalette = (palette: LabelPalette): LabelPalette =>
  clampPaletteToUserColors(palette);

const partsOfSpeechPalette: Record<string, LabelPalette> = {
  "pos-verb": toUserPalette({ fill: "#F79AC2", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR }),
  "pos-noun": toUserPalette({ fill: "#7FC6F5", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR }),
  "pos-adjective": toUserPalette({ fill: "#CDE7AE", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR }),
  "pos-negative-particle": toUserPalette({ fill: "#B80F3A", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" }),
  "pos-adverb": toUserPalette({ fill: "#D42E86", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" }),
  "pos-object-marker": toUserPalette({ fill: "#0F1B4C", border: "#070C26", text: "#FFFFFF" }),
  "pos-pronoun": toUserPalette({ fill: "#77D9D9", border: DEFAULT_BORDER_COLOR, text: "#000000" }),
  "pos-preposition": toUserPalette({ border: "#000000", text: DEFAULT_TEXT_COLOR }),
  "pos-interjection": toUserPalette({ fill: "#FBEA8C", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR }),
  "pos-interrogative": toUserPalette({ fill: "#F7C06F", border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR }),
  "pos-conjunction": toUserPalette({ fill: DEFAULT_COLOR_FILL, border: DEFAULT_BORDER_COLOR, text: DEFAULT_TEXT_COLOR }),
  "pos-proper-noun": toUserPalette({ fill: "#1D3BEC", border: "#0D1B76", text: "#FFFFFF" }),
};

const verbConjugationPalette: Record<string, LabelPalette> = {
  "vc-perfect": toUserPalette({ fill: "#F0588A", border: "#D43C72", text: "#FFFFFF" }),
  "vc-imperfect": toUserPalette({ fill: "#4C75FF", border: "#2F52D4", text: "#FFFFFF" }),
  "vc-participle": toUserPalette({ fill: "#42C073", border: "#2A9154", text: "#FFFFFF" }),
  "vc-infinitive": toUserPalette({ fill: "#905DF6", border: "#6F3BCB", text: "#FFFFFF" }),
  "vc-imperative": toUserPalette({ fill: "#FFF176", border: "#FBC02D", text: "#000000" }),
  "vc-cohortative": toUserPalette({ fill: "#FFF176", border: "#FBC02D", text: "#000000" }),
  "vc-jussive": toUserPalette({ fill: "#FFF176", border: "#FBC02D", text: "#000000" }),
};

const verbalStemPalette: Record<string, LabelPalette> = {
  "vs-qal": toUserPalette({ fill: "#F8BBD0", border: DEFAULT_BORDER_COLOR, text: "#000000" }),
  "vs-niphal": toUserPalette({ fill: "#E91E63", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" }),
  "vs-piel": toUserPalette({ fill: "#B3E5FC", border: DEFAULT_BORDER_COLOR, text: "#000000" }),
  "vs-pual": toUserPalette({ fill: "#03A9F4", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" }),
  "vs-hifil": toUserPalette({ fill: "#DCEDC8", border: DEFAULT_BORDER_COLOR, text: "#000000" }),
  "vs-hofal": toUserPalette({ fill: "#4CAF50", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" }),
  "vs-hitpael": toUserPalette({ fill: "#388E3C", border: DEFAULT_BORDER_COLOR, text: "#FFFFFF" }),
};

const personPalette: Record<string, LabelPalette> = {
  "pgn-person-1": toUserPalette({ fill: "#E0F2FE", border: "#42A5F5", text: "#0D47A1" }),
  "pgn-person-2": toUserPalette({ fill: "#E8F5E9", border: "#66BB6A", text: "#1B5E20" }),
  "pgn-person-3": toUserPalette({ fill: "#F3E5F5", border: "#BA68C8", text: "#4A148C" }),
};

const genderPalette: Record<string, LabelPalette> = {
  "pgn-gender-m": toUserPalette({ fill: "#E0F2F1", border: "#4DB6AC", text: "#004D40" }),
  "pgn-gender-f": toUserPalette({ fill: "#FCE4EC", border: "#F48FB1", text: "#880E4F" }),
  "pgn-gender-c": toUserPalette({ fill: "#FFF8E1", border: "#FFE082", text: "#8D6E63" }),
};

const numberPalette: Record<string, LabelPalette> = {
  "pgn-number-s": toUserPalette({ fill: "#F1F8E9", border: "#AED581", text: "#33691E" }),
  "pgn-number-d": toUserPalette({ fill: "#EDE7F6", border: "#9575CD", text: "#4527A0" }),
  "pgn-number-p": toUserPalette({ fill: "#E3F2FD", border: "#64B5F6", text: "#0D47A1" }),
};

const derivedMorphTokenPatterns = [
  "CONJ",
  "IMPERF",
  "IMPERFECT",
  "PERF",
  "PERFECT",
  "PART",
  "PARTICIPLE",
  "COHORT",
  "COHORTATIVE",
  "JUS",
  "JUSSIVE",
  "IMPERATIVE",
  "QAL",
  "NIPHAL",
  "PIEL",
  "PUAL",
  "HIFIL",
  "HIPHIL",
  "HOFAL",
  "HITPAEL",
  "HITHPAEL",
];

const shouldSkipDerivedPattern = (token: string, pattern: string): boolean => {
  if ((pattern === "PERF" || pattern === "PERFECT") && token.includes("IMPERF")) {
    return true;
  }
  return false;
};

const addDerivedTokens = (token: string, target: Set<string>) => {
  derivedMorphTokenPatterns.forEach((pattern) => {
    if (token.includes(pattern) && !shouldSkipDerivedPattern(token, pattern)) {
      target.add(pattern);
    }
  });
};

const isProperNoun = (features: MorphFeatures): boolean => {
  const properPatterns = [/PROPER/, /PROPN/, /^NP/, /NOUNPROP/];

  const hasProperToken = Array.from(features.tokens).some((token) =>
    properPatterns.some((pattern) => pattern.test(token)),
  );

  if (hasProperToken) {
    return true;
  }

  return features.normalizedSegments.some((segment) =>
    properPatterns.some((pattern) => pattern.test(segment)),
  );
};

const isObjectMarker = (features: MorphFeatures): boolean => {
  const hasSegmentMatch = features.normalizedSegments.some((segment) =>
    segment.includes("DIROBJ"),
  );

  if (hasSegmentMatch) {
    return true;
  }

  const patterns = [/DIROBJ/, /OBJMK/, /OBJECTMARK/];
  return Array.from(features.tokens).some((token) =>
    patterns.some((pattern) => pattern.test(token)),
  );
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
    predicate: (features) => features.tokens.has("N") && !isProperNoun(features),
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
    predicate: (features) => isObjectMarker(features),
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
    predicate: (features) => isProperNoun(features),
    highlightable: true,
  },
];

export const verbConjugationLabels: SyntaxLabelDefinition[] = [
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
    highlightable: false,
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

export const buildMorphFeatures = (morphology?: string | null): MorphFeatures | null => {
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
      .split(/[-./:\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    rawTokens.forEach((token) => {
      const camelSplit = token
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .split(/\s+/)
        .filter(Boolean);
      camelSplit.forEach((part) => {
        const upperPart = part.toUpperCase();
        tokens.add(upperPart);
        addDerivedTokens(upperPart, tokens);
      });

      const upperToken = token.toUpperCase();
      tokens.add(upperToken);
      addDerivedTokens(upperToken, tokens);

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

const deriveUniformPalette = (words: WordProps[]): LabelPalette | undefined => {
  if (!words.length) {
    return undefined;
  }

  const overrides: LabelPalette = {};
  let hasOverrides = false;

  (["fill", "border", "text"] as (keyof LabelPalette)[]).forEach((key) => {
    let uniformValue: string | undefined;
    let isUniform = true;

    for (const word of words) {
      const value = word.metadata?.color?.[key];
      if (value === undefined) {
        if (uniformValue !== undefined) {
          isUniform = false;
          break;
        }
        continue;
      }

      if (uniformValue === undefined) {
        uniformValue = value;
        continue;
      }

      if (value !== uniformValue) {
        isUniform = false;
        break;
      }
    }

    if (isUniform && uniformValue !== undefined) {
      overrides[key] = uniformValue;
      hasOverrides = true;
    }
  });

  return hasOverrides ? overrides : undefined;
};

const getLabelPalette = (
  label: SyntaxLabelDefinition,
  words: WordProps[],
  sectionId: string,
  activeHighlightId: string | null,
  customPalettes: Map<string, LabelPalette>,
): LabelPalette | undefined => {
  if (!activeHighlightId || activeHighlightId === sectionId) {
    const derived = deriveUniformPalette(words);
    if (derived) {
      return label.palette ? { ...label.palette, ...derived } : derived;
    }
  }

  const stored = customPalettes.get(label.id);
  if (stored) {
    return label.palette ? { ...label.palette, ...stored } : stored;
  }

  return label.palette;
};

const palettesEqual = (a: LabelPalette | undefined, b: LabelPalette | undefined) =>
  a?.fill === b?.fill && a?.border === b?.border && a?.text === b?.text;

const collectSectionLabels = (section: SyntaxSectionDefinition): SyntaxLabelDefinition[] =>
  section.subSections
    ? section.subSections.flatMap((sub) => sub.labels)
    : section.labels ?? [];

const Syntax = () => {
  const {
    ctxPassageProps,
    ctxSelectedWords,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxWordsColorMap,
  } = useContext(FormatContext);
  const { toggleHighlight, activeHighlightId } = useHighlightManager("syntax", {
    preserveCustomColors: PRESERVE_CUSTOM_COLORS_ON_SMART_HIGHLIGHT,
  });

  const [openSection, setOpenSection] = useState<SyntaxType | null>(SyntaxType.partsOfSpeech);
  const [labelCustomPalettes, setLabelCustomPalettes] = useState<Map<string, LabelPalette>>(new Map());
  const selectedWordIds = useMemo(() => {
    const ids = new Set<number>();
    ctxSelectedWords.forEach((word) => ids.add(word.wordId));
    return ids;
  }, [ctxSelectedWords]);

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

  const sectionLabelMap = useMemo(() => {
    const map = new Map<string, SyntaxLabelDefinition[]>();
    syntaxSections.forEach((section) => {
      map.set(section.id, collectSectionLabels(section));
    });
    return map;
  }, []);

  const updateCustomPalettes = useCallback(
    (labels: SyntaxLabelDefinition[]) => {
      if (!labels.length) {
        return;
      }
      setLabelCustomPalettes((prev) => {
        let changed = false;
        const next = new Map(prev);

        labels.forEach((label) => {
          const words = labelWordMap.get(label.id) || [];
          const overrides = deriveUniformPalette(words);

          if (overrides) {
            const existing = next.get(label.id);
            if (!palettesEqual(existing, overrides)) {
              next.set(label.id, overrides);
              changed = true;
            }
          } else if (next.has(label.id)) {
            next.delete(label.id);
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    },
    [labelWordMap],
  );

  useEffect(() => {
    void ctxWordsColorMap;
    if (!activeHighlightId) {
      updateCustomPalettes(allLabelDefinitions);
      return;
    }

    const labels = sectionLabelMap.get(activeHighlightId);
    if (labels) {
      updateCustomPalettes(labels);
    }
  }, [activeHighlightId, sectionLabelMap, updateCustomPalettes, ctxWordsColorMap]);

  const handleHighlightToggle = (highlightId: string, groups: HighlightGroup[]) => {
    toggleHighlight(
      highlightId,
      groups.filter((group) => group.words.length > 0),
    );
  };

  const handleLabelSelectionToggle = (words: WordProps[]) => {
    if (!words.length) {
      return;
    }

    const idsToToggle = new Set(words.map((word) => word.wordId));
    const allSelected = words.every((word) => selectedWordIds.has(word.wordId));
    let updatedSelection = [...ctxSelectedWords];

    if (allSelected) {
      updatedSelection = updatedSelection.filter((word) => !idsToToggle.has(word.wordId));
    } else {
      const existingIds = new Set(updatedSelection.map((word) => word.wordId));
      words.forEach((word) => {
        if (!existingIds.has(word.wordId)) {
          updatedSelection.push(word);
          existingIds.add(word.wordId);
        }
      });
    }

    ctxSetSelectedWords(updatedSelection);
    ctxSetNumSelectedWords(updatedSelection.length);
    ctxSetSelectedStrophes([]);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        {syntaxSections.map((section) => {
          const isOpen = openSection === section.type;
          const sectionHighlightLabels = collectSectionLabels(section).filter(
            (label) => label.highlightable !== false,
          );
          const sectionGroups = section.highlightable
            ? sectionHighlightLabels
                .map((label) => {
                  const words = labelWordMap.get(label.id) || [];
                  return {
                    label: label.label,
                    words,
                    palette: getLabelPalette(
                      label,
                      words,
                      section.id,
                      activeHighlightId,
                      labelCustomPalettes,
                    ),
                  };
                })
                .filter((group) => group.words.length > 0)
            : [];
          const sectionHasActiveHighlight = activeHighlightId === section.id;
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
                            const palette = getLabelPalette(
                              label,
                              words,
                              section.id,
                              activeHighlightId,
                              labelCustomPalettes,
                            );
                            const hasCustomPalette = labelCustomPalettes.has(label.id);
                            const canShowBasePalette = section.highlightable && sectionHasActiveHighlight;
                            const displayPalette =
                              hasCustomPalette || canShowBasePalette ? palette : undefined;
                            const highlightId = `${section.id}__${label.id}`;
                            const isSelected =
                              words.length > 0 && words.every((word) => selectedWordIds.has(word.wordId));

                            return (
                              <SyntaxLabel
                                key={label.id}
                                label={label.label}
                                wordCount={words.length}
                                palette={displayPalette}
                                isActive={activeHighlightId === highlightId}
                                isSelected={isSelected}
                                onToggleSelection={() => handleLabelSelectionToggle(words)}
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
                          const palette = getLabelPalette(
                            label,
                            words,
                            section.id,
                            activeHighlightId,
                            labelCustomPalettes,
                          );
                          const hasCustomPalette = labelCustomPalettes.has(label.id);
                          const canShowBasePalette = section.highlightable && sectionHasActiveHighlight;
                          const displayPalette =
                            hasCustomPalette || canShowBasePalette ? palette : undefined;
                          const highlightId = `${section.id}__${label.id}`;
                          const isSelected =
                            words.length > 0 && words.every((word) => selectedWordIds.has(word.wordId));

                          return (
                            <SyntaxLabel
                              key={label.id}
                              label={label.label}
                              wordCount={words.length}
                              palette={displayPalette}
                              isActive={activeHighlightId === highlightId}
                              isSelected={isSelected}
                              onToggleSelection={() => handleLabelSelectionToggle(words)}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                  {section.highlightable && (
                    <div className="flex justify-center pt-2">
                      <SyntaxSmartHighlight
                        highlightId={section.id}
                        groups={sectionGroups}
                        activeHighlightId={activeHighlightId}
                        onToggle={handleHighlightToggle}
                      />
                    </div>
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
