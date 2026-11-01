
  // ---------- Native parts (installed app only): barcode scan, Health Connect, AI ----------
  // JS asks with HFDev.call(id, method, args); Android answers through HFNative._done(id, result).
  const NATIVE = { n: 0, waits: {} };
  window.HFNative = { _done(id, r) { const f = NATIVE.waits[id]; delete NATIVE.waits[id]; if (f) f(r || {}); } };
  const native = (method, args = {}) => new Promise(res => {
    if (!REAL || !window.HFDev.call) return res({ error: 'Only in the installed app.' });
    const id = 'n' + (++NATIVE.n); NATIVE.waits[id] = res;
    window.HFDev.call(id, method, JSON.stringify(args));
  });

  // ----- Barcode scan + Open Food Facts -----
  // Open Food Facts gives nutrients per 100 g and, when it knows it, per serving.
  function offFood(code, p) {
    const n = p.nutriments || {}, q = +p.serving_quantity;
    const per = q > 0 && n['energy-kcal_serving'] != null ? 'serving' : '100g';
    const v = k => +(n[k + '_' + per] ?? (per === '100g' ? n[k] : 0)) || 0;
    const name = [p.product_name, p.brands && p.brands.split(',')[0]].filter(Boolean).join(' · ') || 'Barcode ' + code;
    // serving_quantity is in grams (ml for drinks), so portions can always be entered in grams.
    return { id: 'off' + code, name, src: 'OpenFoodFacts', serv: per === 'serving' ? q : 100, unit: 'g', servName: per === 'serving' && p.serving_size ? p.serving_size : '', cal: r1(v('energy-kcal')), p: r1(v('proteins')), c: r1(v('carbohydrates')), f: r1(v('fat')), barcode: code };
  }
  A.scanReal = async () => {
    const r = await native('scan');
    if (r.cancelled) return;
    if (r.error || !r.code) return toast('Scanner: ' + (r.error || 'nothing read'));
    const code = r.code;
    let f = S.foods.find(x => x.barcode === code);
    if (!f) {
      toast('Looking up ' + code + '…');
      const res = await native('http', { url: `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity` });
      let j = null; try { j = JSON.parse(res.body || ''); } catch (e) {}
      if (j && j.status === 1 && j.product) { f = offFood(code, j.product); S.foods.push(f); save(); }
    }
    if (!f) { U.scanCode = code; U.sheet = { kind: 'scan', title: 'Not found', code }; return render(); }
    U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render();
  };

  // ----- Online food search (Open Food Facts), right inside the food log -----
  async function getJson(url) {
    if (REAL) { const r = await native('http', { url }); if (r.error) throw new Error(r.error); if (r.status < 200 || r.status > 299) throw new Error('HTTP ' + r.status); return JSON.parse(r.body || 'null'); }
    const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
  }
  A.offSearch = async () => {
    const q = (U.q || '').trim(); if (!q) return;
    U.off = { q, busy: true, items: [] }; render();
    const fields = 'code,product_name,brands,nutriments,serving_size,serving_quantity';
    let items = [], err = '';
    try {
      const j = await getJson(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=20&fields=${fields}`);
      items = (j && j.hits) || [];
    } catch (e) { err = e.message; }
    if (!items.length) {
      try {
        const j = await getJson(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=20&fields=${fields}`);
        items = (j && j.products) || []; err = '';
      } catch (e) { err = err || e.message; }
    }
    items = items.filter(p => p.code && p.product_name && p.nutriments && (p.nutriments['energy-kcal_100g'] != null || p.nutriments['energy-kcal_serving'] != null)).map(p => offFood(p.code, p));
    if (U.off?.q !== q) return;
    U.off = { q, busy: false, items, err }; render();
  };
  A.offPick = d => {
    const f = U.off?.items?.[+d.i]; if (!f) return;
    if (!S.foods.some(x => x.id === f.id)) { S.foods.push(f); save(); }
    if (topFull()?.kind === 'ingPick') return A.ingAdd({ id: f.id });
    U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render();
  };
  // Results card shown under "No match in your foods" (and below your own matches).
  window.offBlock = () => {
    const o = U.off && U.off.q === (U.q || '').trim() ? U.off : null;
    const btns = `<div class="row wrap"><button class="btn sm" data-act="offSearch" ${o?.busy ? 'disabled' : ''}>${ic('search')}${o?.busy ? 'Searching…' : 'Search online'}</button><button class="btn sm soft" data-act="foodAI" data-src="search">${ic('spark')}Ask AI for macros</button><button class="btn sm ghost" data-act="newFood">${ic('plus')}By hand</button></div>`;
    if (!o || o.busy) return btns;
    return `${o.items.length ? `<div class="tiny muted caps">Open Food Facts</div><div class="list">${o.items.map((f, i) => `<div class="li" data-act="offPick" data-i="${i}"><div class="grow"><div class="small">${esc(f.name)}</div><div class="tiny muted num">${r0(f.cal)} kcal · P${r0(f.p)} C${r0(f.c)} F${r0(f.f)} per ${f.servName ? esc(f.servName) : r0(f.serv) + ' g'}</div></div></div>`).join('')}</div>` : `<div class="small muted">${o.err ? 'Online search failed: ' + esc(o.err) : 'Nothing online for "' + esc(o.q) + '".'} Try fewer words, or ask the AI.</div>`}${btns}`;
  };

  // ----- Health Connect -----
  // Pull weigh-ins, resting heart rate and sleep. Manual weigh-ins stay as they are.
  let hcBusy = false, hcLast = 0;
  async function hcSync(force) {
    if (!REAL || !S.hc.connected || hcBusy || (!force && Date.now() - hcLast < 15 * 60e3)) return;
    hcBusy = true;
    try {
      const r = await native('hcRead', { days: 365 });
      if (r.error) return;
      if (r.weights && S.hc.read.weight) {
        const manual = new Set(S.weights.filter(w => w.src === 'Manual').map(w => w.date));
        const hc = r.weights.filter(w => !manual.has(w.date)).map(w => ({ date: w.date, lb: w.lb, src: 'Health Connect' }));
        S.weights = [...S.weights.filter(w => w.src === 'Manual'), ...hc].sort((a, b) => a.date.localeCompare(b.date));
        const last = S.weights[S.weights.length - 1]; if (last) S.profile.weightLb = last.lb;
      }
      const smp = {};
      if (r.rhr?.length && S.hc.read.rhr) { const t = r.rhr.find(x => x.date === today); const base = r.rhr.filter(x => x.date < today).slice(-14); smp.rhrToday = t ? t.bpm : null; smp.rhrBase = base.length ? Math.round(base.reduce((a, x) => a + x.bpm, 0) / base.length) : null; }
      if (r.sleep?.length && S.hc.read.sleep) { const n = r.sleep.find(x => x.date === today); smp.sleepHrs = n ? n.hours : null; }
      S.hcSamples = smp; S.hc.granted = r.granted || []; hcLast = Date.now(); gameCache = null; save(); render();
    } finally { hcBusy = false; }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) hcSync(); });
  A.hcConnect = async () => {
    const st = await native('hcStatus');
    if (st.error) return toast(st.error);
    if (!st.available) { toast(st.needsUpdate ? 'Update Health Connect first.' : 'Install Health Connect first.'); return native('hcOpen'); }
    const r = await native('hcRequest');
    const g = r.granted || [];
    S.hc.connected = g.length > 0; S.hc.granted = g;
    S.hc.read = { weight: g.includes('weight'), hr: g.includes('hr'), rhr: g.includes('rhr'), sleep: g.includes('sleep') };
    S.hc.write.sessions = g.includes('exercise');
    save(); render();
    toast(g.length ? `Connected: ${g.length} of 7 allowed.` : 'Nothing allowed. You can try again.');
    hcSync(true);
  };
  A.hcOpen = () => native('hcOpen');
  A.hcSyncNow = () => { hcSync(true).then(() => toast('Synced.')); };
  // After a workout: fill in watch heart rate, then recompute calories with it.
  function hcWorkoutHr(sess, startMs) {
    if (!REAL || !S.hc.connected || !S.hc.read.hr) return;
    native('hcHeartRate', { start: new Date(startMs).toISOString(), end: new Date().toISOString() }).then(r => {
      if (!r.avg) return;
      sess.avgHr = r.avg;
      sess.kcal = L.sessionCalories(S.profile, sess.min, r.avg, sess.morning ? L.MET.light : L.MET.strength);
      const f = U.stack.find(x => x.kind === 'summary'); if (f) { f.avgHr = r.avg; f.kcal = sess.kcal; }
      save(); render();
    });
  }
  function hcSendWorkout(sess) {
    if (!REAL || !S.hc.connected || !S.hc.write.sessions) return;
    const end = new Date(sess.start), start = new Date(end.getTime() - sess.min * 60e3);
    const names = [...new Set(sess.sets.map(x => exName(x.ex)))];
    native('hcWriteSession', { start: start.toISOString(), end: end.toISOString(), title: sess.morning ? 'Morning movement' : 'Strength workout', notes: names.join(', '), kcal: sess.kcal || 0, force: S.hc.conflict === 'app' }).then(r => {
      if (r.ok) toast('Sent to Health Connect.');
      else if (r.overlap) toast('Your watch already logged this workout, so the watch\'s copy stays.');
      else if (r.error) toast('Health Connect: ' + r.error);
    });
  }

  // ----- AI (any OpenAI-compatible service) -----
  const aiReady = () => REAL && S.ai.endpoint && S.ai.model;
  const aiUrl = () => { const e = S.ai.endpoint.trim().replace(/\/+$/, ''); return /\/chat\/completions$/.test(e) ? e : e + '/chat/completions'; };
  async function aiCall(text, img) {
    const content = img ? [{ type: 'text', text }, { type: 'image_url', image_url: { url: img } }] : text;
    const r = await native('http', { url: aiUrl(), method: 'POST', useAiKey: true, body: JSON.stringify({ model: S.ai.model, max_tokens: 2000, messages: [{ role: 'user', content }] }) });
    if (r.error) throw new Error(r.error);
    let j = null; try { j = JSON.parse(r.body); } catch (e) {}
    if (r.status < 200 || r.status > 299) throw new Error(`${r.status}: ${(j && (j.error?.message || j.message)) || (r.body || '').slice(0, 160)}`);
    const msg = j?.choices?.[0]?.message?.content;
    return Array.isArray(msg) ? msg.map(x => x.text || '').join('') : (msg || '');
  }
  A.aiTest = async () => {
    if (!aiReady()) return toast('Fill in the endpoint and model first.');
    toast('Testing…');
    try { const t = await aiCall('Reply with just the word OK.'); toast('Connected. The model said: ' + t.slice(0, 60)); } catch (e) { toast('Failed: ' + e.message); }
  };
  // Photo for plate and gear prompts, shrunk before sending.
  IN.aiImg = el => { const f = el.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const k = Math.min(1, 1024 / Math.max(img.width, img.height)); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); U.sheet.img = c.toDataURL('image/jpeg', .8); render(); }; img.src = rd.result; }; rd.readAsDataURL(f); };
  A.aiSend = async () => {
    const s = U.sheet; if (!s || s.busy) return;
    const needsImg = s.v === 'food' || s.v === 'eqphoto';
    if (needsImg && !s.img) return toast('Add a photo first.');
    s.busy = true; s.err = ''; render();
    try { s.answer = await aiCall(bridgePrompt(s.v).replace(/\n\n\(Attach the photo when you paste this\.\)/, ''), needsImg ? s.img : null); }
    catch (e) { s.err = e.message; }
    s.busy = false; render();
  };
  const bridgeBase = SHEETS.bridge;
  SHEETS.bridge = s => {
    if (!aiReady()) return bridgeBase(s);
    const needsImg = s.v === 'food' || s.v === 'eqphoto';
    return `<div class="small">Sends to <b>${esc(S.ai.model)}</b>${window.HFDev.hasSecret('ai_key') ? '' : ' (no API key saved)'}.</div>
      ${needsImg ? `<label class="btn ghost sm" style="cursor:pointer;align-self:flex-start">${ic('camera')}${s.img ? 'Change photo' : 'Add a photo'}<input type="file" accept="image/*" data-in="aiImg" hidden></label>${s.img ? `<img src="${s.img}" alt="" style="max-height:160px;border-radius:8px;align-self:flex-start">` : ''}` : ''}
      ${extraBox(s)}
      <button class="btn" data-act="aiSend" ${s.busy ? 'disabled' : ''}>${ic('spark')}${s.busy ? 'Asking…' : s.answer ? 'Ask again' : 'Ask AI'}</button>
      ${s.err ? `<div class="small" style="color:var(--a-alert)">${esc(s.err)}</div>` : ''}
      ${s.answer ? aiAnswerView(s) : ''}
      <label class="fl">Answer<textarea class="f small" rows="4" id="bridgeIn" placeholder='{ ... }'>${esc(s.answer || '')}</textarea></label>
      <button class="btn soft" data-act="bridgeApply" data-v="${s.v}">Apply</button>
      <details class="tiny"><summary>Prompt</summary><textarea class="f small" rows="6" readonly id="bridgeOut">${esc(bridgePrompt(s.v))}</textarea></details>`;
  };
  const parseJson = t => { try { return JSON.parse((String(t).match(/\{[\s\S]*\}/) || [''])[0]); } catch (e) { return null; } };
  // Readable view of the answer before applying it.
  function aiAnswerView(s) {
    const j = parseJson(s.answer); if (!j) return '';
    if (j.suggestions) return `<ul class="blist">${j.suggestions.map(x => `<li><span class="bn"><b>${esc(x.title)}</b>: ${esc(x.change || '')} <span class="muted">${esc(x.why || '')}</span></span></li>`).join('')}</ul>`;
    if (j.exercises) return `<b class="small">${esc(j.routine_name || 'Workout')}</b><ul class="blist">${j.exercises.map(x => `<li><span class="bn">${esc(x.name)}${aiEx(x.name) ? '' : ' <span class="muted">(not in your list)</span>'}</span><span class="bt num">${x.sets} × ${esc(String(x.reps))}</span></li>`).join('')}</ul>`;
    if (j.serving_g != null) return `<div class="small"><b>${esc(j.name || '')}</b>${j.brand ? ' · ' + esc(j.brand) : ''}</div><div class="small num">${esc(j.serving || '1 serving')} (${r0(j.serving_g)} g): ${r0(j.calories)} kcal · P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div><div class="tiny muted">${esc(j.source || '')}</div>`;
    if (j.foods) return `<ul class="blist">${j.foods.map(x => `<li><span class="bn">${esc(x.name)}</span><span class="bt num">${r0(x.grams)} g${x.calories != null ? ' · ' + r0(x.calories) + ' kcal' : ''}</span></li>`).join('')}</ul><div class="small num">${r0(j.total_calories)} kcal · P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div>`;
    if (j.calories) return `<div class="small num">${r0(j.calories)} kcal · P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div><div class="tiny muted">${esc(j.reason || '')}</div>`;
    if (j.matches) return `<div class="small">Found: ${j.matches.map(esc).join(', ') || 'nothing from your list'}</div>`;
    if (j.why) return `<div class="small">${esc(j.why)}</div>`;
    return '';
  }
  const aiEx = name => { const n = String(name).toLowerCase().replace(/[^a-z0-9 ]/g, ''); return EX.find(e => e.n.toLowerCase().replace(/[^a-z0-9 ]/g, '') === n) || EX.find(e => e.n.toLowerCase().includes(n) || n.includes(e.n.toLowerCase())); };
  const applyRecipe = A.bridgeApply;
  A.bridgeApply = d => {
    if (d.v === 'recipe' || (!REAL && d.v !== 'foodai')) return applyRecipe(d);
    const j = parseJson($('#bridgeIn').value);
    if (!j) return toast('That answer isn\'t valid JSON.');
    if (d.v === 'food') {
      // Each food on the plate becomes its own entry, in grams, so every portion can be adjusted.
      const t = Date.now(), parts = (j.foods || []).filter(x => +x.grams > 0 && x.calories != null);
      const add = (k, name, grams, m) => { const f = { id: 'c' + t + '_' + k, name, src: 'AI photo', serv: Math.round(grams), unit: 'g', cal: r1(+m.cal || 0), p: r1(+m.p || 0), c: r1(+m.c || 0), f: r1(+m.f || 0) }; S.foods.push(f); S.log.push({ id: 'l' + t + '_' + k, date: U.foodDate, meal: U.meal, foodId: f.id, qty: 1 }); };
      if (parts.length) parts.forEach((x, k) => add(k, x.name, +x.grams, { cal: x.calories, p: x.protein_g, c: x.carbs_g, f: x.fat_g }));
      else add(0, 'Plate: ' + (j.foods || []).map(x => x.name).slice(0, 3).join(', '), (j.foods || []).reduce((a, x) => a + (+x.grams || 0), 0) || 300, { cal: j.total_calories, p: j.protein_g, c: j.carbs_g, f: j.fat_g });
      toast(`Logged ${parts.length || 1} item${parts.length > 1 ? 's' : ''} to ${U.meal.toLowerCase()}. Tap any to change the grams.`);
    } else if (d.v === 'foodai') {
      const g = +j.serving_g || 100, s = U.sheet;
      const f = { id: 'c' + Date.now(), name: [j.name || s.name || 'Food', j.brand].filter(Boolean).join(' · '), src: 'AI' + (j.source ? ' (' + j.source + ')' : ''), serv: g, unit: 'g', servName: j.serving || '', cal: r1(+j.calories || 0), p: r1(+j.protein_g || 0), c: r1(+j.carbs_g || 0), f: r1(+j.fat_g || 0) };
      if (s.code) { f.barcode = s.code; U.scanCode = null; }
      S.foods.push(f); save();
      if (topFull()?.kind === 'ingPick') { U.sheet = null; return A.ingAdd({ id: f.id }); }
      U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; return render();
    } else if (d.v === 'goal') {
      Object.assign(S.goal, { method: 'manual', cal: r0(j.calories), p: r0(j.protein_g), c: r0(j.carbs_g), f: r0(j.fat_g) }); toast('Targets updated.');
    } else if (d.v === 'schemes') {
      (j.schemes || []).forEach(x => { const k = Object.keys(S.schemes).find(k => S.schemes[k].name.toLowerCase() === String(x.name).toLowerCase()); if (k) Object.assign(S.schemes[k], { lo: +x.lo || S.schemes[k].lo, hi: +x.hi || S.schemes[k].hi, rest: +x.rest || S.schemes[k].rest }); }); toast('Rep schemes updated.');
    } else if (d.v === 'eqphoto' || d.v === 'eqlink') {
      const names = d.v === 'eqphoto' ? (j.matches || []) : [j.match].filter(Boolean);
      const hit = EQUIPMENT.filter(e => names.some(n => String(n).toLowerCase() === e.name.toLowerCase()));
      hit.forEach(e => { S.equipment[e.id] = d.v === 'eqphoto' ? 'own' : 'wish'; }); toast(hit.length ? `${d.v === 'eqphoto' ? 'Marked as owned' : 'Added to wishlist'}: ${hit.map(e => e.name).join(', ')}` : 'No match in the gear list.');
    } else if (d.v === 'workout') {
      const items = (j.exercises || []).map(x => { const e = aiEx(x.name); return e && { ex: e.id, sets: Math.max(1, Math.min(8, +x.sets || 3)), scheme: 'build' }; }).filter(Boolean);
      if (!items.length) return toast('None of those exercises are in your list.');
      U.sheet = null; save();
      U.log = { kind: 'main', name: j.routine_name || 'AI workout', items, idx: 0, sets: items.map(it => [...Array(it.sets)].map(() => newSet(it.ex, it.scheme))), start: Date.now() };
      U.stack = [{ kind: 'logger' }]; U.keepFullScroll = false; return render();
    } else { U.sheet = null; return render(); }
    U.sheet = null; gameCache = null; save(); render();
  };
