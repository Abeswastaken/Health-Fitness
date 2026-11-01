import json,re,os,sys
from PIL import Image
B='assets/Fitness_assets/'
x=json.load(open(B+'data/exercises.json'))
FLOOR=re.compile(r'deadlift|row|curl|romanian|stiff|hip thrust|glute bridge|floor press|upright|shrug|power clean|hang clean|rollout|good morning',re.I)
NOTFLOOR=re.compile(r'bench press|squat|lunge|military|overhead|push press|jerk|snatch|step|incline|decline|preacher|lying|seated|behind',re.I)
CABLE=re.compile(r'pulldown|pushdown|seated cable row|face pull|straight-arm|low cable|cable curl|rope|cable row',re.I)
BAD=re.compile(r'chains|bands|pins|hanging bar|blocks|behind the neck|lying cable curl|crossover',re.I)
WISH=re.compile(r'^(hack squat|leg press|narrow stance hack squats|narrow stance leg press|calf press on the leg press machine)$',re.I)
def gear(e):
    eq=set(e['equipment']);n=e['name']
    if 'neck' in e['primary_muscles'] or BAD.search(n): return None
    if WISH.search(n): return 'hack-legpress'
    if e['id']=='Goblet_Squat': return 'dumbbell'
    if eq<= {'bodyweight'}: return 'bodyweight'
    if eq<= {'bodyweight','dumbbell','ez-curl-bar'}: return 'ez-curl-bar' if 'ez-curl-bar' in eq else 'dumbbell'
    if 'barbell' in eq and FLOOR.search(n) and not NOTFLOOR.search(n): return 'barbell'
    if 'cable-machine' in eq and CABLE.search(n) and 'kneeling' not in n.lower(): return 'smith-cable'
    if ('machine-generic' in eq or 'other' in eq) and 'smith' in n.lower(): return 'smith'
    return None
out=[]
os.makedirs('proto/media',exist_ok=True)
for e in x:
    g=gear(e)
    if not g or not e['has_media']: continue
    slug=e['id']
    out.append(dict(id=slug,n=e['name'],d=e['description'],pm=e['primary_muscles'],sm=e['secondary_muscles'],lv=e['level'],df=e['difficulty'],mech=e['mechanic'],f=e['force'],cat=e['category'],g=g))
    if '--media' in sys.argv:
        t=Image.open(B+e['thumbnail']); t.thumbnail((240,240)); t.save(f'proto/media/{slug}.t.webp',quality=70)
        a=Image.open(B+e['animated']); fr=[]
        for i in range(a.n_frames):
            a.seek(i); f=a.convert('RGB'); f.thumbnail((420,420)); fr.append(f)
        fr[0].save(f'proto/media/{slug}.a.webp',save_all=True,append_images=fr[1:],duration=850,loop=0,quality=62)
json.dump(out,open('proto/exercises.json','w'),separators=(',',':'))
import collections;print(len(out),collections.Counter(o['g'] for o in out))
