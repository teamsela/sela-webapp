import { createContext } from "react";

// Cross-column layout coordination for parallel/counter display. The two
// language columns and the counter column are independent DOM subtrees (three
// separate <PassageBlock/> renders in Passage), so nothing intrinsically keeps a
// strophe row aligned across them. A strophe-note title is the thing that breaks
// alignment: it can wrap to a different number of lines per column, and the
// counter column reserves title space with a placeholder that assumes one line.
//
// Two mechanisms fix this:
//   1. Passage measures each language column's natural width and applies the max
//      as a min-width to both, so a title wraps identically in each (handled with
//      refs/props, not this context).
//   2. The language StropheBlock reports its measured title height here, keyed by
//      stropheId; the counter column reads it back and reserves exactly that
//      height instead of a single placeholder line.
//
// Lives in its own module (not Passage/index) so StropheBlock and
// CounterStropheBlock can import it without a circular dependency.
export type StropheAlignContextValue = {
  titleHeights: Record<number, number>;
  reportTitleHeight: (stropheId: number, height: number) => void;
};

export const StropheAlignContext = createContext<StropheAlignContextValue | null>(null);
