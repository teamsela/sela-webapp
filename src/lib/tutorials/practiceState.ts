import type { StudyMetadata } from "@/lib/data";
import type { InfoPaneActionType } from "@/lib/types";

/*
  Everything the tutorial needs to put the study screen back the way it was
  at the start of a step: the study's metadata (words, structure, colors,
  layers, language, box style), the notes, and two pieces of screen state.
  Plain JSON, so it can be kept in localStorage.
*/
export type PracticeState = {
  metadata: StudyMetadata;
  notes: string;
  notesOn: boolean;
  infoPaneAction: InfoPaneActionType;
};

export type PracticeControls = {
  capture: () => PracticeState;
  restore: (state: PracticeState) => void;
};
