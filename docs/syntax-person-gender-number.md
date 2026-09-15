# Person, Gender, Number

[Implementation specification](syntax-person-gender-number-spec.pdf): the unmodified
six pages 121-126 extracted from **Sela Mockup - 2026.pdf**. Page 123 supplies the
information dialog, page 125 the matching/display requirements, and page 126 the
Smart Highlight rules.

## Data and matching

The revised section replaces the separate Person, Gender, and Number chips.
It uses the existing passage `word.morphology` data path: the application's
`hebBible.morphology` mapping (`heb_bible_test`, the current equivalent of the
mockup's Xata `Heb_Bible` table). No additional database request or migration is
needed. The existing passage loader's StepBible fallback is unchanged.

Only complete morphology tokens in the ten-code list match; a noun's `ms` alone,
partial matches, or unsupported combinations do not. Each word contributes once
to each matching chip. `V-Piel-Imperf.h-1cs | 2ms` counts in both chips, but its
word box uses the first code's yellow. A subject followed by a pronominal object
suffix likewise uses the subject's color.

## Exact palette

The filled shapes embedded in source page 124 were read directly from the PDF and
matched against page 126's hex table. These presets deliberately bypass user-swatch
clamping: the specified gray font is **#666666**, not the app's default #525252.
The colors apply equally to chips and passage word boxes.

The chip outlines use page 124's embedded **#B7B7B7** stroke, and counters retain
its **#EFEFEF** fill. Page 124's rendered `3fs`/`3fp` text is #595959, whereas
page 126 explicitly specifies #666666 for both. The implementation follows the
explicit page 126 font table for those two chips, rather than mixing the grays.

| Code | Gloss | Fill | Font |
| --- | --- | --- | --- |
| 3ms | He Him His | #BBDEFB | #666666 |
| 3mp | They Them Their | #F8BBD0 | #666666 |
| 2ms | You Your | #3F51B5 | #FFFFFF |
| 2mp | You Your | #E91E63 | #FFFFFF |
| 1cs | I Me My | #FFF9C4 | #666666 |
| 1cp | We Us Our | #FFD54F | #666666 |
| 2fs | You Your (f) | #9C27B0 | #FFFFFF |
| 2fp | You Your (f) | #607D8B | #FFFFFF |
| 3fs | She Her Her | #E1BEE7 | #666666 |
| 3fp | They Them Their (f) | #CFD8DC | #666666 |

Chips follow this row-major order in two columns, falling back to one column when
the pane is narrow rather than wrapping the gloss. Codes are larger and bold.
All ten chips and their counters remain visible, including disabled zero counts.

## Interaction and regression contract

- Clicking chips stages their matching words using the existing shared selection.
  Overlapping matches are deduplicated; deselecting one chip retains words still
  selected by another chip.
- Smart Highlight colors the selected chips and the union of their words. With no
  selected chips it colors all ten chips and all matching words. For ambiguous
  verbs, the word always uses its first code even if only the second chip was
  selected; the selected chip retains its own preset.
- The button becomes Clear Highlight while active. Highlighting uses the existing
  history, metadata persistence, and cross-tool clearing behavior. The chip scope
  is part of the highlight ID so undo/redo restores the correct chip colors, and
  is saved per layer in the existing JSON metadata. Reloading restores the explicit
  scope rather than incorrectly inferring it from an ambiguous verb's color.
- Like the existing Syntax tools, applying highlights retains the selection.
  Selecting additional chips while a highlight is active does not recolor words
  immediately or change the button back to Smart Highlight: clear the current
  highlight, then apply the updated selection. This intentionally does not adopt
  Sounds/Letters' additive highlighting interaction.
- Staged chip selection lives in the shared study context, so switching tool tabs
  does not silently broaden the scope. The Smart Highlight button uses the same
  `ClickBlock` marker as other selection-preserving controls.
- The existing custom-color preservation feature flag is unchanged. Non-color
  metadata and the other Syntax sections are preserved. View-only studies cannot
  select or highlight these chips.
- The info dialog includes the complete Overview, Legend, and Disclaimer from
  page 123. Its native modal behavior supports keyboard focus containment,
  Escape, a close button, and backdrop dismissal.

## Automated checks

`npm test` includes the literal palette/exact-token unit tests and the Syntax
acceptance/regression suite, alongside all existing feature tests. The acceptance
suite exercises the real highlighter, rendered passage word boxes, and metadata
updates with only server/browser boundaries mocked.

The `Tests` GitHub Actions workflow runs the full suite, TypeScript, and lint on
every pull request. Vercel's existing Git integration builds the PR preview;
preview deployment does not require merging into `main`.

## PDF requirement checklist

Each row is covered by `src/lib/personGenderNumber.test.ts` and/or
`src/components/StudyPane/InfoPane/Syntax/Syntax.acceptance.test.tsx`, except where
the verification explicitly calls for the real browser or existing data loader.

### Page 125: Notes

| Note | Implementation | Verification |
| --- | --- | --- |
| 1. Replace the previous version | Remove the separate person/gender/number groups; render the revised section in the existing Syntax accordion. | Assert exactly ten chips and absence of the old groups; regression tests retain all other Syntax sections. |
| 2. Use the existing Hebrew Bible morphology data | Read passage `word.morphology` from the existing `hebBible.morphology` query; preserve the loader and its existing fallback. | Trace `src/schema.ts` and `src/lib/actions.ts`; conflicting gloss/word-information codes do not affect chip counts. Browser counts are checked against actual passage morphology. |
| 3. Match complete codes only | Tokenize morphology and look up only complete supported codes, never prefixes or fragments. | Positive/negative cases for every code, including `3msX`, `X3ms`, `3msp`, missing data, and unsupported combinations. |
| 4. Keep each gloss on one line | Use `whitespace-nowrap` and a responsive two-column grid that becomes one column in a narrow pane. | Assert the no-wrap class; browser checks computed layout and overflow at wide/narrow widths. |
| 5. Make codes larger and bold | Render codes with `text-lg font-bold`, above the smaller gloss font size. | Assert typography classes; browser compares computed font size and weight. |
| 6. Provide exactly the ten listed chips | Define a typed ten-entry preset list in the mockup's row-major order. | Compare the complete literal list, order, labels, fills, and fonts. |
| 7. Count both matches on ambiguous verbs | Retain unique codes in source order; a word can belong to both chip groups. | The PDF's `1cs | 2ms` example counts in both; overlapping selections never duplicate a word. |
| 8. Include occurrence counters | Display the number of matching words per code, including zero; repeated codes within one word count once. | Assert every counter and stable counts before/after highlight/clear; compare real Psalm 23 counts in the browser. |
| 9. Add the info popup and supplied copy | Include the full page 123 Overview, Legend, and subject/object Disclaimer in an accessible modal. | Assert the complete text and open/close behavior; browser checks Escape, backdrop dismissal, and modal focus isolation. |

### Page 126: Smart Highlighter

| Rule | Implementation | Verification |
| --- | --- | --- |
| 1. Use the supplied hex table | Apply the exact fill/font presets without swatch clamping; see the palette and documented page 124/126 gray discrepancy above. | Assert all ten literal chip, rendered-word, and persisted palettes; browser checks computed colors, including zero-count chips. |
| 2. Color ambiguous verbs by their first code | Partition words by the first exact code before creating highlight groups. Thus `1cs | 2ms` is yellow `#FFF9C4`; subject colors take precedence over following object suffixes. | Test both code orders, subject-plus-suffix examples, and a selected secondary chip whose word must still use the first code's color. |
| 3. Highlight selected chips and their words only | Build the union of selected chip matches, color each selected chip with its preset, and color its words by their primary code. | Test each individual code, multiple overlapping chips, unrelated pre-selected words, mouse-up selection preservation, and tab/reload scope retention. |
| 4. With no selected chips, highlight all | Use all ten codes as the scope and color all matching passage words. | Assert all chip presets and every matched word, with unmatched words unchanged; empty/missing-morphology passages safely disable the action. |
| 5. Change Smart Highlight to Clear Highlight | Reuse the existing Syntax button/highlight manager; Clear removes the active highlight and permits reapplication. | Test label/state changes, mouse and keyboard activation, deterministic clear/reapply, changed selections, reload, and undo/redo. |
