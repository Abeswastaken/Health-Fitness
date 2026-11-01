
  // ----- Progress -----
  const RANGES = [['7d', '7 days', 7], ['2w', '2 weeks', 14], ['1m', '1 month', 30], ['3m', '3 months', 91], ['6m', '6 months', 182], ['1y', '1 year', 365]];
  const rangeDays = () => (RANGES.find(r => r[0] === U.range) || RANGES[2])[2];
  function lineChart(dots, line, h = 150, fmtY = r1) {
    if (!dots.length) return '<div class="muted small">No data in this range.</div>';
    const w = 340, ys = [...dots, ...line].map(p => p.y), mn = Math.floor(Math.min(...ys) - 0.5), mx = Math.ceil(Math.max(...ys) + 0.5);
    const xs = dots.map(p => p.x), x0 = new Date(xs[0]), x1 = new Date(xs[xs.length - 1]);
    const X = d => 30 + (new Date(d) - x0) / ((x1 - x0) || 1) * (w - 38), Y = v => 8 + (mx - v) / ((mx - mn) || 1) * (h - 26);
    const ticks = [mn, (mn + mx) / 2, mx];
    return `<svg class="svgchart" viewBox="0 0 ${w} ${h}">${ticks.map(t => `<line x1="30" x2="${w - 8}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--a-line)"/><text x="0" y="${Y(t) + 3}">${fmtY(t)}</text>`).join('')}
      ${dots.length < 120 ? dots.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="2.2" fill="var(--a-muted)"/>`).join('') : ''}
      <path d="${line.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--a-accent)" stroke-width="2.4"/>
      <text x="30" y="${h - 2}">${shortDate(xs[0])}</text><text x="${w - 34}" y="${h - 2}">${shortDate(xs[xs.length - 1])}</text></svg>`;
  }
  SCREENS['progress:overview'] = () => {
    const n = rangeDays(), from = dateAdd(today, -n + 1), g = goalNow();
    const pts = S.weights.filter(w => w.date >= from);
    const ptsAll = S.weights.filter(w => w.date >= dateAdd(from, -6));
    const avg = L.rolling(ptsAll, 7).filter(p => p.date >= from);
    const rate = L.weeklyRate(ptsAll), target = S.profile.weightLb * S.goal.rate / 100;
    const days = [...Array(n)].map((_, i) => dateAdd(from, i));
    const foodDays = days.map(d => ({ d, t: totalsFor(d) }));
    const logged = foodDays.filter(x => x.t.cal > 0);
    const avgCal = logged.length ? logged.reduce((a, x) => a + x.t.cal, 0) / logged.length : 0;
    const avgP = logged.length ? logged.reduce((a, x) => a + x.t.p, 0) / logged.length : 0;
    const ss = sessionsBetween(from, today), workouts = ss.filter(s => !s.morning).length;
    const wChange = avg.length > 1 ? avg[avg.length - 1].v - avg[0].v : null;
    // Nutrition: daily bars up to a month, weekly averages beyond.
    let nutri;
    if (n <= 31) nutri = foodDays.slice().reverse().map(x => `<div class="row small tap" data-act="openFoodDay" data-d="${x.d}"><span style="width:78px" class="muted">${DAYS[dow(x.d)]} ${shortDate(x.d)}</span><div class="bar grow"><i style="width:${Math.min(100, x.t.cal / g.cal * 100)}%;background:${x.t.cal > g.cal * 1.05 ? 'var(--a-alert)' : 'var(--a-accent)'}"></i></div><span class="num" style="width:44px;text-align:right">${x.t.cal ? r0(x.t.cal) : '—'}</span>${ic('fwd', 'class="inl muted"')}</div>`).join('');
    else { const weeks = []; for (let k = 0; k * 7 < n; k++) { const a = dateAdd(today, -7 * (k + 1) + 1); const ds = [...Array(7)].map((_, i) => dateAdd(a, i)).map(totalsFor).filter(t => t.cal > 0); weeks.push({ a, cal: ds.length ? ds.reduce((s, t) => s + t.cal, 0) / ds.length : 0 }); }
      nutri = weeks.map(w => `<div class="row small tap" data-act="openFoodDay" data-d="${w.a}"><span style="width:78px" class="muted">Wk ${shortDate(w.a)}</span><div class="bar grow"><i style="width:${Math.min(100, w.cal / g.cal * 100)}%;background:var(--a-accent)"></i></div><span class="num" style="width:44px;text-align:right">${w.cal ? r0(w.cal) : '—'}</span></div>`).join(''); }
    const wkN = Math.min(26, Math.ceil(n / 7));
    const vol = [...Array(wkN)].map((_, k) => { const a = dateAdd(today, -7 * (k + 1) + 1), b = dateAdd(today, -7 * k); const s2 = sessionsBetween(a, b); return { a, vol: s2.reduce((t, s) => t + s.sets.reduce((u, x) => u + (x.w || 0) * x.reps, 0), 0), sets: s2.reduce((t, s) => t + s.sets.length, 0) }; }).reverse();
    const vmax = Math.max(1, ...vol.map(v => v.vol));
    // One row per week: a dot per day (filled = workout, ring = morning only), then sets and pounds.
    const wkRows = vol.slice(-8).reverse().map(w => { const ds = [...Array(7)].map((_, i) => dateAdd(w.a, i)); return { ...w, dots: ds.map(d => { const ss = S.sessions.filter(s => s.date === d); return d > today ? 'f' : ss.some(s => !s.morning) ? 'w' : ss.length ? 'm' : 'n'; }), n: ds.filter(d => S.sessions.some(s => s.date === d && !s.morning)).length }; });
    return `<div class="row" data-k="range"><label class="small muted" for="rangeSel">Show</label><select class="f" id="rangeSel" data-in="range" style="width:auto">${RANGES.map(([k, l]) => `<option value="${k}" ${U.range === k ? 'selected' : ''}>Last ${l}</option>`).join('')}</select></div>
      <div class="card tight" data-k="ov-stats"><div class="grid4 stats"><div><b class="num">${wChange === null ? '—' : (wChange > 0 ? '+' : '') + r1(wChange)}</b><span class="tiny muted">lb</span></div><div><b class="num">${avgCal ? r0(avgCal) : '—'}</b><span class="tiny muted">avg kcal</span></div><div><b class="num">${workouts}</b><span class="tiny muted">workouts</span></div><div><b class="num">${ss.reduce((a, s) => a + s.sets.length, 0)}</b><span class="tiny muted">sets</span></div></div></div>
      <div class="card" data-k="ov-body"><h2>Body<span class="sp"></span><span class="tiny muted">dots = weigh-ins, line = 7-day avg</span></h2>${lineChart(pts.map(p => ({ x: p.date, y: p.lb })), avg.map(p => ({ x: p.date, y: p.v })))}
        <div class="grid2 small num"><div><div class="tiny muted">Actual</div>${rate === null ? '—' : (rate > 0 ? '+' : '') + rate.toFixed(2) + ' lb/wk'}</div><div><div class="tiny muted">Target</div>${(target > 0 ? '+' : '') + target.toFixed(2)} lb/wk</div></div></div>
      ${S.modules.food ? `<div class="card" data-k="ov-nutrition"><h2>Nutrition<span class="sp"></span><span class="tiny muted">tap a day to open its log</span></h2><div class="small num">Average ${r0(avgCal)} kcal · ${r0(avgP)} g protein · ${logged.length} of ${n} days logged</div><div class="scroll-in">${nutri}</div></div>` : ''}
      ${S.modules.workout ? `<div class="card" data-k="ov-training"><h2>Training<span class="sp"></span><span class="tiny muted">last ${wkRows.length} weeks</span></h2>
        <div class="wkhead tiny muted"><span>Week of</span><span class="wkdots">${DAYS.map(x => `<i>${x[0]}</i>`).join('')}</span><span>Sets</span><span>Lifted</span></div>
        ${wkRows.map(w => `<div class="wkrow small"><span class="muted">${shortDate(w.a)}</span><span class="wkdots">${w.dots.map(t => `<i class="dt ${t}"></i>`).join('')}</span><b class="num">${w.sets}</b><span class="vcell"><span class="bar"><i style="width:${w.vol / vmax * 100}%;background:var(--a-accent)"></i></span><span class="num tiny">${(w.vol / 1000).toFixed(1)}k</span></span></div>`).join('')}
        <div class="tiny muted">Filled dot = workout, ring = morning movement only. Lifted = pounds moved (weight × reps).</div></div>` : ''}
      <div class="card" data-k="correlation"><h2>Food vs weight vs training</h2>${trendTable(3, Math.min(8, Math.max(2, Math.ceil(n / 7))))}</div>`;
  };

  // Strength: e1RM per lift, chips grouped by muscle group, then highlights.
  function liftSeries(id) {
    return S.sessions.filter(s => s.sets.some(x => x.ex === id && x.w > 0)).sort((a, b) => a.date.localeCompare(b.date)).map(s => ({ x: s.date, y: Math.max(...s.sets.filter(x => x.ex === id).map(x => L.epley(x.w, x.reps))), sid: s.id }));
  }
  SCREENS['progress:strength'] = () => {
    const lifts = [...new Set(S.sessions.flatMap(s => s.sets.filter(x => x.w > 0).map(x => x.ex)))];
    if (!lifts.length) return '<div class="card small muted">Log a weighted lift to see strength here.</div>';
    const id = lifts.includes(U.strengthEx) ? U.strengthEx : lifts[0];
    const pts = liftSeries(id), bw = S.profile.weightLb, best = Math.max(...pts.map(p => p.y));
    const byGroup = {}; lifts.forEach(l => { const g = L.groupOf(EXB[l]?.pm[0]) || 'Other'; (byGroup[g] = byGroup[g] || []).push(l); });
    const stats = lifts.map(l => { const s = liftSeries(l); return { l, s, gain: s.length > 1 ? s[s.length - 1].y - s[0].y : 0, pct: s.length > 1 ? (s[s.length - 1].y / s[0].y - 1) * 100 : 0, n: s.length }; });
    const jumps = stats.filter(x => x.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 5), jmax = Math.max(1, ...jumps.map(j => j.gain));
    const prog = stats.filter(x => x.n >= 3).sort((a, b) => b.pct - a.pct)[0];
    const bestS = S.sessions.filter(s => !s.morning).map(s => ({ s, vol: s.sets.reduce((a, x) => a + (x.w || 0) * x.reps, 0) })).sort((a, b) => b.vol - a.vol)[0];
    const steady = stats.slice().sort((a, b) => b.n - a.n)[0];
    const lo = U.liftOpen || {};
    return `<div class="card tight" data-k="lift-chips">${[...GROUPS, 'Other'].filter(g => byGroup[g]).map(g => { const has = byGroup[g].includes(id); return `<div class="liftgrp"><h3 class="tap row small" data-act="liftGroup" data-v="${g}"><b>${g}</b><span class="tiny muted">${byGroup[g].length}</span><span class="grow tiny ell" style="text-align:right">${has && !lo[g] ? esc(exName(id)) : ''}</span>${chev(!!lo[g])}</h3>${lo[g] ? `<div class="chips">${byGroup[g].map(l => `<button class="chip sm ${l === id ? 'on' : ''}" data-act="strengthEx" data-v="${l}">${esc(exName(l))}</button>`).join('')}</div>` : ''}</div>`; }).join('')}</div>
      <div class="card" data-k="strength-chart"><h2>${esc(exName(id))}<span class="sp"></span><span class="num">${fmtW(best)}</span></h2>${pts.length > 1 ? lineChart(pts, pts) : '<div class="muted small">Log it twice to see a curve.</div>'}
      <div class="small muted">Estimated 1-rep max · ${(best / bw).toFixed(2)}× body weight · Epley formula, best set each session</div><button class="btn sm ghost" data-act="openEx" data-id="${id}" style="align-self:flex-start">${ic('history')}Full history</button></div>
      <h3 class="sect">${ic('trophy', 'class="inl"')} Highlights</h3>
      <div class="card" data-k="hl-jump"><h2>Biggest jump<span class="sp"></span><span class="tiny muted">1RM gained since first logged</span></h2>${jumps.map(j => `<div class="row small tap" data-act="strengthEx" data-v="${j.l}"><span style="width:110px" class="ell">${esc(exName(j.l))}</span><div class="bar grow"><i style="width:${j.gain / jmax * 100}%;background:var(--a-good)"></i></div><span class="num" style="width:52px;text-align:right">+${r1(j.gain)}</span></div>`).join('') || '<div class="small muted">Not enough history yet.</div>'}</div>
      ${prog ? `<div class="card" data-k="hl-progression"><h2>Best progression<span class="sp"></span><span class="badge good">+${r0(prog.pct)}%</span></h2><div class="small">${esc(exName(prog.l))}: ${fmtW(prog.s[0].y)} → ${fmtW(prog.s[prog.s.length - 1].y)} over ${prog.n} sessions</div>${lineChart(prog.s, prog.s, 110)}</div>` : ''}
      ${bestS ? `<div class="card" data-k="hl-workout" data-act="openSession" data-id="${bestS.s.id}"><h2>Best workout<span class="sp"></span><span class="num">${r0(bestS.vol).toLocaleString()} lb</span></h2><div class="small muted">${fmtDate(bestS.s.date)} · ${bestS.s.sets.length} sets · ${bestS.s.min} min</div><div class="tiny">${[...new Set(bestS.s.sets.map(x => x.ex))].map(exName).join(' · ')}</div></div>` : ''}
      ${steady ? `<div class="card tight" data-k="hl-steady"><div class="row small"><span class="achi sm">${ic('shield')}</span><span class="grow">Most consistent: <b>${esc(exName(steady.l))}</b></span><span class="num">${steady.n} sessions</span></div></div>` : ''}`;
  };

  // ---------- Adventure: hero, weekly boss, quests, shop, badges ----------
  // Simple SVG art. The hero wears whatever is equipped.
  function heroSvg(eq, cls = '') {
    const has = id => Object.values(eq).includes(id);
    const body = has('b-plate') ? '#b8c2cc' : has('b-chain') ? '#8b949e' : has('b-tunic') ? '#4f7a3a' : '#9aa5b1';
    const cape = has('c-royal') ? '#6b3fa0' : has('c-red') ? '#b3261e' : '';
    const sword = has('w-legend') ? ['#e8c547', '#fff3b0'] : has('w-flame') ? ['#e8590c', '#ffd43b'] : has('w-iron') ? ['#adb5bd', '#e9ecef'] : has('w-wood') ? ['#8d5a2b', '#b07a45'] : null;
    const shield = has('s-tower') ? 'tower' : has('s-kite') ? 'kite' : has('s-buckler') ? 'buckler' : '';
    const head = has('h-crown') ? 'crown' : has('h-horns') ? 'horns' : has('h-helm') ? 'helm' : has('h-cap') ? 'cap' : '';
    const pet = has('p-dragon') ? 'dragon' : has('p-owl') ? 'owl' : has('p-cat') ? 'cat' : '';
    return `<svg viewBox="0 0 120 130" class="hero ${cls}" aria-label="Your hero">
      ${cape ? `<path d="M44 48 L76 48 L84 108 L36 108Z" fill="${cape}"/>` : ''}
      <rect x="47" y="96" width="10" height="26" fill="#3d3d3d"/><rect x="63" y="96" width="10" height="26" fill="#3d3d3d"/>
      <rect x="44" y="46" width="32" height="54" rx="6" fill="${body}" stroke="#222" stroke-width="2"/>
      ${has('b-chain') ? '<path d="M46 56h28M46 64h28M46 72h28M46 80h28M46 88h28" stroke="#6c757d" stroke-width="1.5"/>' : ''}
      ${has('b-plate') ? '<path d="M60 48v50M46 70h28" stroke="#6c757d" stroke-width="2"/>' : ''}
      <rect x="34" y="50" width="10" height="34" rx="5" fill="#e0b48a" stroke="#222" stroke-width="2"/><rect x="76" y="50" width="10" height="34" rx="5" fill="#e0b48a" stroke="#222" stroke-width="2"/>
      <circle cx="60" cy="32" r="15" fill="#e8c09a" stroke="#222" stroke-width="2"/><circle cx="55" cy="31" r="1.8" fill="#222"/><circle cx="65" cy="31" r="1.8" fill="#222"/><path d="M55 38q5 3 10 0" stroke="#222" stroke-width="1.5" fill="none"/>
      ${head === 'cap' ? '<path d="M45 30a15 13 0 0 1 30 0z" fill="#8d5a2b" stroke="#222" stroke-width="2"/>' : ''}
      ${head === 'helm' || head === 'horns' ? '<path d="M44 33a16 17 0 0 1 32 0v-2H44z" fill="#adb5bd" stroke="#222" stroke-width="2"/><path d="M60 22v16" stroke="#222" stroke-width="3"/>' : ''}
      ${head === 'horns' ? '<path d="M45 24q-8-6-6-16q5 8 11 10zM75 24q8-6 6-16q-5 8-11 10z" fill="#f1f3f5" stroke="#222" stroke-width="1.5"/>' : ''}
      ${head === 'crown' ? '<path d="M46 22l4-10 5 7 5-9 5 9 5-7 4 10z" fill="#e8c547" stroke="#222" stroke-width="2"/>' : ''}
      ${sword ? `<g class="sword"><rect x="83" y="70" width="12" height="4" fill="#222"/><rect x="87" y="28" width="4" height="44" fill="${sword[0]}" stroke="#222" stroke-width="1"/><path d="M87 28l2-6 2 6z" fill="${sword[1]}"/>${has('w-flame') ? '<path d="M89 26q-6 10 0 20q6-10 0-20z" fill="#ffd43b" opacity=".7"/>' : ''}</g>` : ''}
      ${shield === 'buckler' ? '<circle cx="34" cy="70" r="11" fill="#8d5a2b" stroke="#222" stroke-width="2"/><circle cx="34" cy="70" r="3" fill="#adb5bd"/>' : ''}
      ${shield === 'kite' ? '<path d="M22 56h24v16q0 12-12 20q-12-8-12-20z" fill="#1c7ed6" stroke="#222" stroke-width="2"/><path d="M34 58v30M24 68h20" stroke="#f1f3f5" stroke-width="3"/>' : ''}
      ${shield === 'tower' ? '<rect x="20" y="52" width="26" height="46" rx="3" fill="#495057" stroke="#222" stroke-width="2"/><path d="M33 56v38M24 74h18" stroke="#e8c547" stroke-width="3"/>' : ''}
      ${pet === 'cat' ? '<g transform="translate(88 106)"><ellipse cx="10" cy="10" rx="10" ry="7" fill="#868e96"/><circle cx="19" cy="3" r="5" fill="#868e96"/><path d="M16 0l1-5 2 4M21 -1l2-4 0 5" fill="#868e96"/><path d="M0 8q-6-8 0-12" stroke="#868e96" stroke-width="2.5" fill="none"/></g>' : ''}
      ${pet === 'owl' ? '<g transform="translate(78 30)"><ellipse cx="10" cy="12" rx="8" ry="10" fill="#8d5a2b"/><circle cx="7" cy="9" r="3" fill="#fff"/><circle cx="13" cy="9" r="3" fill="#fff"/><circle cx="7" cy="9" r="1.3"/><circle cx="13" cy="9" r="1.3"/><path d="M9 12l1 2 1-2z" fill="#e8c547"/></g>' : ''}
      ${pet === 'dragon' ? '<g transform="translate(86 98)"><ellipse cx="12" cy="12" rx="11" ry="8" fill="#2f9e44"/><path d="M8 6l-6-10 12 6zM16 6l4-11 4 10z" fill="#51cf66"/><circle cx="23" cy="8" r="5" fill="#2f9e44"/><circle cx="25" cy="7" r="1.2" fill="#fff"/><path d="M0 14q-8 2-6 8" stroke="#2f9e44" stroke-width="3" fill="none"/></g>' : ''}
    </svg>`;
  }
  function monsterSvg(b, cls = '') {
    const c = b.color, eye = '<circle cx="48" cy="52" r="6" fill="#fff"/><circle cx="72" cy="52" r="6" fill="#fff"/><circle cx="49" cy="53" r="3"/><circle cx="71" cy="53" r="3"/>';
    const extra = {
      goblin: '<path d="M30 46l-14-8 14 16zM90 46l14-8-14 16z" fill="' + c + '"/>',
      troll: '<rect x="30" y="92" width="60" height="10" rx="4" fill="#a0522d"/>',
      wraith: '<path d="M28 90q8 14 16 0q8 14 16 0q8 14 16 0q8 14 16 0" fill="' + c + '"/>',
      ogre: '<path d="M44 34l-4-14 10 10zM76 34l4-14-10 10z" fill="#f1f3f5"/>',
      golem: '<path d="M38 40h44M36 70h48" stroke="#5c3d2e" stroke-width="3"/>',
      dragon: '<path d="M30 56l-26-20 10 30zM90 56l26-20-10 30z" fill="' + c + '" opacity=".8"/>',
      slime: '<circle cx="40" cy="80" r="4" fill="#fff" opacity=".5"/>',
      lich: '<path d="M40 30l4-14 6 10 10-14 10 14 6-10 4 14z" fill="#e8c547"/>',
    }[b.id] || '';
    return `<svg viewBox="0 0 120 120" class="monster ${cls}" aria-label="${esc(b.name)}">${extra}<path d="M28 96q-6-60 32-66q38 6 32 66z" fill="${c}" stroke="#222" stroke-width="2"/>${eye}<path d="M46 74q14 10 28 0" stroke="#222" stroke-width="2.5" fill="#fff"/><path d="M50 75l3 5 3-4 4 5 3-5 4 4 3-5" stroke="#222" stroke-width="1.2" fill="none"/></svg>`;
  }
  const ADV_TABS = [['hero', 'Hero'], ['quests', 'Quests'], ['shop', 'Shop'], ['badges', 'Badges']];
  const SLOT_NAMES = { weapon: 'Weapons', shield: 'Shields', head: 'Helmets', body: 'Armor', cape: 'Capes', pet: 'Pets', potion: 'Potions' };
  const earnRules = () => {
    const X = L.XP, Gd = L.GOLD;
    return [['Workout', `${X.workout} XP + ${X.perSet} per set, ${Gd.workout} gold`], ['Morning movement', `${X.morning} XP, ${Gd.morning} gold`], ['New personal best', `${X.pr} XP, ${Gd.pr} gold`], ['Food logged for a day', `${X.foodDay} XP`], ['Hit protein and calories', `${X.macroDay} XP, ${Gd.macroDay} gold`], ['Weigh-in', `${X.weighIn} XP, ${Gd.weighIn} gold`], ['Daily quest', '10-40 XP, 5-20 gold each'], ['Weekly quest', `${X.quest} XP, ${Gd.quest} gold`], ['Every 7 days of streak', `${X.streak7} XP, ${Gd.streak7} gold`], ['Defeat the weekly boss', `${L.BOSS_XP} XP, ${Gd.boss} gold`], ['Loot after a workout (random)', 'coin pouch 20 gold, gold chest 60 gold, or scroll 40 XP']];
  };
  SCREENS['progress:achievements'] = () => {
    const G = game(), nextT = L.TITLES.find(([n]) => n > G.lv), tab = U.advTab || 'hero';
    const earned = G.ach.filter(a => a.done).length;
    const head = `<div class="card" data-k="level"><div class="row">${heroSvg(S.game.equip, 'sm')}<div class="grow"><div class="row"><b class="head big2 grow">${G.title}</b>${goldTag(G.gold)}</div><div class="tiny muted">Level ${G.lv} · ${G.xp.toLocaleString()} XP total${nextT ? ` · "${nextT[1]}" at level ${nextT[0]}` : ''}</div>${xpBar(G.into, G.need)}<div class="tiny muted num">${(G.need - G.into).toLocaleString()} XP to level ${G.lv + 1}</div></div></div></div>
      <div class="seg" data-k="adv-tabs">${ADV_TABS.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="advTab" data-v="${k}">${l}</button>`).join('')}</div>`;
    const B = G.boss, left = Math.max(0, B.hp - B.dmg), daysLeft = Math.round((new Date(B.ends) - new Date(today)) / 864e5);
    const todayHit = B.hits.find(h => h.d === today)?.dmg || 0;
    if (tab === 'hero') return head + `
      <div class="card" data-k="boss"><h2>Weekly boss<span class="sp"></span><span class="tiny muted">${B.won ? 'Defeated!' : daysLeft ? daysLeft + ' days left' : 'last day'}</span></h2>
        <div class="arena ${U.fight ? 'fight' : ''}" data-act="fight">${heroSvg(S.game.equip, 'atk')}<div class="vs">${todayHit ? `<b class="dmgpop num">-${todayHit}</b>` : ''}</div>${monsterSvg(B, B.won ? 'dead' : 'hit')}</div>
        <div class="row small"><b class="grow">${esc(B.name)}</b><span class="num">${left} / ${B.hp} HP</span></div>
        <div class="bar hp"><i style="width:${left / B.hp * 100}%"></i></div>
        <div class="tiny muted">Every set, morning movement, logged food day, macro day and weigh-in this week hits it. Your weapon adds ${Math.round((G.mult - 1) * 100)}% damage. Tap the fight to replay.</div>
        <ul class="blist">${B.hits.map(h => `<li><span class="bn">${DAYS[dow(h.d)]} ${shortDate(h.d)}</span><span class="bt num">${h.dmg ? `${h.w.sets ? h.w.sets + ' sets · ' : ''}${h.w.mornings ? 'morning · ' : ''}${h.w.foodDays ? 'food · ' : ''}<b>${h.dmg} dmg</b>` : 'no hits'}</span></li>`).join('')}</ul></div>
      <div class="card" data-k="campaign"><h2>Your road<span class="sp"></span><span class="tiny muted">titles by level</span></h2><div class="mapscroll" data-scrollx="${Math.max(0, (L.TITLES.filter(([n]) => G.lv >= n).length - 3) * 78)}">${campaignMap(G.lv)}</div></div>
      <div class="card tight" data-k="past-bosses"><h2>Past bosses<span class="sp"></span><span class="tiny muted">${G.st.bossKills} defeated</span></h2>${G.bosses.length ? '' : '<div class="small muted">Your first boss fight is this week.</div>'}${G.bosses.map(b => `<div class="row small"><span class="muted" style="width:56px">${shortDate(b.ws)}</span><span class="grow">${esc(b.boss.name)}</span><span class="num tiny">${b.dmg}/${b.boss.hp}</span><span class="badge ${b.won ? 'good' : ''}">${b.won ? 'Won' : 'Escaped'}</span></div>`).join('')}</div>
      <div class="card" data-k="xp-rules"><h2 class="tap" data-act="rulesToggle">How you earn XP and gold<span class="sp"></span>${chev(U.rulesOpen)}</h2>${U.rulesOpen ? `<ul class="blist">${earnRules().map(([a, b]) => `<li><span class="bn">${a}</span><span class="bt">${b}</span></li>`).join('')}</ul>` : ''}</div>
      <div class="card tight" data-k="xp-log"><h2>Recent rewards</h2>${G.ev.filter(e => !e.small).slice(0, 12).map(e => `<div class="row small"><span class="muted" style="width:46px">${shortDate(e.d)}</span><span class="grow">${esc(e.t)}</span>${e.xp ? `<b class="num" style="color:var(--a-good)">+${e.xp}</b>` : ''}${e.gold ? `<span class="gold num tiny">+${e.gold}g</span>` : ''}</div>`).join('')}</div>`;
    if (tab === 'quests') return head + `
      <div class="card" data-k="daily"><h2>Today's quests<span class="sp"></span><span class="tiny muted">new ones tomorrow</span></h2>${G.daily.map(q => questRow(q, `+${q.xp} XP · +${q.gold}g`)).join('')}</div>
      <div class="card" data-k="quests"><h2>Weekly quests<span class="sp"></span><span class="tiny muted">reset Sunday</span></h2>${G.quests.map(q => questRow(q, `+${L.XP.quest} XP · +${L.GOLD.quest}g`)).join('')}</div>
      <div class="card tight" data-k="boss-mini"><div class="row small"><span class="achi sm">${ic('sword')}</span><span class="grow">Weekly boss: <b>${esc(B.name)}</b></span><span class="num">${B.won ? 'Defeated' : left + ' HP left'}</span></div></div>`;
    if (tab === 'shop') {
      const ownedIds = new Set(S.game.items.map(x => x.id));
      return head + `<div class="card tight" data-k="shop-head"><div class="row small"><span class="grow">Weapons hit the boss harder. Pets find extra gold each workout. Armor is for looks. Potions save a streak.</span></div>${G.freezesLeft ? `<div class="tiny muted">${G.freezesLeft} streak shield${G.freezesLeft > 1 ? 's' : ''} ready.</div>` : ''}</div>
        ${Object.keys(SLOT_NAMES).map(slot => `<div class="card" data-k="shop-${slot}"><h2>${SLOT_NAMES[slot]}</h2>${L.SHOP.filter(x => x.slot === slot).map(x => {
          const own = ownedIds.has(x.id) && slot !== 'potion', on = S.game.equip[slot] === x.id, locked = G.lv < x.lv, poor = G.gold < x.price;
          const perk = x.dmg ? `+${Math.round((x.dmg - 1) * 100)}% boss damage` : x.gold ? `+${x.gold} gold per workout` : x.desc || 'Looks';
          return `<div class="row small shoprow ${locked ? 'locked' : ''}"><span class="grow"><b>${esc(x.name)}</b><br><span class="tiny muted">${perk}${locked ? ` · level ${x.lv}` : ''}</span></span>${own ? `<button class="btn sm ${on ? '' : 'ghost'}" data-act="equip" data-id="${x.id}">${on ? 'Equipped' : 'Equip'}</button>` : `<button class="btn sm ${locked || poor ? 'ghost' : ''}" data-act="buy" data-id="${x.id}" ${locked || poor ? 'disabled' : ''}>${ic('coin', 'class="inl"')}${x.price}</button>`}</div>`;
        }).join('')}</div>`).join('')}`;
    }
    return head + `<div class="card" data-k="ach-grid"><h2>Badges<span class="sp"></span><span class="tiny muted">${earned} of ${G.ach.length}</span></h2><div class="achgrid">${G.ach.sort((a, b) => b.done - a.done || b.have / b.goal - a.have / a.goal).map(a => `<div class="ach ${a.done ? 'on' : ''}"><span class="achi">${ic(a.icon)}</span><b class="small">${esc(a.name)}</b><span class="tiny muted">${esc(a.desc)}</span>${a.done ? '<span class="badge good">Earned</span>' : `<div class="bar"><i style="width:${Math.min(100, a.have / a.goal * 100)}%;background:var(--a-c)"></i></div><span class="tiny num muted">${r0(Math.min(a.have, a.goal)).toLocaleString()} / ${a.goal.toLocaleString()}</span>`}</div>`).join('')}</div></div>`;
  };
  const questRow = (q, reward) => `<div class="row small"><span class="achi sm ${q.done ? 'on' : ''}">${ic(q.done ? 'check' : 'target')}</span><span class="grow">${esc(q.name)}<br><span class="tiny muted">${reward}</span></span><div class="bar" style="width:70px"><i style="width:${Math.min(100, q.have / q.goal * 100)}%;background:${q.done ? 'var(--a-good)' : 'var(--a-c)'}"></i></div><span class="num tiny" style="width:30px;text-align:right">${q.have}/${q.goal}</span></div>`;
  function campaignMap(lv) {
    const T = L.TITLES, w = T.length * 78 + 20;
    const pts = T.map((t, i) => [30 + i * 78, i % 2 ? 26 : 56]);
    const cur = T.filter(([n]) => lv >= n).length - 1;
    return `<svg viewBox="0 0 ${w} 96" style="width:${w}px;height:96px" class="campaign"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ')}" stroke="var(--a-line)" stroke-width="4" stroke-dasharray="6 6" fill="none"/>
      ${pts.map((p, i) => `<g><circle cx="${p[0]}" cy="${p[1]}" r="${i === cur ? 13 : 9}" fill="${i <= cur ? 'var(--a-accent)' : 'var(--a-card)'}" stroke="var(--a-accent)" stroke-width="2"/>${i === cur ? `<text x="${p[0]}" y="${p[1] + 4}" text-anchor="middle" fill="#fff" style="font-size:11px;font-weight:700">${lv}</text>` : `<text x="${p[0]}" y="${p[1] + 3.5}" text-anchor="middle" fill="${i <= cur ? '#fff' : 'var(--a-muted)'}" style="font-size:9px">${T[i][0]}</text>`}<text x="${p[0]}" y="${i % 2 ? 54 : 86}" text-anchor="middle" style="font-size:10px" fill="var(--a-fg)">${T[i][1]}</text></g>`).join('')}</svg>`;
  }
