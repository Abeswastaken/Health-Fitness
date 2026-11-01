
  // ---------- Render ----------
  const phone = $('#phone');
  const SUBS = {
    food: [['log', 'Log'], ['recipes', 'Recipes'], ['mealplan', 'Meal plan'], ['goals', 'Goals']],
    train: [['today', 'Today'], ['week', 'Week'], ['balance', 'Balance'], ['programs', 'Programs'], ['library', 'Exercises'], ['equipment', 'Gear'], ['history', 'History']],
    progress: [['overview', 'Overview'], ['strength', 'Strength'], ['achievements', 'Adventure']],
  };
  function render() {
    const m = S.modules;
    const tabs = [['home', 'Home', 'home'], m.food && ['food', 'Food', 'food'], m.workout && ['train', 'Train', 'train'], ['progress', 'Progress', 'progress']].filter(Boolean);
    if (!tabs.find(t => t[0] === S.tab)) S.tab = 'home';
    const title = { home: 'Today', food: 'Food', train: 'Train', progress: 'Progress' }[S.tab];
    const subs = SUBS[S.tab];
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const prevScroll = $('#scroll')?.scrollTop || 0, prevKey = render.key;
    render.key = S.tab + ':' + (U.sub[S.tab] || '');
    let body = '';
    try { body = SCREENS[S.tab === 'home' ? 'home' : S.tab + ':' + U.sub[S.tab]]?.() || ''; } catch (e) { body = `<div class="card">Screen error: ${esc(e.message)}</div>`; console.error(e); }
    const fullScroll = [...document.querySelectorAll('.full .scroll')].map(x => x.scrollTop);
    let fulls = '';
    U.stack.forEach((f, i) => { let h = ''; try { h = FULL[f.kind](f); } catch (e) { h = `<div class="card">Screen error: ${esc(e.message)}</div>`; console.error(e); } fulls += `<div class="full" data-depth="${i}">${h}</div>`; });
    phone.innerHTML = `
      <div class="statusbar"><span>${time}</span><span>5G ▮▮▮ 82%</span></div>
      <div class="appbar" data-k="appbar"><h1 data-k="title">${title}</h1>
        ${S.tab === 'home' ? `<button class="btn sm soft" data-act="review" data-k="review-btn">${ic('spark')}Review</button>` : ''}
        <button class="iconbtn" data-act="settings" aria-label="Settings" data-k="settings-btn">${ic('gear')}</button></div>
      ${subs ? `<div class="tabsub" data-k="subtabs">${subs.map(([k, l]) => `<button class="${U.sub[S.tab] === k ? 'on' : ''}" data-act="sub" data-v="${k}">${l}</button>`).join('')}</div>` : ''}
      <div class="scroll" id="scroll">${body}</div>
      <nav class="nav" data-k="bottom-nav">${tabs.map(([k, l, i]) => `<button class="${S.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}"><span class="pill">${ic(i)}</span><span class="lbl">${l}</span></button>`).join('')}</nav>
      ${fulls}
      ${U.sheet ? `<div class="sheet-bg" data-act="closeSheetBg"><div class="sheet" data-k="sheet-${esc(U.sheet.kind)}"><div class="sh"><h3>${esc(U.sheet.title || '')}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Close">${ic('close')}</button></div><div class="sb">${SHEETS[U.sheet.kind](U.sheet)}</div></div></div>` : ''}
      ${!S.profile.setupDone ? `<div class="full">${setupScreen()}</div>` : ''}
      ${U.toast ? `<div class="toast">${esc(U.toast)}</div>` : ''}`;
    phone.classList.toggle('nolabels', !D().navLabels);
    if (prevKey === render.key && $('#scroll')) $('#scroll').scrollTop = prevScroll;
    document.querySelectorAll('.full .scroll').forEach((x, i) => { if (fullScroll[i] !== undefined && U.keepFullScroll) x.scrollTop = fullScroll[i]; });
    U.keepFullScroll = true;
    document.querySelectorAll('[data-anim]').forEach(drawAnim);
    document.querySelectorAll('[data-scrollx]').forEach(el => { el.scrollLeft = +el.dataset.scrollx; });
    if (U.focusId) { const f = document.getElementById(U.focusId); if (f) { f.focus(); const n = f.value.length; try { f.setSelectionRange(n, n); } catch (e) {} } U.focusId = null; }
    window.dispatchEvent(new CustomEvent('app-rendered', { detail: { screen: currentScreen() } }));
  }
  function currentScreen() {
    if (!S.profile.setupDone) return 'Setup';
    const f = topFull();
    if (f) return { settings: 'Settings', logger: 'Workout logger', summary: 'Workout summary', recipe: 'Recipe builder', exercise: 'Exercise', swap: 'Swap exercise', builder: 'Plan builder', dayedit: 'Edit day' }[f.kind] || f.kind;
    const base = S.tab === 'home' ? 'Home' : L.cap(S.tab) + ' > ' + U.sub[S.tab];
    return U.sheet ? base + ' > ' + (U.sheet.title || U.sheet.kind) : base;
  }
  function toast(t) { U.toast = t; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { U.toast = null; render(); }, 2400); }

  // ---------- Pieces ----------
  const macroBar = (label, val, goal, color, unit = 'g') => {
    const pct = goal ? Math.min(100, val / goal * 100) : 0, over = goal && val > goal;
    return `<div class="macro" data-k="macro-${label.toLowerCase()}"><span class="small">${label}</span><div class="bar"><i style="width:${pct}%;background:${over ? 'var(--a-alert)' : color}"></i></div><span class="small num" style="text-align:right">${r0(val)} / ${r0(goal)}${unit}</span></div>`;
  };
  const ring = (label, val, goal, color, unit = 'g', size = 70) => {
    const r = size / 2 - 6, c = 2 * Math.PI * r, pct = goal ? Math.min(1, val / goal) : 0, over = goal && val > goal * 1.05;
    return `<div class="ring" data-k="ring-${label.toLowerCase()}"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="color-mix(in srgb,var(--a-fg) 9%,transparent)" stroke-width="7"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${over ? 'var(--a-alert)' : color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c * pct} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" class="ringpct">${r0(pct * 100)}%</text></svg><div class="ringlbl"><span class="tiny muted">${label}</span><span class="small num">${r0(val)}<span class="muted"> / ${r0(goal)}${unit}</span></span></div></div>`;
  };
  const sw = (on, act, extra = '') => `<button class="switch ${on ? 'on' : ''}" data-act="${act}" ${extra} role="switch" aria-checked="${on}"></button>`;
  const level = l => `<span class="badge ${l}">${{ alert: 'Act now', warn: 'Heads up', info: 'Tip', good: 'Nice' }[l]}</span>`;
  const chev = open => `<span class="chev">${ic(open ? 'up' : 'down')}</span>`;

  function todaysWorkout(d = today) {
    const wd = dow(d), out = [];
    const mOff = !S.morning.on || S.morning.off.includes(d);
    if (S.modules.workout) {
      out.push({ kind: 'morning', name: 'Morning movement', time: S.morning.time, off: mOff, items: EX.length ? L.morningMovement(EXB, ownedGear(), wd) : [] });
      const main = (S.planWeek?.[wd] || []);
      const groups = S.days[wd].off ? [] : S.days[wd].groups;
      if (main.length) out.push({ kind: 'main', name: groups.length ? groups.join(' + ') : 'Daily minimum', time: S.days[wd].time, items: main, off: false });
    }
    const done = S.sessions.filter(s => s.date === d);
    for (const w of out) w.done = done.some(s => (w.kind === 'morning') === !!s.morning);
    return out;
  }

  // ---------- Levels, achievements, quests (all worked out from history, nothing stored) ----------
  const LEG = new Set(L.GROUPS.Legs);
  const hitsLegs = s => s.sets.some(x => EXB[x.ex]?.pm.some(m => LEG.has(m)));
  function dayHit(d) {
    const t = totalsFor(d), g = goalNow();
    return { food: t.cal > 0, protein: t.p >= g.p * 0.9, macro: t.p >= g.p * 0.9 && Math.abs(t.cal - g.cal) <= g.cal * 0.1 };
  }
  function weekCounts(start) {
    const end = dateAdd(start, 6), ss = sessionsBetween(start, end);
    const days = [...Array(7)].map((_, i) => dateAdd(start, i)).filter(d => d <= today);
    return {
      legDaysWeek: new Set(ss.filter(s => !s.morning && hitsLegs(s)).map(s => s.date)).size,
      morningsWeek: new Set(ss.filter(s => s.morning).map(s => s.date)).size,
      foodDaysWeek: days.filter(d => dayEntries(d).length).length,
      proteinDaysWeek: days.filter(d => dayHit(d).protein).length,
    };
  }
  let gameCache = null;
  // Daily quest counts for one date.
  function dayCounts(d, prDays) {
    const es = dayEntries(d), ss = S.sessions.filter(s => s.date === d), h = dayHit(d), g = goalNow(), t = totalsFor(d);
    const main = ss.filter(s => !s.morning);
    return {
      breakfast: es.some(e => e.meal === 'Breakfast') ? 1 : 0,
      meals: new Set(es.filter(e => e.meal !== 'Snack').map(e => e.meal)).size,
      protein: h.protein ? 1 : 0,
      withinCal: t.cal > 0 && t.cal <= g.cal * 1.05 ? 1 : 0,
      sets: main.reduce((a, s) => a + s.sets.length, 0),
      legSets: ss.reduce((a, s) => a + s.sets.filter(x => EXB[x.ex]?.pm.some(m => LEG.has(m))).length, 0),
      morning: ss.some(s => s.morning) ? 1 : 0,
      weighIn: S.weights.some(w => w.date === d) ? 1 : 0,
      prs: prDays[d] || 0,
    };
  }
  function weekWork(ws) {
    const days = [...Array(7)].map((_, i) => dateAdd(ws, i)).filter(d => d <= today);
    const ss = sessionsBetween(ws, dateAdd(ws, 6));
    const main = ss.filter(s => !s.morning);
    return {
      sets: main.reduce((a, s) => a + s.sets.length, 0),
      volume: main.reduce((a, s) => a + s.sets.reduce((u, x) => u + (x.w || 0) * x.reps, 0), 0),
      mornings: ss.filter(s => s.morning).length,
      foodDays: days.filter(d => dayEntries(d).length).length,
      macroDays: days.filter(d => dayHit(d).macro).length,
      weighIns: S.weights.filter(w => w.date >= ws && w.date <= dateAdd(ws, 6)).length,
    };
  }
  const shopItem = id => L.SHOP.find(x => x.id === id);
  const ownedBy = d => S.game.items.filter(x => x.at <= d).map(x => shopItem(x.id)).filter(Boolean);
  const weaponMult = d => Math.max(1, ...ownedBy(d).filter(x => x.slot === 'weapon').map(x => x.dmg));
  const petGold = d => Math.max(0, ...ownedBy(d).filter(x => x.slot === 'pet').map(x => x.gold));
  function game() {
    const sig = S.sessions.length + ':' + S.log.length + ':' + S.weights.length + ':' + S.stars.length + ':' + JSON.stringify(goalNow()) + ':' + JSON.stringify(S.game);
    if (gameCache && gameCache.sig === sig) return gameCache;
    const X = L.XP, Gd = L.GOLD, ev = [];
    const add = (d, t, xp = 0, gold = 0, small) => ev.push({ d, t, xp, gold, small });
    const st = { workouts: 0, mornings: 0, legSessions: 0, prs: 0, heaviest: 0, bestVolume: 0, macroDays: 0, containers: 0, weighIns: S.weights.length, stars: S.stars.length, legStreak: 0, bestStreak: 0, balancedWeeks: 0, bossKills: 0, dailyDone: 0, goldEarned: 0, chests: 0, pets: 0, slotsFilled: 0, level: 1 };
    const best = {}, prDays = {};
    const sorted = [...S.sessions].sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')));
    for (const s of sorted) {
      if (s.morning) { st.mornings++; add(s.date, 'Morning movement', X.morning, Gd.morning); continue; }
      st.workouts++; if (hitsLegs(s)) st.legSessions++;
      let vol = 0;
      for (const x of s.sets) {
        vol += (x.w || 0) * x.reps; st.heaviest = Math.max(st.heaviest, x.w || 0);
        const e = L.epley(x.w, x.reps);
        if (x.w > 0 && best[x.ex] && e > best[x.ex] + 0.5) { st.prs++; prDays[s.date] = (prDays[s.date] || 0) + 1; add(s.date, 'New best: ' + exName(x.ex), X.pr, Gd.pr); }
        if (x.w > 0) best[x.ex] = Math.max(best[x.ex] || 0, e);
      }
      st.bestVolume = Math.max(st.bestVolume, vol);
      add(s.date, 'Workout, ' + s.sets.length + ' sets', X.workout + X.perSet * s.sets.length, Gd.workout + petGold(s.date));
      const loot = L.loot(s.id);
      if (loot) { if (loot.name === 'Gold chest') st.chests++; add(s.date, 'Loot: ' + loot.name, loot.xp, loot.gold); }
    }
    const logDates = [...new Set(S.log.map(e => e.date))].sort();
    for (const d of logDates) { const h = dayHit(d); add(d, 'Food logged', X.foodDay, 0, true); if (h.macro) { st.macroDays++; add(d, 'Hit your macros', X.macroDay, Gd.macroDay); } }
    st.containers = S.log.filter(e => e.recipeId).reduce((a, e) => a + e.qty, 0);
    for (const w of S.weights) add(w.date, 'Weigh-in', X.weighIn, Gd.weighIn, true);
    // Daily quests, last 60 days.
    for (let i = 60; i >= 0; i--) {
      const d = dateAdd(today, -i), c = dayCounts(d, prDays);
      for (const q of L.dailyQuests(d)) if ((c[q.key] || 0) >= q.goal) { st.dailyDone++; add(d, 'Daily: ' + q.name, q.xp, q.gold); }
    }
    // Streaks: any workout or food log counts. A streak shield potion covers one missed day.
    const freezes = S.game.items.filter(x => x.id === 'x-freeze').map(x => x.at).sort();
    let run = 0, legRun = 0, used = 0;
    const activeDay = {};
    for (let i = 130; i >= 0; i--) {
      const d = dateAdd(today, -i);
      let active = S.sessions.some(s => s.date === d) || dayEntries(d).length > 0;
      if (!active && i > 0 && run > 0 && used < freezes.length && freezes[used] <= d) { used++; active = true; add(d, 'Streak shield used', 0, 0, true); }
      activeDay[d] = active;
      run = active ? run + 1 : 0; st.bestStreak = Math.max(st.bestStreak, run);
      if (run && run % 7 === 0) add(d, run + '-day streak', X.streak7, Gd.streak7);
      legRun = S.sessions.some(s => s.date === d && hitsLegs(s)) ? legRun + 1 : 0; st.legStreak = Math.max(st.legStreak, legRun);
    }
    let curStreak = 0; for (let i = 0; i < 130; i++) { const d = dateAdd(today, -i); if (activeDay[d]) curStreak++; else if (i > 0) break; }
    // Weekly quests and bosses in finished weeks pay out.
    const xpBefore = d => ev.filter(e => e.d < d).reduce((a, e) => a + e.xp, 0);
    const bosses = [];
    for (let k = 8; k >= 1; k--) {
      const ws = dateAdd(weekStart(), -7 * k), we = dateAdd(ws, 6), c = weekCounts(ws);
      for (const q of L.QUESTS) if (c[q.key] >= q.goal) add(we, 'Quest: ' + q.name, X.quest, Gd.quest);
      const boss = L.bossFor(ws, L.levelFor(xpBefore(ws))), dmg = L.bossDamage(weekWork(ws), weaponMult(we));
      const won = dmg >= boss.hp; bosses.push({ ws, boss, dmg, won });
      if (won) { st.bossKills++; add(we, 'Defeated ' + boss.name, L.BOSS_XP, Gd.boss); }
    }
    const goldEarned = ev.reduce((a, e) => a + e.gold, 0);
    const spent = S.game.items.reduce((a, x) => a + (shopItem(x.id)?.price || 0), 0);
    const xp = ev.reduce((a, e) => a + e.xp, 0), lv = L.levelFor(xp);
    const into = xp - L.xpForLevel(lv), need = L.xpForLevel(lv + 1) - L.xpForLevel(lv);
    const owned = ownedBy(today);
    Object.assign(st, { goldEarned, level: lv, pets: owned.filter(x => x.slot === 'pet').length, slotsFilled: new Set(owned.map(x => x.slot).filter(x => x !== 'potion')).size });
    const wc = weekCounts(weekStart());
    const ws0 = weekStart(), boss = L.bossFor(ws0, L.levelFor(xpBefore(ws0))), mult = weaponMult(today);
    const hits = [...Array(7)].map((_, i) => dateAdd(ws0, i)).filter(d => d <= today).map(d => {
      const ss = S.sessions.filter(s => s.date === d), main = ss.filter(s => !s.morning);
      const w = { sets: main.reduce((a, s) => a + s.sets.length, 0), volume: main.reduce((a, s) => a + s.sets.reduce((u, x) => u + (x.w || 0) * x.reps, 0), 0), mornings: ss.filter(s => s.morning).length, foodDays: dayEntries(d).length ? 1 : 0, macroDays: dayHit(d).macro ? 1 : 0, weighIns: S.weights.some(x => x.date === d) ? 1 : 0 };
      return { d, w, dmg: L.bossDamage(w, mult) };
    });
    const dmg = hits.reduce((a, h) => a + h.dmg, 0);
    const tc = dayCounts(today, prDays);
    gameCache = { sig, xp, lv, title: L.titleFor(lv), into, need, st, curStreak, gold: goldEarned - spent, goldEarned, spent, owned, mult,
      ach: L.achievements(st), quests: L.QUESTS.map(q => ({ ...q, have: wc[q.key] || 0, done: (wc[q.key] || 0) >= q.goal })),
      daily: L.dailyQuests(today).map(q => ({ ...q, have: Math.min(tc[q.key] || 0, q.goal), done: (tc[q.key] || 0) >= q.goal })),
      boss: { ...boss, dmg, hits, won: dmg >= boss.hp, ends: dateAdd(ws0, 6) }, bosses: bosses.reverse(), freezesLeft: freezes.length - used,
      ev: ev.filter(e => e.xp || e.gold || e.t.startsWith('Streak')).sort((a, b) => b.d.localeCompare(a.d)) };
    return gameCache;
  }
  const xpBar = (into, need) => `<div class="bar xp"><i style="width:${Math.min(100, into / need * 100)}%;background:var(--a-accent)"></i></div>`;
  const lvBadge = lv => `<span class="lvbadge" aria-label="Level ${lv}">${ic('shield')}<b class="num">${lv}</b></span>`;
  const goldTag = n => `<span class="gold num">${ic('coin', 'class="inl"')}${Math.round(n).toLocaleString()}</span>`;

  // ---------- Trends table (Home and Progress) ----------
  function trendRows(days = 3, weeks = 4) {
    const wAt = d => { const w = S.weights.filter(x => x.date <= d).slice(-7); return w.length ? w.reduce((a, x) => a + x.lb, 0) / w.length : null; };
    const daily = [...Array(days)].map((_, i) => dateAdd(today, -i)).map(d => { const t = totalsFor(d); const w = S.weights.find(x => x.date === d); const ss = S.sessions.filter(s => s.date === d); return { label: d === today ? 'Today' : DAYS[dow(d)] + ' ' + shortDate(d), d, cal: t.cal || null, p: t.p, w: w ? w.lb : null, sets: ss.reduce((a, s) => a + s.sets.length, 0) }; });
    const weekly = [...Array(weeks)].map((_, k) => { const a = dateAdd(today, -7 * (k + 1) + 1), b = dateAdd(today, -7 * k); const ds = [...Array(7)].map((_, i) => totalsFor(dateAdd(a, i))).filter(t => t.cal > 0); const w0 = wAt(dateAdd(a, -1)), w1 = wAt(b); return { label: 'Wk ' + shortDate(a), cal: ds.length ? ds.reduce((s, t) => s + t.cal, 0) / ds.length : null, p: ds.length ? ds.reduce((s, t) => s + t.p, 0) / ds.length : 0, wc: w0 && w1 ? w1 - w0 : null, sets: sessionsBetween(a, b).reduce((t, s) => t + s.sets.length, 0) }; });
    return { daily, weekly };
  }
  function trendTable(days = 3, weeks = 4) {
    const { daily, weekly } = trendRows(days, weeks), g = goalNow();
    const calCell = c => c === null ? '<span class="muted">—</span>' : `<span style="color:${c > g.cal * 1.1 ? 'var(--a-alert)' : c < g.cal * 0.8 ? 'var(--a-warn)' : 'inherit'}">${r0(c)}</span>`;
    return `<table class="tt num small"><thead><tr><th></th><th>kcal</th><th>Protein</th><th>Weight</th><th>Sets</th></tr></thead><tbody>
      ${daily.map(r => `<tr data-act="openFoodDay" data-d="${r.d}"><td>${r.label}</td><td>${calCell(r.cal)}</td><td>${r.cal ? r0(r.p) + 'g' : '—'}</td><td>${r.w ? r1(r.w) : '<span class="muted">—</span>'}</td><td>${r.sets || '<span class="muted">0</span>'}</td></tr>`).join('')}
      <tr class="sep"><td colspan="5"></td></tr>
      ${weekly.map(r => `<tr><td>${r.label}</td><td>${calCell(r.cal)}</td><td>${r.cal ? r0(r.p) + 'g' : '—'}</td><td>${r.wc === null ? '—' : (r.wc > 0 ? '+' : '') + r1(r.wc)}</td><td>${r.sets}</td></tr>`).join('')}</tbody></table>
      <div class="tiny muted">Days show that day's weigh-in. Weeks show average kcal and protein per logged day and the change in 7-day average weight.</div>`;
  }

  // ---------- Screens ----------
  const SCREENS = {};
  SCREENS.home = () => {
    const cards = {
      macros: () => {
        if (!S.modules.food) return '';
        const g = goalNow(), t = totalsFor(today), net = L.netRemaining(g.cal, t.cal);
        const burn = S.sessions.filter(s => s.date === today).reduce((a, s) => a + (s.kcal || 0), 0);
        const planned = todaysWorkout().filter(w => !w.done && !w.off).reduce((a, w) => a + (w.kind === 'main' ? L.sessionCalories(S.profile, 50) : 35), 0);
        return `<div class="card" data-k="card-macros" data-act="goFood">
          <h2>Food today<span class="sp"></span><span class="tiny muted">tap to log</span></h2>
          <div class="netline"><span class="num big">${r0(net)}</span><span class="muted small">kcal ${net >= 0 ? 'left' : 'over'} of ${r0(g.cal)}</span></div>
          ${D().macroStyle === 'rings' ? `<div class="ringgrid">${ring('Calories', t.cal, g.cal, 'var(--a-accent)', '')}${ring('Protein', t.p, g.p, 'var(--a-p)')}${ring('Carbs', t.c, g.c, 'var(--a-c)')}${ring('Fat', t.f, g.f, 'var(--a-f)')}</div>` :
          macroBar('Calories', t.cal, g.cal, 'var(--a-accent)', '') + macroBar('Protein', t.p, g.p, 'var(--a-p)') + macroBar('Carbs', t.c, g.c, 'var(--a-c)') + macroBar('Fat', t.f, g.f, 'var(--a-f)')}
          <div class="row small hr" data-k="burn-line"><span class="grow muted">Workout burn (not counted in net)</span><span class="num">${burn ? r0(burn) + ' kcal' : planned ? '~' + planned + ' kcal planned' : '0 kcal'}</span></div>
        </div>`;
      },
      streak: () => {
        const G = game();
        const wk = sessionsThisWeek().filter(s => !s.morning).length;
        const planned = S.days.filter(d => !d.off && d.groups.length).length;
        const soFar = S.days.slice(0, dow(today) + 1).filter(d => !d.off && d.groups.length).length;
        const q = G.daily.filter(x => !x.done).slice(0, 2), doneQ = G.daily.filter(x => x.done).length, doneW = G.quests.filter(x => x.done).length;
        const nextAch = G.ach.filter(a => !a.done).sort((a, b) => b.have / b.goal - a.have / a.goal)[0];
        return `<div class="card" data-k="card-streak" data-act="goAch">
          <div class="row">${lvBadge(G.lv)}<div class="grow"><div class="row"><b class="grow head">${G.title}</b>${goldTag(G.gold)}<span class="tiny muted num">${G.into.toLocaleString()} / ${G.need.toLocaleString()} XP</span></div>${xpBar(G.into, G.need)}</div></div>
          <div class="grid3 stats"><div><b class="num">${ic('flame', 'class="inl"')}${G.curStreak}</b><span class="tiny muted">day streak</span></div><div><b class="num">${wk}/${planned}</b><span class="tiny muted">workouts this week</span></div><div><b class="num">${soFar ? r0(Math.min(1, wk / soFar) * 100) + '%' : '\u2014'}</b><span class="tiny muted">${soFar ? 'adherence' : 'no workouts due yet'}</span></div></div>
          <div class="tiny muted">Today's quests ${doneQ}/${G.daily.length} · weekly ${doneW}/${G.quests.length} · ${esc(G.boss.name)} ${G.boss.won ? 'defeated' : Math.max(0, G.boss.hp - G.boss.dmg) + ' HP left'}</div>
          ${q.map(x => `<div class="row small"><span class="grow">${esc(x.name)}</span><span class="tiny muted num">+${x.xp} XP +${x.gold}g</span><div class="bar" style="width:60px"><i style="width:${x.have / x.goal * 100}%;background:var(--a-c)"></i></div><span class="num tiny" style="width:28px;text-align:right">${x.have}/${x.goal}</span></div>`).join('')}
          ${nextAch ? `<div class="row small"><span class="achi sm">${ic(nextAch.icon)}</span><span class="grow">Next: <b>${esc(nextAch.name)}</b> <span class="muted">${esc(nextAch.desc)}</span></span><span class="num tiny">${r0(Math.min(nextAch.have, nextAch.goal))}/${nextAch.goal}</span></div>` : ''}
        </div>`;
      },
      workout: () => {
        if (!S.modules.workout) return '';
        const ws = todaysWorkout();
        return `<div class="card" data-k="card-workout"><h2>Today's workout<span class="sp"></span><span class="tiny muted">${DAYS[dow(today)]}</span></h2>
          ${ws.map((w, i) => slotRow(w, i)).join('') || '<div class="muted small">Rest day. Nothing planned.</div>'}
        </div>`;
      },
      weight: () => {
        const pts = S.weights.slice(-21);
        const last = S.weights[S.weights.length - 1], rate = L.weeklyRate(S.weights.slice(-28));
        return `<div class="card" data-k="card-weight"><h2>Weight<span class="sp"></span><span class="num">${last ? fmtW(last.lb) : '—'}</span></h2>
          ${sparkline(pts.map(p => p.lb), 330, 50)}
          <div class="row small"><span class="grow muted">${rate === null ? 'Need more weigh-ins' : (rate < 0 ? 'Losing ' : 'Gaining ') + Math.abs(rate).toFixed(1) + ' lb/week (7-day avg)'}</span><button class="btn sm ghost" data-act="logWeight">Add</button></div></div>`;
      },
      trends: () => `<div class="card" data-k="card-trends"><h2>Trends<span class="sp"></span><button class="btn sm ghost" data-act="goOverview">More</button></h2>${trendTable(3, 3)}</div>`,
      soreness: () => {
        if (!S.modules.workout) return '';
        const s = S.soreness[today] || {};
        const sum = Object.entries(s).filter(([, v]) => v).map(([g, v]) => `${g} ${['', 'mild', 'sore', 'very sore'][v]}`).join(', ');
        return `<div class="card" data-k="card-soreness"><h2 data-act="soreToggle" class="tap">How do you feel?<span class="sp"></span><span class="tiny muted">${sum || 'not rated today'}</span>${chev(U.soreOpen)}</h2>
          ${U.soreOpen ? soreGrid() : ''}</div>`;
      },
      coach: () => {
        const items = runReview().filter(x => !S.dismissed.includes(x.id)).slice(0, 3);
        return `<div class="card" data-k="card-coach"><h2>Coach<span class="sp"></span><button class="btn sm soft" data-act="review">Review all</button></h2>
          ${items.map(x => `<div class="row small">${level(x.level)}<span class="grow">${esc(x.title)}</span></div>`).join('') || '<div class="muted small">Nothing needs attention.</div>'}
          <div class="tiny muted">Plain-code checks. No AI used until you tap Ask coach.</div></div>`;
      },
    };
    const order = [...D().homeOrder, ...Object.keys(HOME_CARDS).filter(k => !D().homeOrder.includes(k))];
    return order.filter(k => !D().homeHidden.includes(k) && cards[k]).map(k => cards[k]()).join('');
  };
  const soreGrid = () => { const s = S.soreness[today] || {}; return ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'].map(g => `<div class="row small"><span style="width:72px">${g}</span><div class="chips">${['None', 'Mild', 'Sore', 'Very'].map((l, v) => `<button class="chip ${(s[g] || 0) === v ? 'on' : ''}" data-act="sore" data-g="${g}" data-v="${v}">${l}</button>`).join('')}</div></div>`).join(''); };
  // One compact row per workout slot; the Done badge sits right after the title.
  function slotRow(w, i) {
    const open = U.slotOpen === i;
    return `<div class="slot" data-k="slot-${w.kind}"><div class="row"><span class="dot" style="background:${w.done ? 'var(--a-good)' : w.off ? 'var(--a-alert)' : 'var(--a-warn)'}"></span>
      <div class="grow tap" data-act="slotOpen" data-i="${i}"><div class="row" style="gap:6px"><b style="${w.off ? 'text-decoration:line-through' : ''}">${esc(w.name)}</b>${w.done ? '<span class="badge good">Done</span>' : w.off ? '<span class="badge alert">Skipped</span>' : ''}${chev(open)}</div>
      <div class="tiny muted">${w.time} · ${w.items.length} exercises · ${w.items.reduce((a, x) => a + x.sets, 0)} sets · tap to ${open ? 'hide' : 'see'} them</div></div>
      ${w.done ? '' : w.off ? `<button class="btn sm ghost" data-act="morningToggle" data-d="${today}">Restore</button>` : `${w.kind === 'morning' ? `<button class="btn sm ghost" data-act="morningToggle" data-d="${today}">Skip</button>` : ''}<button class="btn sm" data-act="startWorkout" data-i="${i}">Start</button>`}</div>
      ${open ? `<div class="slotlist">${w.items.map(x => `<div class="li tight" data-act="openEx" data-id="${esc(x.ex)}">${exThumb(x.ex)}<div class="grow"><div class="small">${esc(exName(x.ex))}${x.daily ? ' <span class="badge">daily min</span>' : ''}</div><div class="tiny muted num">${targetLine(x)}</div></div>${ic('fwd', 'class="inl muted"')}</div>`).join('')}
        ${w.done || w.off ? '' : `<button class="btn block" data-act="startWorkout" data-i="${i}">Start ${esc(w.name.toLowerCase())}</button>`}</div>` : ''}</div>`;
  }

  function sparkline(vals, w, h) {
    if (vals.length < 2) return '';
    const mn = Math.min(...vals), mx = Math.max(...vals), sx = w / (vals.length - 1), sy = v => h - 6 - (v - mn) / ((mx - mn) || 1) * (h - 12);
    const d = vals.map((v, i) => `${i ? 'L' : 'M'}${(i * sx).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
    return `<svg class="svgchart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d} L${w} ${h} L0 ${h}Z" fill="color-mix(in srgb,var(--a-accent) 12%,transparent)"/><path d="${d}" fill="none" stroke="var(--a-accent)" stroke-width="2"/><circle cx="${w}" cy="${sy(vals[vals.length - 1])}" r="3.5" fill="var(--a-accent)"/></svg>`;
  }
