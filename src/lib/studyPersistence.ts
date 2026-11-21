/*
  Client-side gate in front of the study write actions.

  The study screen's components save through these wrappers instead of calling
  the server actions directly. In practice mode (a non-owner trying out a
  tutorial study) every save is skipped, so the visitor can use every tool
  while the tutorial itself is never touched. StudyPane sets the mode (lib/practiceMode)
  while it renders, before any child component can save.

  The server actions still check ownership; this gate just avoids sending
  writes that would be refused anyway.
*/
import {
  updateMetadataInDb as saveMetadata,
  updateStudyName as saveStudyName,
} from "@/lib/actions";

import { isPracticeMode } from "@/lib/practiceMode";

export { isPracticeMode, setPracticeMode } from "@/lib/practiceMode";

export const updateMetadataInDb = async (
  ...args: Parameters<typeof saveMetadata>
): Promise<Awaited<ReturnType<typeof saveMetadata>>> => {
  if (isPracticeMode()) return undefined;
  return saveMetadata(...args);
};

export const updateStudyName = async (
  ...args: Parameters<typeof saveStudyName>
): Promise<Awaited<ReturnType<typeof saveStudyName>>> => {
  if (isPracticeMode()) return undefined;
  return saveStudyName(...args);
};
