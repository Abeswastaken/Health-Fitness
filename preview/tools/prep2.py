import json,re,os,base64,io,sys,collections
from PIL import Image
B='assets/Fitness_assets/'
x=json.load(open(B+'data/exercises.json'))
FLOOR=re.compile(r'deadlift|row|curl|romanian|stiff|hip thrust|glute bridge|floor press|upright|shrug|power clean|hang clean|rollout|good morning',re.I)
NOTFLOOR=re.compile(r'bench press|squat|lunge|military|overhead|push press|jerk|snatch|step|incline|decline|preacher|lying|seated|behind',re.I)
SMITHCABLE=re.compile(r'pulldown|pushdown|seated cable row|face pull|straight-arm|low cable|cable curl|rope|cable row',re.I)
BAD=re.compile(r'chains|reverse band|pins|hanging bar|blocks|behind the neck|neck|atlas|keg|log lift|yoke|conan|circus|car deadlift|rickshaw|sandbag|tire flip|axle',re.I)
OTHER=[(r'leg press|hack squat|calf press','hack-legpress'),(r'leg extension|leg curl','legext'),(r'parallel bar|^dips|dip machine|ring dips','dip'),
 (r'box jump|box skip|box shuffle|high box|depth jump|power stairs|front box','box'),(r'plate|svend','plates'),(r'treadmill','treadmill'),(r'bicycling|recumbent','bike'),
 (r'rowing, stationary','rower'),(r'elliptical|stairmaster|step mill','cardio-machine'),(r'rope jumping','jumprope'),(r'^ab roller','wheel'),(r'heavy bag','bag'),
 (r'suspended|with straps','trx'),(r'hyperextension|glute ham','hyper'),(r'sled|prowler','sled'),(r'chin|muscle up|pull-?ups|one handed hang|rope climb|otis','pullup'),
 (r'trap bar','trapbar'),(r'battling ropes','ropes'),(r"farmer",'dumbbell'),(r'smr','foam-roller'),(r'stretch|chair|london|balance board|skating|hops?|leap|sprint|jump|push-off|bear crawl','bodyweight')]
EQMAP={'kettlebell':'kettlebell','resistance-bands':'bands','medicine-ball':'medball','exercise-ball':'ball','foam-roller':'foam-roller'}
def gear(e):
    eq=set(e['equipment']);n=e['name']
    if 'neck' in e['primary_muscles'] or BAD.search(n): return None
    if e['id']=='Goblet_Squat': return 'dumbbell'
    if eq<={'bodyweight'}:
        if re.search(r'^dips|parallel bar',n,re.I): return 'dip'
        if re.search(r'pull-?up|chin-?up|hanging',n,re.I): return 'pullup'
        return 'bodyweight'
    if eq<={'bodyweight','dumbbell','ez-curl-bar'}: return 'ez-curl-bar' if 'ez-curl-bar' in eq else 'dumbbell'
    if 'barbell' in eq: return 'barbell' if FLOOR.search(n) and not NOTFLOOR.search(n) else 'rack'
    if 'cable-machine' in eq: return 'smith-cable' if SMITHCABLE.search(n) and 'kneeling' not in n.lower() else 'cable-tower'
    if 'smith' in n.lower(): return 'smith'
    for k,v in EQMAP.items():
        if k in eq: return v
    if 'machine-generic' in eq or 'other' in eq:
        for p,g in OTHER:
            if re.search(p,n,re.I): return g
        return None
    return None
out=[];packs=[{} for _ in range(6)]
for i,e in enumerate(x):
    g=gear(e)
    if not g or not e['has_media']: continue
    out.append(dict(id=e['id'],n=e['name'],d=e['description'],pm=e['primary_muscles'],sm=e['secondary_muscles'],lv=e['level'],df=e['difficulty'],mech=e['mechanic'],f=e['force'],cat=e['category'],g=g))
    if '--media' in sys.argv:
        a=Image.open(B+e['animated']); fr=[]
        for k in range(a.n_frames):
            a.seek(k); f=a.convert('RGB'); f.thumbnail((360,360)); bio=io.BytesIO(); f.save(bio,'WEBP',quality=55); fr.append(base64.b64encode(bio.getvalue()).decode())
        packs[len(out)%6][e['id']]=fr
json.dump(out,open('proto/exercises.json','w'),separators=(',',':'))
if '--media' in sys.argv:
    for f in os.listdir('proto'):
        if f.startswith('media') and f.endswith('.json'): os.remove('proto/'+f)
    for i,p in enumerate(packs): json.dump(p,open(f'proto/media{i}.json','w'),separators=(',',':'))
print(len(out),collections.Counter(o['g'] for o in out))
