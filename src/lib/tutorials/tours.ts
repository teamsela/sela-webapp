import { INTERFACE_TOUR } from "./interfaceTour";
import { ORIENTATION_TOUR } from "./orientationTour";
import type { TourDefinition } from "./tour";

/*
  Which guided tour a tutorial study runs, chosen by its passage. Each
  tutorial is a different passage (see scripts/create-interface-tutorial.mts),
  so the passage is enough to tell them apart without another column.
*/
export const tourForStudy = (study: { book?: string; passage?: string }): TourDefinition => {
  const book = (study.book ?? "").trim().toLowerCase();
  const passage = (study.passage ?? "").trim();
  if (book === "psalms" && passage === "1") return ORIENTATION_TOUR;
  return INTERFACE_TOUR;
};
