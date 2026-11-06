const L=require('./logic.js'),assert=require('assert');
// jake's example: 3x5 @100, did 5,5,11 to failure, PowerBlock step 2.5 -> capped at 110
let r=L.recommend({sets:3,lo:5,hi:5,w:100},[{w:100,reps:5},{w:100,reps:5},{w:100,reps:11,fail:true}],2.5);
console.log(r); assert.equal(r.kind,'jump'); assert.equal(r.w,110);
r=L.recommend({sets:3,lo:8,hi:12,w:50},[{w:50,reps:12},{w:50,reps:12},{w:50,reps:12}],2.5); assert.equal(r.w,52.5);
r=L.recommend({sets:3,lo:8,hi:12,w:50},[{w:50,reps:9},{w:50,reps:8},{w:50,reps:8}],2.5); assert.equal(r.kind,'reps'); assert.equal(r.reps,9);
r=L.recommend({sets:3,lo:8,hi:12,w:50},[{w:50,reps:9,pain:true}],2.5); assert.equal(r.kind,'pain');
const p={sex:'male',weightLb:200,heightIn:70,age:30,activity:'moderate'};
console.log(Math.round(L.bmr(p)),Math.round(L.tdee(p)),Math.round(L.goalCalories(p,-0.5)));
assert(Math.abs(L.bmr(p)-1873)<2);
console.log(L.macrosFor(2000,'Keto'),L.macrosFor(2000,'Standard'));
const foods={a:{cal:165,p:31,c:0,f:3.6,serv:100},b:{cal:130,p:2.7,c:28,f:0.3,serv:100}};
const rec={containers:4,ing:[{foodId:'a',qty:800},{foodId:'b',qty:600}]};
const pc=L.recipePerContainer(rec,foods); console.log(pc); assert.equal(Math.round(pc.cal),525);
console.log(L.sessionCalories(p,60,null),L.sessionCalories(p,60,130));
const ex=require('./exercises.json');const byId=Object.fromEntries(ex.map(e=>[e.id,e]));
const missing=Object.values(L.STAPLES).flat().concat(L.LEG_ROTATION).filter(i=>!byId[i]);console.log('missing staples',missing);
const gear=new Set(['dumbbell','ez-curl-bar','barbell','smith','smith-cable']);
const days=[[],['Chest','Arms'],['Back','Core'],['Legs','Arms'],[],['Chest','Shoulders'],['Back','Legs']].map(g=>({groups:g}));
const tg=Object.fromEntries(L.MUSCLES.map(m=>[m,{min:10,max:20}]));
const wk=L.buildWeek({days,exById:byId,ownedGear:gear,stars:new Set(),focus:new Set(['chest']),targets:tg,dailyMin:{Legs:1}});
wk.forEach((d,i)=>console.log(i,d.map(x=>x.ex+'x'+x.sets).join(', ')));
const tot=L.setsByMuscle(wk.flat(),byId);console.log(Object.fromEntries(Object.entries(tot).map(([k,v])=>[k,v])));
const dq=L.dailyQuests('2026-11-01');assert.equal(dq.length,3);assert.deepEqual(dq,L.dailyQuests('2026-11-01'));assert.equal(new Set(dq.map(q=>q.id)).size,3);
assert.equal(L.bossFor('2026-11-01',5).hp,450);assert.equal(L.bossFor('2026-11-01',5).id,L.bossFor('2026-11-01',9).id);
assert.equal(L.bossDamage({sets:10,volume:2500,mornings:1,foodDays:1,macroDays:0,weighIns:0}),115);
let drops=0;for(let i=0;i<1000;i++)if(L.loot('s'+i))drops++;assert(drops>200&&drops<400,drops);
// jake's example: told 5 at 100, got 2, dropped to 80 and got 4 -> stay at 80, aim for 5
r=L.recommend({sets:3,lo:5,hi:6,w:100},[{w:100,reps:2},{w:80,reps:4},{w:80,reps:4}],2.5);
console.log(r.text); assert.equal(r.kind,'hold'); assert.equal(r.w,80); assert.equal(r.reps,5);
// at 80 for all three sets and hit the top -> add from 80, not from the old target
r=L.recommend({sets:3,lo:5,hi:6,w:100},[{w:80,reps:6},{w:80,reps:6},{w:80,reps:6}],2.5); assert.equal(r.w,82.5);
const exs=require('./exercises.json');const ebi=Object.fromEntries(exs.map(e=>[e.id,e]));
const me={sex:'male',weightLb:195,level:'beginner'};
const sw=id=>L.startWeight(ebi[id],me,'build');
const lat=exs.find(e=>e.g==='dumbbell'&&/Side Lateral Raise/.test(e.n));
console.log('start',lat&&L.startWeight(lat,me,'endurance'),sw('Barbell_Squat'),sw('Barbell_Bench_Press_-_Medium_Grip'),sw('Alternate_Hammer_Curl'),sw('Barbell_Deadlift'));
assert(lat&&L.startWeight(lat,me,'endurance')<=7.5); assert.equal(sw('Barbell_Squat'),67.5); assert(sw('Alternate_Hammer_Curl')<=12.5);
assert(L.startWeight(ebi['Barbell_Squat'],{...me,level:'advanced'})>sw('Barbell_Squat'));
assert.equal(L.startWeight({g:'bands',pm:['chest']},me),null);
// quick add + usually now + fill suggestion
assert.equal(L.entryMacros({quick:{cal:600,p:40,c:50,f:20},qty:1},{},{}).cal,600);
const lg=[];for(let i=1;i<=14;i++){const d=new Date(Date.UTC(2026,10,3)-i*864e5).toISOString().slice(0,10);lg.push({date:d,meal:'Breakfast',foodId:'oats',qty:1});if(i%7===0)lg.push({date:d,meal:'Breakfast',foodId:'eggs',qty:2});}
lg.push({date:'2026-11-03',meal:'Breakfast',foodId:'eggs',qty:1});
const un=L.usuallyNow(lg,'Breakfast','2026-11-03');console.log('usually',un.map(x=>x.key+':'+x.n));assert.equal(un[0].key,'oats');assert(!un.some(x=>x.key==='eggs'));
const fs=L.fillSuggestion({cal:300,p:40},[{id:'a',name:'yogurt',cal:100,p:17},{id:'b',name:'chips',cal:250,p:3},{id:'c',name:'steak',cal:500,p:60}]);assert.equal(fs.id,'a');
assert.equal(L.fillSuggestion({cal:30,p:5},[{id:'a',cal:20,p:3}]),null);

