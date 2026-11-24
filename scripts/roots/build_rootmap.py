"""Step 1: build the raw Strong's(+augment) -> BDB root map.
Usage: python3 -I build_rootmap.py <sources_dir> <out_rootmap.csv>
<sources_dir> must contain clones of openscriptures/HebrewLexicon and openscriptures/morphhb (see README.md)."""
import xml.etree.ElementTree as ET, re, csv, sys, collections, glob, os
HERE=os.path.dirname(os.path.abspath(__file__))
D=sys.argv[1]; NS='{http://openscriptures.github.com/morphhb/namespace}'; XL='{http://www.w3.org/XML/1998/namespace}lang'
missing={int(x) for x in open(os.path.join(HERE,'decisions','strongs_absent_from_heb_bible.txt')).read().strip().split(',')}
FIN=str.maketrans('ךםןףץ','כמנפצ'); TOFIN={'כ':'ך','מ':'ם','נ':'ן','פ':'ף','צ':'ץ'}
def cons(w): return re.sub(r'[^א-ת]','',w or '').translate(FIN)
def disp(c): return c[:-1]+TOFIN.get(c[-1],c[-1]) if c else c
# ---- occurrences per (strong,aug) from OSHB
occ=collections.Counter()
for f in glob.glob(D+'/morphhb/wlc/*.xml'):
    for lem in re.findall(r'lemma="([^"]*)"',open(f).read()):
        for part in lem.split('/'):
            m=re.match(r'\s*(\d+)\s*([a-z]?)\s*\+?$',part)
            if m: occ[(int(m.group(1)),m.group(2))]+=1
# ---- BDB index
E={}; order=[]
for part in ET.parse(D+'/HebrewLexicon/LexicalIndex.xml').getroot():
    lang=part.get(XL)
    for e in part:
        g=lambda t:e.find(NS+t); x,et=g('xref'),g('etym')
        E[e.get('id')]=d=dict(id=e.get('id'),lang=lang,w=g('w').text if g('w') is not None else '',pos=g('pos').text if g('pos') is not None else '',
            df=g('def').text if g('def') is not None else '',strong=x.get('strong') if x is not None else None,aug=(x.get('aug') or '') if x is not None else '',
            bdb=x.get('bdb') if x is not None else '',root=et.get('root') if et is not None else None,
            parent=(et.text or '').strip() if et is not None and et.get('type')=='sub' else None,
            kids=[k.strip() for k in (et.text or '').split(',') if k.strip()] if et is not None and et.get('type')=='main' else [])
        order.append(d['id'])
def top(i,seen=()):
    p=E[i]['parent']; return top(p,seen+(i,)) if p and p in E and p not in seen else i
hom=collections.defaultdict(list)
for i in order:
    if E[i]['root']: hom[(E[i]['lang'],cons(E[i]['root']))].append(i)
ROM=['I','II','III','IV','V','VI','VII','VIII']; KEY={}
for (lang,c),ids in hom.items():
    ids.sort(key=lambda i:E[i]['bdb'] or 'zzz')
    for n,i in enumerate(ids): KEY[i]=('arc:' if lang=='arc' else '')+disp(c)+(' '+ROM[n] if len(ids)>1 else '')
def members(r):
    out=[];st=[r]
    while st: x=st.pop(); out.append(x); st+=[k for k in E[x]['kids'] if k in E]
    return out
def gloss_of(t):
    ms=[E[m] for m in members(t) if m!=t]; v=[m for m in ms if m['pos']=='V']
    def f(m): return sum(occ.get((int(x),m['aug']),0) for x in re.findall(r'\d+',m['strong'] or ''))
    if v: return max(v,key=f)['df'] or ''
    return (max(ms,key=f)['df'] if ms else E[t]['df']) or ''
NAMEPOS={'Np','Ag','Ng'}
def family(i):
    t=top(i)
    if t in KEY: return KEY[t],'bdb-root',gloss_of(t)
    if E[t]['pos'] in NAMEPOS: return None,'name',''
    return 'word:'+(E[t]['w'] or '')+('' if E[t]['lang']=='heb' else ' (arc)'),'bdb-primary-word',E[t]['df'] or ''
sa=collections.defaultdict(list)
for i in order:
    if E[i]['strong']:
        for s in re.findall(r'\d+',E[i]['strong']): sa[(int(s),E[i]['aug'])].append(i)
# ---- Strong's dictionary
SI={}
for e in ET.parse(D+'/HebrewLexicon/HebrewStrong.xml').getroot().iter(NS+'entry'):
    sid=int(re.sub(r'\D','',e.get('id'))); w=e.find(NS+'w'); src=e.find(NS+'source'); mn=e.find(NS+'meaning')
    SI[sid]=dict(w=w.text if w is not None else '',pos=w.get('pos') if w is not None else '',
        links=[int(re.sub(r'\D','',x.get('src'))) for x in (src.iter(NS+'w') if src is not None else []) if x.get('src')],
        src=' '.join(''.join(src.itertext()).split()) if src is not None else '',df=' '.join(''.join(mn.itertext()).split())[:80] if mn is not None else '')
