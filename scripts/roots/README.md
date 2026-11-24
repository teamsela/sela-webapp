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
- Proper names never join a root group; a name only matches the same name. Name etymologies
  (Strong's, often folk etymology) proved too unreliable for a primary tool; a name's components
  are visible in its dictionary entry. God's name is one group: יהוה, יָהּ and יֱהוִה ("Yahweh").
- Function words (prepositions, conjunctions, particles, pronouns) match exactly only.
- Aramaic words join their Hebrew cognate's root, including regular sound shifts (ד=ז, ת=שׁ).

## Motif chip labels

Chips show **unpointed** letters, so they name the root and its family rather than one word
(ישׁב, not יָשַׁב; shin/sin dots are kept). The pointed `label` below is shown in the tooltip
("יָשַׁב · sit"); for root groups the chip shows the root letters, otherwise the word's letters.

- Tooltip word: root groups use the verb's qatal (3ms perfect), the form lexicons and vocabulary lists cite:
  - qal is the verb's main stem → the qal qatal (יָשַׁב, אָמַר)
  - another stem dominates → that stem's attested qatal, in its textbook form (דִּבֵּר, הֶאֱזִין,
    הִשְׁחִית), not BDB's rare or unused qal; hollow verbs keep their usual citation form (שׁוּב, קוּם)
  - the verb is under 35% of the root's uses (nouns dominate), or there is no verb → the root's
    most common word (מֶלֶךְ 'king', not מָלַךְ; זֶרַע 'seed'; לֵב; אֶבֶן)
- Groups split off by meaning, and roots with only one word in the Bible, show that word
  (דְּבוֹרָה "bee", שָׁמַיִם "heavens").
- Words without a root (particles, names) show their dictionary form (כִּי), not the inflected word.
  יהוה stays unpointed. The few lexicon forms without vowels use the word as pointed in the text.
- Familiar forms: nouns that only ever occur in the plural or dual show their real plural form
  from the text (מַיִם, not the lexicons' unused singular מַי), taken from standalone occurrences
  (no prefix dagesh), with dagesh lene restored and the non-pausal ‑ַיִם ending preferred.
  Verbs, names, particles and ordinary nouns keep their dictionary form.
- Homonym numerals (ענה I / עָנָה IV) appear only when two chips in the same passage share letters.
- English labels come from `decisions/chip_glosses.json`: reviewed plain-English labels per root
  group and per small word (טוב 'good', not BDB's first sense 'pleasant'; קוה II 'to gather').
  They are not taken from the STEP word lookup, which cannot tell the senses of one Strong's
  number apart. Divine names show their Hebrew name: Yahweh, Elohim, El, Adonai.

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
