"""Step 3: generate src/lib/roots/rootData.json for the app.
Usage: python3 -I generate_app_data.py <root_map.csv from step 2> <morphhb_dir> <out rootData.json> [heb_bible_layout.txt]

Output format (kept compact; indices refer to `roots`):
  roots:      [[label, gloss, homonym, letters], ...]  label = pointed chip word (יָשַׁב, דִּבֵּר, לֵב),
              letters = bare root for the tooltip (ישׁב); homonym = "I"/"II"... or ""
  strong:     {strongNumber: rootIndex}   default root for the Strong's number (its most frequent homonym)
  lemmas:     {strongNumber: [lemma, gloss]}   dictionary form for words without a root (exact match)
  exceptions: {"book|chapter|verse|strong|n": rootIndex or -1}
              words whose homonym (OSHB augmented Strong's) differs from the default; chapter/verse use
              heb_bible's English numbering; n = nth occurrence of that Strong's number in the verse
              (0-based); -1 = no root (exact match only)
Strong's numbers absent from `strong` (particles, proper names, unrooted words) fall back to exact
Strong's matching. Proper names never join a root group; God's name (יהוה, יָהּ, יֱהוִה) is one group.
"""
import csv, json, re, sys, glob, os, collections, unicodedata
MAP, MORPH, OUT = sys.argv[1:4]
BOOKS = {'Gen':'genesis','Exod':'exodus','Lev':'leviticus','Num':'numbers','Deut':'deuteronomy','Josh':'joshua','Judg':'judges','Ruth':'ruth',
 '1Sam':'1 samuel','2Sam':'2 samuel','1Kgs':'1 kings','2Kgs':'2 kings','1Chr':'1 chronicles','2Chr':'2 chronicles','Ezra':'ezra','Neh':'nehemiah',
 'Esth':'esther','Job':'job','Ps':'psalms','Prov':'proverbs','Eccl':'ecclesiastes','Song':'songs','Isa':'isaiah','Jer':'jeremiah','Lam':'lamentations',
 'Ezek':'ezekiel','Dan':'daniel','Hos':'hosea','Joel':'joel','Amos':'amos','Obad':'obadiah','Jonah':'jonah','Mic':'micah','Nah':'nahum','Hab':'habakkuk',
 'Zeph':'zephaniah','Hag':'haggai','Zech':'zechariah','Mal':'malachi'}
rows = [r for r in csv.DictReader(open(MAP, encoding='utf-8-sig')) if r['in_db'] == 'yes']
ACCENTS = re.compile(r'[֑-ֽ֯]')  # cantillation and meteg; vowels and shin/sin dots stay
def clean(word): return unicodedata.normalize('NFC', ACCENTS.sub('', (word or '').replace(chr(0x034F), '')).strip())  # U+034F joiner in some lemmas
TEXT_MARKS = re.compile(r'[֑-ֽ֯־׀׃]')  # accents, meteg, maqqef, paseq, sof pasuq
def plain(word): return unicodedata.normalize('NFC', TEXT_MARKS.sub('', (word or '').replace(chr(0x034F), '')).strip())

# ---- Familiar forms for plural-only nouns. Lexicons cite these in a singular that never occurs
# (BDB/STEP מַי 'water', but the Bible only has מַיִם). For common nouns (OSHB morph Nc...) that
# occur only in the plural or dual, the chip shows their most frequent plural/dual absolute form.
# Everything else (verbs, names, particles, ordinary nouns) keeps its dictionary form.
def citation_spelling(form):
    """A word as cited on its own: an initial בגדכפת takes dagesh lene (lost after a vowel-final word)."""
    first_marks = re.match(r'.[֑-ׇ]*', form or '')
    if form and form[0] in 'בגדכפת' and 'ּ' not in first_marks.group(0):
        form = unicodedata.normalize('NFC', form[0] + 'ּ' + form[1:])
    return form

