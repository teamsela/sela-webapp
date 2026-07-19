# Hebrew Poetic Accent Parsing Logic

## Overview

This document describes the accent marker parsing logic used to identify and label Hebrew cantillation marks (te'amim) in poetic books (Job, Psalms, Proverbs). The parser handles the disambiguation of compound accents that share Unicode codepoints with simpler conjunctive marks, preventing double counting.

## Core Architecture: Claim-Based Scanning

### The Problem

Many poetic accents share their component marks:
- The Qadma (U+05A8) of **Azla Legarmeh** is the same codepoint as bare conjunctive **Azla**
- The Merkha (U+05A5) of **Ole VeYored** is the same codepoint as the Merkha of **Sinnorit Merkha**
- Every Legarmeh ends in the same Paseq bar (U+05C0) that also occurs alone
- Dechi (U+05AD) followed by Munach/Merkha/Revia on the same word absorbs that mark

### The Solution

Scanning is **claim-based** and runs in a fixed precedence order:

1. Every occurrence of a pattern names the exact mark positions (token index + char index) it consumes
2. Scan passes run in a fixed order (SCAN_PASSES); once a pass claims a mark, later passes see it as taken
3. Fall-through cases (bare conjunctives) run last and pick up only marks no compound claimed
4. The `emit()` function is atomic: it refuses if any mark is already taken, guaranteeing no double counting

### Data Structure

```
Mark position = { t: token_index, i: char_index_within_token }
Claim = array of mark positions consumed by one accent occurrence
Occurrence = { lead: [token_idxs], head: [token_idxs], claims: [marks] }
```

- `lead` = earlier word(s) of a multi-word accent (rendered underlined)
- `head` = word the accent resolves on (rendered highlighted)
- Single-word accents: lead=[], head=[token_idxs]

### Prosodic Words

Tokens joined by **maqqef** (U+05BE) count as a single prosodic word. A compound "over two adjacent words" may span several tokens (e.g., Ps 130:7: Ole on one word, Merkha three tokens later on the maqqef chain forming the next prosodic word).

## Input Data Shape

The entry point is `scanAccents(tokens)`. `tokens` is an array of word objects in
reading (verse) order. Only three fields are read:

| Field | Type | Purpose |
|-------|------|---------|
| `hebrew` | string | The pointed Hebrew for the word, including its accent marks and any word-final maqqef (U+05BE), Paseq (U+05C0) or Sof Pasuq (U+05C3). Leading/trailing whitespace is tolerated. |
| `chapter` | number | Verse/chapter boundary detection (a compound never spans a boundary). |
| `verse` | string \| number | Together with `chapter`, identifies the verse; compared by equality, so the type only needs to be consistent across tokens. |

Any other fields (gloss, ids, layout flags, …) are ignored. Tokens must be in
reading order — "next word" and adjacency are defined by array position, and
maqqef-joined tokens are grouped into one prosodic word internally.

`scanAccents(tokens)` returns `{ ids, underIds, counts, spans }` (see the
[pseudocode](#pseudocode-for-claim-based-scanning) under Implementation Notes for
the shape of each).

## Unicode Codepoints

| Name | Codepoint | Unicode Name |
|------|-----------|-------------|
| MUNACH | U+05A3 | HEBREW ACCENT MUNAH |
| MAHAPAKH | U+05A4 | HEBREW ACCENT MAHAPAKH |
| MERKHA | U+05A5 | HEBREW ACCENT MERKHA |
| TARCHA | U+0596 | HEBREW ACCENT TIPEHA |
| ILUY | U+05AC | HEBREW ACCENT ILUY |
| QADMA | U+05A8 | HEBREW ACCENT QADMA (Azla) |
| GALGAL | U+05AA | HEBREW ACCENT GALGAL |
| PAZER | U+05A1 | HEBREW ACCENT PAZER |
| GERESH | U+059C | HEBREW ACCENT GERESH |
| GERESH_MUQDAM | U+059D | HEBREW ACCENT GERESH MUQDAM |
| REVIA | U+0597 | HEBREW ACCENT REVIA |
| ETNACHTA | U+0591 | HEBREW ACCENT ETNAHTA |
| OLE | U+05AB | HEBREW ACCENT OLE |
| DEHI | U+05AD | HEBREW ACCENT DEHI (Dechi) |
| TSINNORIT | U+0598 | HEBREW ACCENT ZARQA (Sinnorit) |
| ZINOR | U+05AE | HEBREW ACCENT ZINOR (Tsinnor) |
| SHALSHELET | U+0593 | HEBREW ACCENT SHALSHELET |
| METEG | U+05BD | HEBREW POINT METEG (Silluq) |
| SOF_PASUQ | U+05C3 | HEBREW PUNCTUATION SOF PASUQ |
| PASEQ | U+05C0 | HEBREW PUNCTUATION PASEQ |
| MAQQEF | U+05BE | HEBREW PUNCTUATION MAQAF |

## Scan Pass Order

The order defines which pattern wins when accents share marks:

```
1.  bareScan("sof-pasuq")           -- Level 1, no shared marks
2.  bareScan("etnachta")            -- Level 2, no shared marks
3.  scanReviaMugrash                -- Geresh_Muqdam + Revia on same token
4.  bareScan("geresh")              -- Level 2, no shared marks
5.  scanDechiAndCompounds           -- Dechi + (Revia|Munach|Merkha) compound + bare
6.  bareScan("tsinnor")             -- Level 3, no shared marks
7.  bareScan("pazer")               -- Level 4, no shared marks
8.  scanLegarmehFamily              -- Shalshelet/Qadma/Mahpakh + word-final Paseq
9.  scanPaseqAfterSinnoritMerkha    -- Tsinnorit+Merkha before Paseq => label as Paseq
10. scanOleVeYored                  -- Same-word Ole + Merkha only
11. pairScan("azla-illuy")          -- Qadma + Illuy, same or adjacent words (Level 2)
12. pairScan("illuy-illuy")         -- Illuy + Illuy, same or adjacent words (Level 2)
13. pairScan("tarcha-munach")       -- Tarcha + Munach, same or adjacent words (Level 2)
14. pairScan("sinnorit-merkha")     -- Tsinnorit + Merkha, same or adjacent words (Level 3)
15. pairScan("azla-tarcha")         -- Qadma + Tarcha, same or adjacent words (Level 3)
16. pairScan("munach-munach")       -- Munach + Munach, same or adjacent words (Level 3)
17. pairScan("sinnorit-mahpakh")    -- Tsinnorit + Mahpakh, same word ONLY (conjunctive)
18. scanOleVeYoredCrossWord         -- Cross-word Ole + Merkha (deferred past sinnorit-merkha)
19. bareScan("munach")              -- Fall-through conjunctive
20. bareScan("merkha")              -- Fall-through conjunctive
21. bareScan("tarcha")              -- Fall-through conjunctive
22. bareScan("azla")                -- Fall-through conjunctive
23. bareScan("mahpakh")             -- Fall-through conjunctive
24. bareScan("illuy")               -- Fall-through conjunctive
25. bareScan("sinnorit")            -- Fall-through conjunctive
26. bareScan("ole")                 -- Fall-through conjunctive
27. bareScan("shalshelet")          -- Fall-through conjunctive (Qetannah, no Paseq)
28. bareScan("galgal")              -- Fall-through conjunctive
29. scanBarePaseq                   -- Word-final Paseq nothing else claimed (conjunctive)
```

## Accent Patterns

### Disjunctives, Level 1 (strongest)

**Sof Pasuq** (U+05C3)
- End-of-verse mark on the verse-final word
- ~99.98% of verses have it

### Disjunctives, Level 2

**Etnachta** (U+0591)
- Single mark under a letter

**Ole VeYored** (U+05AB + U+05A5)
- Ole + its Yored (Merkha) on one word or spanning to the next
- Same-word Ole+Merkha scanned before Sinnorit Merkha
- Cross-word Ole+Merkha deferred AFTER sinnorit-merkha to prevent stealing its Merkha
- Ole with no Merkha in reach => bare Ole conjunctive

**Revia Mugrash** (U+059D + U+0597)
- Geresh Muqdam before Revia on the same token

**Shalshelet Gedolah** (U+0593 + U+05C0)
- Shalshelet + word-final Paseq on same word or next word
- The Paseq is owned, not counted as plain Paseq
- Shalshelet without Paseq => conjunctive Shalshelet

**Azla Illuy** (U+05A8 + U+05AC) -- virtual Revia Mugrash
- Qadma followed by Illuy on same word or next
- If Azla's word ends in Paseq => Azla Legarmeh instead

**Illuy Illuy** (U+05AC + U+05AC) -- virtual Revia Mugrash
- Two Illuy marks on same word or adjacent words

**Tarcha Munach** (U+0596 + U+05A3) -- virtual Revia Mugrash
- Tarcha followed by Munach on same word or next
- Claims both marks (Munach not counted toward Munach Munach)
- Runs before Munach Munach, so Tarcha+Munach+Munach => Tarcha Munach + bare Munach

**Geresh** (U+059C)
- Single mark, prose-system disjunctive, rare in poetic books

### Disjunctives, Level 3

**Dechi** (U+05AD)
- Single mark under a letter
- Compound forms: Dechi followed by Revia, Munach, or Merkha on the same word => single Dechi (following mark absorbed)
- Found across the poetic books: Dechi+Munach x17, Dechi+Merkha x4, Dechi+Revia x3 (24 compounds; every other Dechi is bare)

**Tsinnor** (U+05AE)
- Single mark (distinct from U+0598 Tsinnorit used in Sinnorit pairs)

**Sinnorit Merkha** (U+0598 + U+05A5) -- virtual Dechi
- Tsinnorit before Merkha on one word or over two consecutive words
- EXCEPTION: one-word form followed by Paseq (same word or next word) => plain Paseq only (claim all three marks)
- A Merkha taken as Yored of Ole VeYored is not counted here

**Azla Tarcha** (U+05A8 + U+0596) -- virtual Dechi
- Qadma followed by Tarcha on same word or next
- If Azla bound into Azla Legarmeh (word-final Paseq) or Azla Illuy => not counted here

**Munach Munach** (U+05A3 + U+05A3) -- virtual Dechi
- Two Munach marks on same word or adjacent words
- Each Munach claimed once (three Munachs => one pair + one bare Munach)
- A Munach claimed by Tarcha Munach is not reused here

### Disjunctives, Level 4 (weakest)

**Azla Legarmeh** (U+05A8 + U+05C0)
- Qadma + word-final Paseq on same word or next word
- If multiple formers precede Paseq, the LAST one owns it: [mahpakh qadma paseq] => Azla Legarmeh + plain Mahpakh
- Paseq is not double-counted as plain Paseq or Azla conjunctive

**Mahpakh Legarmeh** (U+05A4 + U+05C0)
- Mahpakh + word-final Paseq on same word or next word
- If Mahpakh preceded by Tsinnorit on same word => Sinnorit Mahpakh (conjunctive), never forms Legarmeh

**Pazer** (U+05A1)
- Single mark under a letter

### Conjunctives (no level)

**Paseq** (U+05C0)
- Vertical bar at end of word, standing alone
- Only counted when no Legarmeh owns it
- Special case: one-word Sinnorit Merkha followed by Paseq => label as plain Paseq only

**Galgal** (U+05AA)
- Single marking underneath a Hebrew letter

**Munach** (U+05A3)
- By itself, a conjunctive
- Not recounted if claimed by Munach Munach, Tarcha Munach, or absorbed after Dechi

**Merkha** (U+05A5)
- By itself, a conjunctive
- Renders bottom-left (vs bottom-middle in Sinnorit Merkha), but same Unicode codepoint
- Not recounted if serving as Yored of Ole VeYored, inside Sinnorit Merkha, or absorbed after Dechi

**Tarcha** (U+0596)
- By itself, poetic-system conjunctive
- Not recounted if claimed by Tarcha Munach or Azla Tarcha

**Azla** (U+05A8)
- By itself, a conjunctive
- Not recounted if bound into Azla Legarmeh, Azla Tarcha, or Azla Illuy

**Mahpakh** (U+05A4)
- By itself, a conjunctive
- Not recounted if bound into Mahpakh Legarmeh or Sinnorit Mahpakh

**Illuy** (U+05AC)
- By itself, a conjunctive
- Not recounted if claimed by Illuy Illuy or Azla Illuy

**Sinnorit** (U+0598)
- By itself, a conjunctive
- Not recounted if bound into Sinnorit Mahpakh or Sinnorit Merkha

**Sinnorit Mahpakh** (U+0598 + U+05A4) -- conjunctive
- Tsinnorit before Mahpakh on the same word ONLY (not adjacent words)
- Its Mahpakh never doubles as Mahpakh Legarmeh or bare Mahpakh

**Ole** (U+05AB)
- By itself, a conjunctive (Ole with no Yored-Merkha in reach)

**Shalshelet** (U+0593)
- By itself with no word-final Paseq => conjunctive Shalshelet (Qetannah)
- Paseq-bearing form is Level-2 Shalshelet Gedolah

## Key Disambiguation Rules

### Rule 1: Legarmeh Family (Paseq ownership)
- Scanned BEFORE Sinnorit Merkha + Paseq rule
- The LAST free former mark before the Paseq owns it
- Mahpakh preceded by Tsinnorit => Sinnorit Mahpakh (conjunctive), never Legarmeh
- One-word cases claim Paseq first, so two-word reading can't steal it

### Rule 2: Sinnorit Merkha + Paseq => plain Paseq
- When one-word Sinnorit Merkha (Tsinnorit before Merkha on same word) is followed by Paseq (same word or next word), the whole thing labels as "paseq"
- All three marks (Tsinnorit, Merkha, Paseq) are claimed
- Runs AFTER Legarmeh (so Legarmeh's Paseq isn't eaten)

### Rule 3: Ole VeYored vs Sinnorit Merkha priority
- Same-word Ole+Merkha scanned BEFORE same-word Sinnorit Merkha (they can't compete: different preceding marks)
- Cross-word Ole+Merkha deferred AFTER Sinnorit Merkha to prevent stealing its Merkha

### Rule 4: Compound Dechi absorption
- Dechi followed by Revia, Munach, or Merkha on the same word => single Dechi
- The following mark is absorbed and not counted separately
- Runs EARLY (pass 5, BEFORE Ole VeYored / Tarcha Munach / Sinnorit Merkha). This is safe because compound Dechi is confined to a single word, whereas those three compounds span one or two words — and no word in the corpus carries a Dechi alongside an Ole / Tarcha / Tsinnorit lead mark, so they never contend for the same mark

### Rule 5: Pair scan chaining
- pairScan runs left to right, claiming as it goes
- Three Munachs => one Munach Munach pair + one bare Munach
- Tarcha+Munach+Munach => Tarcha Munach + bare Munach (not Munach Munach)

## Implementation Notes

### Reading Hebrew Unicode from Data
- Accent marks are single UTF-16 units (BMP), so plain string indexing is safe
- Check for a mark at character position `i` of a word: `word[i] === String.fromCodePoint(markCodepoint)` (here `i` is an index into the string, not a codepoint value)
- Reading-order comparison: first token index, then char index within token

### Cross-Word Scanning
- "Adjacent words" means the immediately next prosodic word in the same verse
- Compounds spanning two words: lead=[first_word_tokens], head=[second_word_tokens]
- For rendering: underline the lead word(s), highlight the head word(s)

### Display Grouping
- Every pattern carries a `level` (1–4) when it is a disjunctive, or `null` when it is a conjunctive
- Rendering only needs to distinguish the four disjunctive levels (1 = strongest … 4 = weakest) from the single conjunctive group; the exact palette is not significant to the parsing
- When one word hosts several accents, render it by its strongest accent (lowest-numbered level, or earliest in registry order)

### Pseudocode for Claim-Based Scanning
```
function scanAccents(tokens):
    used = Set()  // "tokenIdx:charIdx" of every claimed mark
    spans = {}
    
    for each pass in SCAN_PASSES:
        pass(context)
    
    // context.isFree(mark) = mark not in used
    // context.emit(id, lead, head, claims):
    //   if claims is empty OR any claim is in used: return false (refuse)
    //   add all claims to used
    //   record spans[id].push({lead, head, claims})
    //   return true

    // Per-pattern occurrence counts (a two-word accent counts once):
    counts = {}
    for each pattern p: counts[p.id] = length(spans[p.id] or [])

    // Build per-token id lists (a token may host more than one accent):
    ids = []       // accent ids HIGHLIGHTING each token (head word)
    underIds = []  // accent ids UNDERLINING each token (lead word)
    for each (id, occurrences) in spans:
        for each occ in occurrences:
            for t in occ.head: if id not already in ids[t]: ids[t].append(id)
            for t in occ.lead: if id not already in underIds[t]: underIds[t].append(id)

    // Sort each token's ids by registry order (strongest / earliest-listed
    // first) so a multi-accent word can be tinted by its strongest accent.
    for each list in ids and underIds: sort by registry index of id
    
    return {ids, underIds, counts, spans}
```
