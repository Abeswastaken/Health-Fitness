import json,re
W='wg/repo/packages/workout-guide/'
m=json.load(open(W+'manifest.json'))
ex=json.load(open('proto/exercises.json'))
SYN={'pushup':'push','pullup':'pull','chinup':'chin','lateral':'side','fly':'flye','flyes':'flye','flys':'flye','crusher':'skullcrusher','skull':'skullcrusher','bentover':'bent','rdl':'romanian','dip':'dip','dips':'dip','situp':'sit','raises':'raise','curls':'curl','rows':'row','presses':'press','squats':'squat','lunges':'lunge','extensions':'extension','pulldowns':'pulldown','pushdowns':'pushdown','crunches':'crunch','pushups':'push','pullups':'pull','dumbbells':'dumbbell'}
STOP={'the','a','with','on','and','to','up','over','s','of','version','exercise'}
def toks(s):
    s=s.lower().replace('push-up','pushup').replace('pull-up','pullup').replace('chin-up','chinup').replace('sit-up','situp').replace('bent-over','bentover').replace('ez-bar','ez').replace('ez bar','ez').replace('e-z','ez')
    t=re.findall(r'[a-z0-9]+',s)
    return {SYN.get(w,w) for w in t if w not in STOP}
EQ={'Barbell':'barbell','Dumbbell':'dumbbell','Cable':'cable','Machine':'machine','Bodyweight':'','Kettlebell':'kettlebell','EZ Bar':'ez','Band':'band','Plate':'plate','Smith Machine':'smith','Cardio':''}
best={}
for a in m:
    ta=toks(a['name'])|({EQ.get(a.get('equipment'),'')}-{''})
    for e in ex:
        te=toks(e['n'])
        if 'dumbbell' not in ta and 'barbell' not in ta and e['g'] in('dumbbell',) and 'dumbbell' not in toks(a['name']) : te=te|{'dumbbell'}
        MODS={'reverse','close','wide','upright','hack','decline','incline','preacher','front','single','one','lying','overhead','sumo','cable','smith','machine','ez','hammer','jump','push','calf','rear','side','straight','kneeling','pike','feet','elevated','wrist','concentration','spider','drag','zottman','assisted','walking','goblet','bulgarian','pistol','box'}
        if (toks(a['name'])^toks(e['n']))&MODS: continue
        j=len(ta&te)/len(ta|te)
        if j>=0.6 and (e['id'] not in best or j>best[e['id']][0]): best[e['id']]=(j,a['slug'],a['name'])
used={}
for k,(j,s,n) in sorted(best.items(),key=lambda x:-x[1][0]):
    used.setdefault(k,s)
OV={'Triceps_Pushdown':'tricep-pushdown','Wide-Grip_Lat_Pulldown':'lat-pulldown','Dumbbell_Lunges':'forward-lunge','Barbell_Curl':'ez-bar-curl','Dumbbell_Squat':None,'EZ-Bar_Skullcrusher':'skull-crusher','Smith_Machine_Calf_Raise':'standing-calf-raise','Standing_Dumbbell_Calf_Raise':'standing-calf-raise','Stiff-Legged_Dumbbell_Deadlift':'dumbbell-romanian-deadlift','Bent_Over_Barbell_Row':'barbell-row'}
slugs={a['slug'] for a in m}
for k,v in OV.items():
    if v is None: used.pop(k,None)
    elif v in slugs: used[k]=v
    else: print('no slug',v)
print(len(used))
ex_by={e['id']:e['n'] for e in ex}
for k,s in list(used.items()): print(f'{ex_by[k]:45s} <- {s}')
json.dump(used,open('art_map.json','w'))
