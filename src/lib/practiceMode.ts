/*
  Whether the study screen is in practice mode (a non-owner trying out a
  tutorial study, where nothing is saved). Kept in its own dependency-free
  module so components can check it without importing the server actions.
  StudyPane sets it while rendering, before any child component can save.
*/
let practiceMode = false;

export const setPracticeMode = (on: boolean): void => {
  practiceMode = on;
};

export const isPracticeMode = (): boolean => practiceMode;
