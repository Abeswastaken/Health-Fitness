
  // ---------- Peptides (under More) ----------
  // Vials, a dose calculator, editable schedules (split / microdose / step-up), a Today list with
  // site rotation, history, a cravings check and a beginner guide. Shot reminders come from the app (native).
  const PEP_SITES = [
    ['belly-ul', 'Belly, upper left'], ['belly-ur', 'Belly, upper right'], ['belly-ll', 'Belly, lower left'], ['belly-lr', 'Belly, lower right'],
    ['thigh-l', 'Left thigh'], ['thigh-r', 'Right thigh'], ['arm-l', 'Back of left arm'], ['arm-r', 'Back of right arm'],
    ['hip-l', 'Left upper buttock'], ['hip-r', 'Right upper buttock'],
  ];
  const siteName = id => (PEP_SITES.find(x => x[0] === id) || [0, id || ''])[1];
  const lastMonday = d => dateAdd(d, -((dow(d) + 6) % 7));
  const nextDow = (d, wd) => dateAdd(d, (wd - dow(d) + 7) % 7);
  function pepSeed() {
    // From jake's Reconstitution & Dosing Worksheet v2 (2026-11-05). Everything stays editable.
    const t = today;
    return {
      remind: false, syringes: [50, 100], tick100: null, tick50: null, crave: {}, shots: [], vials: [], seeded: t,
      compounds: [
        { id: 'rt', name: 'Retatrutide', code: 'RT60', vialMg: 60, bacMl: 6, unit: 'mg', useDays: 28 },
        { id: 'cgl', name: 'Cagrilintide', code: 'CGL10', vialMg: 10, bacMl: 2, unit: 'mg', useDays: 28 },
        { id: 'xa', name: 'Semax', code: 'XA10', vialMg: 10, bacMl: 2, unit: 'mcg', useDays: 28 },
        { id: 'sk', name: 'Selank', code: 'SK10', vialMg: 10, bacMl: 2, unit: 'mcg', useDays: 28 },
        { id: 'b12', name: 'B12', code: 'B12', vialMg: 10, bacMl: 2, unit: 'mg', useDays: 120, note: 'Your worksheet keeps B12 past 30 days on purpose. Look for cloudiness before every draw and keep it out of light.' },
      ],
      scheds: [
        { id: 'p-rt', cid: 'rt', kind: 'days', days: [1], dose: 2, doseMode: 'shot', time: '08:00', start: t, missWin: 4, active: true, remind: true, note: 'Set this to the dose you are on now. Worksheet: hold each step 4+ weeks, +2 mg only if your stomach is quiet; 12 mg is the highest dose studied.' },
        { id: 'p-cgl', cid: 'cgl', kind: 'days', days: [1], dose: 0.5, doseMode: 'shot', time: '08:00', start: t, missWin: 4, active: false, remind: true, ladder: [{ dose: 0.5, weeks: 2 }, { dose: 1, weeks: 2 }, { dose: 1.5, weeks: 2 }, { dose: 2, weeks: 2 }, { dose: 2.5, weeks: 1 }], note: 'Off until your reta dose is steady. Turn it on the week you start; the step-up counts from the start date. Trials stepped every 4 weeks; this sheet steps every 2. Never raise reta and cagrilintide in the same week.' },
        { id: 'p-xa', cid: 'xa', kind: 'days', days: [2, 3, 4, 5, 6], dose: 0.3, doseMode: 'shot', time: '08:00', start: t, missWin: 0, active: true, remind: true, note: 'Mornings only (it can keep you up). 300 mcg to start, 500 mcg standard. Judge it after 10 to 14 days.' },
        { id: 'p-sk', cid: 'sk', kind: 'days', days: [2, 3, 4, 5, 6], dose: 0.25, doseMode: 'shot', time: '12:00', start: t, missWin: 0, active: true, remind: true, note: '250 mcg for the first 2 to 3 days, then change this to 500 mcg. Separate shot from Semax, other side.' },
        { id: 'p-b12', cid: 'b12', kind: 'load', days: [1], loadWeeks: 4, dose: 1, doseMode: 'shot', time: '08:00', start: t, missWin: 6, active: true, remind: true, note: 'Weekly for 4 weeks, then the first Monday of each month.' },
      ],
    };
  }
  if (!S.pep) S.pep = pepSeed();
  U.sub.more = U.sub.more || 'today';
  const P = () => S.pep;
  const comp = id => P().compounds.find(c => c.id === id);
  const schedById = id => P().scheds.find(s => s.id === id);
  const fmtNum = n => String(+(+n).toFixed(3));
  const doseTxt = (mg, c) => c && c.unit === 'mcg' ? `${r0(mg * 1000)} mcg` : `${fmtNum(mg)} mg`;
  const unitsTxt = u => (Math.abs(u - Math.round(u)) < 0.05 ? String(Math.round(u)) : String(r1(u)));
  const time12 = t => { const [h, m] = (t || '08:00').split(':').map(Number); return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  const pepSave = () => { save(); pepSync(); };
  // The vial a dose comes from: open, not empty, not past its use-by; oldest first. Expired ones only if nothing else.
  function activeVial(cid, date = today) {
    const vs = P().vials.filter(v => v.cid === cid && !v.done).map(v => ({ v, st: L.pepVial(v, P().shots, date) })).filter(x => !x.st.empty).sort((a, b) => a.v.mixed.localeCompare(b.v.mixed));
    return (vs.find(x => !x.st.expired) || vs[0] || null);
  }
  const concFor = (cid, date) => { const a = activeVial(cid, date); if (a) return a.st.conc; const c = comp(cid); return c ? L.pepConc(c.vialMg, c.bacMl) : 0; };

  // ----- Syringe picture -----
  // cap = syringe size in units (30, 50 or 100). Fill runs from the needle end.
  function syringeSvg(units, cap) {
    const x0 = 46, len = 230, u = Math.min(units, cap), x = x0 + len * u / cap;
    const major = cap >= 100 ? 10 : 5, minor = cap >= 100 ? (P().tick100 || 2) : (P().tick50 || 1);
    let ticks = '';
    for (let k = 0; k <= cap + 1e-9; k += minor) { const tx = x0 + len * k / cap, big = Math.abs(k / major - Math.round(k / major)) < 1e-9; ticks += `<line class="tk" x1="${tx}" y1="22" x2="${tx}" y2="${big ? 34 : 28}"/>${big && k ? `<text x="${tx}" y="17" text-anchor="middle">${k}</text>` : ''}`; }
    return `<svg class="syr" viewBox="0 0 300 66" role="img" aria-label="Syringe filled to ${unitsTxt(units)} units of ${cap}">
      <line x1="2" y1="34" x2="34" y2="34" stroke="currentColor" stroke-width="1.5"/><rect x="34" y="30" width="12" height="8" fill="none" stroke="currentColor"/>
      <rect class="fill" x="${x0}" y="22" width="${Math.max(0, x - x0)}" height="24"/>
      <rect x="${x0}" y="22" width="${len}" height="24" fill="none" stroke="currentColor" stroke-width="1.5"/>${ticks}
      <rect x="${x}" y="22" width="9" height="24" fill="currentColor"/><line x1="${x + 9}" y1="34" x2="${Math.max(x + 30, 290)}" y2="34" stroke="currentColor" stroke-width="3"/>
      <line x1="${x}" y1="50" x2="${x}" y2="58" stroke="var(--a-accent)" stroke-width="2"/><text x="${x}" y="65" text-anchor="middle" style="fill:var(--a-accent);font-weight:700">${unitsTxt(u)}</text></svg>`;
  }
  // Plain words for where the plunger edge goes.
  function readTxt(units, cap) {
    const major = cap >= 100 ? 10 : 5, tick = cap >= 100 ? P().tick100 : P().tick50;
    const below = Math.floor(units / major + 1e-9) * major, rest = r1(units - below);
    if (rest < 0.05) return `Plunger's top edge on the "${below}" line.`;
    if (!tick) return `${unitsTxt(units)} units: ${unitsTxt(rest)} past the "${below || 0}" line. Set what one small tick equals on this syringe (Calculator) and the app will count the ticks for you.`;
    const n = rest / tick;
    if (Math.abs(n - Math.round(n)) < 0.05) return `Plunger's top edge ${Math.round(n)} small tick${Math.round(n) === 1 ? '' : 's'} past "${below || 0}" (each tick is ${tick} unit${tick === 1 ? '' : 's'}).`;
    return `Between ticks: ${unitsTxt(units)} units sits halfway between two ${tick}-unit ticks past "${below || 0}". A 0.5 ml syringe (1-unit ticks) reads this more exactly.`;
  }
  function drawHelp(units) {
    const sy = L.pepSyringe(units, P().syringes);
    return { sy, html: `${syringeSvg(sy.draws > 1 ? sy.cap : units, sy.cap)}<div class="tiny">${sy.draws > 1 ? `<b>More than one syringe holds.</b> Draw ${sy.cap} units, inject, then draw ${unitsTxt(units - sy.cap * (sy.draws - 1))} more${sy.draws > 2 ? ' (repeat)' : ''}. Or mix the next vial stronger.` : readTxt(units, sy.cap)} <span class="muted">${sy.cap === 100 ? '1 ml' : sy.cap === 50 ? '0.5 ml' : '0.3 ml'} syringe.</span>${units < 2 && units > 0 ? ' <b>Under 2 units is hard to measure:</b> use less water next time so the dose is bigger in units.' : ''}</div>` };
  }

  // ----- Body map -----
  const FIG = '<circle cx="60" cy="20" r="13"/><path d="M54 33v6M66 33v6"/><path d="M38 42 Q60 35 82 42 L85 110 Q60 120 35 110 Z"/><path d="M38 44 Q26 72 22 124M82 44 Q94 72 98 124"/><path d="M37 110 L40 214 L56 214 L59 124 L61 124 L64 214 L80 214 L83 110"/>';
  const FRONT = [['belly-ur', 46, 76, 7, 7, 'R'], ['belly-ul', 74, 76, 7, 7, 'L'], ['belly-lr', 46, 102, 7, 7, 'R'], ['belly-ll', 74, 102, 7, 7, 'L'], ['thigh-r', 48, 152, 8, 20, 'R'], ['thigh-l', 72, 152, 8, 20, 'L']];
  const BACK = [['arm-l', 31, 74, 5, 13, 'L'], ['arm-r', 89, 74, 5, 13, 'R'], ['hip-l', 47, 108, 9, 7, 'L'], ['hip-r', 73, 108, 9, 7, 'R']];
  function bodyMap(sel, act = 'pepSite') {
    const shots = P().shots.filter(x => x.status === 'done' && x.site);
    const recent = new Set(shots.filter(x => L.pepDaysBetween(x.date, today) < 7).map(x => x.site));
    const sug = L.pepNextSite(PEP_SITES.map(x => x[0]), shots);
    const fig = (sites, label, navel) => `<svg viewBox="0 0 120 232" role="group" aria-label="${label}"><g fill="none" stroke="currentColor" stroke-width="1.2">${FIG}</g>${navel ? '<circle cx="60" cy="89" r="1.6" fill="currentColor"/><circle cx="60" cy="89" r="8" fill="none" stroke="var(--a-alert)" stroke-dasharray="2 2"/>' : ''}
      ${sites.map(([id, cx, cy, rx, ry, lr]) => `<ellipse class="site ${id === sel ? 'on' : id === sug ? 'sug' : recent.has(id) ? 'recent' : ''}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" data-act="${act}" data-v="${id}" role="button" aria-label="${siteName(id)}"/><text x="${cx}" y="${cy + 3}" text-anchor="middle">${lr}</text>`).join('')}
      <text x="60" y="229" text-anchor="middle">${label}</text></svg>`;
    return `<div class="body-map">${fig(FRONT, 'Front (facing you)', true)}${fig(BACK, 'Back', false)}</div>
      <div class="tiny muted">L and R are your left and right. Green = suggested next. Orange = used in the last 7 days. Red dashed ring = stay 2 inches from the navel.${sel ? ` Picked: <b>${esc(siteName(sel))}</b>.` : ''}</div>`;
  }

  // ----- What's due -----
  function dueList(date = today) {
    const shots = P().shots, act = P().scheds.filter(s => comp(s.cid));
    const due = L.pepDueOn(act, date).map(x => ({ ...x, late: 0 }));
    const late = date === today ? L.pepLate(act, shots, today) : [];
    const byKey = Object.fromEntries(shots.map(x => [x.key, x]));
    return [...late, ...due].map(x => ({ ...x, s: schedById(x.sid), c: comp(schedById(x.sid).cid), shot: byKey[x.key] })).sort((a, b) => (b.late - a.late) || a.s.time.localeCompare(b.s.time));
  }
  function dueRow(x) {
    const conc = concFor(x.c.id, today), units = L.pepUnits(x.dose, conc), av = activeVial(x.c.id);
    const st = x.shot ? x.shot.status : '';
    return `<div class="pep-due ${x.late ? 'late' : ''} ${st ? 'done' : ''}" data-k="pep-due">
      <div class="pep-units num">${conc ? unitsTxt(x.shot?.units ?? units) : '?'}<small>units</small></div>
      <div class="grow"><b class="small">${esc(x.c.name)} ${esc(doseTxt(x.shot?.dose ?? x.dose, x.c))}</b>
        <div class="tiny muted">${x.late ? `<b style="color:var(--a-warn)">${x.late} day${x.late > 1 ? 's' : ''} late</b> (window ${x.s.missWin} days) · ` : ''}${time12(x.s.time)}${st === 'done' ? ` · done${x.shot.site ? ', ' + esc(siteName(x.shot.site)) : ''}` : st === 'skipped' ? ' · skipped' : av ? ` · vial mixed ${shortDate(av.v.mixed)}${av.st.expired ? ' <b style="color:var(--a-alert)">past use-by</b>' : ''}` : ' · <b>no vial mixed yet</b>'}</div></div>
      ${st ? `<button class="btn sm ghost" data-act="pepUndo" data-v="${esc(x.key)}">Undo</button>` : av ? `<button class="btn sm ghost" data-act="pepSkip" data-v="${esc(x.key)}">Skip</button><button class="btn sm" data-act="pepDoneOpen" data-v="${esc(x.key)}" data-d="${x.dose}">Done</button>` : `<button class="btn sm" data-act="vialNew" data-v="${x.c.id}">Mix a vial</button>`}</div>`;
  }
  function vialWarnings() {
    const out = [];
    P().vials.filter(v => !v.done).forEach(v => {
      const c = comp(v.cid), st = L.pepVial(v, P().shots, today); if (!c || st.empty) return;
      if (st.expired) return out.push(`${c.name} vial (mixed ${shortDate(v.mixed)}) is past its use-by with ${fmtNum(r1(st.left))} mg left.`);
      const need = P().scheds.filter(s => s.cid === v.cid && s.active !== false).reduce((a, s) => a + L.pepNeed(s, today, st.expires), 0);
      if (need > st.left + 1e-6) out.push(`${c.name}: this vial runs out before ${shortDate(st.expires)} (needs about ${fmtNum(r1(need))} mg, has ${fmtNum(r1(st.left))}). Mix the next one soon.`);
      else if (st.daysLeft <= 7 && st.left - need > 0.5) out.push(`${c.name}: about ${fmtNum(r1(st.left - need))} mg will be left when this vial hits its use-by on ${shortDate(st.expires)}.`);
    });
    return out;
  }
  const upcoming = (days = 7) => { const out = []; for (let i = 1; i <= days; i++) { const d = dateAdd(today, i); L.pepDueOn(P().scheds.filter(s => comp(s.cid)), d).forEach(x => out.push({ ...x, s: schedById(x.sid), c: comp(schedById(x.sid).cid) })); } return out; };

  SCREENS['more:today'] = () => {
    const due = dueList(), warn = vialWarnings(), up = upcoming(7), cr = P().crave[today] || 0;
    return `${!P().guideSeen ? `<div class="card tight" data-k="pep-new"><div class="row"><span class="grow small"><b>New to this?</b> The Guide walks through mixing, drawing and giving a shot, with pictures.</span><button class="btn sm" data-act="pepGuideGo">${ic('book')}Guide</button></div></div>` : ''}
      <div class="card" data-k="pep-due-card"><h2>Due today<span class="sp"></span><span class="tiny muted">${fmtDate(today)}</span></h2>
        ${due.length ? due.map(dueRow).join('') : '<div class="small muted">Nothing due today.</div>'}
        ${warn.map(w => `<div class="tiny" style="color:var(--a-warn)">${esc(w)}</div>`).join('')}</div>
      ${REAL && !P().remind ? `<div class="card tight" data-k="pep-remind"><div class="row"><span class="grow small">${ic('bell', 'class="inl"')} Get a reminder at each dose time? It stays until you log or skip the dose.</span><button class="btn sm" data-act="pepRemindOn">Turn on</button></div></div>` : ''}
      <div class="card tight" data-k="pep-crave"><div class="small"><b>Appetite and cravings today</b> <span class="tiny muted">1 = none, 5 = strong</span></div>
        <div class="crave">${[1, 2, 3, 4, 5].map(n => `<button class="${cr === n ? 'on' : ''}" data-act="pepCrave" data-v="${n}">${n}</button>`).join('')}</div>${craveChart(14)}</div>
      <div class="card" data-k="pep-next"><h2>Next 7 days</h2>${up.length ? up.map(x => `<div class="row small"><span style="width:70px" class="muted">${DAYS[dow(x.date)]} ${shortDate(x.date)}</span><span class="grow">${esc(x.c.name)} ${esc(doseTxt(x.dose, x.c))}</span><span class="tiny muted num">${unitsTxt(L.pepUnits(x.dose, concFor(x.c.id, x.date)))} u · ${time12(x.s.time)}</span></div>`).join('') : '<div class="small muted">Nothing scheduled.</div>'}</div>
      <div class="card tight flag" data-k="pep-flags-link" data-act="pepGuideGo" data-v="flags" style="cursor:pointer"><div class="small"><b>Red flags</b>: severe belly pain going to the back, can't keep fluids down, swelling of the face or throat. <span class="muted">Tap for the full list.</span></div></div>`;
  };
  // Cravings over the last N days, with shot days marked (GLP-type shots as a dot under the bar).
  function craveChart(n) {
    const days = [...Array(n)].map((_, i) => dateAdd(today, i - n + 1));
    if (!days.some(d => P().crave[d])) return '<div class="tiny muted">Rate it daily; after a week or two this shows whether cravings climb toward the end of the week.</div>';
    const shotDays = new Set(P().shots.filter(x => x.status === 'done' && ['rt', 'cgl'].includes(x.cid)).map(x => x.date));
    const w = 300, bw = w / n;
    return `<svg viewBox="0 0 ${w} 64" style="width:100%;height:auto" role="img" aria-label="Cravings, last ${n} days">${days.map((d, i) => { const v = P().crave[d] || 0, h = v * 10; return `${v ? `<rect x="${i * bw + 2}" y="${50 - h}" width="${bw - 4}" height="${h}" fill="var(--a-c)" rx="2"/>` : ''}${shotDays.has(d) ? `<circle cx="${i * bw + bw / 2}" cy="56" r="2.5" fill="var(--a-accent)"/>` : ''}<text x="${i * bw + bw / 2}" y="63" text-anchor="middle" style="font-size:7px;fill:var(--a-muted)">${DAYS[dow(d)][0]}</text>`; }).join('')}</svg><div class="tiny muted">Bars = cravings (1 to 5). Green dot = reta or cagrilintide shot that day.</div>`;
  }

  A.pepCrave = d => { const v = +d.v; if (P().crave[today] === v) delete P().crave[today]; else P().crave[today] = v; save(); render(); };
  A.pepGuideGo = d => { P().guideSeen = true; save(); U.guideOpen = d.v || 'basics'; go('more', 'guide'); };
  A.pepSkip = d => { const [sid, date] = d.v.split('|'), s = schedById(sid); P().shots.push({ id: nid('sh'), key: d.v, sid, cid: s.cid, date, status: 'skipped', dose: 0, at: new Date().toISOString() }); pepSave(); render(); toast('Skipped.'); };
  A.pepUndo = d => { P().shots = P().shots.filter(x => x.key !== d.v); pepSave(); render(); };
  A.pepDoneOpen = d => {
    const [sid, date] = d.v.split('|'), s = schedById(sid), c = comp(s.cid), av = activeVial(c.id);
    const site = L.pepNextSite(PEP_SITES.map(x => x[0]), P().shots.filter(x => x.status === 'done'));
    U.sheet = { kind: 'pepDone', title: `${c.name}`, key: d.v, sid, date, cid: c.id, dose: +d.d, vialId: av?.v.id, site, time: new Date().toTimeString().slice(0, 5) }; render();
  };
  SHEETS.pepDone = s => {
    const c = comp(s.cid), vs = P().vials.filter(v => v.cid === s.cid && !v.done), v = vs.find(x => x.id === s.vialId) || vs[0];
    const conc = v ? L.pepConc(v.mg, v.ml) : 0, units = L.pepUnits(s.dose, conc), dh = drawHelp(units);
    return `<div class="row"><span class="calbig num">${unitsTxt(units)}</span><span class="small">units of ${esc(doseTxt(s.dose, c))}<br><span class="tiny muted">${fmtNum(r1(conc))} mg/ml · ${r1(units / 100 * 1000) / 1000} ml</span></span></div>
      ${dh.html}
      <div class="grid2"><label class="fl">Dose this time (${c.unit})<input class="f num" type="number" inputmode="decimal" step="any" value="${c.unit === 'mcg' ? r0(s.dose * 1000) : fmtNum(s.dose)}" data-in="pepDoseNow"></label><label class="fl">Time<input class="f" type="time" value="${s.time}" data-in="pepTimeNow"></label></div>
      ${vs.length > 1 ? `<label class="fl">From vial<select class="f" data-in="pepVialNow">${vs.map(x => `<option value="${x.id}" ${x.id === (v && v.id) ? 'selected' : ''}>Mixed ${shortDate(x.mixed)} · ${fmtNum(r1(L.pepVial(x, P().shots, today).left))} mg left</option>`).join('')}</select></label>` : ''}
      <div class="small"><b>Where?</b> Tap a spot.</div>${bodyMap(s.site)}
      <button class="btn block" data-act="pepDoneSave">Log it</button>
      <div class="tiny muted">Wipe the vial top and your skin with alcohol, use a new syringe, then into the sharps container. <a class="linkbtn" data-act="pepGuideGo" data-v="inject">How to give the shot</a></div>`;
  };
  IN.pepDoseNow = el => { const c = comp(U.sheet.cid); U.sheet.dose = (+el.value || 0) / (c.unit === 'mcg' ? 1000 : 1); render(); };
  IN.pepTimeNow = el => { U.sheet.time = el.value; };
  IN.pepVialNow = el => { U.sheet.vialId = el.value; render(); };
  A.pepSite = d => { if (U.sheet) { U.sheet.site = d.v; render(); } };
  A.pepDoneSave = () => {
    const s = U.sheet, vs = P().vials.filter(v => v.cid === s.cid && !v.done), v = vs.find(x => x.id === s.vialId) || vs[0];
    const conc = v ? L.pepConc(v.mg, v.ml) : 0;
    P().shots = P().shots.filter(x => x.key !== s.key);
    P().shots.push({ id: nid('sh'), key: s.key, sid: s.sid, cid: s.cid, date: s.date, time: s.time, takenOn: today, status: 'done', dose: s.dose, units: r1(L.pepUnits(s.dose, conc)), vialId: v?.id, site: s.site, at: new Date().toISOString() });
    U.sheet = null; pepSave(); toast('Logged.');
  };

  // ----- Vials -----
  SCREENS['more:vials'] = () => `${P().compounds.map(c => {
    const vs = P().vials.filter(v => v.cid === c.id && !v.done);
    return `<div class="card" data-k="vial-card"><h2>${esc(c.name)} <span class="tiny muted">${esc(c.code || '')}</span><span class="sp"></span><button class="btn sm" data-act="vialNew" data-v="${c.id}">${ic('plus')}Mix a vial</button></h2>
      ${vs.map(v => { const st = L.pepVial(v, P().shots, today); return `<div class="li tight" style="cursor:default"><div class="grow"><div class="small"><b>${fmtNum(v.mg)} mg + ${fmtNum(v.ml)} ml</b> = ${fmtNum(r1(st.conc))} mg/ml · mixed ${shortDate(v.mixed)}</div>
        <div class="tiny ${st.expired ? '' : 'muted'}" ${st.expired ? 'style="color:var(--a-alert)"' : ''}>${fmtNum(r1(st.left))} mg left (${r1(st.mlLeft)} ml) · use by ${shortDate(st.expires)}${st.expired ? ' (past use-by: throw it out)' : ` (${st.daysLeft} days)`}</div></div>
        <button class="btn sm ghost" data-act="vialDone" data-v="${v.id}">Finished</button></div>`; }).join('') || '<div class="small muted">No mixed vial.</div>'}
      <div class="tiny muted">Default mix: ${fmtNum(c.vialMg)} mg + ${fmtNum(c.bacMl)} ml BAC = ${fmtNum(r1(L.pepConc(c.vialMg, c.bacMl)))} mg/ml · good for ${c.useDays} days once mixed. <a class="linkbtn" data-act="compEdit" data-v="${c.id}">Edit</a></div>${c.note ? `<div class="tiny muted">${esc(c.note)}</div>` : ''}</div>`;
  }).join('')}
    <button class="btn ghost" data-act="compEdit" data-v="">${ic('plus')}Add a compound</button>
    <div class="tiny muted" style="text-align:center"><a class="linkbtn" data-act="pepGuideGo" data-v="mix">How to mix a vial, step by step</a></div>`;
  A.vialNew = d => { const c = comp(d.v); U.sheet = { kind: 'vialNew', title: 'Mix a vial: ' + c.name, cid: c.id, mg: c.vialMg, ml: c.bacMl, mixed: today, useDays: c.useDays }; render(); };
  SHEETS.vialNew = s => {
    const c = comp(s.cid), conc = L.pepConc(s.mg, s.ml), sch = P().scheds.find(x => x.cid === s.cid);
    const dose = sch ? L.pepDose(sch, today) : 0;
    return `<div class="grid2"><label class="fl">Powder in the vial (mg)<input class="f num" type="number" step="any" value="${s.mg}" data-in="vialF" data-k2="mg"></label><label class="fl">BAC water added (ml)<input class="f num" type="number" step="any" value="${s.ml}" data-in="vialF" data-k2="ml"></label>
      <label class="fl">Mixed on<input class="f" type="date" max="${today}" value="${s.mixed}" data-in="vialF" data-k2="mixed"></label><label class="fl">Good for (days)<input class="f num" type="number" value="${s.useDays}" data-in="vialF" data-k2="useDays"></label></div>
      <div class="small">= <b class="num">${fmtNum(r1(conc))} mg/ml</b>${dose ? ` · your ${esc(doseTxt(dose, c))} dose = <b class="num">${unitsTxt(L.pepUnits(dose, conc))} units</b>` : ''}</div>
      ${dose ? `<div class="tiny muted">Other amounts of water for ${esc(doseTxt(dose, c))}: ${[0.5, 1, 1.5, 2, 3, 4, 5, 6].filter(ml => ml !== +s.ml).map(ml => `${ml} ml = ${unitsTxt(L.pepUnits(dose, L.pepConc(s.mg, ml)))} u`).join(' · ')}. Less water = fewer units per dose (finer measuring is harder); more water = bigger, easier-to-read draws.</div>` : ''}
      <ol class="steps small"><li>Wash hands. Wipe both vial tops with alcohol and let them dry.</li><li>Draw ${fmtNum(s.ml)} ml of BAC water${s.ml > 1 ? ` (with a 1 ml syringe that's ${Math.ceil(s.ml)} fills)` : ''}.</li><li>Needle into the powder vial at an angle: let the water run slowly down the glass wall, not onto the powder.</li><li>Swirl or roll gently until clear. Never shake. Cloudy or bits floating: don't use it.</li><li>Write ${fmtNum(r1(conc))} mg/ml and today's date on it. Fridge (36-46 °F), never frozen.</li></ol>
      <button class="btn block" data-act="vialSave">Save vial</button>`;
  };
  IN.vialF = el => { const k = el.dataset.k2; U.sheet[k] = k === 'mixed' ? el.value : +el.value || 0; render(); };
  A.vialSave = () => { const s = U.sheet; if (!(s.mg > 0) || !(s.ml > 0)) return toast('Enter the mg and the ml.'); P().vials.push({ id: nid('v'), cid: s.cid, mg: s.mg, ml: s.ml, mixed: s.mixed || today, useDays: s.useDays || 28 }); U.sheet = null; pepSave(); toast('Vial saved.'); };
  A.vialDone = d => { const v = P().vials.find(x => x.id === d.v); if (!v || !confirm('Mark this vial finished (used up or thrown out)?')) return; v.done = today; pepSave(); render(); };
  A.compEdit = d => { const c = d.v ? comp(d.v) : { id: '', name: '', code: '', vialMg: 10, bacMl: 2, unit: 'mg', useDays: 28 }; U.sheet = { kind: 'compEdit', title: d.v ? 'Edit ' + c.name : 'Add a compound', c: { ...c } }; render(); };
  SHEETS.compEdit = s => `<div class="grid2"><label class="fl">Name<input class="f" value="${esc(s.c.name)}" data-in="compF" data-k2="name"></label><label class="fl">Label code (optional)<input class="f" value="${esc(s.c.code || '')}" data-in="compF" data-k2="code"></label>
    <label class="fl">Powder per vial (mg)<input class="f num" type="number" step="any" value="${s.c.vialMg}" data-in="compF" data-k2="vialMg"></label><label class="fl">Usual BAC water (ml)<input class="f num" type="number" step="any" value="${s.c.bacMl}" data-in="compF" data-k2="bacMl"></label>
    <label class="fl">Doses shown in<select class="f" data-in="compF" data-k2="unit">${['mg', 'mcg'].map(u => `<option ${s.c.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label><label class="fl">Good for after mixing (days)<input class="f num" type="number" value="${s.c.useDays}" data-in="compF" data-k2="useDays"></label></div>
    <label class="fl">Note<textarea class="f small" rows="2" data-in="compF" data-k2="note">${esc(s.c.note || '')}</textarea></label>
    <div class="row">${s.c.id && !P().shots.some(x => x.cid === s.c.id) ? `<button class="btn ghost" data-act="compDel">${ic('trash')}Delete</button>` : ''}<button class="btn block" data-act="compSave">Save</button></div>`;
  IN.compF = el => { const k = el.dataset.k2; U.sheet.c[k] = ['vialMg', 'bacMl', 'useDays'].includes(k) ? +el.value || 0 : el.value; };
  A.compSave = () => { const c = U.sheet.c; if (!c.name.trim()) return toast('Give it a name.'); if (c.id) Object.assign(comp(c.id), c); else P().compounds.push({ ...c, id: nid('c') }); U.sheet = null; pepSave(); };
  A.compDel = () => { const id = U.sheet.c.id; P().compounds = P().compounds.filter(x => x.id !== id); P().scheds = P().scheds.filter(x => x.cid !== id); P().vials = P().vials.filter(x => x.cid !== id); U.sheet = null; pepSave(); };

  // ----- Calculator -----
  SCREENS['more:calc'] = () => {
    const k = U.calc = U.calc || { src: '', mg: 10, ml: 2, dose: 0.5, unit: 'mg', units: '', target: 20 };
    const vs = P().vials.filter(v => !v.done);
    const v = vs.find(x => x.id === k.src);
    const mg = v ? v.mg : k.mg, ml = v ? v.ml : k.ml, conc = L.pepConc(mg, ml);
    const doseMg = k.unit === 'mcg' ? k.dose / 1000 : k.dose, units = L.pepUnits(doseMg, conc);
    const dh = drawHelp(units);
    return `<div class="card" data-k="calc-in"><h2>Dose to units</h2>
      <label class="fl">Vial<select class="f" data-in="calcF" data-k2="src"><option value="">Type the numbers in</option>${vs.map(x => `<option value="${x.id}" ${x.id === k.src ? 'selected' : ''}>${esc(comp(x.cid)?.name || '?')}: ${fmtNum(x.mg)} mg + ${fmtNum(x.ml)} ml (mixed ${shortDate(x.mixed)})</option>`).join('')}</select></label>
      ${v ? '' : `<div class="grid2"><label class="fl">Powder in the vial (mg)<input class="f num" type="number" step="any" value="${k.mg}" data-in="calcF" data-k2="mg"></label><label class="fl">BAC water (ml)<input class="f num" type="number" step="any" value="${k.ml}" data-in="calcF" data-k2="ml"></label></div>`}
      <div class="row"><label class="fl grow">Dose<input class="f num" type="number" step="any" value="${k.dose}" data-in="calcF" data-k2="dose"></label><div class="seg" style="align-self:flex-end">${['mg', 'mcg'].map(u => `<button class="${k.unit === u ? 'on' : ''}" data-act="calcUnit" data-v="${u}">${u}</button>`).join('')}</div></div>
      <div class="row"><span class="calbig num">${conc ? unitsTxt(units) : '—'}</span><span class="small">units<br><span class="tiny muted">${fmtNum(r1(conc * 100) / 100)} mg/ml · ${r1(units) / 100} ml · 1 unit = ${fmtNum(r1(conc / 100 * 1000 * 10) / 10)} mcg</span></span></div>
      ${conc && units ? dh.html : ''}</div>
      <div class="card" data-k="calc-rev"><h2>Units to dose</h2><div class="row"><label class="fl grow">I drew (units)<input class="f num" type="number" step="any" value="${k.units}" data-in="calcF" data-k2="units"></label><span class="small grow">${k.units ? `= <b>${fmtNum(r1(L.pepDoseFromUnits(+k.units, conc) * 1000) / 1000)} mg</b> (${r0(L.pepDoseFromUnits(+k.units, conc) * 1000)} mcg)` : ''}</span></div></div>
      <div class="card" data-k="calc-water"><h2>How much water?</h2><div class="small">To make ${k.dose} ${k.unit} land on <input class="f num w56" type="number" value="${k.target}" data-in="calcF" data-k2="target"> units with a ${fmtNum(mg)} mg vial, add <b class="num">${fmtNum(r1(L.pepBacFor(mg, doseMg, +k.target) * 100) / 100)} ml</b> of BAC water.</div></div>
      <div class="card" data-k="calc-syr"><h2>My syringes</h2>
        <div class="chips">${[[30, '0.3 ml'], [50, '0.5 ml'], [100, '1 ml']].map(([c, l]) => `<button class="chip ${P().syringes.includes(c) ? 'on' : ''}" data-act="calcSyr" data-v="${c}">${l} (${c} units)</button>`).join('')}</div>
        <div class="small">On my 1 ml syringe, one small tick is <span class="chips" style="display:inline-flex">${[1, 2].map(t => `<button class="chip ${P().tick100 === t ? 'on' : ''}" data-act="calcTick" data-k2="tick100" data-v="${t}">${t} unit${t > 1 ? 's' : ''}</button>`).join('')}</span></div>
        <div class="small">On my 0.5 / 0.3 ml syringe, one small tick is <span class="chips" style="display:inline-flex">${[0.5, 1].map(t => `<button class="chip ${P().tick50 === t ? 'on' : ''}" data-act="calcTick" data-k2="tick50" data-v="${t}">${t} unit</button>`).join('')}</span></div>
        <div class="tiny muted">Count the small marks between "0" and "10" on the barrel: 10 marks = 1 unit each, 5 marks = 2 units each. The app uses the smallest syringe that fits a dose.</div></div>`;
  };
  IN.calcF = el => { const k = el.dataset.k2; U.calc[k] = k === 'src' ? el.value : el.value === '' ? '' : +el.value; render(); };
  A.calcUnit = d => { const k = U.calc; if (k.unit !== d.v) { k.dose = d.v === 'mcg' ? r0(k.dose * 1000) : k.dose / 1000; k.unit = d.v; } render(); };
  A.calcSyr = d => { const c = +d.v, s = P().syringes; P().syringes = s.includes(c) ? (s.length > 1 ? s.filter(x => x !== c) : s) : [...s, c].sort((a, b) => a - b); save(); render(); };
  A.calcTick = d => { P()[d.k2] = +d.v; save(); render(); };

  // ----- Schedules -----
  const KIND_TXT = { days: 'Chosen weekdays', every: 'Every few days', load: 'Weekly, then monthly' };
  function schedSummary(s) {
    const c = comp(s.cid), dn = (s.days || []).map(d => DAYS[d]).join(', ');
    const base = L.pepDose(s, today);
    const what = s.kind === 'every' ? `every ${s.n || 1} day${(s.n || 1) > 1 ? 's' : ''}` : s.kind === 'load' ? `${DAYS[(s.days || [1])[0]]}s for ${s.loadWeeks} weeks, then the first ${DAYS[(s.days || [1])[0]]} monthly` : dn || 'no days picked';
    const split = s.kind === 'days' && s.doseMode === 'week' && s.days?.length > 1 ? ` (${doseTxt(L.pepBaseDose(s, today), c)} a week split ${s.days.length} ways)` : '';
    const step = s.ladder?.length ? ` · step ${L.pepStep(s, today) + 1} of ${s.ladder.length}` : '';
    return `${doseTxt(base, c)} ${what} at ${time12(s.time)}${split}${step}`;
  }
  SCREENS['more:plan'] = () => `${P().scheds.map(s => { const c = comp(s.cid); if (!c) return ''; let nx = ''; for (let i = 0; i < 60 && !nx; i++) { const d = dateAdd(today, i); if (L.pepIsDue(s, d)) nx = d; }
    return `<div class="card tight" data-k="sched-card"><div class="row"><b class="grow small">${esc(c.name)}</b>${sw(s.active !== false, 'schedActive', `data-v="${s.id}"`)}</div>
      <div class="small">${esc(schedSummary(s))}</div><div class="tiny muted">${s.active === false ? 'Off' : nx ? 'Next: ' + fmtDate(nx) : 'Nothing in the next 60 days'}${s.missWin ? ` · late window ${s.missWin} days` : ''}${s.remind === false ? ' · no reminder' : ''}</div>
      ${s.note ? `<div class="tiny muted">${esc(s.note)}</div>` : ''}<div class="row"><button class="btn sm ghost" data-act="schedEdit" data-v="${s.id}">${ic('edit')}Edit</button>${s.ladder?.length && s.active !== false ? `<button class="btn sm ghost" data-act="schedHold" data-v="${s.id}">Hold this step a week</button>` : ''}</div></div>`; }).join('')}
    <button class="btn ghost" data-act="schedEdit" data-v="">${ic('plus')}Add a schedule</button>
    <div class="tiny muted">Split a weekly dose into 2 or more smaller shots (for end-of-week cravings) with "Weekly total, split" in Edit. Microdosing = a small dose every day or every few days.</div>`;
  A.schedActive = d => { const s = schedById(d.v); s.active = s.active === false; if (s.active && s.start < today && s.ladder?.length && confirm('Restart the step-up from today?')) s.start = today; pepSave(); render(); };
  A.schedHold = d => { const s = schedById(d.v), i = L.pepStep(s, today); if (i < 0) return; s.ladder[i].weeks = (+s.ladder[i].weeks || 1) + 1; pepSave(); render(); toast('This step lasts one more week.'); };
  A.schedEdit = d => { const s = d.v ? JSON.parse(JSON.stringify(schedById(d.v))) : { id: '', cid: P().compounds[0]?.id, kind: 'days', days: [1], dose: 1, doseMode: 'shot', time: '08:00', start: today, missWin: 0, active: true, remind: true, n: 2, loadWeeks: 4 }; pushFull({ kind: 'schedEdit', s }); };
  FULL.schedEdit = f => {
    const s = f.s, c = comp(s.cid) || P().compounds[0], u = c?.unit === 'mcg' ? 1000 : 1;
    const prev = []; for (let i = 0; i < 120 && prev.length < 8; i++) { const d = dateAdd(today, i); if (L.pepIsDue({ ...s, active: true }, d)) prev.push(d); }
    const conc = c ? concFor(c.id, today) : 0;
    return `${bar(s.id ? 'Edit schedule' : 'New schedule', `<button class="btn sm" data-act="schedSave">Save</button>`)}<div class="scroll">
      <div class="card"><label class="fl">Compound<select class="f" data-in="schedF" data-k2="cid">${P().compounds.map(x => `<option value="${x.id}" ${x.id === s.cid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
        <div class="chips">${Object.entries(KIND_TXT).map(([k, l]) => `<button class="chip ${s.kind === k ? 'on' : ''}" data-act="schedKind" data-v="${k}">${l}</button>`).join('')}</div>
        ${s.kind === 'every' ? `<label class="fl">Every how many days?<input class="f num" type="number" min="1" value="${s.n || 1}" data-in="schedF" data-k2="n"></label><div class="tiny muted">1 = every day (daily microdose). Counts from the start date.</div>` : `<div class="daygrid">${DAYS.map((dn, i) => `<button class="chip ${(s.days || []).includes(i) ? 'on' : ''}" data-act="schedDay" data-v="${i}" style="padding:6px 0">${dn}</button>`).join('')}</div>`}
        ${s.kind === 'load' ? `<label class="fl">Weekly for how many weeks first?<input class="f num" type="number" min="0" value="${s.loadWeeks || 0}" data-in="schedF" data-k2="loadWeeks"></label><div class="tiny muted">Pick one day. After the weekly part, it's the first of that weekday each month.</div>` : ''}
        ${s.kind === 'days' && (s.days || []).length > 1 ? `<div class="seg">${[['shot', 'Same dose each shot'], ['week', 'Weekly total, split']].map(([k, l]) => `<button class="${(s.doseMode || 'shot') === k ? 'on' : ''}" data-act="schedMode" data-v="${k}">${l}</button>`).join('')}</div>` : ''}
        <div class="grid2"><label class="fl">${s.doseMode === 'week' && s.kind === 'days' ? 'Weekly total' : 'Dose'} (${c?.unit || 'mg'})<input class="f num" type="number" step="any" value="${fmtNum((+s.dose || 0) * u)}" data-in="schedF" data-k2="dose"></label><label class="fl">Time<input class="f" type="time" value="${s.time}" data-in="schedF" data-k2="time"></label>
          <label class="fl">Starts<input class="f" type="date" value="${s.start}" data-in="schedF" data-k2="start"></label><label class="fl">Late doses OK for (days)<input class="f num" type="number" min="0" value="${s.missWin || 0}" data-in="schedF" data-k2="missWin"></label></div>
        <div class="tiny muted">After that many days a missed dose is dropped and you wait for the next one. 0 = skip missed doses. Tirzepatide's label uses 4 days for a weekly shot.</div>
        <div class="row small"><span class="grow">Reminder at dose time</span>${sw(s.remind !== false, 'schedRemind')}</div></div>
      <div class="card"><h2>Step-up<span class="sp"></span><button class="btn sm ghost" data-act="ladderAdd">${ic('plus')}Step</button></h2>
        ${(s.ladder || []).map((st, i) => `<div class="row small"><span style="width:42px" class="muted">Step ${i + 1}</span><input class="f num w56" type="number" step="any" value="${fmtNum(st.dose * u)}" data-in="ladderF" data-i="${i}" data-k2="dose"><span>${c?.unit || 'mg'} for</span><input class="f num w56" type="number" min="1" value="${st.weeks}" data-in="ladderF" data-i="${i}" data-k2="weeks"><span>wk</span><button class="iconbtn sm" data-act="ladderDel" data-i="${i}" aria-label="Remove step">${ic('close')}</button></div>`).join('') || '<div class="small muted">No step-up: the dose above stays the same. Add steps to raise it on a timetable; the last step holds.</div>'}
        ${s.ladder?.length ? '<div class="tiny muted">Steps count from the start date and replace the dose above. Raise one compound at a time.</div>' : ''}</div>
      <div class="card"><label class="fl">Note<textarea class="f small" rows="2" data-in="schedF" data-k2="note">${esc(s.note || '')}</textarea></label></div>
      <div class="card"><h2>Next doses</h2>${prev.map(d => { const ds = L.pepDose(s, d); return `<div class="row small"><span class="grow">${fmtDate(d)} ${time12(s.time)}</span><span>${esc(doseTxt(ds, c))}</span><span class="tiny muted num" style="width:60px;text-align:right">${conc ? unitsTxt(L.pepUnits(ds, conc)) + ' u' : ''}</span></div>`; }).join('') || '<div class="small muted">None in the next 4 months.</div>'}</div>
      ${s.id ? `<button class="btn ghost" data-act="schedDel">${ic('trash')}Delete this schedule</button>` : ''}</div>`;
  };
  const SE = () => topFull().s;
  IN.schedF = el => { const s = SE(), k = el.dataset.k2, c = comp(s.cid); s[k] = ['n', 'loadWeeks', 'missWin'].includes(k) ? Math.max(0, +el.value || 0) : k === 'dose' ? (+el.value || 0) / (c?.unit === 'mcg' ? 1000 : 1) : el.value; render(); };
  IN.ladderF = el => { const s = SE(), c = comp(s.cid), st = s.ladder[+el.dataset.i]; st[el.dataset.k2] = el.dataset.k2 === 'dose' ? (+el.value || 0) / (c?.unit === 'mcg' ? 1000 : 1) : Math.max(1, +el.value || 1); render(); };
  A.schedKind = d => { const s = SE(); s.kind = d.v; if (d.v === 'load') s.days = [(s.days || [1])[0] ?? 1]; render(); };
  A.schedDay = d => { const s = SE(), i = +d.v; if (s.kind === 'load') s.days = [i]; else s.days = (s.days || []).includes(i) ? s.days.filter(x => x !== i) : [...(s.days || []), i].sort(); render(); };
  A.schedMode = d => { const s = SE(); if (s.doseMode !== d.v) { const n = (s.days || []).length || 1; s.dose = d.v === 'week' ? s.dose * n : s.dose / n; if (s.ladder) s.ladder.forEach(x => { x.dose = d.v === 'week' ? x.dose * n : x.dose / n; }); s.doseMode = d.v; } render(); };
  A.schedRemind = () => { const s = SE(); s.remind = s.remind === false; render(); };
  A.ladderAdd = () => { const s = SE(); s.ladder = s.ladder || []; const l = s.ladder[s.ladder.length - 1]; s.ladder.push({ dose: l ? l.dose : s.dose, weeks: 4 }); render(); };
  A.ladderDel = d => { const s = SE(); s.ladder.splice(+d.i, 1); if (!s.ladder.length) delete s.ladder; render(); };
  A.schedSave = () => {
    const s = SE(); if (!s.cid) return toast('Pick a compound.');
    if (s.kind !== 'every' && !(s.days || []).length) return toast('Pick at least one day.');
    if (s.id) Object.assign(schedById(s.id), s); else P().scheds.push({ ...s, id: nid('p') });
    pepSave(); popFull(); toast('Schedule saved.');
  };
  A.schedDel = () => { const s = SE(); if (!confirm('Delete this schedule? Logged shots stay in History.')) return; P().scheds = P().scheds.filter(x => x.id !== s.id); pepSave(); popFull(); };

  // ----- History -----
  SCREENS['more:history'] = () => {
    const m = U.pepMonth || today.slice(0, 7), first = m + '-01', start = dateAdd(first, -dow(first));
    const shots = P().shots, byDate = {};
    shots.forEach(x => { (byDate[x.date] = byDate[x.date] || []).push(x); });
    const cells = [...Array(42)].map((_, i) => dateAdd(start, i));
    const sel = U.pepDay || today;
    const list = (byDate[sel] || []).map(x => ({ x, c: comp(x.cid) }));
    const mo = (n) => { const d = new Date(m + '-15T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };
    return `<div class="card" data-k="pep-cal"><div class="row"><button class="iconbtn" data-act="pepMonth" data-v="${mo(-1)}" aria-label="Previous month">${ic('back')}</button><b class="grow" style="text-align:center">${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}</b><button class="iconbtn" data-act="pepMonth" data-v="${mo(1)}" aria-label="Next month">${ic('fwd')}</button></div>
      <div class="daygrid">${DAYS.map(d => `<div class="tiny muted" style="text-align:center">${d[0]}</div>`).join('')}${cells.map(d => { const xs = byDate[d] || [], due = d > today ? L.pepDueOn(P().scheds, d).length : 0; return `<div class="d ${d === today ? 'today' : ''}" data-act="pepDay" data-v="${d}" style="cursor:pointer;${d.slice(0, 7) !== m ? 'opacity:.35;' : ''}${d === sel ? 'background:color-mix(in srgb,var(--a-accent) 12%,transparent)' : ''}">${+d.slice(8)}<br>${xs.map(x => `<i class="${x.status === 'skipped' ? 'sk' : ''}"></i>`).join('')}${[...Array(due)].map(() => '<i class="due"></i>').join('')}</div>`; }).join('')}</div>
      <div class="tiny muted">Filled dot = done, gray = skipped, ring = planned.</div></div>
      <div class="card" data-k="pep-day"><h2>${fmtDate(sel)}</h2>${list.map(({ x, c }) => `<div class="li tight" style="cursor:default"><div class="grow"><div class="small">${esc(c?.name || '?')} ${x.status === 'done' ? esc(doseTxt(x.dose, c)) : '<span class="muted">skipped</span>'}</div><div class="tiny muted">${x.status === 'done' ? `${x.units ?? ''} units${x.time ? ' · ' + time12(x.time) : ''}${x.site ? ' · ' + esc(siteName(x.site)) : ''}` : ''}</div></div><button class="iconbtn sm" data-act="pepUndo" data-v="${esc(x.key)}" aria-label="Delete">${ic('trash')}</button></div>`).join('') || '<div class="small muted">No shots logged.</div>'}
        ${P().crave[sel] ? `<div class="tiny muted">Cravings: ${P().crave[sel]} of 5</div>` : ''}</div>
      <div class="card" data-k="pep-crave-30"><h2>Cravings, last 4 weeks</h2>${craveChart(28)}</div>`;
  };
  A.pepMonth = d => { U.pepMonth = d.v; render(); };
  A.pepDay = d => { U.pepDay = d.v; render(); };

  // ----- Guide -----
  const ART_G = {
    basics: `<svg class="guide-art" viewBox="0 0 300 120" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="20" y="14" width="34" height="12" rx="2"/><path d="M24 26h26v8H24zM22 34h30v66a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z"/><path class="wt" d="M23 70h28v30a5 5 0 0 1-5 5H28a5 5 0 0 1-5-5z" stroke="none"/><text x="37" y="118" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Vial</text>
      <rect x="84" y="24" width="30" height="10" rx="2"/><path d="M86 34h26v72H86z"/><path class="wt" d="M87 52h24v53H87z" stroke="none"/><text x="99" y="118" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">BAC water</text>
      <path d="M150 60h18M168 54h10v12h-10zM178 50h96v20h-96z"/><path class="wt" d="M178 51h30v18h-30z" stroke="none"/><path d="M208 50v20M274 56h14M288 50v20"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<path d="M${178 + i * 9.6} 50v${i % 5 ? 4 : 8}"/>`).join('')}<text x="225" y="90" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Insulin syringe: 100 units = 1 ml</text></svg>`,
    mix: `<svg class="guide-art" viewBox="0 0 300 140" fill="none" stroke="currentColor" stroke-width="1.5"><g transform="rotate(-20 110 80)"><rect x="90" y="30" width="40" height="12" rx="2"/><path d="M94 42h32v8H94zM92 50h36v70a6 6 0 0 1-6 6H98a6 6 0 0 1-6-6z"/><path class="wt" d="M93 108h34v12a5 5 0 0 1-5 5H98a5 5 0 0 1-5-5z" stroke="none"/></g><path class="ac" d="M200 8 L130 52" stroke-width="2"/><path d="M200 8l60-36" stroke-width="6" opacity=".5"/><path class="ac" d="M126 56 C120 70 118 90 122 110" stroke-dasharray="3 3" stroke-width="2"/><text x="190" y="100" fill="currentColor" stroke="none" style="font-size:10px">Aim at the glass wall.</text><text x="190" y="114" fill="currentColor" stroke="none" style="font-size:10px">Let it trickle down.</text><text x="190" y="128" fill="currentColor" stroke="none" style="font-size:10px">Swirl, never shake.</text></svg>`,
    draw: `<svg class="guide-art" viewBox="0 0 300 110" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 50h200v24H20z"/><path class="wt" d="M21 51h120v22H21z" stroke="none"/>${[...Array(21)].map((_, i) => `<path d="M${20 + i * 10} 50v${i % 5 ? 5 : 10}"/>`).join('')}<path d="M141 50h12v24h-12z" fill="currentColor"/><path d="M153 62h110" stroke-width="4"/><path class="ac" d="M141 40v-18M134 28l7-7 7 7" stroke-width="2"/><text x="141" y="14" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Read here: the plunger's top edge (needle side)</text><text x="80" y="96" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Hold it at eye level. Tap bubbles up, push them out.</text></svg>`,
    inject: `<svg class="guide-art" viewBox="0 0 300 130" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 100 C60 100 70 60 100 60 C130 60 140 100 190 100 L290 100"/><path class="wt" d="M70 100 C80 75 90 64 100 64 C110 64 120 75 130 100z" stroke="none"/><path d="M60 70 C66 62 74 58 82 58M140 70 C134 62 126 58 118 58" stroke-width="3" opacity=".6"/><path class="ac" d="M100 80 L100 24" stroke-width="2"/><path d="M100 24v-18" stroke-width="6" opacity=".5"/><text x="100" y="120" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Pinch, 90°</text><path d="M200 100 C220 100 230 80 245 80 C260 80 270 100 290 100"/><path class="ac" d="M245 92 L210 40" stroke-width="2"/><path d="M210 40 L200 25" stroke-width="6" opacity=".5"/><text x="245" y="120" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Lean: 45°</text></svg>`,
  };
  const GUIDE = [
    ['flags', 'Red flags: stop and get seen', () => `<div class="flag small"><ul class="steps" style="list-style:disc">
      <li><b>Severe, constant pain in the upper middle belly</b>, maybe going through to the back, with or without vomiting (pancreatitis).</li>
      <li><b>Pain under the right ribs</b> with fever, or yellow skin or eyes (gallbladder).</li>
      <li><b>Can't keep fluids down</b>, very little or very dark pee, dizzy when standing (dehydration can hurt the kidneys). Your worksheet: hold reta and cagrilintide, restart at half dose.</li>
      <li><b>Swelling of the face, lips, tongue or throat, trouble breathing</b>, or hives all over: call 911.</li>
      <li><b>Racing heart, chest tightness or fainting</b> after a shot.</li>
      <li><b>A lump in the neck, trouble swallowing or a hoarse voice that won't go away</b> (listed on GLP-1 drug labels).</li>
      <li><b>A shot spot that spreads red, hot, hard or oozes</b>, or a fever (infection).</li></ul></div>`],
    ['basics', 'The basics: vial, water, syringe, units', () => `${ART_G.basics}<ul class="steps small" style="list-style:disc">
      <li><b>mg and mcg</b> are how much drug. 1 mg = 1,000 mcg. Reta and cagrilintide doses are in mg; Selank and Semax are in mcg (100 times smaller). Never mix them up.</li>
      <li><b>BAC water</b> (bacteriostatic water) dissolves the powder. How much you add sets the strength: <b>mg per ml</b>.</li>
      <li><b>Insulin syringes (U-100)</b> are marked in units: 100 units = 1 ml, so 1 unit = 0.01 ml.</li>
      <li><b>The math:</b> units = dose ÷ strength × 100. Example: 60 mg + 6 ml = 10 mg/ml, so 2 mg = 0.2 ml = 20 units. The app does this for you on every dose.</li>
      <li>Smaller syringes are easier to read: use the 0.5 ml one for anything up to 50 units.</li></ul>`],
    ['mix', 'Mixing a vial', () => `${ART_G.mix}<ol class="steps small">
      <li>Wash your hands. Clean a flat spot. Lay out alcohol swabs, BAC water, the vial, a syringe.</li>
      <li>Pop the caps. Wipe both rubber tops with alcohol and let them dry.</li>
      <li>Draw the BAC water. For more than 1 ml, fill the syringe more than once (or use a 3 ml mixing syringe).</li>
      <li>Push the needle into the powder vial at an angle and aim at the glass wall. Push slowly so the water runs down the side.</li>
      <li>Swirl or roll the vial between your palms. <b>Never shake.</b> Let it sit until it's fully clear (a few minutes).</li>
      <li>Clear = good. Cloudy, colored or bits floating = don't use it.</li>
      <li>Write the strength and the date on it. In the fridge (36 to 46 °F), never the freezer. Save it in Vials so the app tracks what's left and the use-by.</li></ol>`],
    ['draw', 'Drawing a dose', () => `${ART_G.draw}<ol class="steps small">
      <li>Check Today for the units. Wash hands, wipe the vial top.</li>
      <li>Pull the plunger back to your dose line to fill the syringe with air, push the needle in, and push the air into the vial (makes drawing easier).</li>
      <li>Turn the vial upside down. Pull the plunger a little past your line.</li>
      <li>Tap the syringe so bubbles rise, then push back to exactly your line (bubbles out).</li>
      <li>Read at eye level: the line is the plunger's flat top edge, the side nearest the needle.</li>
      <li>Compare with the drawn syringe on the Log screen before you inject.</li></ol>`],
    ['inject', 'Giving the shot (under the skin)', () => `${ART_G.inject}<ol class="steps small">
      <li>Pick a spot (see Where to inject). Wipe with alcohol and let it dry.</li>
      <li>Pinch about an inch of skin and fat.</li>
      <li>Needle in all the way, quick and straight (90°). If you're lean, go in at 45°.</li>
      <li>Push the plunger slowly. Wait 5 to 10 seconds, then pull straight out and let go of the pinch.</li>
      <li>Don't rub. A drop of blood is normal: press with a cotton ball.</li>
      <li>Syringe straight into the sharps container. New syringe every time, never shared.</li>
      <li>Two shots the same day: separate syringes, different spots (worksheet: opposite sides). Never pool two peptides in one syringe.</li></ol>`],
    ['sites', 'Where to inject', () => `${bodyMap(null, 'noop')}<ul class="steps small" style="list-style:disc">
      <li><b>Belly</b>: anywhere soft at least 2 inches from the navel. Easiest to start with.</li>
      <li><b>Front and outer thigh</b>: the middle third, between hip and knee.</li>
      <li><b>Back of the upper arm</b>: the fatty part; easier with help.</li>
      <li><b>Upper outer buttock / love handle</b>.</li>
      <li>Move at least an inch from the last spot; rotate around the map. Skip moles, scars, bruises and stretch marks.</li>
      <li>When you log a shot the app suggests the next spot (green).</li></ul>`],
    ['store', 'Storage and supplies', () => `<ul class="steps small" style="list-style:disc">
      <li>Mixed vials: fridge, upright, in a box (B12 especially: light breaks it down). Never frozen. If one freezes, throw it out.</li>
      <li>Use within about 28 days of mixing (that's the BAC preservative limit). The app shows each vial's use-by.</li>
      <li>Supplies: 0.5 ml and 1 ml insulin syringes, BAC water, alcohol swabs, a sharps container, a marker. A full monthly remix of your kit uses about 14 ml of BAC water, so a 30 ml bottle lasts about 2 months.</li>
      <li>Sharps: a sealed sharps container (or a heavy plastic bottle with a screw lid); drop it at a pharmacy or sharps drop-off.</li></ul>`],
    ['fix', 'Problems and fixes', () => `<ul class="steps small" style="list-style:disc">
      <li><b>Air bubble in the syringe</b>: tap it up and push it out. A tiny one under the skin isn't dangerous; it just means a little less dose.</li>
      <li><b>Bruise or drop of blood</b>: normal now and then. Press, don't rub.</li>
      <li><b>Red, itchy bump</b> that fades in a day or two: common. Spreading, hot or oozing: see Red flags.</li>
      <li><b>Dropped the needle or touched it</b>: throw it out and start over with a new one.</li>
      <li><b>Botched draw</b> (wrong line, big bubble): push it back into the vial and redraw, or throw out the syringe.</li>
      <li><b>Nausea</b> on reta/cagrilintide: smaller meals, stop eating when full, go easy on fat. Your sheet's first lever: skip cagrilintide for a week and keep reta.</li></ul>`],
    ['missed', 'Missed doses', () => `<div class="small">Each schedule has a <b>late window</b> (Schedules → Edit). Inside it, Today shows the dose as late and you can still take it. After it, the dose is dropped and you wait for the next one. Never double up.</div>
      <div class="tiny muted">For reference: tirzepatide's label (a weekly shot) says take it within 4 days, otherwise skip. Retatrutide has no label. Daily ones (Selank, Semax) are set to skip.</div>`],
    ['review', 'Notes from your worksheet review', () => `<ul class="steps small" style="list-style:disc">
      <li>The concentration and unit math is right for every vial.</li>
      <li>12 mg was the highest retatrutide dose studied. At 10 mg/ml anything over 10 mg is more than a 1 ml syringe; the app tells you to split the draw.</li>
      <li>Remixing reta monthly means most of a 60 mg vial goes in the trash at 2 to 4 mg a week; the Vials tab shows how much will be left at use-by.</li>
      <li>Cagrilintide trials stepped up every 4 weeks; your sheet steps every 2 (more nausea risk).</li>
      <li>Tick spacing differs by syringe: set yours in Calculator so the app counts ticks correctly.</li></ul>`],
  ];
  SCREENS['more:guide'] = () => { if (!P().guideSeen) { P().guideSeen = true; save(); }
    return `<div class="tiny muted">Written for someone who has never done this. Tap a section.</div>${GUIDE.map(([k, t, body]) => { const open = U.guideOpen === k || k === 'flags'; return `<div class="card ${k === 'flags' ? 'flag' : ''}" data-k="guide-${k}"><h2 class="tap" data-act="guideOpen" data-v="${k}">${t}<span class="sp"></span>${k === 'flags' ? '' : chev(open)}</h2>${open ? body() : ''}</div>`; }).join('')}`; };
  A.guideOpen = d => { if (d.v === 'flags') return; U.guideOpen = U.guideOpen === d.v ? null : d.v; render(); };

  // ----- Reminders (installed app) -----
  A.pepRemindOn = async () => {
    const r = await native('notifyPermission');
    if (r.error) return toast(r.error);
    if (!r.granted) return toast('Notifications are off for this app. Turn them on in the phone\'s settings.');
    P().remind = true; pepSave(); render(); toast('Reminders on.');
  };
  function pepSync() {
    if (!REAL || !window.HFDev.call) return;
    if (!P().remind || !S.modules.peptides) return native('pepSchedule', { items: [] });
    const items = [], logged = new Set(P().shots.map(x => x.key)), now = Date.now();
    const scheds = P().scheds.filter(s => s.remind !== false && comp(s.cid));
    for (let i = -7; i <= 14; i++) {
      const d = dateAdd(today, i);
      L.pepDueOn(scheds, d).forEach(x => {
        if (logged.has(x.key)) return;
        const s = schedById(x.sid), c = comp(s.cid), [h, m] = s.time.split(':').map(Number);
        const at = new Date(d + 'T00:00:00'); at.setHours(h, m, 0, 0);
        const until = s.missWin ? at.getTime() + s.missWin * 864e5 : new Date(d + 'T23:59:00').getTime();
        if (until < now) return;
        const conc = concFor(c.id, d), u = conc ? unitsTxt(L.pepUnits(x.dose, conc)) : null;
        items.push({ key: x.key, at: at.getTime(), until, title: `${c.name} ${doseTxt(x.dose, c)}`, text: u ? `Draw ${u} units. Tap to log it.` : 'Mix a vial first, then log it.' });
      });
    }
    native('pepSchedule', { items });
  }
  // Tapped a reminder: open Today.
  const appOpen0 = window.App && window.App.open;
  window.App.open = where => { if (where === 'peptides' && S.modules.peptides) go('more', 'today'); else if (appOpen0) appOpen0(where); };
  if (REAL && window.HFDev.takeLaunch && window.HFDev.takeLaunch() === 'peptides' && S.modules.peptides) { S.tab = 'more'; U.sub.more = 'today'; }
  if (REAL) setTimeout(pepSync, 1500);
