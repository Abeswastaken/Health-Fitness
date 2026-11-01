
  // ----- Food -----
  SCREENS['food:log'] = () => {
    const d = U.foodDate, g = goalNow(), t = totalsFor(d);
    const entries = dayEntries(d);
    const res = U.q ? searchFoods(U.q) : null;
    const listIds = U.recentTab === 'fav' ? S.favFoods : S.recent.slice(0, 25);
    return `
      <div class="datenav" data-k="food-date"><button class="iconbtn" data-act="foodDay" data-v="-1" aria-label="Previous day">${ic('back')}</button><button class="dn" data-act="foodDayPick"><b>${d === today ? 'Today' : d === dateAdd(today, -1) ? 'Yesterday' : fmtDate(d)}</b><span class="tiny muted">${d === today ? fmtDate(d) : ''}</span></button><button class="iconbtn" data-act="foodDay" data-v="1" aria-label="Next day" ${d >= today ? 'disabled style="opacity:.3"' : ''}>${ic('fwd')}</button></div>
      <div class="card tight" data-k="day-total"><div class="row num small"><span class="grow"><b class="big2">${r0(t.cal)}</b> / ${r0(g.cal)} kcal</span><span style="color:var(--a-p)">P${r0(t.p)}</span><span style="color:var(--a-c)">C${r0(t.c)}</span><span style="color:var(--a-f)">F${r0(t.f)}</span></div>${macroBar('kcal', t.cal, g.cal, 'var(--a-accent)', '').replace('class="macro"', 'class="macro solo"')}</div>
      ${d === today && REAL ? `<div class="row" data-k="scanner"><button class="btn sm soft" data-act="photoAI">${ic('camera')}Plate photo (AI)</button><span class="tiny muted grow">Barcode scanning comes with the native app.</span></div>` : ''}
      ${d === today && !REAL ? `<div class="viewfinder" data-k="scanner"><div class="frame"><div class="laser"></div></div>
        <div style="position:absolute;top:10px;left:12px;font-size:12px;opacity:.85">Point at a barcode</div>
        <div class="vf-actions"><button class="btn sm" data-act="simScan">${ic('scan')}Simulate scan</button><button class="btn sm" data-act="photoAI" aria-label="Photo of plate">${ic('camera')}Plate photo</button></div></div>` : ''}
      <div class="chips" data-k="meal-chips">${MEALS.map(m => `<button class="chip ${U.meal === m ? 'on' : ''}" data-act="meal" data-v="${m}">${m}</button>`).join('')}</div>
      <div class="row" data-k="food-search"><input class="f" id="foodq" placeholder="Search foods, recipes, barcodes" value="${esc(U.q)}" data-in="foodq" autocomplete="off"><button class="btn sm ghost" data-act="newFood">${ic('plus')}Custom</button></div>
      ${res ? `<div class="card" data-k="search-results">${res.length ? groupResults(res) : `<div class="muted small">No match in your foods. Online search (Open Food Facts) runs here in the real app.</div>`}</div>` : `
      <div class="card" data-k="recent-foods"><div class="seg" role="tablist"><button class="${U.recentTab === 'recent' ? 'on' : ''}" data-act="recentTab" data-v="recent">Recent</button><button class="${U.recentTab === 'fav' ? 'on' : ''}" data-act="recentTab" data-v="fav">${ic('star', 'class="inl"')}Favorites</button></div>
        <div class="list scroll5">${listIds.map(itemById).filter(Boolean).map(x => foodRow(x)).join('') || '<div class="muted small" style="padding:10px 0">Tap the star on any food to add it here.</div>'}</div>
        <div class="tiny muted">${U.recentTab === 'fav' ? listIds.length + ' favorites' : 'Last ' + Math.min(25, listIds.length) + ' foods'} · scroll for more · logs to ${U.meal}</div></div>`}
      ${MEALS.map(m => {
        const es = entries.filter(e => e.meal === m), open = S.mealOpen[m] !== false;
        const mt = L.dayTotals(es, foodsById(), recipesById());
        return `<div class="card meal" data-k="meal-${m.toLowerCase()}" data-drop="${m}"><h2 class="tap" data-act="mealToggle" data-v="${m}">${m}<span class="sp"></span><span class="small muted num">${es.length ? r0(mt.cal) + ' kcal' : ''}</span>${chev(open)}</h2>
          ${open ? `${es.map(e => { const mm = L.entryMacros(e, foodsById(), recipesById()); return `<div class="li tight" data-act="editEntry" data-id="${e.id}"><span class="grip" data-drag="${e.id}" data-act="noop" aria-label="Drag to another meal">${ic('grip')}</span><div class="grow"><div class="small">${esc(entryName(e))} <span class="muted">×${r1(e.qty)}</span></div><div class="tiny muted num">P${r0(mm.p)} C${r0(mm.c)} F${r0(mm.f)}</div></div><span class="num small">${r0(mm.cal)}</span><span class="muted">${ic('edit', 'class="inl"')}</span></div>`; }).join('') || '<div class="muted small">Nothing yet.</div>'}
          <button class="btn sm ghost" data-act="addToMeal" data-v="${m}" style="align-self:flex-start">${ic('plus')}Add to ${m.toLowerCase()}</button>` : ''}</div>`;
      }).join('')}
      ${entries.length ? `<div class="tiny muted" style="text-align:center">Hold ${ic('grip', 'class="inl"')} and drag to move a food to another meal.</div>` : ''}`;
  };
  function searchFoods(q, opts = {}) {
    const s = q.toLowerCase().trim();
    const fuzzy = (name) => { const n = name.toLowerCase(); if (n.includes(s)) return 2; let i = 0; for (const ch of n) if (ch === s[i]) i++; return i >= s.length - 1 && s.length > 2 ? 1 : 0; };
    const out = [];
    for (const r of S.recipes) { const sc = fuzzy(r.name); if (sc) out.push({ type: 'Recipes', item: r, sc: sc + 1 }); }
    for (const f of S.foods) { const sc = fuzzy(f.name) || (f.barcode && f.barcode.includes(s) ? 2 : 0); if (sc) out.push({ type: f.src === 'Custom' ? 'My foods' : f.src === 'OpenFoodFacts' ? 'Scanned' : 'USDA', item: f, sc: sc + (S.recent.includes(f.id) ? 1 : 0) + (S.favFoods.includes(f.id) ? 1 : 0) }); }
    return out.sort((a, b) => b.sc - a.sc);
  }
  function groupResults(res, act = 'pickFood') {
    const by = {}; res.forEach(r => (by[r.type] = by[r.type] || []).push(r.item));
    return Object.entries(by).map(([k, items]) => `<div class="tiny muted">${k}</div><div class="list">${items.map(x => foodRow(x, act)).join('')}</div>`).join('');
  }
  function foodRow(x, act = 'pickFood') {
    const isR = !!x.ing;
    const m = isR ? L.recipePerContainer(x, foodsById()) : x;
    const fav = S.favFoods.includes(x.id);
    return `<div class="li" data-act="${act}" data-id="${x.id}" data-r="${isR ? 1 : ''}"><div class="grow"><div class="small">${esc(x.name)}</div><div class="tiny muted">${isR ? '1 container' : `${x.serv} ${esc(x.unit)}`} · P${r0(m.p)} C${r0(m.c)} F${r0(m.f)}</div></div><span class="num small">${r0(m.cal)}</span><button class="iconbtn sm star ${fav ? 'on' : ''}" data-act="favFood" data-id="${x.id}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${ic('star')}</button></div>`;
  }
  SCREENS['food:recipes'] = () => `
    <div class="card" data-k="recipes-help"><div class="small muted">Put everything in the pot, say how many containers it fills, and log one container at a time.</div><button class="btn" data-act="newRecipe">${ic('plus')}New recipe</button></div>
    ${S.recipes.map(r => { const pc = L.recipePerContainer(r, foodsById()); return `<div class="card" data-k="recipe-card"><h2>${esc(r.name)}<span class="sp"></span><span class="badge">${r.containers} containers${r.cooked ? ' · ' + r0(r.cooked / r.containers) + ' g each' : ''}</span></h2>
      <div class="small muted">${r.ing.map(i => esc(foodsById()[i.foodId]?.name || '?')).join(', ')}</div>
      <div class="row small num"><span class="grow">Per container</span><b>${r0(pc.cal)} kcal</b><span>P${r0(pc.p)} C${r0(pc.c)} F${r0(pc.f)}</span></div>
      <div class="row small"><span class="grow muted">Containers</span><button class="iconbtn sm" data-act="rcontQuick" data-id="${r.id}" data-v="-1" aria-label="Fewer containers">−</button><b class="num">${r.containers}</b><button class="iconbtn sm" data-act="rcontQuick" data-id="${r.id}" data-v="1" aria-label="More containers">+</button></div>
      <div class="row"><button class="btn sm" data-act="pickFood" data-id="${r.id}" data-r="1">Log a container</button><button class="btn sm ghost" data-act="editRecipe" data-id="${r.id}">Edit</button></div></div>`; }).join('')}`;
  SCREENS['food:mealplan'] = () => {
    const start = dateAdd(weekStart(), 7 * (U.mpWeek || 0));
    const days = [...Array(7)].map((_, i) => dateAdd(start, i));
    if (!U.mpDay || U.mpDay < start || U.mpDay > days[6]) U.mpDay = days.includes(today) ? today : start;
    const planned = S.mealPlan.filter(p => p.date === U.mpDay), logged = dayEntries(U.mpDay);
    const pT = L.dayTotals(planned, foodsById(), recipesById()), aT = L.dayTotals(logged, foodsById(), recipesById()), g = goalNow();
    return `<div class="row" data-k="mp-weeknav"><button class="iconbtn" data-act="mpWeek" data-v="-1" aria-label="Previous week">${ic('back')}</button><b class="grow" style="text-align:center">${U.mpWeek ? (U.mpWeek > 0 ? 'Week of ' : 'Week of ') + shortDate(start) : 'This week'}</b><button class="iconbtn" data-act="mpWeek" data-v="1" aria-label="Next week">${ic('fwd')}</button></div>
      <div class="week" data-k="mealplan-week">${days.map(d => { const pc = L.dayTotals(S.mealPlan.filter(p => p.date === d), foodsById(), recipesById()).cal; return `<div class="d ${d === U.mpDay ? 'on' : ''}" data-act="mpDay" data-d="${d}">${DAYS[dow(d)]}<br><b>${+d.slice(8)}</b><br><span class="tiny num ${pc ? '' : 'muted'}">${pc ? r0(pc) : '—'}</span></div>`; }).join('')}</div>
      <div class="row"><button class="btn sm" data-act="planAdd">${ic('plus')}Add food</button><button class="btn sm soft" data-act="planWeekSheet">${ic('copy')}Plan week</button></div>
      <div class="card" data-k="planned-vs-actual"><h2>${fmtDate(U.mpDay)}</h2>
        <div class="grid2 small num"><div><div class="muted tiny">Planned</div><b>${r0(pT.cal)}</b> / ${r0(g.cal)} kcal<br>P${r0(pT.p)} C${r0(pT.c)} F${r0(pT.f)}</div><div><div class="muted tiny">Eaten</div><b>${r0(aT.cal)}</b> kcal<br>P${r0(aT.p)} C${r0(aT.c)} F${r0(aT.f)}</div></div></div>
      ${MEALS.map(m => { const ps = planned.filter(p => p.meal === m); return `<div class="card tight" data-k="plan-${m.toLowerCase()}"><h2>${m}<span class="sp"></span><button class="btn sm ghost" data-act="planAdd" data-v="${m}">${ic('plus')}Add</button></h2>
        ${ps.map(p => { const done = logged.some(l => (l.recipeId || l.foodId) === (p.recipeId || p.foodId)); const mm = L.entryMacros(p, foodsById(), recipesById()); return `<div class="li tight"><div class="grow" data-act="editPlan" data-id="${p.id}"><div class="small">${esc(entryName(p))} <span class="muted">×${r1(p.qty)}</span></div><div class="tiny muted num">${r0(mm.cal)} kcal · P${r0(mm.p)}</div></div>${done ? '<span class="badge good">Eaten</span>' : U.mpDay <= today ? `<button class="btn sm ghost" data-act="logPlanned" data-id="${p.id}">Log it</button>` : ''}<button class="iconbtn sm" data-act="unplan" data-id="${p.id}" aria-label="Remove">${ic('close')}</button></div>`; }).join('') || '<div class="tiny muted">Nothing planned.</div>'}</div>`; }).join('')}`;
  };
  SCREENS['food:goals'] = () => {
    const p = S.profile, g = goalNow(), tdee = L.tdee(p);
    const m = S.goal.method;
    return `<div class="card" data-k="goal-method"><h2>How to set your target</h2>
        <div class="chips">${[['manual', 'Type it in'], ['tdee', 'Maintenance (TDEE)'], ['goal', 'Goal-based'], ['ai', 'Ask AI']].map(([k, l]) => `<button class="chip ${m === k ? 'on' : ''}" data-act="goalMethod" data-v="${k}">${l}</button>`).join('')}</div>
        ${m === 'manual' ? `<div class="grid2">${['cal', 'p', 'c', 'f'].map(k => `<label class="fl">${{ cal: 'Calories', p: 'Protein g', c: 'Carbs g', f: 'Fat g' }[k]}<input class="f num" type="number" value="${S.goal[k] || g[k]}" data-in="goal" data-k2="${k}"></label>`).join('')}</div>` : ''}
        ${m === 'tdee' ? `<div class="small">Resting burn <b class="num">${r0(L.bmr(p))}</b> × activity ${L.ACTIVITY[p.activity]} = <b class="num">${r0(tdee)}</b> kcal to stay the same.</div>` : ''}
        ${m === 'goal' ? `<div class="chips">${[['Lose fat', -0.75], ['Maintain', 0], ['Lean bulk', 0.35]].map(([l, v]) => `<button class="chip ${Math.sign(S.goal.rate) === Math.sign(v) ? 'on' : ''}" data-act="goalRate" data-v="${v}">${l}</button>`).join('')}</div>
          <label class="fl">Rate: <b class="num">${S.goal.rate > 0 ? '+' : ''}${S.goal.rate}% body weight / week</b> (${r1(Math.abs(p.weightLb * S.goal.rate / 100))} lb)<input type="range" min="-1.25" max="0.75" step="0.05" value="${S.goal.rate}" data-in="rate"></label>
          <div class="tiny muted">Suggested: lose 0.5-1%, lean bulk 0.25-0.5%. You can go outside these; the coach will flag it.</div>
          <div class="small">TDEE ${r0(tdee)} ${S.goal.rate < 0 ? '−' : '+'} ${r0(Math.abs(p.weightLb * S.goal.rate / 100 * 500))} = <b class="num">${r0(g.cal)}</b> kcal</div>` : ''}
        ${m === 'ai' ? `<div class="small muted">Sends your stats, goal and the last 4 weeks of weight and intake to your AI. No key set, so it uses the copy-and-paste bridge.</div><button class="btn" data-act="bridge" data-v="goal">${ic('copy')}Copy prompt for Lumo / Claude</button>` : ''}
      </div>
      <div class="card" data-k="presets"><h2>Diet preset</h2><div class="chips">${Object.keys(L.PRESETS).map(k => `<button class="chip ${S.goal.preset === k ? 'on' : ''}" data-act="preset" data-v="${k}">${k}</button>`).join('')}</div>
        <div class="tiny muted">${S.goal.preset === 'Keto' ? 'Keto caps carbs at 30 g.' : 'Splits calories into protein, carbs and fat. Every number stays editable.'}</div>
        ${macroBar('Protein', g.p, g.p, 'var(--a-p)')}${macroBar('Carbs', g.c, g.c, 'var(--a-c)')}${macroBar('Fat', g.f, g.f, 'var(--a-f)')}
        <div class="small muted">Protein ${r1(g.p / p.weightLb)} g per lb of body weight.</div></div>`;
  };
