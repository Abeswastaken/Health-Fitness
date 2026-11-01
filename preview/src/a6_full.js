
  // ---------- Setup ----------
  const heightInputs = p => `<div class="fl">Height<div class="row"><input class="f num" type="number" value="${Math.floor(p.heightIn / 12)}" data-in="htft" aria-label="Feet"><span class="muted">ft</span><input class="f num" type="number" value="${r0(p.heightIn % 12)}" data-in="htin" aria-label="Inches"><span class="muted">in</span></div></div>`;
  function setupScreen() {
    const p = S.profile;
    return `<div class="appbar"><h1>Welcome</h1></div><div class="scroll">
      <div class="card" data-k="setup-intro"><div class="small">A few numbers so calorie targets and workout burn are right. You can change them any time in Settings.</div></div>
      <div class="card" data-k="setup-form"><div class="grid2">
        <label class="fl">Age<input class="f num" type="number" value="${p.age}" data-in="prof" data-k2="age"></label>
        ${heightInputs(p)}
        <label class="fl">Weight (lb)<input class="f num" type="number" value="${p.weightLb}" data-in="prof" data-k2="weightLb"><span class="tiny">Health Connect keeps this updated</span></label>
        <label class="fl">Daily activity<select class="f" data-in="prof" data-k2="activity">${Object.keys(L.ACTIVITY).map(k => `<option ${p.activity === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label class="fl">Training experience<select class="f" data-in="prof" data-k2="level">${['beginner', 'intermediate', 'advanced'].map(k => `<option ${p.level === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div></div>
      <div class="card" data-k="setup-modules"><h2>What do you want to track?</h2>
        <div class="row"><span class="grow">Food and macros</span>${sw(S.modules.food, 'modFood')}</div>
        <div class="row"><span class="grow">Workouts</span>${sw(S.modules.workout, 'modWorkout')}</div></div>
      <div class="card" data-k="setup-gear"><h2>Your gear</h2><div class="small muted">We filled in your home gym. Fix anything in Train → Gear later.</div><ul class="blist">${EQUIPMENT.filter(e => S.equipment[e.id] === 'own').map(e => `<li><span class="bn">${esc(e.name)}</span></li>`).join('')}</ul><div class="tiny muted">Wishlist</div><ul class="blist">${EQUIPMENT.filter(e => S.equipment[e.id] === 'wish').map(e => `<li><span class="bn">${esc(e.name)}</span></li>`).join('')}</ul></div>
      <button class="btn block" data-act="setupDone">Looks right, start</button></div>`;
  }

  // ---------- Full screens ----------
  const FULL = {};
  const bar = (title, right = '', back = 'closeFull') => `<div class="appbar"><button class="iconbtn" data-act="${back}" aria-label="Back">${ic('back')}</button><h1 class="h1sm">${title}</h1>${right}</div>`;
  FULL.settings = () => `${bar('Settings')}<div class="scroll">
    <div class="card" data-k="set-modules"><h2>Tracking</h2><div class="small muted">Turning a side off hides it everywhere: tabs, widgets, checks and AI. Your data stays.</div>
      <div class="row"><span class="grow">Food and macros</span>${sw(S.modules.food, 'modFood')}</div>
      <div class="row"><span class="grow">Workouts</span>${sw(S.modules.workout, 'modWorkout')}</div></div>
    <div class="card" data-k="set-profile"><h2>You</h2><div class="grid2">
      <label class="fl">Age<input class="f num" type="number" value="${S.profile.age}" data-in="prof" data-k2="age"></label>
      ${heightInputs(S.profile)}
      <label class="fl">Daily activity<select class="f" data-in="prof" data-k2="activity">${Object.keys(L.ACTIVITY).map(k => `<option ${S.profile.activity === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
      <label class="fl">Experience<select class="f" data-in="prof" data-k2="level">${['beginner', 'intermediate', 'advanced'].map(k => `<option ${S.profile.level === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <div class="tiny muted">Weight comes from your scale through Health Connect. Pounds everywhere.</div></div>
    <div class="card" data-k="set-ai"><div class="row" data-act="aiOpen" style="cursor:pointer"><h2 class="grow">AI (optional)</h2><span class="tiny muted">${aiReadyTxt()}</span>${chev(U.aiOpen)}</div>
      <label class="fl"><span><b>Always tell the AI</b></span><textarea class="f small" rows="2" placeholder="e.g. No workouts Monday or Wednesday (night school). Bad left knee." data-in="ai" data-k2="notes">${esc(S.ai.notes || '')}</textarea><span class="tiny muted">Added to every AI request: plans, workouts, coach, food.</span></label>
      ${U.aiOpen ? `<div class="small"><b>Leave all three blank</b> and every AI button gives you a prompt to copy into Lumo or the Claude app, then you paste the answer back. Free, nothing to set up.</div>
      <div class="small">Fill them in only if you want the app to call an AI directly. Any service that speaks the "OpenAI-compatible" format works.</div>
      <label class="fl"><span><b>Endpoint URL</b> · required for direct AI</span><input class="f" placeholder="https://api.example.com/v1" value="${esc(S.ai.endpoint)}" data-in="ai" data-k2="endpoint"><span class="tiny">The service's API address, from its API docs. Examples: Anthropic <code>https://api.anthropic.com/v1/</code>, Groq <code>https://api.groq.com/openai/v1</code>, OpenRouter <code>https://openrouter.ai/api/v1</code>.</span></label>
      <label class="fl"><span><b>Model</b> · required for direct AI</span><input class="f" placeholder="model ID" value="${esc(S.ai.model)}" data-in="ai" data-k2="model"><span class="tiny">The exact model ID from the same docs page (copy it, spelling matters). Pick one that can read photos if you want plate and gear photos.</span></label>
      <label class="fl"><span><b>API key</b> · required by most services</span><input class="f" type="password" placeholder="${REAL ? (window.HFDev.hasSecret('ai_key') ? 'Key saved on this phone (type to replace)' : 'Paste your key') : 'Don\'t enter a real key in this preview'}" data-in="ai" data-k2="key"><span class="tiny">Made in the service's console (for Anthropic: console.anthropic.com → API keys). It costs money per use on paid services. The app keeps it in its private storage on the phone (not in backup files) and only sends it to the endpoint above.</span></label>
      <div class="row small"><span class="grow">Model can read photos</span>${sw(S.ai.vision, 'aiVision')}</div>
      <button class="btn sm ghost" data-act="aiTest" style="align-self:flex-start">Test connection</button>` : ''}</div>
    <div class="card" data-k="set-schemes"><h2>Rep schemes</h2>${Object.entries(S.schemes).map(([k, s]) => `<div class="row small"><b style="width:76px">${s.name}</b><input class="f num w56" type="number" value="${s.lo}" data-in="scheme" data-s="${k}" data-k2="lo"><span>to</span><input class="f num w56" type="number" value="${s.hi}" data-in="scheme" data-s="${k}" data-k2="hi"><span class="muted nw">reps, rest</span><input class="f num w56" type="number" value="${s.rest}" data-in="scheme" data-s="${k}" data-k2="rest"><span class="muted">s</span></div><div class="tiny muted">${esc(s.tip)}</div>`).join('')}
      <button class="btn sm soft" data-act="bridge" data-v="schemes" style="align-self:flex-start">${ic('spark')}Ask AI to review these against my history</button>
      <div class="tiny muted">Weight jumps are 2.5 lb. If a suggested weight doesn't fit your gear, type the real one in the logger.</div></div>
    ${REAL ? `<div class="card" data-k="set-hc"><h2>Health Connect</h2><div class="small muted">Samsung Health shares your scale and watch through Health Connect. Weigh-ins you add by hand stay in this app only.</div>
      ${S.hc.connected ? `${[['weight', 'Read body weight'], ['hr', 'Read heart rate (workout calories)'], ['rhr', 'Read resting heart rate'], ['sleep', 'Read sleep']].map(([k, l]) => `<div class="row small"><span class="grow">${l}${(S.hc.granted || []).includes(k) ? '' : ' <span class="muted">(not allowed)</span>'}</span>${sw(S.hc.read[k], 'hcRead', `data-k2="${k}"`)}</div>`).join('')}
      <div class="row small"><span class="grow">Write workouts${(S.hc.granted || []).includes('exercise') ? '' : ' <span class="muted">(not allowed)</span>'}</span>${sw(S.hc.write.sessions, 'hcWrite')}</div>
      <label class="fl">When the watch also logged the same workout<select class="f" data-in="hcConflict">${[['skip', 'Keep the watch\'s, don\'t send mine (recommended)'], ['app', 'Send mine too']].map(([k, l]) => `<option value="${k}" ${S.hc.conflict === k || (k === 'skip' && S.hc.conflict !== 'app') ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="row"><button class="btn sm ghost" data-act="hcSyncNow">Sync now</button><button class="btn sm ghost" data-act="hcConnect">Permissions</button><button class="btn sm ghost" data-act="hcOpen">Open Health Connect</button></div>` : `<button class="btn" data-act="hcConnect">Connect Health Connect</button>`}</div>` : `<div class="card" data-k="set-hc"><h2>Health Connect</h2><div class="small muted">Samsung Health shares your scale and watch data through Health Connect.</div>
      ${[['weight', 'Read body weight'], ['hr', 'Read heart rate'], ['rhr', 'Read resting heart rate'], ['sleep', 'Read sleep']].map(([k, l]) => `<div class="row small"><span class="grow">${l}</span>${sw(S.hc.read[k], 'hcRead', `data-k2="${k}"`)}</div>`).join('')}
      <div class="row small"><span class="grow">Write workouts</span>${sw(S.hc.write.sessions, 'hcWrite')}</div>
      <label class="fl">When the watch also logged the same workout<select class="f" data-in="hcConflict">${HC_CHOICES.map(([k, l]) => `<option value="${k}" ${S.hc.conflict === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>`}
    ${REAL ? `<div class="card" data-k="set-data"><h2>Data</h2><div class="small muted">Everything is saved on this phone. Back up now and then: it shares one file you can keep in Drive or email to yourself.</div>
      <div class="row"><button class="btn sm ghost" data-act="backupJson">${ic('copy')}Back up (file)</button><button class="btn sm ghost" data-act="wipeAll">${ic('trash')}Clear all data</button></div></div>
    <div class="card" data-k="set-dev"><h2>Developer</h2><div class="row"><span class="grow">Design panel<br><span class="tiny muted">Shows a small Dev button: change the look live, pin notes, and export a file for Claude.</span></span>${sw(S.devPanel, 'devPanel')}</div><div class="tiny muted num">${esc(window.HFDev.version())}</div></div>` : `<div class="card" data-k="set-data"><h2>Data</h2><div class="row"><button class="btn sm ghost" data-act="exportCsv">Export CSV</button><button class="btn sm ghost" data-act="backup">Backup (encrypted ZIP)</button></div>
      <button class="btn sm ghost" data-act="resetDemo" style="align-self:flex-start">Reset preview to example data</button></div>`}
    <div class="card" data-k="set-about"><h2>About and credits</h2><div class="tiny muted">Exercise drawings: everkinetic and workout-guide by bryllim (both CC BY-SA 4.0). Exercise data and photos: free-exercise-db (public domain). Muscle and equipment metadata: wger (CC BY-SA 3.0). Food data: USDA FoodData Central, Open Food Facts (ODbL). Darebee and Planfit links open their sites; nothing from them is stored in the app.</div></div></div>`;
  const HC_CHOICES = [['merge', 'Merge: my sets + watch heart rate (recommended)'], ['app', 'Use the app\'s workout'], ['watch', 'Use the watch\'s workout'], ['skip', 'Skip: don\'t send it']];

  FULL.exercise = ({ id }) => {
    const e = EXB[id]; if (!e) return bar('Exercise');
    const hist = S.sessions.filter(s => s.sets.some(x => x.ex === id)).sort((a, b) => b.date.localeCompare(a.date));
    const best = hist.length ? Math.max(...hist.flatMap(s => s.sets.filter(x => x.ex === id).map(x => L.epley(x.w, x.reps)))) : 0;
    return `${bar(esc(e.n), `<button class="iconbtn star ${S.stars.includes(id) ? 'on' : ''}" data-act="star" data-id="${id}" aria-label="Star">${ic('star')}</button>`)}
      <div class="scroll">${exAnim(id)}
      ${artBar(id)}
      <div class="chips">${e.pm.map(m => `<span class="badge info">${L.cap(m)}</span>`).join('')}${e.sm.map(m => `<span class="badge">${L.cap(m)} (helper)</span>`).join('')}<span class="badge">${e.lv}</span><span class="badge">${esc(gearName(e.g))}</span></div>
      ${S.next[id] ? `<div class="card tight" data-k="ex-next"><div class="row small"><b class="grow">Next time</b><span class="num">${fmtW(S.next[id].w)} × ${S.next[id].reps}</span></div></div>` : ''}
      <div class="card" data-k="ex-history"><h2>Your history<span class="sp"></span>${best ? `<span class="small num">1RM est. ${fmtW(best)}</span>` : ''}</h2>${hist.length > 1 && best ? lineChart(liftSeries(id), liftSeries(id), 100) : ''}
        ${hist.map(s => { const ss = s.sets.filter(x => x.ex === id); const b = Math.max(...ss.map(x => L.epley(x.w, x.reps))); return `<div class="row small"><span class="muted" style="width:76px">${DAYS[dow(s.date)]} ${shortDate(s.date)}</span><span class="grow num">${ss.map(x => (x.w ? r1(x.w) + '×' : '') + x.reps + (x.fail ? 'F' : '')).join(', ')}</span>${b && x0(ss) ? `<span class="tiny muted num">${r0(b)}</span>` : ''}</div>`; }).join('') || '<div class="small muted">Not logged yet.</div>'}</div>
      <div class="card" data-k="ex-steps"><h2>How to do it</h2><ol class="small steps">${e.d.split('\n').filter(Boolean).map(s => `<li>${esc(s)}</li>`).join('')}</ol></div></div>`;
  };
  const x0 = ss => ss.some(x => x.w > 0);

  FULL.recipe = () => {
    const r = U.draft;
    const fb = foodsById(), tot = L.recipeTotal(r, fb), pc = L.recipePerContainer(r, fb);
    return `${bar('Recipe', '<button class="btn sm" data-act="saveRecipe">Save</button>')}<div class="scroll">
      <label class="fl">Name<input class="f" value="${esc(r.name)}" data-in="rname"></label>
      <div class="card" data-k="pot"><h2>${ic('pot', 'class="inl"')} The pot</h2>
        ${r.ing.map((i, k) => { const f = fb[i.foodId]; return `<div class="row small"><span class="grow">${esc(f?.name)}</span><input class="f num" style="width:80px" type="number" value="${i.qty}" data-in="ringq" data-i="${k}"><span class="muted" style="width:36px">${esc(f?.unit)}</span><button class="iconbtn sm" data-act="rdel" data-i="${k}" aria-label="Remove">${ic('close')}</button></div>`; }).join('')}
        <button class="btn sm ghost" data-act="ingPick" style="align-self:flex-start">${ic('search')}Add ingredient</button>
        <div class="row small num hr"><span class="grow">Whole pot</span><b>${r0(tot.cal)} kcal</b><span>P${r0(tot.p)} C${r0(tot.c)} F${r0(tot.f)}</span></div></div>
      <div class="card" data-k="containers"><h2>Containers</h2><div class="row"><button class="btn ghost" data-act="rcont" data-v="-1">−</button><span class="num grow" style="text-align:center;font-size:1.6em;font-weight:700">${r.containers}</span><button class="btn ghost" data-act="rcont" data-v="1">+</button></div>
        <div class="row small num"><span class="grow">Each container</span><b>${r0(pc.cal)} kcal</b><span>P${r0(pc.p)} C${r0(pc.c)} F${r0(pc.f)}</span></div>
        <label class="fl">Cooked weight of the whole pot (g, optional)<input class="f num" type="number" inputmode="decimal" value="${r.cooked || ''}" placeholder="weigh the pot minus the pot" data-in="rcooked"></label>
        ${r.cooked ? `<div class="small num">Each container: <b>${r0(r.cooked / r.containers)} g</b> of cooked food</div>` : ''}
        <div class="tiny muted">Not sure yet? Save now and change this later: Food → Recipes → Edit, or the − + on the recipe card. Food you already logged from this recipe updates to the new count. Ingredient amounts are raw weight.</div></div>
      ${tot.cal ? splitCard(r, tot) : ''}</div>`;
  };
  // Plain-code portion helper: how many containers fit your macros. AI is optional.
  function splitCard(r, tot) {
    const g = goalNow(), meals = 3;
    const byCal = tot.cal / (g.cal / meals), byP = tot.p / (g.p / meals);
    const best = Math.max(1, Math.round((byCal + byP) / 2));
    const opts = [...new Set([best - 1, best, best + 1].filter(n => n >= 1))];
    return `<div class="card" data-k="split"><h2>${ic('spark', 'class="inl"')} Split for your macros</h2>
      <div class="small muted">Your day is ${r0(g.cal)} kcal and ${r0(g.p)} g protein. As one of ${meals} meals, a container should be about ${r0(g.cal / meals)} kcal and ${r0(g.p / meals)} g protein.</div>
      ${opts.map(n => { const c = tot.cal / n, p = tot.p / n; return `<div class="row small num ${n === best ? 'pick' : ''}"><b style="width:28px">${n}</b><span class="grow">${r0(c)} kcal · P${r0(p)}${r.cooked ? ` · ${r0(r.cooked / n)} g each` : ''}<br><span class="tiny muted">${r0(c / g.cal * 100)}% of calories, ${r0(p / g.p * 100)}% of protein</span></span>${n === best ? '<span class="badge good">Best fit</span>' : ''}${r.containers === n ? '<span class="badge">Current</span>' : `<button class="btn sm ghost" data-act="rcontSet" data-v="${n}">Use ${n}</button>`}</div>`; }).join('')}
      ${r.cooked ? '' : '<div class="tiny muted">Add the cooked weight above to get grams per container.</div>'}
      <button class="btn sm soft" data-act="bridge" data-v="recipe" style="align-self:flex-start">${ic('spark')}Ask AI how to split it</button></div>`;
  }
  FULL.ingPick = () => {
    const q = U.ingq || '';
    const res = q ? searchFoods(q).filter(x => !x.item.ing) : null;
    const rows = list => list.map(x => foodRow(x, 'ingAdd')).join('');
    return `${bar('Add ingredient')}<div class="scroll">
      <input class="f" id="ingq" placeholder="Search foods or scan a barcode" value="${esc(q)}" data-in="ingq" autocomplete="off">
      ${res ? `<div class="card">${res.length ? `<div class="list">${rows(res.map(x => x.item))}</div>` : '<div class="small muted">No match. Online search runs here in the real app.</div>'}</div>` : `
      <div class="card"><h2>Favorites</h2><div class="list">${rows(S.favFoods.map(id => foodsById()[id]).filter(Boolean))}</div></div>
      <div class="card"><h2>All foods</h2><div class="list scroll5">${rows(S.foods)}</div></div>`}
      <button class="btn sm ghost" data-act="newFood">${ic('plus')}Custom food</button></div>`;
  };

  // Logger: one vertical list. The current exercise is open, the rest are collapsed rows.
  FULL.logger = () => {
    const st = U.log;
    const elapsed = Math.max(0, Math.round((Date.now() - st.start) / 60000));
    const rest = U.rest ? Math.max(0, Math.ceil((U.rest.until - Date.now()) / 1000)) : 0;
    const cur = st.sets[st.idx].findIndex(s => !s.done);
    const allDone = st.sets.every(ss => ss.every(s => s.done));
    return `<div class="appbar"><button class="iconbtn" data-act="quitLog" aria-label="Close">${ic('close')}</button><h1 class="h1sm">${esc(st.name)}</h1><span class="small muted num">${elapsed} min</span></div>
      ${rest > 0 ? `<div class="restbar" data-k="rest-timer"><span class="small">Rest</span><b class="num">${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}</b><span class="grow"></span><button class="btn ghost sm" data-act="restAdd">+30 s</button><button class="btn sm" data-act="restSkip">Skip</button></div>` : ''}
      <div class="scroll" data-k="logger-list">
      ${st.items.map((it, k) => {
        const sets = st.sets[k], doneN = sets.filter(s => s.done).length, open = k === st.idx, sch = schemeOf(it);
        const head = `<div class="acc-h" data-act="logGo" data-i="${k}"><span class="accn ${doneN === sets.length ? 'done' : open ? 'cur' : ''}">${doneN === sets.length ? ic('check') : k + 1}</span><div class="grow"><b class="small">${esc(exName(it.ex))}</b><div class="tiny muted num">${targetLine(it)}</div></div><span class="tiny num muted">${doneN}/${sets.length}</span>${chev(open)}</div>`;
        if (!open) return `<div class="acc" data-k="logger-ex">${head}</div>`;
        const c = sets.findIndex(s => !s.done);
        return `<div class="acc open" data-k="logger-ex">${head}
          <div class="acc-b">${exAnim(it.ex).replace('class="exmedia"', 'class="exmedia sm"')}${artBar(it.ex)}
          ${sets.some(s => s.start && !s.done) ? `<div class="tiny muted" data-k="start-weight">Starting weight picked from your ${esc(S.profile.level || 'beginner')} level and body weight. It's meant to feel easy. If a set feels too heavy, drop the weight: the rest of the sets follow, and next time starts from what you actually lifted.</div>` : ''}
          <div class="setrow tiny muted"><span>Set</span><span>lb</span><span>Reps</span><span title="To failure">F</span><span title="Pain">!</span></div>
          ${sets.map((s, j) => `<div class="setrow ${s.done ? 'done' : j === c ? 'cur' : ''}"><b class="num">${s.drop ? 'D' : j + 1}</b><input type="number" inputmode="decimal" step="2.5" value="${s.w === '' ? '' : s.w}" placeholder="—" data-in="setw" data-i="${j}"><input type="number" inputmode="numeric" value="${s.reps}" data-in="setr" data-i="${j}"><button class="tog fail ${s.fail ? 'on' : ''}" data-act="setFail" data-i="${j}" aria-label="To failure">F</button><button class="tog pain ${s.pain ? 'on' : ''}" data-act="setPain" data-i="${j}" aria-label="Pain">!</button></div>`).join('')}
          <div class="row wrap"><button class="btn sm ghost" data-act="addSet">${ic('plus')}Set</button><button class="btn sm ghost" data-act="dropSet">Drop set</button><button class="btn sm ghost" data-act="swapLog">${ic('swap')}Swap</button><button class="btn sm ghost" data-act="openEx" data-id="${it.ex}">${ic('history')}History</button></div>
          <div class="tiny muted">${sch.name} ${sch.lo}-${sch.hi} reps, rest ${sch.rest}s. F = went to failure. ! = pain (not soreness): the coach will suggest a swap.</div></div></div>`;
      }).join('')}
      <button class="btn sm ghost" data-act="logAddEx" style="align-self:flex-start">${ic('plus')}Add exercise</button></div>
      <div class="row bottombar"><button class="btn ghost" data-act="finishLog">Finish</button><button class="btn block" data-act="nextSet" data-k="next-set">${allDone ? 'Finish workout' : cur === -1 ? 'Next exercise' : `Log set ${cur + 1} of ${st.sets[st.idx].length}`}</button></div>`;
  };

  FULL.summary = (st) => `<div class="appbar"><h1>Workout done</h1></div><div class="scroll">
    <div class="card tight" data-k="sum-stats"><div class="grid4 stats"><div><b class="num">${st.min}</b><span class="tiny muted">min</span></div><div><b class="num">${st.setCount}</b><span class="tiny muted">sets</span></div><div><b class="num">${st.kcal}</b><span class="tiny muted">kcal ±10%</span></div><div><b class="num" style="color:var(--a-good)">+${st.xp}</b><span class="tiny muted">XP</span></div></div>
      <div class="row small"><span class="gold num">${ic('coin', 'class="inl"')}+${st.gold} gold</span>${st.loot ? `<span class="badge good">${ic(st.loot.name === 'Gold chest' ? 'chest' : 'coin', 'class="inl"')}Loot: ${esc(st.loot.name)}</span>` : ''}<span class="grow"></span><span class="tiny muted">${st.bossHit > 0 ? `Hit ${esc(st.boss.name)} for ${st.bossHit}` : ''}${st.boss.won ? ' · defeated!' : ''}</span></div>
      ${st.levelUp ? `<div class="levelup">${lvBadge(st.levelUp.lv)}<b>Level up! You are now a ${st.levelUp.title}.</b></div>` : ''}
      <div class="tiny muted">${st.avgHr ? 'Heart rate ' + st.avgHr + ' bpm avg from your watch (Keytel formula).' : 'No heart rate, so MET formula.'} Shown under your food, not taken off it.</div></div>
    <div class="card tight" data-k="sum-recs"><h2>Next time<span class="sp"></span><span class="tiny muted">tap for history</span></h2>
      ${st.recs.map(r => `<div class="li tight" data-act="openEx" data-id="${r.ex}" data-k="sum-rec"><div class="grow"><div class="row" style="gap:6px"><b class="small">${esc(r.name)}</b>${r.pr ? '<span class="badge good">New best</span>' : ''}</div><div class="tiny">${esc(r.rec.text)}</div><div class="tiny muted num">${r.sets.map(x => (x.w ? r1(x.w) + '×' : '') + x.reps + (x.fail ? 'F' : '') + (x.pain ? '!' : '')).join('  ')}</div></div><span class="badge ${r.rec.kind === 'pain' ? 'alert' : r.rec.kind === 'jump' || r.rec.kind === 'up' ? 'good' : 'info'}">${{ jump: 'Go heavier', up: 'Add weight', reps: 'Add reps', hold: 'Hold', down: 'Drop back', pain: 'Swap', none: '' }[r.rec.kind]}</span></div>`).join('')}</div>
    ${st.dup ? `<div class="card" data-k="hc-dup"><h2>Your watch logged this too</h2><div class="small">Samsung Health recorded a workout ${esc(st.dup)}. Pick what goes to Health Connect:</div>
      ${HC_CHOICES.map(([k, l]) => `<button class="choice ${st.hcPick === k ? 'on' : ''}" data-act="hcPick" data-v="${k}"><b>${l}</b><span class="tiny muted">${{ merge: 'One workout: your sets and times from the app, heart rate and calories from the watch. The watch copy is removed.', app: 'Keeps only this app\'s workout. The watch copy is removed; heart rate is lost.', watch: 'Keeps the watch\'s workout. Your sets stay in this app only.', skip: 'Sends nothing. Both stay where they are.' }[k]}</span></button>`).join('')}
      <div class="tiny muted">Change the default in Settings → Health Connect.</div></div>` : ''}
    <div class="card" data-k="sum-sore"><h2 class="tap" data-act="soreToggle">Anything sore?<span class="sp"></span>${chev(U.soreOpen)}</h2>${U.soreOpen ? soreGrid() + '<div class="tiny muted">Pain goes on the set with the ! button.</div>' : ''}</div>
    <button class="btn block" data-act="closeSummary">Save</button></div>`;

  // Swap or add: full-screen search.
  FULL.swap = (f) => {
    const own = ownedGear();
    const base = f.from ? EXB[f.from] : null;
    const list = exerciseList({ q: f.q || '', group: f.group || 'All', mine: f.mine !== false, star: !!f.star, muscle: f.same && base ? base.pm[0] : null }).filter(e => e.id !== f.from);
    return `${bar(f.mode === 'add' ? 'Add exercise' : 'Replace ' + esc(exName(f.from)))}
      <div class="scroll"><input class="f" id="swapq" placeholder="Search exercises" value="${esc(f.q || '')}" data-in="swapq" autocomplete="off">
      <div class="chips">${base ? `<button class="chip ${f.same ? 'on' : ''}" data-act="swapOpt" data-v="same">Same muscle (${esc(L.cap(base.pm[0]))})</button>` : ''}<button class="chip ${f.mine !== false ? 'on' : ''}" data-act="swapOpt" data-v="mine">My gear</button><button class="chip ${f.star ? 'on' : ''}" data-act="swapOpt" data-v="star">★ Starred</button></div>
      ${f.same ? '' : `<div class="chips">${['All', ...GROUPS].map(g => `<button class="chip sm ${(f.group || 'All') === g ? 'on' : ''}" data-act="swapGroup" data-v="${g}">${g}</button>`).join('')}</div>`}
      <div class="card tight"><div class="tiny muted">${list.length} matches${list.length > 50 ? ', showing 50' : ''}. Tap to pick.</div><div class="list">${list.slice(0, 50).map(e => exRow(e, 'swapPick', own)).join('')}</div></div></div>`;
  };

  // Day editor (week or builder draft): dropdowns and steppers, no arrows.
  const ctxRef = ctx => ctx === 'draft' ? { days: U.wiz.days, week: U.wiz.week } : { days: S.days, week: S.planWeek };
  FULL.dayedit = ({ ctx, i }) => {
    const { days, week } = ctxRef(ctx), d = days[i], items = week[i];
    return `${bar(DAYS[i] + ' exercises', `<button class="btn sm" data-act="closeFull">Done</button>`)}
      <div class="scroll"><div class="card tight"><div class="small muted">Muscles this day</div><div class="chips">${GROUPS.map(g => `<button class="chip sm ${d.groups.includes(g) && !d.off ? 'on' : ''}" data-act="deGroup" data-v="${g}">${g}</button>`).join('')}</div></div>
      ${items.map((x, k) => `<div class="card tight exedit" data-k="day-item"><div class="row">${exThumb(x.ex)}<div class="grow"><button class="linkbtn" data-act="deSwap" data-k2="${k}"><b class="small">${esc(exName(x.ex))}</b>${ic('down', 'class="inl"')}</button><div class="tiny muted num">${targetLine(x)}${x.daily ? ' · daily min' : ''}</div></div><button class="iconbtn sm" data-act="deDel" data-k2="${k}" aria-label="Remove">${ic('trash')}</button></div>
        <div class="row"><select class="f sm" data-in="deScheme" data-k2="${k}" aria-label="Rep scheme">${Object.entries(S.schemes).map(([sk, s]) => `<option value="${sk}" ${x.scheme === sk ? 'selected' : ''}>${s.name} ${s.lo}-${s.hi}</option>`).join('')}</select>${stepper('deSets', x.sets, `data-k2="${k}"`, ' set')}</div></div>`).join('') || '<div class="card small muted">No exercises. Add one or let the app fill the day.</div>'}
      <div class="row"><button class="btn sm" data-act="deAdd">${ic('plus')}Add exercise</button><button class="btn sm ghost" data-act="deFill">${ic('spark')}Fill from muscles</button></div>
      <div class="tiny muted">Tap an exercise name to replace it (search or browse). ${Object.values(S.schemes).map(s => `${s.name}: ${s.tip}`).join(' ')}</div></div>`;
  };

  // Plan builder: "Create my own" or coach assisted (draft -> edit -> review, repeat).
  const DAY_TEMPLATES = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6] };
  const SPLIT_FOR = { 2: 'Full body 3x', 3: 'Full body 3x', 4: 'Upper/Lower', 5: 'Your split', 6: 'Push/Pull/Legs' };
  FULL.builder = () => {
    const w = U.wiz;
    if (w.step === 'setup') return `${bar('Coach-assisted plan')}<div class="scroll">
      <div class="steps3"><span class="on">1 Questions</span><span>2 Draft and edit</span><span>3 Coach review</span></div>
      <div class="card"><h2>Days a week</h2><div class="chips">${[2, 3, 4, 5, 6].map(n => `<button class="chip ${w.a.days === n ? 'on' : ''}" data-act="wizA" data-k2="days" data-v="${n}">${n}</button>`).join('')}</div></div>
      <div class="card"><h2>Time per workout</h2><div class="chips">${[30, 45, 60, 75].map(n => `<button class="chip ${w.a.min === n ? 'on' : ''}" data-act="wizA" data-k2="min" data-v="${n}">${n} min</button>`).join('')}</div></div>
      <div class="card"><h2>Focus</h2><div class="small muted">Gets extra sets and shows up more often.</div><div class="chips">${GROUPS.map(g => `<button class="chip ${w.a.focus.includes(g) ? 'on' : ''}" data-act="wizFocus" data-v="${g}">${g}</button>`).join('')}</div></div>
      <div class="card"><div class="row"><span class="grow">A leg set every day (daily minimum)</span>${sw(w.a.legs, 'wizLegs')}</div></div>
      <label class="fl">Plan name<input class="f" value="${esc(w.name)}" data-in="wizName"></label>
      <button class="btn block" data-act="wizDraft">${ic('spark')}Coach, draft my week</button></div>`;
    const check = L.planCheck({ week: w.week, days: w.days, exById: EXB, targets: S.targets, focus: new Set(w.focusMuscles || S.focus) });
    const total = w.week.flat().reduce((a, x) => a + x.sets, 0);
    if (w.step === 'review') return `${bar('Coach review', '', 'wizBack')}<div class="scroll">
      <div class="steps3"><span>1 Questions</span><span>2 Draft and edit</span><span class="on">3 Coach review</span></div>
      <div class="card"><h2>${ic('spark', 'class="inl"')} Round ${w.round}</h2><div class="small muted">${check.length ? `${check.length} thing${check.length === 1 ? '' : 's'} to look at. Apply what you like, edit by hand, then review again.` : 'This week is well rounded. Save it when you\'re happy.'}</div>${coachList(w.week, w.days, 'draft')}
        <button class="btn soft sm" data-act="bridge" data-v="draft" style="align-self:flex-start">${ic('spark')}Ask AI coach too</button></div>
      <div class="row"><button class="btn ghost block" data-act="wizBack">Back to editing</button><button class="btn block" data-act="wizSave">Save plan</button></div></div>`;
    return `${bar(w.mode === 'coach' ? 'Coach-assisted plan' : 'Create my own', '', 'wizClose')}<div class="scroll">
      ${w.mode === 'coach' ? `<div class="steps3"><span>1 Questions</span><span class="on">2 Draft and edit</span><span>3 Coach review</span></div><div class="card tight coachnote"><div class="small">${ic('spark', 'class="inl"')} ${esc(w.note || '')}</div></div>` : `<div class="card tight"><div class="small muted">Turn on your training days, pick muscles, then add exercises. "Fill" builds a day from its muscles if you want a start.</div></div>`}
      <label class="fl">Plan name<input class="f" value="${esc(w.name)}" data-in="wizName"></label>
      ${w.days.map((d, i) => `<div class="card day tight"><div class="row"><h2 class="grow">${DAYS[i]}</h2><span class="small muted num">${d.off ? 'Rest' : w.week[i].reduce((a, x) => a + x.sets, 0) + ' sets'}</span>${sw(!d.off, 'wizDay', `data-i="${i}" aria-label="Train on ${DAYS[i]}"`)}</div>
        ${d.off ? (w.week[i].length ? bullets(w.week[i]) : '') : `<div class="chips">${GROUPS.map(g => `<button class="chip sm ${d.groups.includes(g) ? 'on' : ''}" data-act="wizGroup" data-i="${i}" data-v="${g}">${g}</button>`).join('')}</div>${bullets(w.week[i])}<button class="btn sm ghost" data-act="wizEditDay" data-i="${i}" style="align-self:flex-start">${ic('edit')}${w.week[i].length ? 'Edit exercises' : 'Add exercises'}</button>`}</div>`).join('')}
      <div class="small muted num">${w.days.filter(d => !d.off).length} training days · ${total} sets a week</div>
      <div class="row">${w.mode === 'coach' ? `<button class="btn block" data-act="wizReview">${ic('spark')}Coach review${w.round ? ' (round ' + (w.round + 1) + ')' : ''}</button>` : `<button class="btn ghost" data-act="wizReview">Coach check</button><button class="btn block" data-act="wizSave">Save plan</button>`}</div></div>`;
  };