// Peptides (jake's worksheet numbers)
assert.equal(L.pepConc(60,6),10);assert.equal(L.pepUnits(2,10),20);assert.equal(Math.round(L.pepUnits(0.25,5)),5);assert.equal(Math.round(L.pepUnits(0.3,5)),6);
assert.equal(L.pepUnits(1,5),20);assert.equal(L.pepDoseFromUnits(40,10),4);assert.equal(L.pepBacFor(60,2,20),6);
assert.deepEqual(L.pepSyringe(20,[50,100]),{cap:50,draws:1});assert.deepEqual(L.pepSyringe(60,[50,100]),{cap:100,draws:1});assert.deepEqual(L.pepSyringe(120,[50,100]),{cap:100,draws:2});
// 2026-11-02 is a Monday
const rt={id:'rt',kind:'days',days:[1],start:'2026-11-02',dose:4,missWin:4};
assert(L.pepIsDue(rt,'2026-11-09'));assert(!L.pepIsDue(rt,'2026-11-10'));
const split={...rt,id:'sp',days:[1,4],doseMode:'week'};assert.equal(L.pepDose(split,'2026-11-05'),2);
const cgl={id:'c',kind:'days',days:[1],start:'2026-11-02',ladder:[{dose:0.5,weeks:2},{dose:1,weeks:2},{dose:1.5,weeks:2}]};
assert.equal(L.pepBaseDose(cgl,'2026-11-09'),0.5);assert.equal(L.pepBaseDose(cgl,'2026-11-16'),1);assert.equal(L.pepBaseDose(cgl,'2027-03-01'),1.5);assert.equal(L.pepStep(cgl,'2026-11-30'),2);
const b12={id:'b',kind:'load',days:[1],loadWeeks:4,start:'2026-11-04'};// Wed start: first Monday is 11-09
const b12d=[];for(let d='2026-11-01';d<='2027-01-31';d=L.pepAddDays(d,1))if(L.pepIsDue(b12,d))b12d.push(d);
assert.deepEqual(b12d,['2026-11-09','2026-11-16','2026-11-23','2026-11-30','2026-12-07','2027-01-04']);
const ev={id:'e',kind:'every',n:3,start:'2026-11-02'};assert(L.pepIsDue(ev,'2026-11-08'));assert(!L.pepIsDue(ev,'2026-11-07'));
assert.equal(L.pepDueOn([rt,ev],'2026-11-02').length,2);
// Missed Monday: late on Wed (2 days), gone by Sat (5 days > 4), and logged doses aren't late.
assert.equal(L.pepLate([rt],[],'2026-11-11')[0].late,2);assert.equal(L.pepLate([rt],[],'2026-11-14').length,0);
assert.equal(L.pepLate([rt],[{key:'rt|2026-11-09'}],'2026-11-11').length,0);assert.equal(L.pepLate([rt],[],'2026-11-09').length,0);
const vs=L.pepVial({id:'v',mg:60,ml:6,mixed:'2026-11-02',useDays:28},[{vialId:'v',dose:4,status:'done'},{vialId:'v',dose:4,status:'skipped'}],'2026-11-10');
assert.equal(vs.left,56);assert.equal(vs.expires,'2026-11-30');assert.equal(vs.daysLeft,20);assert.equal(L.pepNeed(rt,'2026-11-10','2026-11-30'),12);
assert.equal(L.pepNextSite(['a','b','c'],[{site:'a',date:'2026-11-02',status:'done'},{site:'b',date:'2026-11-03',status:'done'}]),'c');
assert.equal(L.pepNextSite(['a','b'],[{site:'a',date:'2026-11-02',status:'done'},{site:'b',date:'2026-11-03',status:'done'}]),'a');
console.log('ok');
