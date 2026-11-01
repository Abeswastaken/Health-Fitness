
  // ----- Train -----
  SCREENS['train:today'] = () => {
    const ws = todaysWorkout();
    return ws.map((w, i) => `<div class="card" data-k="today-${w.kind}"><div class="row"><h2 class="grow" style="gap:6px">${esc(w.name)}${w.done ? '<span class="badge good">Done</span>' : w.off ? '<span class="badge alert">Skipped</span>' : ''}</h2><span class="tiny muted">${w.time}</span></div>
      ${w.off ? '<div class="small muted">Cancelled for today.</div>' : bullets(w.items, { act: 'openEx' })}
      ${w.done || w.off ? '' : `<div class="row"><button class="btn sm" data-act="startWorkout" data-i="${i}">Start</button>${w.kind === 'morning' ? `<button class="btn sm ghost" data-act="morningToggle" data-d="${today}">Skip today</button>` : `<button class="btn sm ghost" data-act="editDay" data-i="${dow(today)}">Edit</button>`}</div>`}</div>`).join('') +
      `<div class="card" data-k="ai-generate"><h2>Generate a workout</h2><input class="f" placeholder="e.g. chest day with dumbbells, 45 min" id="genq"><button class="btn soft sm" data-act="bridge" data-v="workout" style="align-self:flex-start">${ic('spark')}Generate (AI or copy-paste)</button></div>`;
  };

  SCREENS['train:week'] = () => {
    const start = weekStart();
    return `${S.days.map((d, i) => { const items = S.planWeek?.[i] || []; const date = dateAdd(start, i); return `<div class="card day" data-k="day-card"><div class="row"><h2 class="grow">${DAYS[i]} <span class="tiny muted">${shortDate(date)}</span>${date === today ? '<span class="badge info">Today</span>' : ''}</h2><span class="small muted num">${d.off ? 'Rest' : items.reduce((a, x) => a + x.sets, 0) + ' sets'}</span>${sw(!d.off, 'dayOn', `data-i="${i}" aria-label="Train on ${DAYS[i]}"`)}</div>
        ${d.off ? '' : `<div class="chips">${GROUPS.map(g => `<button class="chip sm ${d.groups.includes(g) ? 'on' : ''}" data-act="dayGroup" data-i="${i}" data-v="${g}">${g}</button>`).join('')}</div>`}
        ${bullets(items, { act: 'openEx' })}
        <div class="row tiny">${d.off && !items.length ? '' : `<button class="btn sm ghost" data-act="editDay" data-i="${i}">${ic('edit')}Edit exercises</button>`}<span class="grow"></span><span class="muted">Morning ${S.morning.time}</span>${sw(S.morning.on && !S.morning.off.includes(date), 'morningToggle', `data-d="${date}" aria-label="Morning movement ${DAYS[i]}"`)}</div></div>`; }).join('')}
      <div class="card" data-k="daily-min"><h2>Daily minimum</h2><div class="small muted">A little of a muscle every day so it never gets skipped. Rotates the move.</div>
        ${GROUPS.map(g => `<div class="row small"><span class="grow">${g}</span>${stepper('dmin', S.dailyMin[g] || 0, `data-g="${g}"`, ' set')}</div>`).join('')}</div>
      <div class="row"><button class="btn block" data-act="rebuild">${ic('spark')}Rebuild week</button><button class="btn soft" data-act="goBalance">Coach check</button></div>
      <div class="tiny muted">Want a different split? Pick one in Programs, or build your own there.</div>`;
  };
  const stepper = (act, v, extra = '', unit = '') => `<span class="stepper"><button class="iconbtn sm" data-act="${act}" data-v="-1" ${extra} aria-label="Less">${ic('minus')}</button><span class="num">${v}${unit ? unit + (v === 1 ? '' : 's') : ''}</span><button class="iconbtn sm" data-act="${act}" data-v="1" ${extra} aria-label="More">${ic('plus')}</button></span>`;

  // Coach suggestions for a week (plain code). Shared by Balance and the plan builder.
  function coachList(week, days, ctx) {
    const items = L.planCheck({ week, days, exById: EXB, targets: S.targets, focus: new Set(S.focus) }).filter(x => !(ctx === 'week' && S.dismissed.includes('pc-' + x.id)));
    return items.length ? items.map(x => `<div class="sugg" data-k="coach-sugg"><div class="row">${level(x.level)}<b class="grow small">${esc(x.title)}</b></div><div class="tiny muted">${esc(x.detail)}</div>
      <div class="row">${x.fix ? `<button class="btn sm" data-act="applyFix" data-ctx="${ctx}" data-id="${x.id}">${x.fix.type === 'addSets' ? 'Add a set' : 'Trim a set'}</button>` : ''}${ctx === 'week' ? `<button class="btn sm ghost" data-act="dismiss" data-id="pc-${x.id}">Dismiss</button>` : ''}</div></div>`).join('') : '<div class="small">Looks well rounded. Nothing to change.</div>';
  }
  function applyFix(week, days, fix) {
    const m = fix.muscle;
    const cands = [];
    week.forEach((d, i) => d.forEach((it, k) => { if (!it.daily && EXB[it.ex]?.pm.includes(m)) cands.push({ i, k, it }); }));
    if (fix.type === 'cutSets') { const c = cands.sort((a, b) => b.it.sets - a.it.sets)[0]; if (c) { c.it.sets = Math.max(1, c.it.sets - 1); return `${exName(c.it.ex)} on ${DAYS[c.i]}: one fewer set.`; } return 'Nothing to trim.'; }
    const c = cands.filter(x => x.it.sets < 5).sort((a, b) => a.it.sets - b.it.sets)[0];
    if (c) { c.it.sets++; return `${exName(c.it.ex)} on ${DAYS[c.i]}: one more set.`; }
    const g = L.groupOf(m), own = ownedGear(), used = new Set(week.flat().map(x => x.ex));
    const pool = [...(L.STAPLES[m] || []), ...EX.filter(e => e.pm[0] === m && e.cat === 'strength').map(e => e.id)].filter(id => EXB[id] && L.available(EXB[id], own) && !used.has(id));
    if (!pool.length) return 'No exercise for that muscle with your gear.';
    let i = days.findIndex((d, k) => !d.off && d.groups.includes(g));
    if (i < 0) i = days.map((d, k) => k).filter(k => !days[k].off).sort((a, b) => week[a].length - week[b].length)[0];
    if (i === undefined || i < 0) return 'Turn on a training day first.';
    week[i].push({ ex: pool[0], sets: 3, scheme: EXB[pool[0]].mech === 'compound' ? 'build' : 'endurance' });
    return `Added ${exName(pool[0])} to ${DAYS[i]}.`;
  }

  SCREENS['train:balance'] = () => {
    const planned = L.setsByMuscle((S.planWeek || []).flat(), EXB);
    const doneItems = sessionsThisWeek().flatMap(s => s.sets.map(x => ({ ex: x.ex, sets: 1 })));
    const done = L.setsByMuscle(doneItems, EXB);
    const mx = 26;
    const push = L.PUSH.reduce((a, m) => a + planned[m], 0), pull = L.PULL.reduce((a, m) => a + planned[m], 0);
    return `<div class="card" data-k="balance-coach"><h2>${ic('spark', 'class="inl"')} Coach suggestions</h2><div class="small muted">Push ${r0(push)} vs pull ${r0(pull)} sets planned. Tap a fix to change your week; it rebuilds nothing else.</div>
      ${coachList(S.planWeek || [], S.days, 'week')}
      <button class="btn soft sm" data-act="bridge" data-v="plan" style="align-self:flex-start">${ic('spark')}Ask AI coach for more</button></div>
      <div class="card" data-k="balance-bars"><div class="row tiny muted"><span class="grow">Sets per week · helper muscle = ½ set</span><span><span class="dot" style="background:var(--a-accent)"></span> done</span><span><span class="dot" style="background:color-mix(in srgb,var(--a-accent) 35%,transparent)"></span> planned</span></div>
      ${Object.entries(L.GROUPS).map(([g, ms]) => `<div class="tiny muted" style="margin-top:6px">${g}</div>${ms.filter(m => L.TARGETED.includes(m) || planned[m] > 0).map(m => { const t = S.targets[m], st = L.balanceStatus(planned[m], t); return `<div class="row small tap" data-act="muscleTarget" data-m="${m}"><button class="iconbtn sm star ${S.focus.includes(m) ? 'on' : ''}" data-act="focus" data-m="${m}" aria-label="Focus ${m}">${ic('star')}</button><span style="width:80px">${L.cap(m)}</span>
        <div class="bar grow" style="height:14px"><span style="position:absolute;left:${t.min / mx * 100}%;width:${(t.max - t.min) / mx * 100}%;top:0;bottom:0;background:color-mix(in srgb,var(--a-good) 16%,transparent)"></span><i style="position:absolute;width:${Math.min(100, planned[m] / mx * 100)}%;background:color-mix(in srgb,var(--a-accent) 35%,transparent)"></i><i style="position:absolute;width:${Math.min(100, done[m] / mx * 100)}%;background:var(--a-accent)"></i></div>
        <span class="num tiny" style="width:52px;text-align:right">${r1(done[m])}/${r1(planned[m])}</span><span class="badge ${st === 'on' ? 'good' : st === 'under' ? 'warn' : 'info'}" style="width:46px;text-align:center">${st}</span></div>`; }).join('')}`).join('')}
      <div class="tiny muted">Green band = target range. Star a muscle to focus it. Tap a row to change its range.</div></div>`;
  };

  // ----- Programs -----
  const SPLITS = {
    'Your split': DEFAULT_DAYS,
    'Push/Pull/Legs': [[], ['Chest', 'Shoulders', 'Arms'], ['Back', 'Arms'], ['Legs', 'Core'], [], ['Chest', 'Shoulders', 'Arms'], ['Back', 'Legs']],
    'Upper/Lower': [[], ['Chest', 'Back', 'Shoulders', 'Arms'], ['Legs', 'Core'], [], ['Chest', 'Back', 'Shoulders', 'Arms'], ['Legs', 'Core'], []],
    'Full body 3x': [[], ['Chest', 'Back', 'Legs', 'Core'], [], ['Shoulders', 'Back', 'Legs', 'Arms'], [], ['Chest', 'Legs', 'Core'], []],
    'Bro split': [[], ['Chest'], ['Back'], ['Shoulders', 'Core'], ['Arms'], ['Legs'], []],
  };
  const PROGRAMS = [
    ['Your split', 'Chest+Arms, Back+Core, Legs+Arms, Chest+Shoulders, Back+Legs', 'Your split', 'beginner', { Legs: 1 }],
    ['Full body 3x (beginner)', 'Three full-body days. The best place to start.', 'Full body 3x', 'beginner'],
    ['Upper/Lower 4x', 'Two upper, two lower days.', 'Upper/Lower', 'beginner'],
    ['Push/Pull/Legs', 'Five days, each muscle about twice.', 'Push/Pull/Legs', 'intermediate'],
    ['Bro split', 'One muscle group a day.', 'Bro split', 'intermediate'],
    ['Legs every day', 'Your split plus 2 leg sets daily for consistency.', 'Your split', 'beginner', { Legs: 2 }],
    ['PowerBlock only', 'Full body with just dumbbells and a bench.', 'Full body 3x', 'beginner', null, ['dumbbell']],
    ['Bodyweight + pull-up bar', 'Travel or no-gear weeks.', 'Full body 3x', 'beginner', null, ['pullup']],
    ['Floor barbell strength', 'Deadlift, rows and floor press, Smith for squat and bench.', 'Upper/Lower', 'intermediate'],
    ['Morning movement only', '10 minutes a day, nothing else.', null, 'beginner'],
  ];
  const progCache = {};
  const splitDays = name => (SPLITS[name] || [[], [], [], [], [], [], []]).map(g => ({ groups: [...g], off: !g.length, time: '7:00 PM' }));
  function programWeek(i) {
    if (progCache[i]) return progCache[i];
    const p = PROGRAMS[i];
    const gear = p[5] ? new Set(['bodyweight', ...p[5]]) : undefined;
    return (progCache[i] = buildFor(splitDays(p[2]), p[4] || {}, { gear }));
  }
  const weekBullets = (week, days) => days.map((d, i) => week[i]?.length ? `<div class="wkday"><div class="tiny"><b>${DAYS[i]}</b> <span class="muted">${d.groups.join(' + ') || 'Daily minimum'}</span></div>${bullets(week[i], { act: 'openEx' })}</div>` : '').join('') || '<div class="small muted">Morning movement only.</div>';
  SCREENS['train:programs'] = () => `
    <div class="card" data-k="build-own"><h2>Build your own</h2>
      <button class="choice" data-act="wizStart" data-v="own"><b>Create my own</b><span class="tiny muted">Pick the days, muscles and exercises yourself. The coach can check it if you want.</span></button>
      <button class="choice" data-act="wizStart" data-v="coach"><b>Create my own, coach assisted</b><span class="tiny muted">Answer 4 questions. The coach drafts a week, you edit it, the coach reviews it. Repeat until you like it.</span></button></div>
    ${S.myPrograms.length ? `<div class="tiny muted">My plans</div>${S.myPrograms.map((p, i) => { const open = U.progOpen['m' + i]; return `<div class="card" data-k="my-program"><h2 class="tap" data-act="progOpen" data-v="m${i}">${esc(p.name)}<span class="sp"></span><span class="badge">${p.days.filter(d => !d.off).length} days</span>${chev(open)}</h2>${open ? weekBullets(p.week, p.days) : `<div class="tiny muted">${p.days.map((d, k) => d.off ? '' : DAYS[k] + ' ' + d.groups.join('+')).filter(Boolean).join(' · ')}</div>`}<div class="row"><button class="btn sm soft" data-act="useMine" data-i="${i}">Use this plan</button><button class="btn sm ghost" data-act="editMine" data-i="${i}">Edit</button><button class="btn sm ghost" data-act="delMine" data-i="${i}">Delete</button></div></div>`; }).join('')}` : ''}
    <div class="tiny muted">Ready-made programs (built from the gear you own)</div>
    ${PROGRAMS.map((p, i) => { const open = U.progOpen[i]; return `<div class="card" data-k="program"><h2 class="tap" data-act="progOpen" data-v="${i}">${esc(p[0])}<span class="sp"></span><span class="badge">${p[3]}</span>${chev(open)}</h2><div class="small muted">${esc(p[1])}</div>
      ${open ? (EX.length ? weekBullets(programWeek(i), splitDays(p[2])) : '') : ''}
      <div class="row"><button class="btn sm soft" data-act="adopt" data-i="${i}">Use this program</button>${open ? '' : `<button class="btn sm ghost" data-act="progOpen" data-v="${i}">Show the week</button>`}</div></div>`; }).join('')}`;

  // ----- Exercises -----
  SCREENS['train:library'] = () => {
    const own = ownedGear(), list0 = exerciseList({ q: U.libQ, group: U.libGroup, mine: U.libMine, star: U.libStar });
    const shown = list0.slice(0, 60);
    return `<div class="row" data-k="lib-search"><input class="f" placeholder="Search ${EX.length} exercises" value="${esc(U.libQ)}" data-in="libq" id="libq"></div>
      <div class="chips" data-k="lib-filters"><button class="chip ${U.libMine ? 'on' : ''}" data-act="libMine">My gear</button><button class="chip ${U.libStar ? 'on' : ''}" data-act="libStar">★ Starred</button>${['All', ...GROUPS, 'Stretch'].map(g => `<button class="chip ${U.libGroup === g ? 'on' : ''}" data-act="libGroup" data-v="${g}">${g}</button>`).join('')}</div>
      <div class="card" data-k="lib-list"><div class="tiny muted">${list0.length} exercises${list0.length > 60 ? ', showing 60' : ''}</div><div class="list">${shown.map(e => exRow(e, 'openEx', own)).join('')}</div></div>`;
  };
  function exerciseList({ q = '', group = 'All', mine = true, star = false, muscle = null }) {
    const own = ownedGear(), s = q.toLowerCase().trim();
    let list = EX.filter(e => e.cat !== 'stretching' || group === 'Stretch');
    if (mine) list = list.filter(e => L.available(e, own));
    if (star) list = list.filter(e => S.stars.includes(e.id));
    if (muscle) list = list.filter(e => e.pm.includes(muscle));
    if (group !== 'All') list = group === 'Stretch' ? EX.filter(e => e.cat === 'stretching') : list.filter(e => e.pm.some(m => L.GROUPS[group].includes(m)));
    if (s) list = list.filter(e => e.n.toLowerCase().includes(s) || e.pm.join(' ').includes(s) || (e.g || '').includes(s));
    const staples = new Set(Object.values(L.STAPLES).flat());
    const rank = e => (S.stars.includes(e.id) ? 0 : staples.has(e.id) ? 1 : (EK[e.id] || ART[e.id]) ? 2 : e.cat === 'strength' && e.lv === 'beginner' ? 3 : e.cat === 'strength' ? 4 : 5);
    return list.slice().sort((a, b) => rank(a) - rank(b) || a.n.localeCompare(b.n));
  }
  const exRow = (e, act, own, extra = '') => { const avail = L.available(e, own); return `<div class="li" data-act="${act}" data-id="${e.id}" ${extra} style="${avail ? '' : 'opacity:.55'}">${exThumb(e.id)}<div class="grow"><div class="small">${esc(e.n)}</div><div class="tiny muted">${e.pm.map(L.cap).join(', ')} · ${e.lv}${avail ? '' : ' · needs ' + esc(gearName(e.g))}</div></div><button class="iconbtn sm star ${S.stars.includes(e.id) ? 'on' : ''}" data-act="star" data-id="${e.id}" aria-label="Star">${ic('star')}</button></div>`; };
  const gearName = g => EQUIPMENT.find(e => e.gear === g)?.name.toLowerCase() || g;

  // ----- Gear -----
  function unlockRanking() {
    const own = ownedGear(), seen = new Set();
    return EQUIPMENT.filter(e => e.gear && !own.has(e.gear) && S.equipment[e.id] !== 'own').filter(e => !seen.has(e.gear) && seen.add(e.gear)).map(e => {
      const list = EX.filter(x => x.g === e.gear);
      const legs = list.filter(x => x.pm.some(m => LEG.has(m))).length;
      const str = list.filter(x => x.cat === 'strength').length;
      return { e, n: list.length, legs, str, score: str * 1.5 + list.length + legs * 0.5 };
    }).filter(x => x.n).sort((a, b) => b.score - a.score);
  }
  SCREENS['train:equipment'] = () => {
    const own = ownedGear(), rank = unlockRanking();
    const card = e => { const st = S.equipment[e.id]; const n = e.gear && !own.has(e.gear) ? EX.filter(x => x.g === e.gear).length : 0; return `<div class="eq ${st === 'own' ? 'own' : ''}" data-act="eqTap" data-id="${e.id}" data-k="eq-${e.id}">${eqArt(e)}<div class="small" style="font-weight:600">${esc(e.name)}</div><div class="tiny muted">${esc(e.note || '')}</div>${st === 'own' ? `<span class="badge good">Owned</span>` : n ? `<span class="badge ${st === 'wish' ? 'info' : ''}">${st === 'wish' ? 'Wishlist · ' : ''}+${n} exercises</span>` : `<span class="badge">${st === 'wish' ? 'Wishlist' : 'Not owned'}</span>`}</div>`; };
    return `<div class="card" data-k="unlock-rank"><h2>${ic('trophy', 'class="inl"')} If I buy this…</h2><div class="tiny muted">Ranked by how many new exercises each piece opens up with what you already own. Tap one to see the list.</div>
        <ol class="rank">${rank.slice(0, 8).map(x => `<li data-act="unlocks" data-id="${x.e.id}"><span class="rsvg">${eqArt(x.e)}</span><span class="grow"><b class="small">${esc(x.e.name)}</b><span class="tiny muted">${x.str} strength moves${x.legs ? ` · ${x.legs} for legs` : ''}${S.equipment[x.e.id] === 'wish' ? ' · on your wishlist' : ''}</span></span><b class="num">+${x.n}</b></li>`).join('')}</ol></div>
      <div class="card" data-k="eq-ai"><div class="small muted">Got new gear? Snap it or paste a shopping link.</div><div class="row"><button class="btn sm soft" data-act="bridge" data-v="eqphoto">${ic('camera')}From photo</button><button class="btn sm ghost" data-act="bridge" data-v="eqlink">From link</button></div></div>
      <h3 class="sect">Owned · ${EX.filter(e => L.available(e, own)).length} exercises available</h3><div class="eqgrid">${EQUIPMENT.filter(e => S.equipment[e.id] === 'own').map(card).join('')}</div>
      <h3 class="sect">Wishlist</h3><div class="eqgrid">${EQUIPMENT.filter(e => S.equipment[e.id] === 'wish').map(card).join('') || '<div class="muted small">Empty</div>'}</div>
      ${EQ_CATS.map(c => { const items = EQUIPMENT.filter(e => S.equipment[e.id] === 'none' && e.cat === c); return items.length ? `<h3 class="sect">${c}</h3><div class="eqgrid">${items.map(card).join('')}</div>` : ''; }).join('')}`;
  };

  // ----- History -----
  SCREENS['train:history'] = () => {
    const ss = [...S.sessions].sort((a, b) => b.date.localeCompare(a.date) || (b.morning ? -1 : 1)).slice(0, 30);
    return `<div class="card tight" data-k="history-list">${ss.map(s => { const exs = [...new Set(s.sets.map(x => x.ex))]; return `<div class="li" data-act="openSession" data-id="${s.id}"><div class="grow"><div class="small"><b>${s.morning ? 'Morning movement' : exs.map(exName).slice(0, 2).join(', ') + (exs.length > 2 ? ' +' + (exs.length - 2) : '')}</b></div><div class="tiny muted">${fmtDate(s.date)} · ${s.sets.length} sets · ${s.min} min · ${s.kcal} kcal${s.avgHr ? ' · HR ' + s.avgHr : ''}</div></div>${ic('fwd', 'class="inl muted"')}</div>`; }).join('')}</div>`;
  };
