# Person, Gender, Number

[Implementation specification](syntax-person-gender-number-spec.pdf): the unmodified
seven pages 121-127 extracted from **Sela Mockup - 2026 (1).pdf**. Page 123 supplies the
information dialog, page 125 the matching/display requirements, and page 126 the
Smart Highlight rules. Page 127 adds the September 15 refinements and supersedes
the earlier appearance/highlighting rules for zero-match chips. Pages 121-126 are
text- and pixel-identical to the previous PDF.

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
The colors apply equally to matching chips and passage word boxes. Zero-match
chips remain white and use the existing Syntax disabled treatment (`opacity-60`),
including while Smart Highlight is active and after a saved study is reopened.

Page 127 replaces the earlier rounded, thin outline with the standard Syntax
chip design: **2px #D9D9D9** borders and **4px** corners. Counter backgrounds
retain page 124's **#EFEFEF** fill. Page 124's rendered `3fs`/`3fp` text is #595959, whereas
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

Chips follow this row-major order in two columns. Reduced horizontal padding,
compact counters, and a smaller grid minimum retain both columns in 320px and
360px sidebars; very narrow panes fall back to one column rather than wrapping or
clipping the gloss. Codes remain larger and bold. All ten chips and their counters
remain visible, with unavailable zero-count chips lighter and uncolored.

## Interaction and regression contract

- Clicking chips stages their matching words using the existing shared selection.
  Overlapping matches are deduplicated; deselecting one chip retains words still
  selected by another chip.
- Smart Highlight colors the selected chips and the union of their words. With no
  selected chips it colors all available chips and all matching words, leaving
  zero-count chips muted and uncolored as page 127 requires. For ambiguous
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
- PGN and both Sounds distributions reuse `common/InfoButton.tsx`: the same blue
  18px Material info icon as Structure/Pausal Forms, immediately after the heading.
  It is a separate native button, so opening an explanation does not toggle the
  accordion and is keyboard-accessible. Sounds' highlighting behavior is unchanged.

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
| 4. Keep each gloss on one line | Use `whitespace-nowrap` and a compact two-column grid; only very narrow panes fall back to one column. | Assert the no-wrap class; browser checks two columns at 320px/360px and no overflow at smaller widths. |
| 5. Make codes larger and bold | Render codes with `text-lg font-bold`, above the smaller gloss font size. | Assert typography classes; browser compares computed font size and weight. |
| 6. Provide exactly the ten listed chips | Define a typed ten-entry preset list in the mockup's row-major order. | Compare the complete literal list, order, labels, fills, and fonts. |
| 7. Count both matches on ambiguous verbs | Retain unique codes in source order; a word can belong to both chip groups. | The PDF's `1cs \| 2ms` example counts in both; overlapping selections never duplicate a word. |
| 8. Include occurrence counters | Display the number of matching words per code, including zero; repeated codes within one word count once. | Assert every counter and stable counts before/after highlight/clear; compare real Psalm 23 counts in the browser. |
| 9. Add the info popup and supplied copy | Include the full page 123 Overview, Legend, and subject/object Disclaimer in an accessible modal. | Assert the complete text and open/close behavior; browser checks Escape, backdrop dismissal, and modal focus isolation. |

### Page 126: Smart Highlighter

| Rule | Implementation | Verification |
| --- | --- | --- |
| 1. Use the supplied hex table | Apply exact fill/font presets to matching chips/words without swatch clamping; page 127 excludes zero-match chips. | Assert all ten literal matching-chip, rendered-word, and persisted palettes; separately assert zero chips remain white/muted. |
| 2. Color ambiguous verbs by their first code | Partition words by the first exact code before creating highlight groups. Thus `1cs \| 2ms` is yellow `#FFF9C4`; subject colors take precedence over following object suffixes. | Test both code orders, subject-plus-suffix examples, and a selected secondary chip whose word must still use the first code's color. |
| 3. Highlight selected chips and their words only | Build the union of selected chip matches, color each selected chip with its preset, and color its words by their primary code. | Test each individual code, multiple overlapping chips, unrelated pre-selected words, mouse-up selection preservation, and tab/reload scope retention. |
| 4. With no selected chips, highlight all | Use all ten codes as the scope and color all matching passage words; per page 127, color only chips that have matches. | Assert every available chip and matched word, with zero chips/unmatched words uncolored; empty/missing-morphology passages safely disable the action. |
| 5. Change Smart Highlight to Clear Highlight | Reuse the existing Syntax button/highlight manager; Clear removes the active highlight and permits reapplication. | Test label/state changes, mouse and keyboard activation, deterministic clear/reapply, changed selections, reload, and undo/redo. |

### Page 127: Refinements

| Rule | Implementation mapping | Proof |
| --- | --- | --- |
| 127.1. Make zero-match chips lighter gray | `Syntax/SyntaxLabel.tsx` applies the existing Syntax `opacity-60` treatment when the count is zero, without fading valid highlighted chips in read-only studies. | Acceptance tests check zero-chip appearance before/after highlighting and undo/redo, plus read-only isolation. Browser checks computed opacity against a zero-count Verbal Stem chip. |
| 127.2. Leave zero-match chips uncolored during highlighting | `Syntax/PersonGenderNumber.tsx` never supplies a palette for an empty match group, even if an older saved all-chip scope includes that code. | Tests assert white fill before/apply/clear, JSON reload, and history restoration; browser checks actual zero chips remain white while available chips retain exact presets. |
| 127.3. Match existing chip styling and retain two columns in a narrower sidebar | `Syntax/SyntaxLabel.tsx` reuses the standard 2px border/4px corner style and reduces horizontal padding/counter size; `PersonGenderNumber.tsx` lowers the grid minimum to 8.25rem and caps it at two columns. | DOM assertions cover border/corner styles. Browser measurements compare the existing Syntax chip and verify two columns at 320px/360px, single-line glosses, and no clipping. |
| 127.4. Match the adjacent blue PGN info-button design | `common/InfoButton.tsx` uses the same `MdInfoOutline` icon, 18px size, and primary blue as Structure/Pausal Forms; PGN's heading no longer pushes it to the far edge. | Tests assert native button, icon dimensions, blue class, sibling position, and no accordion toggle. Browser compares its SVG, computed color, and heading gap with the reference. |
| 127.5. Match the Sounds info buttons too | Both distribution headers in `Sounds.tsx` reuse that same shared button; existing popup content and highlighting logic are retained. | Parameterized Sounds tests cover both icons, keyboard opening/Escape, and unchanged accordion state. Browser compares both icons with the Structure reference. |
