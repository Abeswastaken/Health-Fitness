import json,re,sys
ek=json.load(open('ek/repo/dist/exercises.json'))
ex=json.load(open('proto/exercises.json'))
SYN={'pushup':'push','pullup':'pull','chinup':'chin','lateral':'side','fly':'flye','flyes':'flye','flys':'flye','bentover':'bent','raises':'raise','curls':'curl','rows':'row','presses':'press','squats':'squat','lunges':'lunge','extensions':'extension','pulldowns':'pulldown','pushdowns':'pushdown','crunches':'crunch','pushups':'push','pullups':'pull','dumbbells':'dumbbell','barbells':'barbell','triceps':'tricep','biceps':'bicep','deadlifts':'deadlift'}
STOP={'the','a','with','on','and','to','up','over','s','of','version','exercise','grip','medium'}
def toks(s):
    s=s.lower().replace('push-up','pushup').replace('pull-up','pullup').replace('chin-up','chinup').replace('sit-up','situp').replace('bent-over','bentover').replace('ez-bar','ez').replace('e-z','ez')
    return {SYN.get(w,w) for w in re.findall(r'[a-z0-9]+',s) if w not in STOP}
EQMAP={'barbell':'barbell','dumbbell':'dumbbell','cable':'cable','kettlebell':'kettlebell','smith':'smith','ez':'ez','body':''}
MODS={'reverse','close','wide','upright','hack','decline','incline','preacher','front','single','one','lying','overhead','sumo','cable','smith','machine','ez','hammer','jump','calf','rear','side','straight','kneeling','pike','elevated','wrist','concentration','spider','zottman','assisted','walking','goblet','bulgarian','pistol','box','seated','standing','alternating','alternate','bar','band','kettlebell','barbell','dumbbell'}
best={}
for a in ek:
    ta=toks(a['title'])|{EQMAP.get(q,q) for q in a.get('equipment',[]) if EQMAP.get(q,q)}
    for e in ex:
        te=toks(e['n'])|({e['g'].replace('ez-curl-bar','ez').replace('smith-cable','cable').replace('cable-tower','cable')}-{'bodyweight','plates','pullup','rack'})
        if (ta^te)&MODS: continue
        j=len(ta&te)/len(ta|te)
        if j>=0.6 and (e['id'] not in best or j>best[e['id']][0]): best[e['id']]=(j,a['id'],a['title'])
for k,(j,i,t) in sorted(best.items(),key=lambda x:-x[1][0]): print(f'{j:.2f} {k:45s} <- {i} {t}')
json.dump({k:v[1] for k,v in best.items()},open('ek_map.json','w'))
print(len(best))
