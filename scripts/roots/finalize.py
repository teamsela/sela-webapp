"""Step 2: apply the reviewed decisions (meaning-based splits, Aramaic merges, name roots).
Usage: python3 -I finalize.py <rootmap.csv from step 1> <out root_map.csv>"""
import csv,json,collections,re,sys,os
HERE=os.path.dirname(os.path.abspath(__file__)); D=lambda p:os.path.join(HERE,'decisions',p)
IN,OUT=sys.argv[1],sys.argv[2]
R=list(csv.DictReader(open(IN,encoding='utf-8')))
rid=lambda r:f"H{r['strong']}{r['aug']}"
byid={rid(r):r for r in R}
for r in R: r['notes']=''
# 1) meaning splits
split_log=[]
for i in range(1,5):
    for e in json.load(open(D(f'meaning_out_{i}.json'))):
        for gi,g in enumerate(e['groups']):
            key=e['family'] if gi==0 else f"{e['family']} ‹{g['label']}›"
            for x in g['ids']:
                if x in byid:
                    byid[x]['root']=key
                    if gi: byid[x]['notes']='split from '+e['family']+' (meaning)'
            if gi: split_log.append(key)
# 2) aramaic merges
FIN=str.maketrans('ךםןףץ','כמנפצ')
def cons(w): return re.sub(r'[^א-ת]','',w or '').translate(FIN)
heb_by_base=collections.defaultdict(set)
for r in R:
    if r['kind']=='word' and not r['root'].startswith(('arc:','word:','exact:')) and '‹' not in r['root']:
        heb_by_base[cons(re.sub(r' [IVX]+$','',r['root']))].add(r['root'])
def heb_root_of_lemma(lemma):
    c=[r for r in R if r['lang']=='heb' and r['kind']=='word' and cons(r['lemma'])==cons(lemma)]
    c.sort(key=lambda r:-int(r['occurrences'])); return c[0]['root'] if c else None
ar=json.load(open(D('review_aramaic_out.json')))
target={}
for a in ar:
    k=a['aramaic_root']; t=None
    if a['decision']=='merge': t=a['hebrew_root']
    elif a['decision']=='suggest-cognate' and a['confidence']=='medium':
        hr=a['hebrew_root'] or ''
        if hr in heb_by_base or any(hr==x for v in heb_by_base.values() for x in v): t=hr
        else:
            opts=heb_by_base.get(cons(hr),set())
            t=sorted(opts)[0] if len(opts)==1 else (sorted(opts)[0] if opts else None)
    target[k]=t
manual={'arc:בית':heb_root_of_lemma('בַּיִת'),'arc:פחה':heb_root_of_lemma('פֶּחָה'),'arc:כסא':heb_root_of_lemma('כִּסֵּא'),'arc:גין':heb_root_of_lemma('גִּיר'),'arc:קבל':'קדם','arc:דרע':heb_root_of_lemma('זְרוֹעַ'),'arc:דחל':heb_root_of_lemma('זָחַל'),'arc:קצא':heb_root_of_lemma('קָצֶה')}
target.update({k:v for k,v in manual.items() if v})
roots_now={r['root'] for r in R}
merged=0; unresolved=[]
for r in R:
    k=r['root']
    if k in target and target[k]:
        if target[k] in roots_now: r['notes']=(r['notes']+'; ' if r['notes'] else '')+f'Aramaic {k} merged'; r['root']=target[k]; merged+=1
        else: unresolved.append((k,target[k]))
# 3) names -> final roots of their source words
best={}
for r in R:
    s=int(r['strong'])
    if r['kind']=='word' and (s not in best or int(r['occurrences'])>int(best[s]['occurrences'])): best[s]=r
for r in R:
    if r['kind']=='name':
        rs=[best[int(x[1:])]['root'] for x in r['name_root_strongs'].split('|') if x and int(x[1:]) in best]
        r['name_roots']='|'.join(dict.fromkeys(rs))
    else: r['name_roots']=''
# root labels / glosses
gl={}
for r in R:
    if r['kind']=='word':
        if '‹' in r['root']: gl.setdefault(r['root'],r['root'].split('‹')[1].rstrip('›'))
        elif r['root_gloss']: gl.setdefault(r['root'],r['root_gloss'])
out=['strong','aug','in_db','occurrences','lemma','lang','kind','gloss','root','root_display','root_gloss','name_roots','notes','root_source','strongs_etymology','bdb_ids']
with open(OUT,'w',newline='',encoding='utf-8-sig') as fh:
    w=csv.DictWriter(fh,fieldnames=out,extrasaction='ignore'); w.writeheader()
    for r in R: r['root_gloss']=gl.get(r['root'],r['root_gloss']) if r['kind']=='word' else ''; w.writerow(r)
db=[r for r in R if r['in_db']=='yes']; W=[r for r in db if r['kind']=='word']
fam=collections.Counter(r['root'] for r in W)
print('splits created',len(split_log),'| aramaic rows merged',merged,'| unresolved',unresolved)
print('word root groups',len(fam),' multi-member',sum(1 for v in fam.values() if v>1),' singletons',sum(1 for v in fam.values() if v==1))
N=[r for r in db if r['kind']=='name']; print('names with roots',sum(bool(r['name_roots']) for r in N),'/',len(N))
for k in ['ענה I','דבר','בקר','זכר','שנה I','גוה','קדם','שלש','שוב']:
    m=[r for r in W if r['root'].startswith(k)]
    print(k, sorted({r['root'] for r in m})[:6], [(r['lemma'],r['lang']) for r in m if r['root']==k][:8])
