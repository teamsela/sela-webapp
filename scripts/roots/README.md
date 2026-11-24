# Hebrew root data

Builds the root map used by double-click "select all repeated words" and the Motif tool's
Identical Words panel. Output: `src/lib/roots/rootData.json` (loaded server-side by `src/lib/roots`).

## Sources (CC BY 4.0, credited in the study footer)

- [openscriptures/HebrewLexicon](https://github.com/openscriptures/HebrewLexicon): BDB lexical index
  (root structure), Strong's dictionary (name etymologies). Built from commit `21c9add`.
- [openscriptures/morphhb](https://github.com/openscriptures/morphhb): OSHB word-level augmented Strong's
  numbers, used to tell homonyms apart per word (e.g. ענה "answer" vs ענה "sing"). Built from commit `db6c5c9`.

## Rules (decided with the project owner)

- A root group means a **shared meaning**. Words with the same letters but unrelated meanings are split
  (e.g. דבר "speak" / מִדְבָּר "wilderness" / דֶּבֶר "plague"). Sound-alikes are left to rhyme tools.
- Homonyms are separate roots (no "sound-alike" mode).
- Proper names carry the roots of the words they are built from (Azariah → עזר). Divine elements
  (אֵל, יָהּ, יהוה) are ignored, and יהוה is not linked to הָיָה. Name matching is on by default (toggle).
- Function words (prepositions, conjunctions, particles, pronouns) match exactly only.
- Aramaic words join their Hebrew cognate's root, including regular sound shifts (ד=ז, ת=שׁ).

## Motif chip labels

- Root groups show BDB's root with shin/sin dots (ישׁב, שׁער "gate" vs שׂער "hair").
- Groups split off by meaning, and roots with only one word in the Bible, show that word
  (דְּבוֹרָה "bee", שָׁמַיִם "heavens") instead of root letters.
- Words without a root (particles, names) show their dictionary form (כִּי), not the inflected word.
- Homonym numerals (ענה I / עָנָה IV) appear only when two chips in the same passage share letters.
- English labels and tooltips use the STEP Bible gloss of the group's most frequent word in the
  passage ("heart"), falling back to the lexicon sense.

`decisions/` holds the reviewed decisions: `meaning_out_*.json` (meaning-based splits; borderline
cases resolved to the reviewed defaults) and `review_aramaic_out.json` (Aramaic merges).
`data/roots/root_map.csv` is the human-readable result, one row per Strong's number + homonym letter.

## Rebuild

```bash
mkdir -p /tmp/roots-src && cd /tmp/roots-src
git clone https://github.com/openscriptures/HebrewLexicon.git
git clone https://github.com/openscriptures/morphhb.git
cd -   # back to the repo root
python3 -I scripts/roots/build_rootmap.py /tmp/roots-src /tmp/rootmap_raw.csv
python3 -I scripts/roots/finalize.py /tmp/rootmap_raw.csv data/roots/root_map.csv
python3 -I scripts/roots/generate_app_data.py data/roots/root_map.csv /tmp/roots-src/morphhb src/lib/roots/rootData.json scripts/roots/decisions/heb_bible_layout.txt
```

`heb_bible` uses English (KJV) verse numbering; the generator converts OSHB's Hebrew verses using
OSHB's `KJV:` markers and, with the optional last argument, checks every book's chapter/verse
layout against `heb_bible` (snapshot in `decisions/heb_bible_layout.txt`). It should print
`layout check: all books match`.

To change a decision, edit the relevant group in `decisions/meaning_out_*.json` and rerun the last two steps.