noun_numbers = collections.defaultdict(collections.Counter)  # strong -> {'s': n, 'p': n, 'd': n}
plural_forms = collections.defaultdict(collections.Counter)  # strong -> unsuffixed plural/dual absolute forms
verb_stems = collections.defaultdict(collections.Counter)    # strong -> {stem code: uses}, q = qal
any_forms = collections.defaultdict(collections.Counter)     # strong -> attested forms (prefix dropped), last resort
qatal_forms = collections.defaultdict(collections.Counter)   # (strong, stem) -> standalone 3ms perfect forms (non-qal)
for f in sorted(glob.glob(os.path.join(MORPH, 'wlc', '*.xml'))):
    for lem, morph, text, after in re.findall(r'<w lemma="([^"]*)"[^>]*?morph="([^"]*)"[^>]*>([^<]*)</w>(<seg type="x-maqqef")?', open(f, encoding='utf-8').read()):
        lsegs, tsegs, msegs = lem.split('/'), text.split('/'), morph[1:].split('/')
        m = re.match(r'\s*(\d+)', lsegs[-1])
        if not m or len(msegs) < len(lsegs): continue
        s, code = int(m.group(1)), msegs[len(lsegs) - 1]   # e.g. Ncmpa = noun common masc plural absolute
        if len(tsegs) >= len(lsegs):
            any_forms[s][citation_spelling(plain(tsegs[len(lsegs) - 1]))] += 1
        if code.startswith('V') and len(code) >= 3:          # e.g. Vpp3ms = verb piel perfect 3ms
            verb_stems[s][code[1]] += 1
            # standalone, not joined by maqqef (which shortens vowels: דִּבֶּר־ vs דִּבֵּר)
            if code[1] != 'q' and code[2:6] == 'p3ms' and len(lsegs) == 1 and len(tsegs) == 1 and not after:
                qatal_forms[(s, code[1])][citation_spelling(plain(tsegs[0]))] += 1
            continue
        if not code.startswith('Nc') or len(code) < 5: continue
        noun_numbers[s][code[3]] += 1
        # standalone plural/dual absolute: no prefix (its dagesh would leak in) and no pronoun suffix
        if code[3] in 'pd' and code[4] == 'a' and len(lsegs) == 1 and len(tsegs) == 1 and not after:
            form = citation_spelling(plain(tsegs[0]))
            if form: plural_forms[s][form] += 1

def familiar(strong_number, lemma):
    """Dictionary form, except plural-only nouns, which show their real plural (מַי → מַיִם)."""
    s = int(strong_number)
    numbers = noun_numbers.get(s)
    # plural-only: at most 2% of uses tagged singular (OSHB has a stray singular tag on one מַיִם)
    if numbers and numbers.get('s', 0) <= 0.02 * sum(numbers.values()) and plural_forms.get(s):
        best = plural_forms[s].most_common(1)[0][0]
        contextual = best.replace('ָיִם', 'ַיִם')  # pausal ָיִם → ַיִם
        return contextual if contextual in plural_forms[s] else best
    return clean(lemma)

members_of = collections.defaultdict(list)
for r in rows:
    if r['kind'] == 'word' and r['root']: members_of[r['root']].append(r)

VERB_SHARE = 0.10  # below this share of the root's uses, the verb is too rare to name the chip

def root_word(members):
    """Pointed chip word for a root with several words: the verb's qatal (3ms perfect) when the verb
    is a real presence in the family, otherwise the family's most common word.
      qal is the verb's main stem  → BDB's citation form, the qal qatal (יָשַׁב)
      another stem dominates       → that stem's attested qatal (דִּבֵּר, הֶאֱזִין), not a rare/unused qal
      rare or no verb              → most common word (לֵב, not לָבַב; אֶבֶן)"""
    total = sum(int(r['occurrences'] or 0) for r in members) or 1
    verbs = [r for r in members if verb_stems.get(int(r['strong']))]
    if verbs:
        verb = max(verbs, key=lambda r: sum(verb_stems[int(r['strong'])].values()))
        s = int(verb['strong'])
        if sum(verb_stems[s].values()) >= VERB_SHARE * total:
            main_stem = verb_stems[s].most_common(1)[0][0]
            if main_stem != 'q':
                forms = qatal_forms.get((s, main_stem)) or collections.Counter(
                    {f: n for (t, st), c in qatal_forms.items() if t == s for f, n in c.items()})
                if forms:
                    best = forms.most_common(1)[0][0]
                    # textbooks cite the regular paradigm form (דִּבֵּר) where the text also has it,
                    # even when a segol variant is more frequent (דִּבֶּר)
                    i = best.rfind('ֶ')
                    regular = best[:i] + 'ֵ' + best[i + 1:] if i >= 0 else best
                    return regular if regular in forms else best
            return pointed(verb['lemma'], s)
    return pointed(familiar(members[0]['strong'], members[0]['lemma']), members[0]['strong'])

VOWELS = re.compile('[' + chr(0x05B0) + '-' + chr(0x05BC) + chr(0x05C7) + ']')  # vowel points and dagesh/shuruq