DIVINE={410:'אֵל',3050:'יָהּ',3068:'יהוה',430:'אֱלֹהִים',433:'אֱלוֹהַּ'}
def s_is_name(s): return SI.get(s,{}).get('pos','').startswith('n-pr')
def s_roots(s):
    out=[]
    for k,ids in sorted(sa.items(),key=lambda kv:-occ.get(kv[0],0)):
        if k[0]==s:
            for i in ids:
                f=family(i)
                if f[0]: out.append(f[0])
    return list(dict.fromkeys(out))
def name_roots(s,depth=0,seen=None):
    seen=seen if seen is not None else set(); out=[]
    if depth>4 or s in seen: return out
    seen.add(s)
    for t in SI.get(s,{}).get('links',[]):
        if t in DIVINE: continue
        elif s_is_name(t): out+=name_roots(t,depth+1,seen)
        elif s_roots(t): out.append('H%d'%t)
    return list(dict.fromkeys(out))
rows=[]
keys=set(sa)|{(s,'') for s in SI}
bystrong=collections.defaultdict(list)
for k in keys: bystrong[k[0]].append(k[1])
for s in sorted(bystrong):
    augs=sorted(bystrong[s])
    if len(augs)>1 and '' in augs and not sa.get((s,'')): augs.remove('')   # Strong's-only placeholder when augmented entries exist
    for a in augs:
        ids=sa.get((s,a),[]); si=SI.get(s,{})
        ent=E[ids[0]] if ids else None
        is_name=(ent['pos'] in NAMEPOS) if ent else s_is_name(s)
        bpos=(ent['pos'] if ent else '')
        is_particle=(not is_name) and bool(re.match(r'^(R|C|T|P)',bpos or ''))
        fams=[family(i) for i in ids]
        fam=next((f for f in fams if f[0]),(None,'',''))
        nr=(name_roots(s) if s not in DIVINE and s not in (3069,) else []) if is_name else []
        
        flags=[]
        if len({f[0] for f in fams if f[0]})>1: flags.append('several-roots-same-aug')
        if not is_name and fam[1]=='bdb-root':
            for t in si.get('links',[]):
                if not s_is_name(t) and t not in DIVINE:
                    tr=s_roots(t)
                    if tr and fam[0] not in tr: flags.append(f'strongs-derives-from-H{t}({tr[0]})')
        lang=(ent['lang'] if ent else ('arc' if 'Chald' in si.get('src','') else 'heb'))
        rows.append(dict(strong=s,aug=a,in_db='no' if s in missing else 'yes',occurrences=occ.get((s,a),0) or (sum(v for (x,y),v in occ.items() if x==s) if a=='' else 0),
            lemma=(ent['w'] if ent else si.get('w','')),lang=lang,kind='name' if is_name else ('particle' if is_particle else 'word'),pos=bpos,
            gloss=(ent['df'] if ent else '') or si.get('df',''),
            root=('' if is_name else ('exact:H%d%s'%(s,a) if is_particle else (fam[0] or 'word:'+(si.get('w') or '')))),root_source=('name' if is_name else (fam[1] or 'strongs-only')),
            root_gloss=('' if is_name else fam[2]),name_root_strongs='|'.join(nr),
            flags='|'.join(flags),strongs_etymology=si.get('src','')[:110],bdb_ids='|'.join(E[i]['bdb'] for i in ids)))
with open(sys.argv[2],'w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
db=[r for r in rows if r['in_db']=='yes']
print('rows',len(rows),'in-db rows',len(db),'strongs in db',len({r['strong'] for r in db}))
print('strongs split by aug (homonyms resolved per word):',sum(1 for s in {r['strong'] for r in db} if sum(1 for r in db if r['strong']==s)>1))
c=collections.Counter((r['kind'],r['root_source']) for r in db); [print(f'  {v:5d} {k}') for k,v in c.most_common()]
W=[r for r in db if r['kind']=='word']
print('distinct root families (words):',len({r['root'] for r in W}),'  of which BDB roots:',len({r['root'] for r in W if r['root_source']=='bdb-root'}))
print('word rows where Strong\'s etymology disagrees with BDB:',sum('strongs-derives' in r['flags'] for r in W),'  occurrences affected:',sum(int(r['occurrences']) for r in W if 'strongs-derives' in r['flags']))
N=[r for r in db if r['kind']=='name']
print('names:',len(N),' with source words for roots:',sum(bool(r['name_root_strongs']) for r in N))
