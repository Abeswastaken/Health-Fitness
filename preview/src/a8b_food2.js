
  // ===================== Nutrition, round 2 (jake's 12 picks + Lumo handoff) =====================
  const nid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const logItem = (it, date, meal) => { const e = { id: nid('l'), date, meal, qty: it.qty }; if (it.quick) e.quick = { ...it.quick }; else if (it.recipeId) e.recipeId = it.recipeId; else e.foodId = it.foodId; S.log.push(e); const k = it.recipeId || it.foodId; if (k) S.recent = [k, ...S.recent.filter(x => x !== k)].slice(0, 25); return e; };
  const itemOf = e => e.quick ? { quick: { ...e.quick }, qty: e.qty } : e.recipeId ? { recipeId: e.recipeId, qty: e.qty } : { foodId: e.foodId, qty: e.qty };
  const itemMacros = it => L.entryMacros(it, foodsById(), recipesById());
  const itemName = it => entryName(it);

  // ----- What's left today (#11) -----
  function leftLine(t, g) {
    const left = { cal: g.cal - t.cal, p: g.p - t.p };
    if (left.cal < -50) return `<div class="tiny" data-k="left-today" style="color:var(--a-warn)">Over by ${r0(-left.cal)} kcal today.</div>`;
    if (left.cal < 60) return `<div class="tiny muted" data-k="left-today">Right on target.</div>`;
    const pool = [...new Set([...S.favFoods, ...S.recent])].map(itemById).filter(Boolean).map(x => { const m = x.ing ? L.recipePerContainer(x, foodsById()) : x; return { id: x.id, r: !!x.ing, name: x.name, cal: m.cal, p: m.p }; });
    const s = L.fillSuggestion(left, pool);
    return `<div class="tiny muted" data-k="left-today">Left: <b class="num">${r0(left.cal)}</b> kcal${left.p > 0 ? `, <b class="num">${r0(left.p)}</b> g protein` : ', protein done'}.${s ? ` Fits: <a href="#" data-act="pickFood" data-id="${s.id}" data-r="${s.r ? 1 : ''}">${esc(s.name)}</a> (${r0(s.cal)} kcal, ${r0(s.p)} g P).` : ''}</div>`;
  }

  // ----- Usually now (#5): one tap logs it again with the same amount -----
  function usualBlock(d) {
    const us = L.usuallyNow(S.log, U.meal, d).filter(x => x.recipeId ? recipesById()[x.recipeId] : foodsById()[x.foodId]);
    if (!us.length) return '';
    return `<div class="card tight" data-k="usual-now"><div class="tiny muted">Usually at ${U.meal.toLowerCase()} · tap to log</div><div class="chips">${us.map(x => `<button class="chip" data-act="usualLog" data-id="${x.key}" data-r="${x.recipeId ? 1 : ''}" data-q="${x.qty}">${ic('plus', 'class="inl"')}${esc(itemName(x))} <span class="muted">${qtyTxt(x)}</span></button>`).join('')}</div></div>`;
  }
  A.usualLog = d => { const it = d.r ? { recipeId: d.id, qty: +d.q } : { foodId: d.id, qty: +d.q }; logItem(it, U.foodDate, U.meal); save(); toast(`Logged ${itemName(it)}.`); };

  // ----- Quick add (#4) -----
  A.quickAdd = d => { const e = d && d.entry ? S.log.find(x => x.id === d.entry) : null; U.sheet = { kind: 'quick', title: e ? 'Quick add' : 'Quick add numbers', entry: e?.id, meal: e?.meal || U.meal, q: e ? { ...e.quick } : { name: '', cal: '', p: '', c: '', f: '' } }; render(); };
  SHEETS.quick = s => `<div class="small muted">For restaurant meals and guesses. No food is saved.</div>
    <label class="fl">What was it? (optional)<input class="f" id="qa-name" value="${esc(s.q.name || '')}" placeholder="e.g. Chipotle bowl"></label>
    <div class="grid2">${[['cal', 'Calories'], ['p', 'Protein g'], ['c', 'Carbs g'], ['f', 'Fat g']].map(([k, l]) => `<label class="fl">${l}<input class="f num" id="qa-${k}" type="number" inputmode="decimal" value="${s.q[k] === '' ? '' : r0(s.q[k])}"></label>`).join('')}</div>
    <div class="tiny muted">Leave calories blank and it's worked out from the macros.</div>
    <div class="chips">${MEALS.map(m => `<button class="chip ${s.meal === m ? 'on' : ''}" data-act="sheetMeal" data-v="${m}">${m}</button>`).join('')}</div>
    ${s.entry ? `<div class="row"><button class="btn ghost" data-act="delEntry" data-id="${s.entry}">${ic('trash')}Delete</button><button class="btn block" data-act="quickSave">Save changes</button></div>` : `<button class="btn block" data-act="quickSave">Log to ${U.foodDate === today ? 'today' : fmtDate(U.foodDate)}</button>`}`;
  A.quickSave = () => {
    const s = U.sheet, v = k => +($('#qa-' + k).value) || 0;
    const q = { name: $('#qa-name').value.trim(), p: v('p'), c: v('c'), f: v('f') };
    q.cal = v('cal') || r0(q.p * 4 + q.c * 4 + q.f * 9);
    if (!q.cal) return toast('Enter calories or macros.');
    if (s.entry) { const e = S.log.find(x => x.id === s.entry); if (e) { e.quick = q; e.meal = s.meal; } }
    else logItem({ quick: q, qty: 1 }, U.foodDate, s.meal);
    U.sheet = null; save(); toast(s.entry ? 'Updated.' : 'Logged.');
  };

  // ----- Meal menu (⋯): copy yesterday, select, save as meal (#1 #2 #3) -----
  A.mealMenu = (d, el, ev) => {
    ev?.stopPropagation?.();
    const m = d.v, y = dateAdd(U.foodDate, -1), ye = dayEntries(y).filter(e => e.meal === m), es = dayEntries(U.foodDate).filter(e => e.meal === m);
    U.sheet = { kind: 'mealMenu', title: m, meal: m, yN: ye.length, n: es.length }; render();
  };
  SHEETS.mealMenu = s => `${s.yN ? `<button class="btn" data-act="copyYesterday" data-v="${s.meal}">${ic('copy')}Copy yesterday's ${s.meal.toLowerCase()} here (${s.yN})</button>` : `<div class="small muted">Nothing logged at ${s.meal.toLowerCase()} yesterday.</div>`}
    ${s.n ? `<button class="btn ghost" data-act="selStart" data-v="${s.meal}">${ic('check')}Select foods to move, copy or delete</button>
    <button class="btn ghost" data-act="saveMealAs" data-v="${s.meal}">${ic('star')}Save as a meal</button>` : ''}
    <div class="tiny muted">Saved meals show in Search and under Meals, and log in one tap.</div>`;
  A.copyYesterday = d => {
    const es = dayEntries(dateAdd(U.foodDate, -1)).filter(e => e.meal === d.v);
    es.forEach(e => logItem(itemOf(e), U.foodDate, d.v)); U.sheet = null; save(); toast(`Copied ${es.length} item${es.length === 1 ? '' : 's'}.`);
  };
  // Select mode (one meal at a time)
  A.selStart = d => { U.sel = { meal: d.v, date: U.foodDate, ids: [] }; S.mealOpen[d.v] = true; U.sheet = null; render(); };
  A.selTog = d => { const a = U.sel.ids, i = a.indexOf(d.id); if (i >= 0) a.splice(i, 1); else a.push(d.id); render(); };
  A.selAll = () => { const es = dayEntries(U.sel.date).filter(e => e.meal === U.sel.meal); U.sel.ids = U.sel.ids.length === es.length ? [] : es.map(e => e.id); render(); };
  A.selDone = () => { U.sel = null; render(); };
  function selBlock(m, es, sel) {
    const n = sel.ids.length;
    return `${es.map(e => { const mm = L.entryMacros(e, foodsById(), recipesById()), on = sel.ids.includes(e.id); return `<div class="li tight" data-act="selTog" data-id="${e.id}" style="gap:10px"><span class="ckbox ${on ? 'on' : ''}">${on ? ic('check') : ''}</span><div class="grow"><div class="small">${esc(entryName(e))} <span class="muted">${qtyTxt(e)}</span></div><div class="tiny muted num">P${r0(mm.p)} C${r0(mm.c)} F${r0(mm.f)}</div></div><span class="num small">${r0(mm.cal)}</span></div>`; }).join('')}
      <div class="row wrap" data-k="sel-actions"><button class="btn sm ghost" data-act="selAll">${n === es.length ? 'None' : 'All'}</button><button class="btn sm" data-act="selMove" ${n ? '' : 'disabled'}>Move</button><button class="btn sm soft" data-act="selCopy" ${n ? '' : 'disabled'}>${ic('copy')}Copy</button><button class="btn sm ghost" data-act="selSave" ${n ? '' : 'disabled'}>${ic('star')}Save as meal</button><button class="btn sm ghost" data-act="selDel" ${n ? '' : 'disabled'}>${ic('trash')}</button><button class="btn sm ghost" data-act="selDone">Done</button></div>`;
  }
  const selEntries = () => S.log.filter(e => U.sel.ids.includes(e.id));
  A.selDel = () => { const n = U.sel.ids.length; S.log = S.log.filter(e => !U.sel.ids.includes(e.id)); U.sel = null; save(); toast(`Deleted ${n}.`); };
  A.selMove = () => { U.sheet = { kind: 'moveTo', title: 'Move to', mode: 'move', meal: U.sel.meal, date: U.sel.date }; render(); };
  A.selCopy = () => { U.sheet = { kind: 'moveTo', title: 'Copy to', mode: 'copy', meal: U.sel.meal, date: today }; render(); };
  SHEETS.moveTo = s => `<div class="small muted">${U.sel.ids.length} item${U.sel.ids.length === 1 ? '' : 's'}</div>
    <label class="fl">Day<input class="f" type="date" id="mv-date" value="${s.date}" max="${today}"></label>
    <div class="row wrap">${[-1, 0].map(k => { const dd = dateAdd(today, k); return `<button class="chip ${s.date === dd ? 'on' : ''}" data-act="mvDay" data-v="${dd}">${k ? 'Yesterday' : 'Today'}</button>`; }).join('')}</div>
    <div class="chips">${MEALS.map(m => `<button class="chip ${s.meal === m ? 'on' : ''}" data-act="sheetMeal" data-v="${m}">${m}</button>`).join('')}</div>
    <button class="btn block" data-act="mvGo">${s.mode === 'move' ? 'Move' : 'Copy'} here</button>`;
  A.mvDay = d => { U.sheet.date = d.v; render(); };
  A.mvGo = () => {
    const s = U.sheet, date = ($('#mv-date')?.value || s.date); if (!date) return;
    if (date > today) return toast('Pick today or an earlier day.');
    const es = selEntries();
    if (s.mode === 'move') es.forEach(e => { e.date = date; e.meal = s.meal; }); else es.forEach(e => logItem(itemOf(e), date, s.meal));
    U.sheet = null; U.sel = null; save(); toast(`${s.mode === 'move' ? 'Moved' : 'Copied'} ${es.length} to ${s.meal.toLowerCase()}, ${date === today ? 'today' : fmtDate(date)}.`);
  };

  // ----- Saved meals (#2) -----
  function savedMealRow(m) {
    const t = m.items.reduce((a, it) => L.add(a, itemMacros(it)), L.ZERO);
    return `<div class="li" data-act="openMeal" data-id="${m.id}" data-long="mealSavedMenu"><div class="grow"><div class="small">${ic('star', 'class="inl"')} ${esc(m.name)}</div><div class="tiny muted">${m.items.length} items · P${r0(t.p)} C${r0(t.c)} F${r0(t.f)}</div></div><span class="num small">${r0(t.cal)}</span></div>`;
  }
  A.saveMealAs = d => { const es = dayEntries(U.foodDate).filter(e => e.meal === d.v); U.sheet = { kind: 'saveMeal', title: 'Save as a meal', items: es.map(itemOf), name: d.v === 'Breakfast' ? 'My usual breakfast' : 'My ' + d.v.toLowerCase() }; render(); };
  A.selSave = () => { const es = selEntries(); U.sheet = { kind: 'saveMeal', title: 'Save as a meal', items: es.map(itemOf), name: 'My ' + U.sel.meal.toLowerCase() }; render(); };
  SHEETS.saveMeal = s => `<label class="fl">Name<input class="f" id="sm-name" value="${esc(s.name)}"></label>
    <ul class="blist">${s.items.map(it => `<li><span class="bn">${esc(itemName(it))}</span><span class="bt num">${qtyTxt(it) || r0(itemMacros(it).cal) + ' kcal'}</span></li>`).join('')}</ul>
    <button class="btn block" data-act="saveMealGo">Save meal</button>`;
  A.saveMealGo = () => { const s = U.sheet; S.meals.unshift({ id: nid('m'), name: $('#sm-name').value.trim() || 'My meal', items: s.items }); U.sheet = null; U.sel = null; save(); toast('Saved. Find it under Meals or in Search.'); };
  A.openMeal = d => { const m = S.meals.find(x => x.id === d.id); if (!m) return; U.sheet = { kind: 'logMeal', title: m.name, id: m.id, meal: U.meal, on: m.items.map(() => true) }; render(); };
  SHEETS.logMeal = s => {
    const m = S.meals.find(x => x.id === s.id); if (!m) return '';
    const t = m.items.reduce((a, it, i) => s.on[i] ? L.add(a, itemMacros(it)) : a, L.ZERO);
    return `<div class="tiny muted">Untick anything you're skipping today. Each food logs on its own, so you can change grams after.</div>
      ${m.items.map((it, i) => `<div class="li tight" data-act="lmTog" data-i="${i}" style="gap:10px"><span class="ckbox ${s.on[i] ? 'on' : ''}">${s.on[i] ? ic('check') : ''}</span><div class="grow small">${esc(itemName(it))} <span class="muted">${qtyTxt(it)}</span></div><span class="num small">${r0(itemMacros(it).cal)}</span></div>`).join('')}
      <div class="small num"><b>${r0(t.cal)}</b> kcal · P${r0(t.p)} C${r0(t.c)} F${r0(t.f)}</div>
      <div class="chips">${MEALS.map(mm => `<button class="chip ${s.meal === mm ? 'on' : ''}" data-act="sheetMeal" data-v="${mm}">${mm}</button>`).join('')}</div>
      <button class="btn block" data-act="logMealGo">Log ${s.on.filter(Boolean).length} to ${U.foodDate === today ? 'today' : fmtDate(U.foodDate)}</button>`;
  };
  A.lmTog = d => { U.sheet.on[+d.i] = !U.sheet.on[+d.i]; render(); };
  A.logMealGo = () => { const s = U.sheet, m = S.meals.find(x => x.id === s.id); let n = 0; m.items.forEach((it, i) => { if (s.on[i]) { logItem(it, U.foodDate, s.meal); n++; } }); U.sheet = null; U.q = ''; save(); toast(`Logged ${n} item${n === 1 ? '' : 's'}.`); };
  A.mealSavedMenu = d => { const m = S.meals.find(x => x.id === d.id); if (!m) return; U.sheet = { kind: 'mealSaved', title: m.name, id: m.id }; render(); };
  SHEETS.mealSaved = s => `<label class="fl">Rename<input class="f" id="ms-name" value="${esc(S.meals.find(x => x.id === s.id)?.name || '')}"></label><button class="btn" data-act="mealRename" data-id="${s.id}">Save name</button><button class="btn ghost" data-act="mealDelete" data-id="${s.id}">${ic('trash')}Delete saved meal</button><div class="tiny muted">Deleting it doesn't touch anything you already logged.</div>`;
  A.mealRename = d => { const m = S.meals.find(x => x.id === d.id); if (m) m.name = $('#ms-name').value.trim() || m.name; U.sheet = null; save(); toast('Renamed.'); };
  A.mealDelete = d => { S.meals = S.meals.filter(x => x.id !== d.id); U.sheet = null; save(); toast('Deleted.'); };

  // ----- One food card for new, edit and AI/label results (#6 #8) -----
  // Everything is per serving, and the serving's weight in grams, so portions can be in grams.
  function foodCard(f, opts = {}) { U.sheet = { kind: 'foodCard', title: opts.edit ? 'Edit food' : opts.review ? 'Check and save' : 'New food', f: { name: '', servName: '', grams: 100, cal: '', p: '', c: '', f: '', ...f }, ...opts }; render(); }
  SHEETS.foodCard = s => {
    const f = s.f;
    return `${s.review ? `<div class="small muted">${esc(s.review)} Fix anything that looks off, then save.</div>` : ''}${s.code ? `<div class="tiny muted">Barcode <b class="num">${esc(s.code)}</b> is saved with it, so the next scan finds it.</div>` : ''}
      <label class="fl">Name<input class="f" id="fc-name" value="${esc(f.name)}" placeholder="e.g. Kirkland protein bar"></label>
      <div class="grid2"><label class="fl">One serving is<input class="f" id="fc-servName" value="${esc(f.servName || '')}" placeholder="e.g. 1 bar, 2 cookies"></label><label class="fl">Weighs (g)<input class="f num" id="fc-grams" type="number" inputmode="decimal" value="${f.grams}"></label></div>
      <div class="tiny muted">Numbers below are for one serving.</div>
      <div class="grid2">${[['cal', 'Calories'], ['p', 'Protein g'], ['c', 'Carbs g'], ['f', 'Fat g']].map(([k, l]) => `<label class="fl">${l}<input class="f num" id="fc-${k}" type="number" inputmode="decimal" value="${f[k] === '' ? '' : r1(+f[k])}"></label>`).join('')}</div>
      ${s.edit ? `<div class="tiny muted">${s.used ? 'Days you already logged keep the old numbers.' : ''}</div><button class="btn block" data-act="foodCardSave">Save changes</button>` : `<button class="btn block" data-act="foodCardSave">${topFull()?.kind === 'ingPick' ? 'Save and add to recipe' : 'Save and log'}</button>`}`;
  };
  A.foodCardSave = () => {
    const s = U.sheet, v = k => $('#fc-' + k).value, n = k => +v(k) || 0;
    const grams = n('grams') || 100, p = n('p'), c = n('c'), fat = n('f');
    const nf = { name: v('name').trim() || 'My food', servName: v('servName').trim(), serv: grams, unit: 'g', cal: n('cal') || r0(p * 4 + c * 4 + fat * 9), p, c, f: fat };
    if (s.edit) {
      const old = S.foods.find(x => x.id === s.id); if (!old) return;
      if (s.used) {
        // Keep the old record for past days; the new one takes its place everywhere else.
        const fresh = { ...old, ...nf, id: nid('c') }; delete fresh.hidden; old.hidden = true; delete old.barcode;
        S.foods.push(fresh);
        const swap = id => id === old.id ? fresh.id : id;
        S.recent = S.recent.map(swap); S.favFoods = S.favFoods.map(swap);
        S.meals.forEach(m => m.items.forEach(it => { if (it.foodId === old.id) it.foodId = fresh.id; }));
        S.mealPlan.forEach(p => { if (p.foodId === old.id && p.date >= today) p.foodId = fresh.id; });
        S.recipes.forEach(r => r.ing.forEach(i => { if (i.foodId === old.id) { i.foodId = fresh.id; if (old.unit !== 'g') i.qty = i.qty / old.serv * grams; } }));
      } else {
        S.recipes.forEach(r => r.ing.forEach(i => { if (i.foodId === old.id && old.unit !== 'g') i.qty = i.qty / old.serv * grams; }));
        Object.assign(old, nf);
      }
      U.sheet = null; save(); return toast('Food updated.');
    }
    const f = { id: nid('c'), src: s.src || 'Custom', ...nf };
    if (s.code) { f.barcode = s.code; U.scanCode = null; }
    S.foods.push(f); save();
    if (topFull()?.kind === 'ingPick') { U.sheet = null; return A.ingAdd({ id: f.id }); }
    U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render();
  };
  A.foodEdit = d => { const f = S.foods.find(x => x.id === d.id); if (!f) return; const used = S.log.some(e => e.foodId === f.id); foodCard({ name: f.name, servName: f.servName || (f.unit !== 'g' && f.unit !== 'ml' ? `${f.serv} ${f.unit}` : ''), grams: gramsPer(f) || (f.unit === 'g' ? f.serv : 100), cal: f.cal, p: f.p, c: f.c, f: f.f }, { edit: true, id: f.id, used }); };

  // ----- Split a logged recipe into its foods (#10) -----
  A.explode = d => {
    const e = S.log.find(x => x.id === d.id), r = e && recipesById()[e.recipeId]; if (!r) return;
    const k = e.qty / Math.max(1, r.containers), fb = foodsById();
    r.ing.forEach(i => { const fd = fb[i.foodId]; if (fd) S.log.push({ id: nid('l'), date: e.date, meal: e.meal, foodId: fd.id, qty: i.qty / fd.serv * k }); });
    S.log = S.log.filter(x => x.id !== e.id); U.sheet = null; save(); toast(`Split into ${r.ing.length} foods. Change any one's grams.`);
  };

  // ----- USDA FoodData Central: plain foods (#7) -----
  // The key is kept in the phone's private storage (like the AI key) and added by the app; without one, USDA's shared DEMO_KEY is used.
  async function usdaSearch(q) {
    const base = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=15&dataType=${encodeURIComponent('Foundation,SR Legacy,Survey (FNDDS)')}`;
    let j;
    if (REAL) { const r = await native('http', { url: base, secretQuery: { param: 'api_key', secret: 'usda_key', fallback: 'DEMO_KEY' } }); if (r.error) throw new Error(r.error); if (r.status < 200 || r.status > 299) throw new Error('USDA ' + r.status + (r.status === 429 ? ' (too many searches: add your free key in Settings)' : '')); j = JSON.parse(r.body || '{}'); }
    else { const r = await fetch(base + '&api_key=DEMO_KEY'); if (!r.ok) throw new Error('USDA ' + r.status); j = await r.json(); }
    const num = (fn, ...ids) => { for (const id of ids) { const x = fn.find(n => String(n.nutrientNumber) === id && (id !== '208' || /kcal/i.test(n.unitName || 'kcal'))); if (x && x.value != null) return +x.value; } return null; };
    return (j.foods || []).map(x => {
      const fn = x.foodNutrients || [], p = num(fn, '203') || 0, c = num(fn, '205') || 0, f = num(fn, '204') || 0;
      const cal = num(fn, '208', '957', '958') ?? (p * 4 + c * 4 + f * 9);
      return { id: 'usda' + x.fdcId, name: L.cap(String(x.description || '').toLowerCase()), src: 'USDA', serv: 100, unit: 'g', cal: r1(cal), p: r1(p), c: r1(c), f: r1(f) };
    }).filter(x => x.cal > 0 || x.p > 0);
  }
  A.usdaSearch = async () => {
    const q = (U.q || '').trim(); if (!q) return;
    U.usda = { q, busy: true, items: [] }; render();
    let items = [], err = '';
    try { items = await usdaSearch(q); } catch (e) { err = e.message; }
    if (U.usda?.q !== q) return;
    U.usda = { q, busy: false, items, err }; render();
  };
  A.usdaPick = d => {
    const f = U.usda?.items?.[+d.i]; if (!f) return;
    if (!S.foods.some(x => x.id === f.id)) { S.foods.push(f); save(); }
    if (topFull()?.kind === 'ingPick') return A.ingAdd({ id: f.id });
    U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render();
  };
  const offBlock0 = window.offBlock;
  window.offBlock = () => {
    const u = U.usda && U.usda.q === (U.q || '').trim() ? U.usda : null;
    const usda = !u ? '' : u.busy ? '<div class="tiny muted">Searching USDA…</div>' : u.items.length ? `<div class="tiny muted caps">USDA (plain foods, per 100 g)</div><div class="list">${u.items.map((f, i) => `<div class="li" data-act="usdaPick" data-i="${i}"><div class="grow"><div class="small">${esc(f.name)}</div><div class="tiny muted num">${r0(f.cal)} kcal · P${r0(f.p)} C${r0(f.c)} F${r0(f.f)} per 100 g</div></div></div>`).join('')}</div>` : `<div class="small muted">${u.err ? 'USDA search failed: ' + esc(u.err) : 'Nothing at USDA for "' + esc(u.q) + '".'}</div>`;
    return usda + offBlock0().replace(`<button class="btn sm" data-act="offSearch"`, `<button class="btn sm" data-act="usdaSearch" ${u?.busy ? 'disabled' : ''}>${ic('search')}Plain foods (USDA)</button><button class="btn sm soft" data-act="offSearch"`).replace('Search online</button>', 'Packaged foods</button>');
  };

  // ----- Recipes from an AI chat (Lumo) or a link (#12 + handoff) -----
  A.recipeImport = () => { U.sheet = { kind: 'bridge', title: 'Recipes from Lumo or a link', v: 'recipes' }; render(); };
  window.recipesPrompt = () => {
    const mine = S.foods.filter(f => !f.hidden && (f.unit === 'g' || f.unit === 'ml')).map(f => f.name).slice(0, 150);
    return `This is a handoff to my food tracking app. Take the recipes from this conversation (the meals we planned), or the recipe at the link or description I add below, and give me each recipe in the app's import format.

For every recipe:
- name: short, like "Turkey bowl".
- portions: how many containers or servings the whole recipe makes, as we portioned it.
- cooked_weight_g: the total cooked weight if you know it, else null.
- ingredients: every ingredient with its RAW weight in grams for the WHOLE recipe (convert cups, spoons and pieces to grams), and its macros per 100 g of that raw ingredient. Use USDA FoodData Central values for plain foods (meat, rice, vegetables, oils) and the nutrition label for packaged foods. Say which in "source".
- If an ingredient is one of my saved foods, use that exact name: ${mine.join('; ') || 'none yet'}.
Check each recipe: the per-portion calories should be roughly sum(grams x calories/100) / portions.

Return ONLY valid JSON, no other text:
{"recipes":[{"name":"string","portions":number,"cooked_weight_g":number or null,"ingredients":[{"name":"string","grams":number,"per100g":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number},"source":"USDA | label | estimate"}]}]}`;
  };
  const recMatch = name => { const n = String(name || '').trim().toLowerCase(); return S.foods.find(f => !f.hidden && (f.unit === 'g' || f.unit === 'ml') && f.name.toLowerCase() === n); };
  const recLoad = (s, j) => { s.recs = j.recipes.filter(r => r && r.name && Array.isArray(r.ingredients) && r.ingredients.length); s.recOn = s.recs.map(() => true); };
  const recPer = r => { const t = r.ingredients.reduce((a, i) => { const m = i.per100g || {}, k = (+i.grams || 0) / 100; return L.add(a, { cal: (+m.calories || 0) * k, p: (+m.protein_g || 0) * k, c: (+m.carbs_g || 0) * k, f: (+m.fat_g || 0) * k }); }, L.ZERO); return L.scale(t, 1 / Math.max(1, +r.portions || 1)); };
  const bridgeSheet3 = SHEETS.bridge;
  SHEETS.bridge = s => {
    if (s.v !== 'recipes' || !s.recs) return bridgeSheet3(s);
    const n = s.recOn.filter(Boolean).length;
    return `<div class="tiny muted">Tap to choose which recipes to add. Ingredients that match your foods reuse them; the rest are added as new foods.</div>
      ${s.recs.map((r, i) => { const pp = recPer(r), on = s.recOn[i]; return `<div class="card tight" data-k="rec-import" data-act="recTog" data-i="${i}" style="cursor:pointer;flex-direction:row;gap:12px;align-items:flex-start"><span class="ckbox ${on ? 'on' : ''}">${on ? ic('check') : ''}</span><div class="grow"><b class="small">${esc(r.name)}</b><div class="tiny num">${+r.portions || 1} portions · ${r0(pp.cal)} kcal, P${r0(pp.p)} C${r0(pp.c)} F${r0(pp.f)} each</div><div class="tiny muted">${r.ingredients.map(x => `${esc(x.name)} ${r0(x.grams)} g${recMatch(x.name) ? ' ✓' : ''}`).join(' · ')}</div></div></div>`; }).join('')}
      <div class="tiny muted">✓ = already in your foods.</div>
      <div class="row"><button class="btn ghost" data-act="recBack">Back</button><button class="btn block" data-act="recApply" ${n ? '' : 'disabled'}>Add ${n} recipe${n === 1 ? '' : 's'}</button></div>`;
  };
  A.recTog = d => { U.sheet.recOn[+d.i] = !U.sheet.recOn[+d.i]; render(); };
  A.recBack = () => { delete U.sheet.recs; render(); };
  A.recApply = () => {
    const s = U.sheet; let nr = 0, nf = 0;
    s.recs.forEach((r, i) => {
      if (!s.recOn[i]) return;
      const ing = r.ingredients.filter(x => +x.grams > 0).map(x => {
        let f = recMatch(x.name);
        if (!f) { const m = x.per100g || {}; f = { id: nid('c'), name: String(x.name).trim(), src: 'AI recipe' + (x.source ? ' (' + x.source + ')' : ''), serv: 100, unit: 'g', cal: r1(+m.calories || 0), p: r1(+m.protein_g || 0), c: r1(+m.carbs_g || 0), f: r1(+m.fat_g || 0) }; S.foods.push(f); nf++; }
        return { foodId: f.id, qty: Math.round(+x.grams) };
      });
      S.recipes.push({ id: nid('r'), name: String(r.name).trim(), containers: Math.max(1, Math.round(+r.portions || 1)), cooked: +r.cooked_weight_g > 0 ? Math.round(+r.cooked_weight_g) : 0, ing }); nr++;
    });
    U.sheet = null; save(); toast(`Added ${nr} recipe${nr === 1 ? '' : 's'}${nf ? ` and ${nf} new food${nf === 1 ? '' : 's'}` : ''}. Log a container from Recipes or plan it on a day.`);
  };
  const bridgeApply3 = A.bridgeApply;
  A.bridgeApply = d => {
    if (d.v !== 'recipes') return bridgeApply3(d);
    const raw = $('#bridgeIn').value, j = parseJson(raw);
    if (!j || !Array.isArray(j.recipes) || !j.recipes.length) return toast('That answer has no recipes in the import format. Copy the prompt again.');
    if (!U.sheet.answer) U.sheet.answer = raw;
    recLoad(U.sheet, j); render();
  };
  const aiSend3 = A.aiSend;
  A.aiSend = async () => { await aiSend3(); const s = U.sheet; if (s && s.v === 'recipes' && s.answer) { const j = parseJson(s.answer); if (j && Array.isArray(j.recipes) && j.recipes.length) { recLoad(s, j); render(); } } };

  // ----- Free keys card in Settings -----
  window.freeKeysCard = () => `<div class="card" data-k="set-keys"><div class="row" data-act="keysOpen" style="cursor:pointer"><h2 class="grow">Free keys (optional)</h2>${chev(U.keysOpen)}</div>
    ${U.keysOpen ? `<div class="small"><b>USDA FoodData Central</b> (plain-food search). Works without a key at a low limit; a free key lifts it.</div>
      <ol class="small" style="margin:0;padding-left:18px"><li>Open <a href="https://fdc.nal.usda.gov/api-key-signup">fdc.nal.usda.gov/api-key-signup</a>.</li><li>Enter your name and email. The key arrives by email in a minute.</li><li>Paste it here.</li></ol>
      <label class="fl"><span>USDA key</span><input class="f" type="password" data-in="usdaKey" placeholder="${REAL && window.HFDev.hasSecret('usda_key') ? 'Key saved on this phone (type to replace)' : 'Paste your USDA key'}"></label>
      <div class="small" style="margin-top:6px"><b>Free AI</b> (for the AI buttons, instead of copy and paste). Either works with the AI card above:</div>
      <ul class="small" style="margin:0;padding-left:18px"><li><b>Google Gemini</b> (reads photos): get a key at <a href="https://aistudio.google.com/apikey">aistudio.google.com/apikey</a>. Endpoint <code>https://generativelanguage.googleapis.com/v1beta/openai/</code>, model e.g. <code>gemini-2.5-flash</code>.</li>
      <li><b>Groq</b>: get a key at <a href="https://console.groq.com/keys">console.groq.com/keys</a>. Endpoint <code>https://api.groq.com/openai/v1</code>; pick a model from its Models page (one marked "vision" for photos).</li></ul>
      <div class="tiny muted">Free tiers have daily limits and the provider may use your requests to improve its models; check its terms. Model names change, so copy the current one from the provider's page. Open Food Facts needs no key.</div>` : ''}</div>`;
  A.keysOpen = () => { U.keysOpen = !U.keysOpen; render(); };
  IN.usdaKey = el => { if (REAL) { window.HFDev.setSecret('usda_key', el.value.trim()); el.value = ''; toast(el.placeholder = 'Key saved on this phone.'); } };