def pointed(word, strong_number=None):
    """Pointed citation spelling (restores an initial dagesh lene: דָבַר → דָּבַר). The few lexicon
    forms without vowels fall back to the word as pointed in the text."""
    word = clean(word)
    if VOWELS.search(word):
        return citation_spelling(word)
    forms = any_forms.get(int(strong_number)) if strong_number else None
    return forms.most_common(1)[0][0] if forms else word

# God's personal name in all its forms is one group, labelled by the name itself (not "LORD").
YAHWEH_KEY = 'divine:YHWH'
YAHWEH_STRONGS = (3068, 3050, 3069)  # יהוה, יָהּ, יֱהוִה

def label_for(key):
    """Chip label for a root group: (pointed label, gloss, homonym numeral or '', bare root letters or '')."""
    if key == YAHWEH_KEY:
        return 'יהוה', 'Yahweh', '', ''
    members = sorted(members_of.get(key, []), key=lambda r: -int(r['occurrences'] or 0))
    # English: the sense of the group's most frequent word (לֵב 'heart', not the rare verb 'encourage')
    split_sense = key.split('‹')[1].rstrip('›') if '‹' in key else ''
    gloss = (members[0]['gloss'] if members else '') or split_sense or next((r['root_gloss'] for r in members if r['root_gloss']), '')
    if key.startswith('word:'):  # primary word with no verbal root, e.g. בַּיִת (with יוֹם/יוֹמָם under יוֹם)
        head = clean(key[5:].replace(' (arc)', ''))
        lead = next((r for r in members if clean(r['lemma']) == head), members[0] if members else None)
        return (pointed(familiar(lead['strong'], lead['lemma']), lead['strong']) if lead else head), gloss, '', ''
    m = re.search(r' ([IVX]+)$', key)
    homonym = m.group(1) if m and '‹' not in key else ''
    if '‹' in key:  # split off by meaning: show its own word (דְּבוֹרָה 'bee'), not the parent root
        return (pointed(familiar(members[0]['strong'], members[0]['lemma']), members[0]['strong']) if members else key), gloss, '', ''
    hebrew = [r for r in members if r['lang'] == 'heb' and 'Aramaic' not in r['notes'] and r['root_display']]
    display = (hebrew or [r for r in members if r['root_display']] or [{'root_display': ''}])[0]['root_display']
    letters = unicodedata.normalize('NFC', display or re.sub(r'^arc:| [IVX]+$', '', key))
    if not members:
        return letters, gloss, homonym, letters
    if len({r['strong'] for r in members}) == 1:
        # a root with a single word in the Bible (שָׁמַיִם, not BDB's conjectural שׁמה): show that word
        return pointed(familiar(members[0]['strong'], members[0]['lemma']), members[0]['strong']), gloss, homonym, ''
    return root_word(members), gloss, homonym, letters

roots, ridx = [], {}
def idx(key):
    if key not in ridx:
        ridx[key] = len(roots); roots.append(list(label_for(key)))
    return ridx[key]
def word_root(r):
    if r['kind'] != 'word' or not r['root'] or r['root'].startswith('exact:'): return -1
    return idx(r['root'])
by_strong = collections.defaultdict(list)
for r in sorted(rows, key=lambda r: (int(r['strong']), r['aug'])): by_strong[int(r['strong'])].append(r)
strong, aug_root, lemmas = {}, {}, {}
for s, rs in by_strong.items():
    if s in YAHWEH_STRONGS:
        strong[str(s)] = idx(YAHWEH_KEY)
        for r in rs: aug_root[(s, r['aug'])] = idx(YAHWEH_KEY)
        continue
    for r in rs: aug_root[(s, r['aug'])] = word_root(r)
    main = max(rs, key=lambda r: int(r['occurrences'] or 0))
    if word_root(main) >= 0:
        strong[str(s)] = word_root(main)
    else:  # exact-match words (particles, names, unrooted): dictionary form + gloss for the chip
        # יהוה stays unpointed: the text points it with the qere (אֲדֹנָי/יְהוִה), not as a word to read
        lemmas[str(s)] = [clean(main['lemma']) if s in (3068, 3069) else pointed(familiar(s, main['lemma']), s), main['gloss']]
