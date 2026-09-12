import { PassageProps, WordProps } from "@/lib/data";

export const flattenPassageWords = (passageProps?: PassageProps): WordProps[] =>
  passageProps?.stanzaProps.flatMap((stanza) =>
    stanza.strophes.flatMap((strophe) =>
      strophe.lines.flatMap((line) => line.words),
    ),
  ) ?? [];
