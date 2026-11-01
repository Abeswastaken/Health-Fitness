import json,re
m=json.load(open('ek_map.json'))
for k in ['Incline_Dumbbell_Press','Seated_Dumbbell_Press','Dumbbell_Incline_Shoulder_Raise','Barbell_Guillotine_Bench_Press','One_Arm_Supinated_Dumbbell_Triceps_Extension']: m.pop(k,None)
ex={e['id'] for e in json.load(open('proto/exercises.json'))}
OV={'Pushups':'0077','Dumbbell_Flyes':'0056','Pullups':'0087','Chin-Up':'0089','Inverted_Row':'0086','Superman':'0105','Dumbbell_Shrug':'0005','Barbell_Shrug':'0030','Seated_Side_Lateral_Raise':'0018','Hack_Squat':'0123','Bench_Dips':'0162','Dumbbell_Shoulder_Press':'0012','Seated_Cable_Rows':'0025','Barbell_Squat':'0122','Dips_-_Triceps_Version':'0172','Dips_-_Chest_Version':'0054','Front_Squat_(Clean_Grip)':'0138'}
for k,v in OV.items():
    if k in ex: m[k]=v
    else: print('no ex',k)
out={}
for k,i in m.items():
    import os
    if not all(os.path.exists(f'ek/repo/dist/svg/{i}-{t}.svg') for t in ('relaxation','tension')):
        print('skip',k,i);continue
    fr=[]
    for t in ('relaxation','tension'):
        s=open(f'ek/repo/dist/svg/{i}-{t}.svg').read()
        s=re.sub(r'<g fill="#FFF">.*?</g>','',s,flags=re.S)
        s=s.replace('fill="#333"','fill="currentColor"')
        s=re.sub(r'\s(width|height)="[^"]*"','',s,count=2)
        s=re.sub(r'(\d+\.\d)\d+',r'\1',s)
        fr.append(s)
    out[k]=fr
json.dump(out,open('proto/ek0.json','w'),separators=(',',':'))
json.dump(m,open('ek_map.json','w'))
print(len(out))