# heb_bible uses English (KJV) verse numbering. OSHB marks where English verses start with
# <note>KJV:Book.c.v</note>; a Hebrew verse without a marker continues the current offset within
# the chapter, and psalm titles fold into English verse 1.
def english_verses(xml):
    """Yield (eng_chapter, eng_verse, lemma) for every word in document order."""
    xml = re.sub(r'<note type="[^"]*">.*?</note>', '', xml, flags=re.S)   # textual notes
    xml = re.sub(r'<rdg type="x-qere">.*?</rdg>', '', xml, flags=re.S)  # qere: heb_bible keeps the ketiv word
    cur = None  # (eng chapter, eng verse, heb chapter, heb verse) of the last KJV marker
    for vm in re.finditer(r'<verse osisID="[^.]+\.(\d+)\.(\d+)">(.*?)</verse>', xml, re.S):
        hc, hv = int(vm.group(1)), int(vm.group(2))
        if cur and cur[2] == hc:
            ec, ev = cur[0], cur[1] + (hv - cur[3])
        else:
            ec, ev = hc, max(hv, 1)
            cur = None
        for tok in re.finditer(r'<note>KJV:[^.]+\.(\d+)\.(\d+)</note>|<w lemma="([^"]*)"', vm.group(3)):
            if tok.group(1):
                ec, ev = int(tok.group(1)), int(tok.group(2)); cur = (ec, ev, hc, hv)
            else:
                yield ec, ev, tok.group(3)

exceptions = {}
layout = collections.defaultdict(dict)
for f in sorted(glob.glob(os.path.join(MORPH, 'wlc', '*.xml'))):
    code = os.path.basename(f)[:-4]
    if code not in BOOKS: continue
    seen = collections.Counter()
    for ec, ev, lem in english_verses(open(f, encoding='utf-8').read()):
        layout[BOOKS[code]][ec] = max(layout[BOOKS[code]].get(ec, 0), ev)
        parts = [p for p in lem.split('/') if re.match(r'\s*\d', p)]
        if not parts: continue
        m = re.match(r'\s*(\d+)\s*([a-z]?)', parts[-1]); s, a = int(m.group(1)), m.group(2)
        n = seen[(ec, ev, s)]; seen[(ec, ev, s)] += 1
        if len(by_strong.get(s, [])) < 2: continue
        default = strong.get(str(s), -1); actual = aug_root.get((s, a), default)
        if actual != default: exceptions[f"{BOOKS[code]}|{ec}|{ev}|{s}|{n}"] = actual
if len(sys.argv) > 4:  # optional: compare chapter/verse layout with heb_bible ("book=c:maxv,..." per book)
    bad = 0
    for bk, rest in re.findall(r'([a-z0-9 ]+?)=([\d:,]+)', open(sys.argv[4], encoding='utf-8').read()):
        bk = bk.strip(); db = {int(c): int(v) for c, v in (x.split(':') for x in rest.split(','))}
        if db != dict(layout[bk]):
            bad += 1; print('layout mismatch', bk, {c: (db.get(c), layout[bk].get(c)) for c in set(db) | set(layout[bk]) if db.get(c) != layout[bk].get(c)})
    print('layout check:', 'all books match' if not bad else f'{bad} books differ')
# ---- English chip labels. Lexicon glosses are often a technical first sense (טוב 'pleasant',
# הלל 'be boastful'), so decisions/chip_glosses.json holds reviewed plain-English labels:
# {"roots": {root key: label}, "words": {strong: label}}. Names keep their name ("Isaac").
HERE = os.path.dirname(os.path.abspath(__file__))
glosses_path = os.path.join(HERE, 'decisions', 'chip_glosses.json')
chip_glosses = json.load(open(glosses_path, encoding='utf-8')) if os.path.exists(glosses_path) else {'roots': {}, 'words': {}}
root_keys = [None] * len(roots)
for key, i in ridx.items(): root_keys[i] = key
for i, key in enumerate(root_keys):
    if key in chip_glosses['roots']: roots[i][1] = chip_glosses['roots'][key]
name_strongs = {r['strong'] for r in rows if r['kind'] == 'name'}
for s, entry in lemmas.items():
    if s in chip_glosses['words']: entry[1] = chip_glosses['words'][s]
    elif s in name_strongs: entry[1] = re.split(r'[.;,(]', entry[1])[0].strip()  # "Isaac. Compare" → "Isaac"
if os.environ.get('ROOT_KEYS_OUT'):  # index-aligned root keys, for writing chip_glosses.json
    json.dump(root_keys, open(os.environ['ROOT_KEYS_OUT'], 'w', encoding='utf-8'), ensure_ascii=False)

json.dump(dict(source='Open Scriptures HebrewLexicon (BDB/Strong) + OSHB morphhb, CC BY 4.0; see scripts/roots/README.md',
               roots=roots, strong=strong, lemmas=lemmas, exceptions=exceptions), open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'roots {len(roots)}  strong {len(strong)}  lemmas {len(lemmas)}  exceptions {len(exceptions)}  size {os.path.getsize(OUT)//1024} KB')
