"""Step 3: generate src/lib/roots/rootData.json for the app.
Usage: python3 -I generate_app_data.py <root_map.csv from step 2> <morphhb_dir> <out rootData.json>

Output format (kept compact; indices refer to `roots`):
  roots:      [[label, gloss], ...]
  strong:     {strongNumber: rootIndex}   default root for the Strong's number (its most frequent homonym)
  names:      {strongNumber: [rootIndex, ...]}  roots contained in a proper name
  exceptions: {"book|chapter|verse|strong|n": rootIndex or -1}
              words whose homonym (OSHB augmented Strong's) differs from the default; n = nth
              occurrence of that Strong's number in the verse (0-based); -1 = no root (exact match only)
Strong's numbers absent from `strong` (particles, unrooted words) fall back to exact Strong's matching.
"""
import csv, json, re, sys, glob, os, collections
MAP, MORPH, OUT = sys.argv[1:4]
BOOKS = {'Gen':'genesis','Exod':'exodus','Lev':'leviticus','Num':'numbers','Deut':'deuteronomy','Josh':'joshua','Judg':'judges','Ruth':'ruth',
 '1Sam':'1 samuel','2Sam':'2 samuel','1Kgs':'1 kings','2Kgs':'2 kings','1Chr':'1 chronicles','2Chr':'2 chronicles','Ezra':'ezra','Neh':'nehemiah',
 'Esth':'esther','Job':'job','Ps':'psalms','Prov':'proverbs','Eccl':'ecclesiastes','Song':'songs','Isa':'isaiah','Jer':'jeremiah','Lam':'lamentations',
 'Ezek':'ezekiel','Dan':'daniel','Hos':'hosea','Joel':'joel','Amos':'amos','Obad':'obadiah','Jonah':'jonah','Mic':'micah','Nah':'nahum','Hab':'habakkuk',
 'Zeph':'zephaniah','Hag':'haggai','Zech':'zechariah','Mal':'malachi'}
rows = [r for r in csv.DictReader(open(MAP, encoding='utf-8-sig')) if r['in_db'] == 'yes']
roots, ridx = [], {}
def idx(key, gloss):
    if key not in ridx:
        ridx[key] = len(roots); roots.append([key, gloss])
    return ridx[key]
def word_root(r):
    if r['kind'] != 'word' or not r['root'] or r['root'].startswith('exact:'): return -1
    return idx(r['root'], r['root_gloss'])
by_strong = collections.defaultdict(list)
for r in sorted(rows, key=lambda r: (int(r['strong']), r['aug'])): by_strong[int(r['strong'])].append(r)
strong, names, aug_root = {}, {}, {}
for s, rs in by_strong.items():
    for r in rs: aug_root[(s, r['aug'])] = word_root(r)
    main = max(rs, key=lambda r: int(r['occurrences'] or 0))
    if word_root(main) >= 0: strong[str(s)] = word_root(main)
    nm = [r for r in rs if r['kind'] == 'name' and r['name_roots']]
    if nm:
        names[str(s)] = [idx(k, next((x['root_gloss'] for x in rows if x['root'] == k), '')) for k in nm[0]['name_roots'].split('|')]
exceptions = {}
for f in sorted(glob.glob(os.path.join(MORPH, 'wlc', '*.xml'))):
    code = os.path.basename(f)[:-4]
    if code not in BOOKS: continue
    for vm in re.finditer(r'<verse osisID="[^.]+\.(\d+)\.(\d+)">(.*?)</verse>', open(f, encoding='utf-8').read(), re.S):
        c, v, body = vm.group(1), vm.group(2), vm.group(3)
        body = re.sub(r'<note.*?</note>', '', body, flags=re.S)
        seen = collections.Counter()
        for lem in re.findall(r'<w lemma="([^"]*)"', body):
            parts = [p for p in lem.split('/') if re.match(r'\s*\d', p)]
            if not parts: continue
            m = re.match(r'\s*(\d+)\s*([a-z]?)', parts[-1]); s, a = int(m.group(1)), m.group(2)
            n = seen[s]; seen[s] += 1
            if len(by_strong.get(s, [])) < 2: continue
            default = strong.get(str(s), -1); actual = aug_root.get((s, a), default)
            if actual != default: exceptions[f"{BOOKS[code]}|{c}|{v}|{s}|{n}"] = actual
json.dump(dict(source='Open Scriptures HebrewLexicon (BDB/Strong) + OSHB morphhb, CC BY 4.0; see scripts/roots/README.md',
               roots=roots, strong=strong, names=names, exceptions=exceptions), open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'roots {len(roots)}  strong {len(strong)}  names {len(names)}  exceptions {len(exceptions)}  size {os.path.getsize(OUT)//1024} KB')
