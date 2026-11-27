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
- Proper names (people, places, peoples) are left out of Repeated Roots entirely: no chip, and
  double-click selects only the word itself. Name etymologies (Strong's, often folk etymology) are
  too unreliable for a primary tool, and a name's components are visible in its dictionary entry.
  God's names are the exception, as two groups: יהוה, יָהּ, יֱהוִה ("Yahweh"), and אֱלֹהִים, אֵל,
  אֱלוֹהַּ, Aramaic אֱלָהּ ("God", chip אלהים: BDB's bare letters אלה would read as אֵלֶּה "these").
- Words written as several words (אַל־תַּשְׁחֵת, יְפֵה־פִיָּה; `compounds` in the data) have one heb_bible
  row per part with the same Strong's number. The parts count as one occurrence, so a compound
  is never its own "repetition". (Repeats such as קֹדֶשׁ הַקֳּדָשִׁים are two words and do count.)
- Function words (prepositions, conjunctions, particles, pronouns) match exactly only.
- Aramaic words join their Hebrew cognate's root, including regular sound shifts (ד=ז, ת=שׁ).

## Motif chip labels

Chips show **unpointed** letters, so they name the root and its family rather than one word
(ישׁב, not יָשַׁב; shin/sin dots are kept). The pointed `label` below is shown in the tooltip
("יָשַׁב · sit"); for root groups the chip shows the root letters, otherwise the word's letters.

- A root with a verb is **named by its verb**, in both languages, even when a noun is more common:
  סָפַר "count" (not סֵפֶר "book"), מָלַךְ "reign", עָבַד "serve". Exceptions, reviewed one by one in
  `decisions/root_naming.json`, keep the noun where the verb is derived from it or too marginal to
  name the family: כֹּל "all" (not כָּלַל), the numbers (not שָׁלַשׁ "do a third time"), לֵב "heart",
  רֶגֶל "foot", עָפָר "dust". Roots without a verb use their most common word (אֶבֶן "stone").
- Tooltip word for a verb: its qatal (3ms perfect), the form lexicons and vocabulary lists cite:
  - qal is the verb's main stem → the qal qatal (יָשַׁב, אָמַר)
  - another stem dominates → that stem's attested qatal, in its textbook form (דִּבֵּר, הֶאֱזִין,
    הִשְׁחִית), not BDB's rare or unused qal; hollow verbs keep their usual citation form (שׁוּב, קוּם);
    if the text has no 3ms perfect of that stem, BDB's citation form (סָפַר, not passive סֻפַּר)
  - verb uses are counted per homonym (OSHB letters), so לחם "bread" is not named by לחם "to fight"
- Groups split off by meaning, and roots with only one word in the Bible, show that word
  (דְּבוֹרָה "bee", שָׁמַיִם "heavens").
- Words without a root (particles, names) show their dictionary form (כִּי), not the inflected word.
  יהוה stays unpointed. The few lexicon forms without vowels use the word as pointed in the text.
- Familiar forms: nouns that only ever occur in the plural or dual show their real plural form
  from the text (מַיִם, not the lexicons' unused singular מַי), taken from standalone occurrences
  (no prefix dagesh), with dagesh lene restored and the non-pausal ‑ַיִם ending preferred.
  Verbs, names, particles and ordinary nouns keep their dictionary form.
- Homonym numerals (ענה I / עָנָה IV) appear only when two chips in the same passage share letters.
- English verb labels drop the infinitive "to" ("remember", "long for", "be willing"). A bare verb
  that would read as a noun is reworded in `decisions/chip_label_fixes.json` ("carry", not "bear").
- English chips never show Hebrew. When two chips in one passage share an English label, each
  gets its reviewed qualifier from `decisions/chip_qualifiers.json` ("gather (assemble)" /
  "gather (glean)"; Hebrew/Aramaic pairs read "(Hebrew)" / "(Aramaic)").
- English labels come from `decisions/chip_glosses.json`: reviewed plain-English labels per root
  group and per small word (טוב 'good', not BDB's first sense 'pleasant'; קוה II 'gather').
  They are not taken from the STEP word lookup, which cannot tell the senses of one Strong's
  number apart. God's personal name shows as "Yahweh"; the titles as "God" (אֱלֹהִים, אֵל) and "Lord" (אֲדֹנָי).

`decisions/` holds the reviewed decisions: `meaning_out_*.json` (meaning-based splits; borderline
cases resolved to the reviewed defaults), `review_aramaic_out.json` (Aramaic merges),
`chip_glosses.json` (English labels), `root_naming.json` (verb- or noun-named roots, with their
English label) and `chip_qualifiers.json` (English qualifiers).
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
