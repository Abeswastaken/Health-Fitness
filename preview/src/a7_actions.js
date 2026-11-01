
  // ---------- Sheets ----------
  const SHEETS = {};
  SHEETS.review = () => {
    const items = U.reviewItems.filter(x => !S.dismissed.includes(x.id));
    const areas = [...new Set(items.map(x => x.area))];
    return `<div class="small muted">Ran every check on your last 4 weeks${S.modules.food ? '' : ' (food off)'}${S.modules.workout ? '' : ' (workouts off)'}. Plain code, no AI used.</div>
      ${areas.map(a => `<div class="tiny muted caps">${a}</div>${items.filter(x => x.area === a).map(x => `<div class="card tight" data-k="review-item"><div class="row">${level(x.level)}<b class="grow small">${esc(x.title)}</b></div><div class="small muted">${esc(x.detail)}</div><div class="row">${x.action ? `<button class="btn sm" data-act="applyReview" data-id="${x.id}">${esc(x.action)}</button>` : ''}<button class="btn sm ghost" data-act="dismiss" data-id="${x.id}">Dismiss</button></div></div>`).join('')}`).join('') || '<div class="card">All clear.</div>'}
      <button class="btn soft block" data-act="bridge" data-v="coach">${ic('spark')}Ask coach (uses AI)</button>`;
  };
  SHEETS.food = (s) => {
    const x = s.r ? recipesById()[s.id] : foodsById()[s.id];
    const m = s.r ? L.scale(L.recipePerContainer(x, foodsById()), s.qty) : L.scale(x, s.qty);
    const fav = S.favFoods.includes(s.id);
    return `<div class="row"><div class="small muted grow">${s.r ? 'Containers' : `Servings (1 = ${x.serv} ${esc(x.unit)})`} · ${esc(x.src || 'Recipe')}${x.barcode ? ' · ' + x.barcode : ''}</div><button class="iconbtn star ${fav ? 'on' : ''}" data-act="favFood" data-id="${s.id}" aria-label="Favorite">${ic('star')}</button></div>
      <div class="row"><button class="btn ghost" data-act="qty" data-v="-0.5">−</button><input class="f num" style="text-align:center;font-size:1.3em" type="number" step="0.25" value="${s.qty}" data-in="qty"><button class="btn ghost" data-act="qty" data-v="0.5">+</button></div>
      <div class="grid2 small num"><div><b>${r0(m.cal)}</b> kcal</div><div>P${r0(m.p)} C${r0(m.c)} F${r0(m.f)}</div></div>
      <div class="chips">${MEALS.map(mm => `<button class="chip ${s.meal === mm ? 'on' : ''}" data-act="sheetMeal" data-v="${mm}">${mm}</button>`).join('')}</div>
      ${s.mode === 'edit' ? `<div class="row"><button class="btn ghost" data-act="${s.plan ? 'unplan' : 'delEntry'}" data-id="${s.entry}">${ic('trash')}Delete</button><button class="btn block" data-act="${s.plan ? 'savePlan' : 'saveEntry'}">Save changes</button></div>` :
      s.plan ? `<button class="btn block" data-act="addPlan">Add to ${fmtDate(U.mpDay)}</button>` : `<button class="btn block" data-act="logFood">Log to ${U.foodDate === today ? 'today' : fmtDate(U.foodDate)}</button>`}`;
  };
  SHEETS.scan = ({ code }) => `<div class="small">Barcode <b class="num">${esc(code)}</b> isn't in Open Food Facts.</div><button class="btn" data-act="newFood">Enter it by hand</button>`;
  SHEETS.newFood = () => `<label class="fl">Name<input class="f" id="nf-name" placeholder="e.g. Mom's chili"></label><div class="grid2"><label class="fl">Serving size<input class="f" id="nf-serv" type="number" value="1"></label><label class="fl">Unit<input class="f" id="nf-unit" value="serving"></label>${['cal', 'p', 'c', 'f'].map(k => `<label class="fl">${{ cal: 'Calories', p: 'Protein g', c: 'Carbs g', f: 'Fat g' }[k]}<input class="f num" id="nf-${k}" type="number" value="0"></label>`).join('')}</div><button class="btn block" data-act="saveFood">Save and log</button>`;
  SHEETS.weight = () => `<label class="fl">Today's weight (lb)<input class="f num" id="wt" type="number" step="0.1" value="${S.weights[S.weights.length - 1]?.lb || S.profile.weightLb}"></label><div class="tiny muted">Usually comes from your scale through Health Connect. Typed weights stay in this app.</div><button class="btn block" data-act="saveWeight">Save</button>`;
  SHEETS.bridge = ({ v }) => {
    const prompt = bridgePrompt(v);
    const has = S.ai.endpoint && S.ai.model;
    return `${has ? `<div class="small">Would send this to <b>${esc(S.ai.model)}</b>. (The preview doesn't call AI.)</div>` : `<div class="small">No AI set up. Copy this, paste it into Lumo or the Claude app, then paste the answer back.</div>`}
      <textarea class="f small" rows="9" readonly id="bridgeOut">${esc(prompt)}</textarea>
      <button class="btn" data-act="copyBridge">${ic('copy')}Copy prompt</button>
      <label class="fl">Paste the JSON answer<textarea class="f small" rows="4" id="bridgeIn" placeholder='{ ... }'></textarea></label>
      <button class="btn soft" data-act="bridgeApply" data-v="${v}">Preview and apply</button>`;
  };
  SHEETS.target = ({ m }) => `<div class="small">${L.cap(m)}: weekly sets</div><div class="grid2"><label class="fl">Minimum<input class="f num" type="number" value="${S.targets[m].min}" data-in="tgt" data-m="${m}" data-k2="min"></label><label class="fl">Maximum<input class="f num" type="number" value="${S.targets[m].max}" data-in="tgt" data-m="${m}" data-k2="max"></label></div><div class="tiny muted">10-20 sets a week suits most people. Focused muscles aim for the maximum.</div>`;
  SHEETS.eq = ({ id }) => {
    const e = EQUIPMENT.find(x => x.id === id), st = S.equipment[id], own = ownedGear();
    const n = e.gear ? EX.filter(x => x.g === e.gear).length : 0, newN = e.gear && !own.has(e.gear) ? n : 0;
    return `<div class="eqbig">${eqArt(e)}</div>
      <div class="small">${n ? `${n} exercises use this${newN ? `. Buying it unlocks <b>${newN}</b> new ones.` : '.'}` : 'Not tied to specific exercises.'}</div>
      ${n ? `<button class="btn sm soft" data-act="unlocks" data-id="${id}" style="align-self:flex-start">See the ${n} exercises</button>` : ''}
      <div class="chips">${[['own', 'I own it'], ['wish', 'Wishlist'], ['none', "Don't have it"]].map(([k, l]) => `<button class="chip ${st === k ? 'on' : ''}" data-act="eqSet" data-id="${id}" data-v="${k}">${l}</button>`).join('')}</div>
      ${st === 'wish' ? `<label class="fl">Shopping link<input class="f" placeholder="https://" value="${esc(S.wishLinks[id] || '')}" data-in="wishlink" data-k2="${id}"></label>` : ''}
      <label class="btn ghost sm" style="cursor:pointer;align-self:flex-start">${ic('camera')}Use my own photo<input type="file" accept="image/*" data-in="eqphoto" data-k2="${id}" hidden></label>
      <div class="tiny muted">Removing gear greys its exercises out. Your history stays.</div>`;
  };
  SHEETS.unlocks = ({ id }) => {
    const e = EQUIPMENT.find(x => x.id === id), list = EX.filter(x => x.g === e.gear).sort((a, b) => (a.cat === 'strength' ? 0 : 1) - (b.cat === 'strength' ? 0 : 1) || a.n.localeCompare(b.n));
    const by = {}; list.forEach(x => { const g = L.groupOf(x.pm[0]) || 'Other'; by[g] = (by[g] || 0) + 1; });
    const own = new Set([...ownedGear(), e.gear]);
    return `<div class="small">${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' · ')}</div>
      <div class="list">${list.map(x => exRow(x, 'openEx', own)).join('')}</div>
      ${S.equipment[id] !== 'own' ? `<div class="row"><button class="btn sm ghost" data-act="eqSet" data-id="${id}" data-v="wish">Add to wishlist</button><button class="btn sm" data-act="eqSet" data-id="${id}" data-v="own">I bought it</button></div>` : ''}`;
  };
  SHEETS.planAdd = (s) => {
    const res = s.q ? searchFoods(s.q) : null;
    return `<div class="chips">${MEALS.map(m => `<button class="chip ${s.meal === m ? 'on' : ''}" data-act="planMeal" data-v="${m}">${m}</button>`).join('')}</div>
      <input class="f" id="planq" placeholder="Search foods and recipes" value="${esc(s.q || '')}" data-in="planq" autocomplete="off">
      ${res ? (res.length ? groupResults(res, 'planPick') : '<div class="small muted">No match.</div>') : `<div class="tiny muted">Favorites</div><div class="list">${S.favFoods.map(itemById).filter(Boolean).map(x => foodRow(x, 'planPick')).join('')}</div><div class="tiny muted">Recent</div><div class="list scroll5">${S.recent.map(itemById).filter(Boolean).map(x => foodRow(x, 'planPick')).join('')}</div>`}`;
  };
  SHEETS.planWeek = () => { const ws = dateAdd(weekStart(), 7 * (U.mpWeek || 0)), wd = [...Array(7)].map((_, i) => dateAdd(ws, i)), sel = U.copyDays || []; return `<div class="small muted">Fills this week (${shortDate(ws)} to ${shortDate(wd[6])}). You can still edit any day after.</div>
    <div class="card tight" data-k="copy-pick"><b class="small">Copy ${DAYS[dow(U.mpDay)]} to these days</b><div class="chips">${wd.map(x => x === U.mpDay ? `<span class="chip on" style="opacity:.5">${DAYS[dow(x)]}</span>` : `<button class="chip ${sel.includes(x) ? 'on' : ''}" data-act="copyDay" data-d="${x}">${DAYS[dow(x)]} ${+x.slice(8)}</button>`).join('')}</div><button class="btn sm" data-act="planCopy" data-v="pick" ${sel.length ? '' : 'disabled'}>${ic('copy')}Copy to ${sel.length || 'selected'} day${sel.length === 1 ? '' : 's'}</button><div class="tiny muted">Replaces what's planned on those days.</div></div>
    ${[['dayToWeek', `Copy ${DAYS[dow(U.mpDay)]} to every day`, 'Same meals all week. Replaces what\'s planned.'], ['dayToWeekdays', `Copy ${DAYS[dow(U.mpDay)]} to Mon-Fri`, 'Weekends stay as they are.'], ['lastWeek', 'Copy what I ate last week', 'Uses last week\'s food log as this week\'s plan.'], ['lastPlan', 'Repeat last week\'s plan', 'Copies the planned meals from the week before.'], ['clear', 'Clear this week', 'Removes every planned meal this week.']].map(([k, l, d]) => `<button class="choice" data-act="planCopy" data-v="${k}"><b>${l}</b><span class="tiny muted">${d}</span></button>`).join('')}`; };
  SHEETS.session = ({ id }) => {
    const s = S.sessions.find(x => x.id === id); if (!s) return '';
    const exs = [...new Set(s.sets.map(x => x.ex))];
    return `<div class="small muted">${fmtDate(s.date)} · ${s.min} min · ${s.kcal} kcal${s.avgHr ? ' · avg HR ' + s.avgHr : ''}</div>
      <div class="list">${exs.map(ex => `<div class="li" data-act="openEx" data-id="${ex}">${exThumb(ex)}<div class="grow"><div class="small">${esc(exName(ex))}</div><div class="tiny muted num">${s.sets.filter(x => x.ex === ex).map(x => (x.w ? r1(x.w) + '×' : '') + x.reps + (x.fail ? 'F' : '')).join(', ')}</div></div>${ic('history', 'class="inl muted"')}</div>`).join('')}</div>`;
  };

  function bridgePrompt(v) {
    const own = EQUIPMENT.filter(e => S.equipment[e.id] === 'own').map(e => e.name).join(', ');
    const me = `I'm a ${S.profile.age}-year-old male, ${S.profile.level}, ${S.profile.weightLb} lb, ${ftIn(S.profile.heightIn)}, training at home with: ${own}.`;
    const weekText = (week, days) => week.map((d, i) => d.length ? `${DAYS[i]} (${days[i].groups.join('+') || 'daily min'}): ${d.map(x => `${exName(x.ex)} ${x.sets}x${schemeOf(x).lo}-${schemeOf(x).hi}`).join('; ')}` : `${DAYS[i]}: rest`).join('\n');
    if (v === 'workout') return `You are a fitness expert. Generate a workout routine based on these constraints:\n\nAvailable Equipment: ${own}\nFitness Level: ${S.profile.level}\nDuration Minutes: 45\nFocus Muscles: ${($('#genq')?.value || 'chest')}\nUser Goal: ${S.goal.rate < 0 ? 'lose fat, keep muscle' : S.goal.rate > 0 ? 'build muscle' : 'maintain'}\n\nReturn ONLY valid JSON in this exact format:\n{"routine_name":"string","exercises":[{"name":"string","sets":number,"reps":"string","rest_seconds":number,"notes":"string or null"}],"estimated_duration_minutes":number}\n\nDo not include any text outside the JSON object.`;
    if (v === 'coach' || v === 'plan' || v === 'draft') {
      const week = v === 'draft' ? U.wiz.week : S.planWeek || [], days = v === 'draft' ? U.wiz.days : S.days;
      const items = (v === 'coach' ? runReview().map(x => `- [${x.level}] ${x.title}: ${x.detail}`) : L.planCheck({ week, days, exById: EXB, targets: S.targets, focus: new Set(S.focus) }).map(x => `- ${x.title}: ${x.detail}`)).join('\n');
      const planned = L.setsByMuscle(week.flat(), EXB);
      return `You are my strength coach. ${me}\nGoal: ${S.goal.rate}% body weight per week. Focus muscles: ${S.focus.join(', ') || 'none'}. I struggle with legs and squats, so I keep a daily leg minimum.\n\n${v === 'draft' ? 'My draft week:' : 'My week:'}\n${weekText(week, days)}\n\nSets per muscle: ${Object.entries(planned).filter(([, n]) => n).map(([m, n]) => `${m} ${n}`).join(', ')}\n\nMy app's automatic checks found:\n${items || '- nothing'}\n\nGive me 3-5 specific changes. Only use my equipment. Return ONLY JSON: {"suggestions":[{"title":"string","why":"string","change":"string"}]}`;
    }
    if (v === 'schemes') {
      const lifts = [...new Set(S.sessions.flatMap(s => s.sets.filter(x => x.w > 0).map(x => x.ex)))].slice(0, 10);
      const hist = lifts.map(id => `${exName(id)}: ${S.sessions.filter(s => s.sets.some(x => x.ex === id)).slice(-4).map(s => s.date.slice(5) + ' ' + s.sets.filter(x => x.ex === id).map(x => `${x.w}x${x.reps}${x.fail ? 'F' : ''}`).join(',')).join(' | ')}`).join('\n');
      return `You are my strength coach. ${me}\nMy rep schemes:\n${Object.values(S.schemes).map(s => `${s.name}: ${s.lo}-${s.hi} reps, rest ${s.rest}s`).join('\n')}\n\nLast 4 sessions of my main lifts (weight x reps, F = to failure):\n${hist}\n\nReview my rep ranges and rest times against this history. Am I progressing? Should any lift use a different scheme? Return ONLY JSON: {"schemes":[{"name":"string","lo":number,"hi":number,"rest":number,"why":"string"}],"per_lift":[{"lift":"string","scheme":"string","why":"string"}]}`;
    }
    if (v === 'recipe') {
      const r = U.draft, fb = foodsById(), tot = L.recipeTotal(r, fb), g = goalNow();
      return `Help me portion a meal-prep recipe to fit my macros.\nMy daily targets: ${r0(g.cal)} kcal, ${r0(g.p)} g protein, ${r0(g.c)} g carbs, ${r0(g.f)} g fat. I eat about 3 meals a day plus a snack.\nRecipe "${r.name}" (raw weights):\n${r.ing.map(i => `- ${fb[i.foodId]?.name}: ${i.qty} ${fb[i.foodId]?.unit}`).join('\n')}\nWhole pot: ${r0(tot.cal)} kcal, P${r0(tot.p)} C${r0(tot.c)} F${r0(tot.f)}.${r.cooked ? `\nCooked weight of the pot: ${r.cooked} g.` : ''}\n\nHow many containers should I split it into, and how many grams each? If one ingredient should change to hit my protein better, say which. Return ONLY JSON: {"containers":number,"grams_each":number or null,"per_container":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number},"why":"string","tweak":"string or null"}`;
    }
    if (v === 'goal') return `Suggest daily calorie and macro targets. Me: ${S.profile.age}, male, ${ftIn(S.profile.heightIn)}, ${S.profile.weightLb} lb, activity ${S.profile.activity}. Goal ${S.goal.rate}%/week. Last 4 weeks weight: ${S.weights.slice(-28).map(w => w.lb).join(', ')}.\nReturn ONLY JSON: {"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"reason":"string"}`;
    if (v === 'eqphoto') return `Identify all fitness equipment visible in this photo. Match against this catalog:\n${EQUIPMENT.map(e => e.name).join(', ')}\nReturn ONLY valid JSON: { "matches": ["equipment_name", ...] }\n\n(Attach the photo when you paste this.)`;
    if (v === 'eqlink') return `Read this product page and tell me what fitness equipment it is. Match it to one of: ${EQUIPMENT.map(e => e.name).join(', ')}.\nLink: <paste link>\nReturn ONLY JSON: {"name":"string","match":"string or null","price":"string or null"}`;
    if (v === 'food') return `Analyze this food photo. Estimate portions and ingredients. Return ONLY valid JSON:\n{"foods":[{"name":"string","grams":number,"confidence":number}],"total_calories":number,"protein_g":number,"carbs_g":number,"fat_g":number}\n\n(Attach the photo when you paste this.)`;
    return '';
  }

  function runReview() {
    const ws = sessionsThisWeek();
    const prevStart = dateAdd(today, -dow(today) - 7), prevEnd = dateAdd(today, -dow(today) - 1);
    const vol = ss => ss.reduce((t, s) => t + s.sets.length, 0);
    const planned = L.setsByMuscle((S.planWeek || []).flat(), EXB);
    const days7 = [...Array(7)].map((_, i) => dateAdd(today, -i));
    const foodDays = days7.filter(d => dayEntries(d).length);
    const avg = foodDays.reduce((a, d) => L.add(a, totalsFor(d)), L.ZERO);
    const scheduled = S.days.slice(0, dow(today) + 1).filter(d => !d.off && d.groups.length).length;
    const soreToday = S.soreness[today] || S.soreness[dateAdd(today, -1)] || {};
    const stalls = [];
    for (const id of new Set(S.sessions.flatMap(s => s.sets.filter(x => x.w > 0).map(x => x.ex)))) {
      const ws2 = S.sessions.filter(s => s.sets.some(x => x.ex === id)).slice(-4).map(s => Math.max(...s.sets.filter(x => x.ex === id).map(x => x.w)));
      if (ws2.length === 4 && ws2.every(w => w === ws2[0])) stalls.push({ ex: id, name: exName(id), n: 4, step: stepFor(id) });
    }
    const pains = S.sessions.filter(s => s.date >= dateAdd(today, -7)).flatMap(s => s.sets.filter(x => x.pain)).map(x => ({ ex: x.ex, name: exName(x.ex) }));
    const rate = L.weeklyRate(S.weights.slice(-28));
    return L.review({
      today, modules: S.modules, exById: EXB, sessions: S.sessions, level: S.profile.level,
      soreness: Object.fromEntries(Object.entries(soreToday).map(([g, v]) => [g.toLowerCase(), v])),
      volumeThis: vol(sessionsBetween(dateAdd(today, -6), today)), volumePrev: vol(sessionsBetween(dateAdd(today, -13), dateAdd(today, -7))),
      stalls, weeksHard: 3, pushSets: r0(L.PUSH.reduce((a, m) => a + planned[m], 0)), pullSets: r0(L.PULL.reduce((a, m) => a + planned[m], 0)),
      morningSkipped: days7.slice(0, 5).filter(d => !S.sessions.some(s => s.date === d && s.morning)).length,
      adherence: scheduled ? ws.filter(s => !s.morning).length / scheduled : null, prs: U.lastPrs || [], pains,
      rhrToday: S.hc.read.rhr ? S.hcSamples?.rhrToday : null, rhrBase: S.hcSamples?.rhrBase, sleepHrs: S.hc.read.sleep ? S.hcSamples?.sleepHrs : null,
      proteinAvg7: foodDays.length ? avg.p / foodDays.length : null, weightLb: S.profile.weightLb,
      calAvg7: foodDays.length ? avg.cal / foodDays.length : null, calFloor: L.calorieFloor(S.profile),
      trend: rate === null ? null : { actual: rate, target: S.profile.weightLb * S.goal.rate / 100, weeks: S.weights.length >= 14 ? 3 : 1 }, weighDays: S.weights.length,
      foodDaysSkipped: days7.slice(1, 4).filter(d => !dayEntries(d).length).length,
    });
  }

  // ---------- Actions ----------
  const A = {};
  const go = (tab, sub) => { S.tab = tab; if (sub) U.sub[tab] = sub; U.stack = []; U.sheet = null; save(); render(); if ($('#scroll')) $('#scroll').scrollTop = 0; };
  A.tab = d => go(d.v);
  A.sub = d => { U.sub[S.tab] = d.v; render(); if ($('#scroll')) $('#scroll').scrollTop = 0; };
  A.settings = () => pushFull({ kind: 'settings' });
  A.closeFull = () => popFull();
  A.closeSheet = () => { U.sheet = null; render(); };
  A.closeSheetBg = (d, el, ev) => { if (ev.target === el) A.closeSheet(); };
  A.review = () => { U.reviewItems = runReview(); U.sheet = { kind: 'review', title: 'Review' }; render(); };
  A.dismiss = d => { S.dismissed.push(d.id); save(); render(); };
  A.applyReview = d => {
    const id = d.id;
    if (id === 'rest') { S.days[dow(today)].off = true; buildPlan(); }
    else if (id === 'sore') { toast('Today\'s sore muscles get 1 fewer set and 10% less weight.'); }
    else if (id.startsWith('untouched-')) { const m = id.slice(10), g = L.groupOf(m); const i = S.days.findIndex((x, k) => k > dow(today) && !x.off); if (i >= 0 && !S.days[i].groups.includes(g)) S.days[i].groups.push(g); buildPlan(); toast(`Added ${g} to ${DAYS[i]}.`); }
    else if (id.startsWith('stall-')) { const ex = id.slice(6); const n = S.next[ex] || { w: 0, reps: 8 }; S.next[ex] = { ...n, w: (n.w || 0) + STEP }; toast('Next session weight raised.'); }
    else if (id === 'trend' || id === 'trend-fast' || id === 'trend-gain') { const g = goalNow(); S.goal.method = 'manual'; const delta = id === 'trend' ? -200 : id === 'trend-fast' ? 200 : -150; Object.assign(S.goal, L.macrosFor(g.cal + delta, S.goal.preset)); toast(`Calories set to ${r0(g.cal + delta)}.`); }
    else toast('Done.');
    S.dismissed.push(id); save(); U.reviewItems = runReview(); render();
  };
  A.goFood = () => { U.foodDate = today; go('food', 'log'); };
  A.goAch = () => go('progress', 'achievements');
  A.goOverview = () => go('progress', 'overview');
  A.goBalance = () => { U.sub.train = 'balance'; render(); };
  A.openFoodDay = d => { if (!S.modules.food) return; U.foodDate = d.d > today ? today : d.d; go('food', 'log'); };
  A.soreToggle = () => { U.soreOpen = !U.soreOpen; render(); };
  A.startToday = () => { const ws = todaysWorkout(); const i = ws.findIndex(w => !w.done && !w.off && w.kind === 'main'); if (i < 0) go('train', 'today'); else A.startWorkout({ i }); };

  // Food log
  A.foodDay = d => { const n = dateAdd(U.foodDate, +d.v); if (n > today) return; U.foodDate = n; render(); };
  A.foodDayPick = () => { U.foodDate = today; render(); };
  A.meal = d => { U.meal = d.v; render(); };
  A.recentTab = d => { U.recentTab = d.v; render(); };
  A.mealToggle = d => { S.mealOpen[d.v] = S.mealOpen[d.v] === false; save(); render(); };
  A.addToMeal = d => { U.meal = d.v; U.focusId = 'foodq'; render(); if ($('#scroll')) $('#scroll').scrollTop = 0; };
  A.favFood = d => { const i = S.favFoods.indexOf(d.id); if (i >= 0) S.favFoods.splice(i, 1); else S.favFoods.unshift(d.id); save(); render(); };
  A.simScan = () => { const pool = S.foods.filter(f => f.barcode); const f = pool[Math.floor(Math.random() * pool.length)]; U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render(); };
  A.photoAI = () => { U.sheet = { kind: 'bridge', title: 'Plate photo', v: 'food' }; render(); };
  A.pickFood = d => { const r = !!d.r; const x = r ? recipesById()[d.id] : foodsById()[d.id]; U.sheet = { kind: 'food', title: x.name, id: d.id, r, qty: 1, meal: U.meal }; render(); };
  A.qty = d => { U.sheet.qty = Math.max(0.25, r1(U.sheet.qty + +d.v)); render(); };
  A.sheetMeal = d => { U.sheet.meal = d.v; render(); };
  A.logFood = () => { const s = U.sheet; S.log.push({ id: 'l' + Date.now(), date: U.foodDate, meal: s.meal, [s.r ? 'recipeId' : 'foodId']: s.id, qty: s.qty }); S.recent = [s.id, ...S.recent.filter(x => x !== s.id)].slice(0, 25); U.sheet = null; U.q = ''; save(); toast('Logged.'); };
  A.editEntry = d => { const e = S.log.find(x => x.id === d.id); if (!e) return; U.sheet = { kind: 'food', mode: 'edit', title: entryName(e), entry: e.id, id: e.recipeId || e.foodId, r: !!e.recipeId, qty: e.qty, meal: e.meal }; render(); };
  A.saveEntry = () => { const s = U.sheet, e = S.log.find(x => x.id === s.entry); if (e) { e.qty = s.qty; e.meal = s.meal; } U.sheet = null; save(); toast('Updated.'); };
  A.delEntry = d => { S.log = S.log.filter(e => e.id !== d.id); U.sheet = null; save(); toast('Removed.'); };
  A.newFood = () => { U.sheet = { kind: 'newFood', title: 'Custom food' }; render(); };
  A.saveFood = () => { const v = k => $('#nf-' + k).value; const f = { id: 'c' + Date.now(), name: v('name') || 'Custom food', src: 'Custom', serv: +v('serv') || 1, unit: v('unit'), cal: +v('cal'), p: +v('p'), c: +v('c'), f: +v('f') }; if (U.scanCode) { f.barcode = U.scanCode; U.scanCode = null; } S.foods.push(f); if (topFull()?.kind === 'ingPick') { U.sheet = null; save(); return A.ingAdd({ id: f.id }); } U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; save(); render(); };
  A.newRecipe = () => { U.draft = { id: 'r' + Date.now(), name: 'New recipe', containers: 4, ing: [] }; pushFull({ kind: 'recipe' }); };
  A.editRecipe = d => { U.draft = JSON.parse(JSON.stringify(recipesById()[d.id])); pushFull({ kind: 'recipe' }); };
  A.rcont = d => { U.draft.containers = Math.max(1, U.draft.containers + +d.v); render(); };
  A.rdel = d => { U.draft.ing.splice(+d.i, 1); render(); };
  A.rcontSet = d => { U.draft.containers = +d.v; render(); };
  A.rcontQuick = d => { const r = recipesById()[d.id]; if (!r) return; r.containers = Math.max(1, r.containers + +d.v); gameCache = null; save(); render(); };
  A.ingPick = () => { U.ingq = ''; pushFull({ kind: 'ingPick' }); U.focusId = 'ingq'; };
  A.ingAdd = d => { const f = foodsById()[d.id]; if (!f) return; U.draft.ing.push({ foodId: f.id, qty: f.unit === 'g' ? 100 : 1 }); U.stack.pop(); toast(f.name + ' added. Set the amount.'); };
  A.saveRecipe = () => { const i = S.recipes.findIndex(r => r.id === U.draft.id); if (i >= 0) S.recipes[i] = U.draft; else S.recipes.push(U.draft); U.stack.pop(); save(); toast('Recipe saved.'); };

  // Meal plan
  A.mpWeek = d => { U.mpWeek = (U.mpWeek || 0) + +d.v; U.mpDay = null; render(); };
  A.mpDay = d => { U.mpDay = d.d; render(); };
  A.planAdd = d => { U.sheet = { kind: 'planAdd', title: 'Add to ' + fmtDate(U.mpDay), meal: d.v || 'Lunch', q: '' }; render(); };
  A.planMeal = d => { U.sheet.meal = d.v; render(); };
  A.planPick = d => { const meal = U.sheet.meal, x = itemById(d.id); U.sheet = { kind: 'food', plan: true, title: x.name, id: d.id, r: !!x.ing, qty: 1, meal }; render(); };
  A.addPlan = () => { const s = U.sheet; S.mealPlan.push({ id: 'p' + Date.now(), date: U.mpDay, meal: s.meal, [s.r ? 'recipeId' : 'foodId']: s.id, qty: s.qty }); U.sheet = null; save(); toast('Planned.'); };
  A.editPlan = d => { const p = S.mealPlan.find(x => x.id === d.id); if (!p) return; U.sheet = { kind: 'food', plan: true, mode: 'edit', title: entryName(p), entry: p.id, id: p.recipeId || p.foodId, r: !!p.recipeId, qty: p.qty, meal: p.meal }; render(); };
  A.savePlan = () => { const s = U.sheet, p = S.mealPlan.find(x => x.id === s.entry); if (p) { p.qty = s.qty; p.meal = s.meal; } U.sheet = null; save(); toast('Updated.'); };
  A.unplan = d => { S.mealPlan = S.mealPlan.filter(p => p.id !== d.id); U.sheet = null; save(); render(); };
  A.logPlanned = d => { const p = S.mealPlan.find(x => x.id === d.id); S.log.push({ id: 'l' + Date.now(), date: p.date, meal: p.meal, foodId: p.foodId, recipeId: p.recipeId, qty: p.qty }); save(); toast('Logged.'); };
  A.planWeekSheet = () => { U.copyDays = []; U.sheet = { kind: 'planWeek', title: 'Plan week' }; render(); };
  A.copyDay = d => { const c = U.copyDays = U.copyDays || []; const i = c.indexOf(d.d); if (i >= 0) c.splice(i, 1); else c.push(d.d); render(); };
  A.planCopy = d => {
    const start = dateAdd(weekStart(), 7 * (U.mpWeek || 0)), days = [...Array(7)].map((_, i) => dateAdd(start, i));
    const nid = () => 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
    const src = S.mealPlan.filter(p => p.date === U.mpDay);
    const put = (targets, rows) => { S.mealPlan = S.mealPlan.filter(p => !targets.includes(p.date)); targets.forEach(t => rows(t).forEach(r => S.mealPlan.push({ ...r, id: nid(), date: t }))); };
    if (d.v === 'pick') { const tg = (U.copyDays || []).filter(x => x !== U.mpDay); if (!tg.length) return toast('Pick at least one day.'); put(tg, () => src); U.copyDays = []; U.sheet = null; save(); return toast(`Copied to ${tg.length} day${tg.length > 1 ? 's' : ''}.`); }
    if (d.v === 'dayToWeek') put(days.filter(x => x !== U.mpDay), () => src);
    if (d.v === 'dayToWeekdays') put(days.slice(1, 6).filter(x => x !== U.mpDay), () => src);
    if (d.v === 'lastWeek') put(days, t => dayEntries(dateAdd(t, -7)).map(e => ({ meal: e.meal, foodId: e.foodId, recipeId: e.recipeId, qty: e.qty })));
    if (d.v === 'lastPlan') put(days, t => S.mealPlan.filter(p => p.date === dateAdd(t, -7)));
    if (d.v === 'clear') S.mealPlan = S.mealPlan.filter(p => !days.includes(p.date));
    U.sheet = null; save(); toast({ dayToWeek: 'Copied to every day.', dayToWeekdays: 'Copied to Mon-Fri.', lastWeek: 'Planned from last week\'s log.', lastPlan: 'Repeated last week\'s plan.', clear: 'Week cleared.' }[d.v]);
  };

  // Goals, weight, soreness
  A.goalMethod = d => { if (d.v === 'manual') Object.assign(S.goal, goalNow()); S.goal.method = d.v === 'ai' ? S.goal.method : d.v; if (d.v === 'ai') U.sheet = { kind: 'bridge', title: 'AI target', v: 'goal' }; save(); render(); };
  A.goalRate = d => { S.goal.rate = +d.v; S.goal.method = 'goal'; save(); render(); };
  A.preset = d => { S.goal.preset = d.v; if (S.goal.method === 'manual') Object.assign(S.goal, L.macrosFor(S.goal.cal, d.v)); save(); render(); };
  A.logWeight = () => { U.sheet = { kind: 'weight', title: 'Add weight' }; render(); };
  A.saveWeight = () => { const lb = +$('#wt').value; S.weights = S.weights.filter(w => w.date !== today); S.weights.push({ date: today, lb, src: 'Manual' }); S.profile.weightLb = lb; U.sheet = null; save(); toast('Saved.'); };
  A.sore = d => { S.soreness[today] = S.soreness[today] || {}; S.soreness[today][d.g] = +d.v; save(); render(); };

  // Exercises and gear
  A.libMine = () => { U.libMine = !U.libMine; render(); };
  A.libStar = () => { U.libStar = !U.libStar; render(); };
  A.libGroup = d => { U.libGroup = d.v; render(); };
  A.star = d => { const i = S.stars.indexOf(d.id); if (i >= 0) S.stars.splice(i, 1); else S.stars.push(d.id); save(); render(); };
  A.openEx = d => { if (!EXB[d.id]) return; U.sheet = null; pushFull({ kind: 'exercise', id: d.id }); };
  A.artMode = d => { U.artMode = d.v; render(); };
  A.liftGroup = d => { U.liftOpen = U.liftOpen || {}; U.liftOpen[d.v] = !U.liftOpen[d.v]; render(); };
  A.slotOpen = d => { U.slotOpen = U.slotOpen === +d.i ? null : +d.i; render(); };
  A.bridgeApply = d => {
    if (d.v !== 'recipe') { U.sheet = null; return toast('Applied (preview only).'); }
    let j; try { j = JSON.parse(($('#bridgeIn').value.match(/\{[\s\S]*\}/) || [''])[0]); } catch (e) { return toast('That answer isn\'t valid JSON.'); }
    if (j.containers > 0) U.draft.containers = Math.round(j.containers);
    if (!U.draft.cooked && j.grams_each > 0 && j.containers > 0) U.draft.cooked = Math.round(j.grams_each * j.containers);
    U.sheet = null; toast(`Set to ${U.draft.containers} containers.${j.tweak ? ' Tip: ' + j.tweak : ''}`);
  };
  A.advTab = d => { U.advTab = d.v; U.fight = false; render(); };
  A.fight = () => { U.fight = false; render(); requestAnimationFrame(() => { U.fight = true; render(); }); };
  A.rulesToggle = () => { U.rulesOpen = !U.rulesOpen; render(); };
  A.buy = d => {
    const x = L.SHOP.find(i => i.id === d.id), G = game();
    if (!x || G.gold < x.price || G.lv < x.lv) return;
    S.game.items.push({ id: x.id, at: today });
    if (x.slot !== 'potion') S.game.equip[x.slot] = x.id;
    gameCache = null; save(); toast(x.slot === 'potion' ? 'Streak shield ready.' : x.name + ' equipped.');
  };
  A.equip = d => { const x = L.SHOP.find(i => i.id === d.id); if (!x) return; if (S.game.equip[x.slot] === x.id) delete S.game.equip[x.slot]; else S.game.equip[x.slot] = x.id; save(); render(); };
  A.artNext = d => { const m = artModes(d.id).map(x => x[0]); if (m.length < 2) return; U.artMode = m[(m.indexOf(animKind(d.id)) + 1) % m.length]; render(); };
  A.eqTap = d => { U.sheet = { kind: 'eq', title: EQUIPMENT.find(e => e.id === d.id).name, id: d.id }; render(); };
  A.unlocks = d => { const e = EQUIPMENT.find(x => x.id === d.id); U.sheet = { kind: 'unlocks', title: `${e.name} unlocks`, id: d.id }; render(); };
  A.eqSet = d => { const was = S.equipment[d.id]; S.equipment[d.id] = d.v; buildPlan(); save(); const e = EQUIPMENT.find(x => x.id === d.id); U.sheet = null; if (d.v === 'own' && was !== 'own') toast(`${EX.filter(x => x.g === e.gear).length} exercises unlocked. Week rebuilt.`); else render(); };
  A.bridge = d => { U.sheet = { kind: 'bridge', title: { workout: 'Generate a workout', coach: 'Ask coach', plan: 'Ask AI coach about my week', draft: 'Ask AI coach about this draft', goal: 'AI target', eqphoto: 'Gear from photo', eqlink: 'Gear from link', food: 'Plate photo', schemes: 'Review my rep schemes', recipe: 'Split this recipe' }[d.v], v: d.v }; render(); };
  A.copyBridge = () => { const t = $('#bridgeOut'); if (window.HFDev?.copyText) { window.HFDev.copyText(t.value); return toast('Copied.'); } navigator.clipboard?.writeText(t.value).then(() => toast('Copied.'), () => { t.select(); }); };
  A.openSession = d => { U.sheet = { kind: 'session', title: 'Workout', id: d.id }; render(); };

  // Week
  A.dayOn = d => { const x = S.days[+d.i]; x.off = !x.off; if (!x.off && !x.groups.length) x.groups = ['Chest']; buildPlan(); render(); };
  A.dayGroup = d => { const x = S.days[+d.i]; const k = x.groups.indexOf(d.v); if (k >= 0) x.groups.splice(k, 1); else x.groups.push(d.v); buildPlan(); render(); };
  A.editDay = d => pushFull({ kind: 'dayedit', ctx: 'week', i: +d.i });
  A.morningToggle = d => { const k = S.morning.off.indexOf(d.d); if (k >= 0) S.morning.off.splice(k, 1); else S.morning.off.push(d.d); save(); render(); };
  A.dmin = d => { S.dailyMin[d.g] = Math.max(0, Math.min(3, (S.dailyMin[d.g] || 0) + +d.v)); buildPlan(); render(); };
  A.rebuild = () => { buildPlan(); toast('Week rebuilt from your muscle picks, stars and gear.'); };
  A.focus = d => { const k = S.focus.indexOf(d.m); if (k >= 0) S.focus.splice(k, 1); else S.focus.push(d.m); buildPlan(); render(); };
  A.muscleTarget = d => { U.sheet = { kind: 'target', title: 'Weekly target', m: d.m }; render(); };
  A.applyFix = d => {
    const ref = d.ctx === 'draft' ? { week: U.wiz.week, days: U.wiz.days } : { week: S.planWeek, days: S.days };
    const f = L.planCheck({ week: ref.week, days: ref.days, exById: EXB, targets: S.targets, focus: new Set(S.focus) }).find(x => x.id === d.id);
    if (!f?.fix) return;
    const msg = applyFix(ref.week, ref.days, f.fix); save(); toast(msg);
  };

  // Day editor
  const deRef = () => { const f = topFull(); const r = ctxRef(f.ctx); return { f, days: r.days, list: r.week[f.i], week: r.week }; };
  A.deGroup = d => { const { f, days } = deRef(); const x = days[f.i]; x.off = false; const k = x.groups.indexOf(d.v); if (k >= 0) x.groups.splice(k, 1); else x.groups.push(d.v); if (!x.groups.length) x.off = true; save(); render(); };
  A.deSwap = d => { const { f, list } = deRef(); pushFull({ kind: 'swap', mode: 'replace', ctx: f.ctx, i: f.i, k: +d.k2, from: list[+d.k2].ex, same: true, q: '' }); };
  A.deAdd = () => { const { f } = deRef(); pushFull({ kind: 'swap', mode: 'add', ctx: f.ctx, i: f.i, q: '', group: (ctxRef(f.ctx).days[f.i].groups[0]) || 'All' }); };
  A.deDel = d => { const { list } = deRef(); list.splice(+d.k2, 1); save(); render(); };
  A.deSets = d => { const { list } = deRef(); const it = list[+d.k2]; it.sets = Math.max(1, Math.min(8, it.sets + +d.v)); save(); render(); };
  A.deFill = () => { const { f, days, week } = deRef(); const one = buildFor(days.map((x, k) => k === f.i ? { ...x, off: false } : { groups: [], off: true }), {}); const daily = week[f.i].filter(x => x.daily); week[f.i] = [...one[f.i], ...daily]; save(); toast(one[f.i].length ? 'Filled from the muscles you picked.' : 'Pick some muscles first.'); };

  // Swap / add picker
  A.swapOpt = d => { const f = topFull(); if (d.v === 'mine') f.mine = f.mine === false; else f[d.v] = !f[d.v]; render(); };
  A.swapGroup = d => { topFull().group = d.v; render(); };
  A.swapPick = d => {
    const f = topFull(), id = d.id, e = EXB[id];
    const scheme = e.mech === 'compound' ? 'build' : 'endurance';
    if (f.ctx === 'logger') {
      if (f.mode === 'add') { U.log.items.push({ ex: id, sets: 3, scheme }); U.log.sets.push([...Array(3)].map(() => newSet(id, scheme))); U.log.idx = U.log.items.length - 1; }
      else { const it = U.log.items[U.log.idx]; it.ex = id; U.log.sets[U.log.idx] = U.log.sets[U.log.idx].map(s => s.done ? s : newSet(id, it.scheme)); }
    } else {
      const list = ctxRef(f.ctx).week[f.i];
      if (f.mode === 'add') list.push({ ex: id, sets: 3, scheme }); else list[f.k] = { ...list[f.k], ex: id };
      save();
    }
    U.stack.pop(); toast(`${f.mode === 'add' ? 'Added' : 'Swapped in'} ${e.n}.`);
  };

  // Programs and plan builder
  A.progOpen = d => { U.progOpen[d.v] = !U.progOpen[d.v]; render(); };
  A.adopt = d => { const p = PROGRAMS[+d.i]; if (p[2]) S.days = splitDays(p[2]); else S.days.forEach(x => { x.off = true; }); S.dailyMin = { ...(p[4] || {}) }; S.planWeek = JSON.parse(JSON.stringify(programWeek(+d.i))); save(); U.sub.train = 'week'; toast(`Using ${p[0]}. Edit any day.`); };
  A.wizStart = d => {
    const blank = () => [...Array(7)].map(() => ({ groups: [], off: true, time: '7:00 PM' }));
    U.wiz = d.v === 'own' ? { mode: 'own', step: 'edit', name: 'My plan', days: blank(), week: [...Array(7)].map(() => []), dailyMin: {}, round: 0 }
      : { mode: 'coach', step: 'setup', name: 'Coach plan', a: { days: 4, min: 60, focus: ['Chest'], legs: true }, days: blank(), week: [...Array(7)].map(() => []), dailyMin: {}, round: 0 };
    pushFull({ kind: 'builder' });
  };
  A.wizA = d => { U.wiz.a[d.k2] = +d.v; render(); };
  A.wizFocus = d => { const f = U.wiz.a.focus, k = f.indexOf(d.v); if (k >= 0) f.splice(k, 1); else f.push(d.v); render(); };
  A.wizLegs = () => { U.wiz.a.legs = !U.wiz.a.legs; render(); };
  A.wizDraft = () => {
    const w = U.wiz, n = w.a.days, slots = DAY_TEMPLATES[n], split = SPLITS[SPLIT_FOR[n]].filter(g => g.length);
    const days = [...Array(7)].map(() => ({ groups: [], off: true, time: '7:00 PM' }));
    slots.forEach((di, k) => { days[di] = { groups: [...split[k % split.length]], off: false, time: '7:00 PM' }; });
    for (const g of w.a.focus) { let have = slots.filter(i => days[i].groups.includes(g)).length; while (have < 2) { const i = slots.filter(x => !days[x].groups.includes(g)).sort((a, b) => days[a].groups.length - days[b].groups.length)[0]; if (i === undefined) break; days[i].groups.push(g); have++; } }
    w.dailyMin = w.a.legs ? { Legs: 1 } : {};
    w.focusMuscles = w.a.focus.flatMap(g => L.GROUPS[g]).filter(m => L.TARGETED.includes(m));
    w.days = days;
    w.week = buildFor(days, w.dailyMin, { focus: w.focusMuscles, perDayMax: { 30: 3, 45: 4, 60: 5, 75: 6 }[w.a.min] });
    w.note = `Draft ${w.round + 1}: ${n} days (${slots.map(i => DAYS[i]).join(', ')}), about ${w.a.min} min each, built as ${SPLIT_FOR[n] === 'Your split' ? 'your usual split' : SPLIT_FOR[n]}${w.a.focus.length ? ` with ${w.a.focus.join(' and ')} on at least 2 days` : ''}${w.a.legs ? ', plus a leg set every day' : ''}. Change anything, then tap Coach review.`;
    w.step = 'edit'; render();
  };
  A.wizReview = () => { U.wiz.round++; U.wiz.step = 'review'; render(); };
  A.wizBack = () => { if (U.wiz.step === 'review') { U.wiz.step = 'edit'; render(); } else popFull(); };
  A.wizClose = () => { U.wiz = null; popFull(); };
  A.wizDay = d => { const x = U.wiz.days[+d.i]; x.off = !x.off; if (x.off) U.wiz.week[+d.i] = U.wiz.week[+d.i].filter(y => y.daily); render(); };
  A.wizGroup = d => { const x = U.wiz.days[+d.i]; const k = x.groups.indexOf(d.v); if (k >= 0) x.groups.splice(k, 1); else x.groups.push(d.v); render(); };
  A.wizEditDay = d => { U.wiz.days[+d.i].off = false; pushFull({ kind: 'dayedit', ctx: 'draft', i: +d.i }); };
  A.wizSave = () => {
    const w = U.wiz, copy = x => JSON.parse(JSON.stringify(x));
    const prog = { id: w.id || 'my' + Date.now(), name: w.name || 'My plan', days: copy(w.days), week: copy(w.week), dailyMin: copy(w.dailyMin || {}) };
    const i = S.myPrograms.findIndex(p => p.id === prog.id); if (i >= 0) S.myPrograms[i] = prog; else S.myPrograms.unshift(prog);
    S.days = copy(prog.days); S.planWeek = copy(prog.week); S.dailyMin = copy(prog.dailyMin);
    U.wiz = null; U.stack = []; U.sub.train = 'week'; save(); toast(`Saved "${prog.name}" and set it as your week.`);
  };
  A.useMine = d => { const p = S.myPrograms[+d.i]; S.days = JSON.parse(JSON.stringify(p.days)); S.planWeek = JSON.parse(JSON.stringify(p.week)); S.dailyMin = { ...p.dailyMin }; U.sub.train = 'week'; save(); toast(`Using ${p.name}.`); };
  A.editMine = d => { const p = JSON.parse(JSON.stringify(S.myPrograms[+d.i])); U.wiz = { mode: 'own', step: 'edit', ...p, round: 0 }; pushFull({ kind: 'builder' }); };
  A.delMine = d => { S.myPrograms.splice(+d.i, 1); save(); render(); };

  // Settings
  A.strengthEx = d => { U.strengthEx = d.v; render(); };
  A.modFood = () => { if (S.modules.food && !S.modules.workout) return toast('Keep at least one side on.'); S.modules.food = !S.modules.food; save(); render(); };
  A.modWorkout = () => { if (S.modules.workout && !S.modules.food) return toast('Keep at least one side on.'); S.modules.workout = !S.modules.workout; save(); render(); };
  A.aiVision = () => { S.ai.vision = !S.ai.vision; save(); render(); };
  A.aiTest = () => toast(S.ai.endpoint && S.ai.model ? 'The app sends a one-word test message and shows the reply.' : 'Fill in the endpoint and model first.');
  A.hcRead = d => { S.hc.read[d.k2] = !S.hc.read[d.k2]; save(); render(); };
  A.hcWrite = () => { S.hc.write.sessions = !S.hc.write.sessions; save(); render(); };
  A.exportCsv = () => toast('The app saves food_log.csv, workouts.csv, recipes.csv, goals.csv to Downloads.');
  A.backup = () => toast('The app asks for a password, then saves an encrypted ZIP.');
  A.resetDemo = () => { S = freshState(); S.profile.setupDone = true; gameCache = null; buildPlan(); save(); U.stack = []; U.sheet = null; toast('Reset to example data.'); };
  A.devPanel = () => { S.devPanel = !S.devPanel; save(); applyDev(); render(); };
  A.backupJson = () => { window.HFDev.shareJson('health-fitness-backup-' + today + '.json', JSON.stringify({ kind: 'health-fitness-backup', v: 1, at: new Date().toISOString(), state: S })); };
  A.wipeAll = () => { if (!confirm('Clear all your data on this phone? This cannot be undone. Back up first if you might want it.')) return; S = freshState(); gameCache = null; save(); U.stack = []; U.sheet = null; applyDev(); render(); };
  A.setupDone = () => { S.profile.setupDone = true; buildPlan(); save(); render(); };

  // Workout logger
  const newSet = (id, scheme) => { const sch = S.schemes[scheme] || S.schemes.build; const nx = S.next[id]; const bw = isBW(id); return { w: bw ? 0 : nx ? nx.w : (lastWeight(id) ?? ''), reps: nx ? nx.reps : sch.lo, fail: false, pain: false, done: false }; };
  A.startWorkout = d => {
    const w = todaysWorkout()[+d.i];
    if (!w || !w.items.length) return;
    U.log = { kind: w.kind, name: w.name, items: w.items.map(it => ({ ...it })), idx: 0, sets: w.items.map(it => [...Array(it.sets)].map(() => newSet(it.ex, it.scheme))), start: Date.now() };
    U.stack = [{ kind: 'logger' }]; U.keepFullScroll = false; render();
  };
  A.logGo = d => { U.log.idx = +d.i; render(); };
  A.setFail = d => { const s = U.log.sets[U.log.idx][+d.i]; s.fail = !s.fail; render(); };
  A.setPain = d => { const s = U.log.sets[U.log.idx][+d.i]; s.pain = !s.pain; render(); };
  A.addSet = () => { const ss = U.log.sets[U.log.idx]; const l = ss[ss.length - 1]; ss.push({ ...l, done: false, fail: false, pain: false, drop: false }); render(); };
  A.dropSet = () => { const ss = U.log.sets[U.log.idx]; const l = ss[ss.length - 1]; ss.push({ w: l.w ? L.roundNear(l.w * 0.75, STEP) : l.w, reps: l.reps, done: false, fail: true, pain: false, drop: true }); toast('Drop set: 25% lighter, go to failure.'); };
  A.swapLog = () => { const it = U.log.items[U.log.idx]; pushFull({ kind: 'swap', mode: 'replace', ctx: 'logger', from: it.ex, same: true, q: '' }); };
  A.logAddEx = () => pushFull({ kind: 'swap', mode: 'add', ctx: 'logger', q: '' });
  A.nextSet = () => {
    const st = U.log, ss = st.sets[st.idx], cur = ss.findIndex(s => !s.done);
    if (st.sets.every(x => x.every(s => s.done))) return A.finishLog();
    if (cur === -1) { const nx = st.sets.findIndex(x => x.some(s => !s.done)); st.idx = nx; U.rest = null; return render(); }
    ss[cur].done = true;
    U.rest = { until: Date.now() + (st.kind === 'morning' ? 20 : schemeOf(st.items[st.idx]).rest) * 1000 };
    if (cur === ss.length - 1) { const nx = st.sets.findIndex(x => x.some(s => !s.done)); if (nx >= 0) st.idx = nx; }
    render(); tickRest();
  };
  function tickRest() { clearInterval(tickRest.t); tickRest.t = setInterval(() => { if (!U.rest || Date.now() > U.rest.until) { clearInterval(tickRest.t); U.rest = null; } if (topFull()?.kind === 'logger') { const el = $('.restbar b'); if (el && U.rest) { const r = Math.max(0, Math.ceil((U.rest.until - Date.now()) / 1000)); el.textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; } else render(); } }, 1000); }
  A.restAdd = () => { if (U.rest) U.rest.until += 30000; render(); };
  A.restSkip = () => { U.rest = null; render(); };
  A.quitLog = () => { U.stack = []; U.log = null; U.rest = null; toast('Workout discarded.'); };
  A.finishLog = () => {
    const st = U.log; U.rest = null;
    const before = game();
    const min = Math.max(1, Math.round((Date.now() - st.start) / 60000));
    const sets = [], recs = [], prs = [];
    st.items.forEach((it, k) => {
      const done = st.sets[k].filter(s => s.done || s.reps > 0).map(s => ({ ex: it.ex, w: +s.w || 0, reps: +s.reps || 0, fail: s.fail, pain: s.pain }));
      if (!done.length) return;
      sets.push(...done);
      const sch = schemeOf(it);
      const tgtW = S.next[it.ex]?.w || Math.max(...done.map(s => s.w));
      const rec = L.recommend({ sets: it.sets, lo: sch.lo, hi: sch.hi, w: tgtW }, done, stepFor(it.ex));
      const prevBest = Math.max(0, ...S.sessions.flatMap(s => s.sets.filter(x => x.ex === it.ex).map(x => L.epley(x.w, x.reps))));
      const best = Math.max(...done.map(s => L.epley(s.w, s.reps)));
      const pr = prevBest > 0 && best > prevBest && done.some(s => s.w > 0);
      if (pr) { const top = done.reduce((a, s) => L.epley(s.w, s.reps) > L.epley(a.w, a.reps) ? s : a); prs.push({ ex: it.ex, name: exName(it.ex), w: top.w, reps: top.reps, e1rm: r0(best) }); }
      if (rec.w !== undefined && done.some(s => s.w > 0)) S.next[it.ex] = { w: rec.w, reps: rec.reps, sets: it.sets };
      recs.push({ ex: it.ex, name: exName(it.ex), rec, sets: done, pr });
    });
    const avgHr = !REAL && S.hc.read.hr ? 112 + Math.round(Math.random() * 18) : null;
    const kcal = L.sessionCalories(S.profile, min, st.kind === 'morning' ? null : avgHr, st.kind === 'morning' ? L.MET.light : L.MET.strength);
    S.sessions.push({ id: 's' + Date.now(), date: today, morning: st.kind === 'morning', start: new Date().toISOString(), min, avgHr, kcal, sets });
    U.lastPrs = prs; gameCache = null;
    const after = game();
    save();
    const sid = S.sessions[S.sessions.length - 1].id;
    hcWorkoutHr(S.sessions[S.sessions.length - 1], st.start);
    U.stack = [{ kind: 'summary', min, setCount: sets.length, kcal, avgHr, recs, xp: after.xp - before.xp, gold: after.goldEarned - before.goldEarned, loot: L.loot(sid), bossHit: after.boss.dmg - before.boss.dmg, boss: after.boss, levelUp: after.lv > before.lv ? { lv: after.lv, title: after.title } : null, hcPick: S.hc.conflict, dup: !REAL && st.kind === 'main' && S.hc.write.sessions ? 'from 7:02 to 7:48 PM (Galaxy Watch)' : null }];
    U.keepFullScroll = false; U.log = null; U.soreOpen = false; render();
  };
  A.hcPick = d => { topFull().hcPick = d.v; render(); };
  A.closeSummary = () => { hcSendWorkout(S.sessions[S.sessions.length - 1]); const f = topFull(); const msg = f?.dup ? { merge: 'Saved. Merged with the watch workout in Health Connect.', app: 'Saved. Sent the app\'s workout to Health Connect.', watch: 'Saved. Kept the watch\'s workout in Health Connect.', skip: 'Saved in the app only.' }[f.hcPick] : 'Saved.'; U.stack = []; toast(msg); };

  // ---------- Inputs ----------
  const IN = {};
  const live = (key, id) => el => { key(el.value); U.focusId = id; render(); };
  IN.foodq = live(v => { U.q = v; }, 'foodq');
  IN.ingq = live(v => { U.ingq = v; }, 'ingq');
  IN.rcooked = el => { U.draft.cooked = +el.value || 0; render(); };
  IN.libq = live(v => { U.libQ = v; }, 'libq');
  IN.swapq = live(v => { topFull().q = v; }, 'swapq');
  IN.planq = live(v => { U.sheet.q = v; }, 'planq');
  IN.qty = el => { U.sheet.qty = Math.max(0, +el.value || 0); };
  IN.goal = el => { S.goal[el.dataset.k2] = +el.value; save(); };
  IN.rate = el => { S.goal.rate = +el.value; save(); render(); };
  IN.prof = el => { const k = el.dataset.k2; S.profile[k] = ['activity', 'level'].includes(k) ? el.value : +el.value; save(); };
  IN.htft = el => { S.profile.heightIn = (+el.value || 0) * 12 + (S.profile.heightIn % 12); save(); };
  IN.htin = el => { S.profile.heightIn = Math.floor(S.profile.heightIn / 12) * 12 + Math.min(11.5, +el.value || 0); save(); };
  IN.ai = el => { if (el.dataset.k2 === 'key') { if (REAL) { window.HFDev.setSecret('ai_key', el.value.trim()); el.value = ''; toast(el.placeholder = 'Key saved on this phone.'); } return; } S.ai[el.dataset.k2] = el.value; save(); };
  IN.scheme = el => { S.schemes[el.dataset.s][el.dataset.k2] = +el.value; save(); };
  IN.rname = el => { U.draft.name = el.value; };
  IN.ringq = el => { U.draft.ing[+el.dataset.i].qty = +el.value; render(); };
  IN.radd = el => { if (!el.value) return; const f = foodsById()[el.value]; U.draft.ing.push({ foodId: el.value, qty: f.unit === 'g' ? 100 : 1 }); render(); };
  IN.setw = el => { U.log.sets[U.log.idx][+el.dataset.i].w = el.value === '' ? '' : +el.value; };
  IN.setr = el => { U.log.sets[U.log.idx][+el.dataset.i].reps = +el.value; };
  IN.tgt = el => { S.targets[el.dataset.m][el.dataset.k2] = +el.value; buildPlan(); };
  IN.wishlink = el => { S.wishLinks[el.dataset.k2] = el.value; save(); };
  IN.range = el => { U.range = el.value; render(); };
  IN.hcConflict = el => { S.hc.conflict = el.value; save(); };
  IN.deScheme = el => { const { list } = deRef(); list[+el.dataset.k2].scheme = el.value; save(); render(); };
  IN.wizName = el => { U.wiz.name = el.value; };
  IN.eqphoto = el => { const f = el.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const k = 240 / Math.max(img.width, img.height); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); S.eqPhotos[el.dataset.k2] = c.toDataURL('image/jpeg', .8); save(); render(); }; img.src = rd.result; }; rd.readAsDataURL(f); };

  phone.addEventListener('click', ev => {
    if (window.__pinMode) return;
    const el = ev.target.closest('[data-act]');
    if (!el || !phone.contains(el)) return;
    const fn = A[el.dataset.act];
    if (fn) fn(el.dataset, el, ev);
  });
  const LIVE = ['ingq', 'foodq', 'libq', 'swapq', 'planq', 'rate', 'setw', 'setr', 'qty', 'rname', 'wizName'];
  const onIn = ev => { const el = ev.target.closest('[data-in]'); if (!el) return; const fn = IN[el.dataset.in]; if (fn) fn(el, ev); };
  phone.addEventListener('input', ev => { if (LIVE.includes(ev.target.dataset?.in)) onIn(ev); });
  phone.addEventListener('change', ev => { const k = ev.target.dataset?.in; if (!LIVE.includes(k)) onIn(ev); if (k === 'qty') render(); });

  // Drag a logged food by its grip to another meal.
  let drag = null;
  phone.addEventListener('pointerdown', ev => {
    if (window.__pinMode) return;
    const h = ev.target.closest('[data-drag]'); if (!h) return;
    ev.preventDefault();
    const row = h.closest('.li'), r = row.getBoundingClientRect();
    const ghost = row.cloneNode(true); ghost.classList.add('dragghost');
    Object.assign(ghost.style, { fontFamily: getComputedStyle(row).fontFamily, fontSize: getComputedStyle(row).fontSize, color: getComputedStyle(row).color, padding: getComputedStyle(row).padding, display: 'flex', alignItems: 'center', gap: '8px' });
    Object.assign(ghost.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', pointerEvents: 'none', zIndex: 99 });
    phone.appendChild(ghost); row.style.opacity = .3;
    drag = { id: h.dataset.drag, ghost, row, dy: ev.clientY - r.top, target: null };
  });
  window.addEventListener('pointermove', ev => {
    if (!drag) return;
    drag.ghost.style.top = (ev.clientY - drag.dy) + 'px';
    const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-drop]');
    document.querySelectorAll('[data-drop].dropon').forEach(x => { if (x !== el) x.classList.remove('dropon'); });
    if (el) el.classList.add('dropon');
    drag.target = el?.dataset.drop || null;
  });
  const endDrag = () => {
    if (!drag) return;
    const { id, target, ghost } = drag; ghost.remove(); drag = null;
    const e = S.log.find(x => x.id === id);
    if (e && target && e.meal !== target) { e.meal = target; S.mealOpen[target] = true; save(); toast('Moved to ' + target.toLowerCase() + '.'); } else render();
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Android back button (test APK): close the top layer first. Returns false when there is nothing to close.
  const back = () => {
    if (drag) { endDrag(); return true; }
    const pn = document.getElementById('panel'); if (pn && pn.classList.contains('open')) { pn.classList.remove('open'); return true; }
    if (U.sheet) { U.sheet = null; render(); return true; }
    if (U.log && topFull()?.kind === 'logger') return true;
    if (U.stack.length) { popFull(); return true; }
    if (S.tab !== 'home') { go('home'); return true; }
    return false;
  };
  // Dev panel button only shows when turned on in Settings (installed app). The review preview always shows it.
  const applyDev = () => document.documentElement.classList.toggle('dev', !REAL || !!S.devPanel);
  applyDev();
  window.App = { render, currentScreen, homeCards: HOME_CARDS, reset: A.resetDemo, state: () => S, back };
