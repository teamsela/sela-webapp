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
