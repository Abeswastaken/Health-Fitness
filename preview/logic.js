// Pure logic for the fitness app prototype. Each function here becomes Kotlin in core/ later,
// so keep it free of DOM and storage. Tested by test_logic.js with node.
(function (root) {
  const L = {};
  const LB_PER_KG = 2.20462, CM_PER_IN = 2.54;

  // ---------- Muscles ----------
  // The 16 trainable muscles the exercise data tags (neck left out), grouped for the day picker.
  L.GROUPS = {
    Chest: ['chest'],
    Back: ['lats', 'middle back', 'lower back', 'traps'],
    Shoulders: ['shoulders'],
    Arms: ['biceps', 'triceps', 'forearms'],
    Core: ['abdominals'],
    Legs: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  };
  L.MUSCLES = Object.values(L.GROUPS).flat();
  L.groupOf = m => Object.keys(L.GROUPS).find(g => L.GROUPS[g].includes(m));
  L.PUSH = ['chest', 'shoulders', 'triceps'];
  L.PULL = ['lats', 'middle back', 'biceps', 'traps'];
  // Muscles worth a weekly target (small stabilisers are tracked but not targeted).
  L.TARGETED = ['chest', 'lats', 'middle back', 'shoulders', 'biceps', 'triceps', 'abdominals', 'quadriceps', 'hamstrings', 'glutes', 'calves'];

  // ---------- Body and calories ----------
  L.toKg = lb => lb / LB_PER_KG;
  L.toLb = kg => kg * LB_PER_KG;
  // Mifflin-St Jeor resting burn.
  L.bmr = ({ sex, weightLb, heightIn, age }) => {
    const kg = L.toKg(weightLb), cm = heightIn * CM_PER_IN;
    return 10 * kg + 6.25 * cm - 5 * age + (sex === 'female' ? -161 : 5);
  };
  L.ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9 };
  L.tdee = p => L.bmr(p) * (L.ACTIVITY[p.activity] || 1.375);
  // Goal-based target: rate is % of body weight per week (negative = lose). 3500 kcal per lb.
  L.goalCalories = (p, ratePct) => {
    const lbPerWeek = p.weightLb * ratePct / 100;
    return L.tdee(p) + lbPerWeek * 3500 / 7;
  };
  // A floor the coach warns under: 80% of resting burn, and never below 1500 (men) / 1200 (women).
  L.calorieFloor = p => Math.max(L.bmr(p) * 0.8, p.sex === 'female' ? 1200 : 1500);

  // Diet presets as % of calories (protein, carbs, fat). Keto caps carbs in grams instead.
  L.PRESETS = {
    Standard: { p: 30, c: 40, f: 30 },
    'High protein': { p: 40, c: 35, f: 25 },
    Keto: { p: 25, c: 5, f: 70, carbCapG: 30 },
    Paleo: { p: 30, c: 30, f: 40 },
    Vegan: { p: 20, c: 55, f: 25 },
  };
  L.macrosFor = (cal, presetName) => {
    const pr = L.PRESETS[presetName] || L.PRESETS.Standard;
    let c = Math.round(cal * pr.c / 100 / 4);
    if (pr.carbCapG) c = Math.min(c, pr.carbCapG);
    const p = Math.round(cal * pr.p / 100 / 4);
    const f = Math.round((cal - p * 4 - c * 4) / 9);
    return { cal: Math.round(cal), p, c, f };
  };

  // ---------- Food ----------
  // A food's macros are per serving. qty is servings (or grams when unit is 'g' and serving is 100 g).
  L.scale = (m, k) => ({ cal: m.cal * k, p: m.p * k, c: m.c * k, f: m.f * k });
  L.add = (a, b) => ({ cal: a.cal + b.cal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f });
  L.ZERO = { cal: 0, p: 0, c: 0, f: 0 };
  // Recipe: total of every ingredient, then divided by the containers it fills.
  L.recipeTotal = (recipe, foodsById) => recipe.ing.reduce((t, i) => {
    const fd = foodsById[i.foodId];
    return fd ? L.add(t, L.scale(fd, i.qty / fd.serv)) : t;
  }, L.ZERO);
  L.recipePerContainer = (recipe, foodsById) => L.scale(L.recipeTotal(recipe, foodsById), 1 / Math.max(1, recipe.containers));
  L.entryMacros = (entry, foodsById, recipesById) => {
    if (entry.quick) return L.scale(entry.quick, entry.qty || 1);
    if (entry.recipeId) {
      const r = recipesById[entry.recipeId];
      return r ? L.scale(L.recipePerContainer(r, foodsById), entry.qty) : L.ZERO;
    }
    const fd = foodsById[entry.foodId];
    return fd ? L.scale(fd, entry.qty) : L.ZERO;
  };
  L.dayTotals = (entries, foodsById, recipesById) => entries.reduce((t, e) => L.add(t, L.entryMacros(e, foodsById, recipesById)), L.ZERO);
  // "Usually now": what you've logged at this meal lately (same weekday counts double), minus what's already in it today.
  // log: [{date, meal, foodId|recipeId, qty}]  -> [{key, foodId?, recipeId?, qty, n}] best first.
  L.usuallyNow = (log, meal, date, opts = {}) => {
    const dayMs = 864e5, t = new Date(date + 'T12:00:00'), wd = t.getDay(), days = opts.days || 21;
    const have = new Set(log.filter(e => e.date === date && e.meal === meal).map(e => e.recipeId || e.foodId));
    const score = {};
    for (const e of log) {
      if (e.meal !== meal || e.quick || e.date >= date) continue;
      const ago = Math.round((t - new Date(e.date + 'T12:00:00')) / dayMs);
      if (ago < 1 || ago > days) continue;
      const k = e.recipeId || e.foodId; if (!k || have.has(k)) continue;
      const w = (new Date(e.date + 'T12:00:00').getDay() === wd ? 2 : 1) + (ago <= 3 ? 1 : 0);
      const x = score[k] || (score[k] = { key: k, foodId: e.foodId, recipeId: e.recipeId, qty: e.qty, n: 0, last: '' });
      x.n += w; if (e.date > x.last) { x.last = e.date; x.qty = e.qty; }
    }
    return Object.values(score).filter(x => x.n >= 2).sort((a, b) => b.n - a.n || b.last.localeCompare(a.last)).slice(0, opts.max || 4);
  };
  // What's left today, and one food from your own list that fits it (most protein per calorie that still fits).
  // items: [{id, name, cal, p, c, f}] per one portion.
  L.fillSuggestion = (left, items) => {
    if (left.cal < 60) return null;
    const fit = items.filter(x => x.cal > 20 && x.cal <= left.cal && x.p > 0)
      .map(x => ({ ...x, score: (left.p > 10 ? Math.min(x.p, left.p) / x.cal : 0) + x.cal / left.cal * 0.05 }))
      .sort((a, b) => b.score - a.score);
    return fit[0] || null;
  };
  // Net remaining = goal minus food. Workout burn is shown separately and never counted here.
  L.netRemaining = (goalCal, eatenCal) => goalCal - eatenCal;

  // ---------- Workout calories ----------
  // MET values from the Compendium of Physical Activities.
  L.MET = { strength: 5.0, light: 3.5, cardio: 7.0 };
  L.metCalories = (met, weightLb, minutes) => met * L.toKg(weightLb) * minutes / 60;
  // Keytel et al. (2005) heart-rate formula, kcal per minute.
  L.hrCaloriesPerMin = (sex, hr, weightLb, age) => {
    const kg = L.toKg(weightLb);
    return sex === 'female'
      ? (-20.4022 + 0.4472 * hr - 0.1263 * kg + 0.074 * age) / 4.184
      : (-55.0969 + 0.6309 * hr + 0.1988 * kg + 0.2017 * age) / 4.184;
  };
  // Conservative estimate shown as "Estimated (\u00b110%)": 10% off whichever formula applies.
  L.sessionCalories = ({ sex, weightLb, age }, minutes, avgHr, met) => {
    const raw = avgHr ? L.hrCaloriesPerMin(sex, avgHr, weightLb, age) * minutes : L.metCalories(met || L.MET.strength, weightLb, minutes);
    return Math.max(0, Math.round(raw * 0.9));
  };

  // ---------- Strength ----------
  L.epley = (w, reps) => reps <= 1 ? w : w * (1 + reps / 30);
  L.weightForReps = (oneRm, reps) => oneRm / (1 + reps / 30);
  L.roundDown = (w, step) => Math.floor(w / step + 1e-9) * step;
  L.roundNear = (w, step) => Math.round(w / step) * step;

  // Rep schemes. Ranges are editable in Settings; these are the defaults.
  L.SCHEMES = {
    strength: { name: 'Strength', lo: 3, hi: 6, rest: 150, tip: 'Heavy and slow. Builds max strength. Rest 2-3 min. Best on big lifts.' },
    build: { name: 'Build', lo: 6, hi: 12, rest: 90, tip: 'The muscle-building middle. Rest 60-90 s. Good default for most lifts.' },
    endurance: { name: 'Endurance', lo: 12, hi: 20, rest: 45, tip: 'Lighter, more reps. Good for small muscles, joints that ache, and legs when squats feel rough.' },
  };

  // Next-session recommendation from what was actually done.
  // target: {sets, lo, hi, w}  actual: [{w, reps, fail, pain}]  step: smallest weight jump for this gear.
  // The working weight is the weight of the last set: if you dropped weight mid-exercise, that's
  // the weight you build from next time (jake: told 5 at 100, got 2, dropped to 80 for 4 -> 80, aim 5).
  L.recommend = (target, actual, step, opts = {}) => {
    const done = actual.filter(s => s.reps > 0);
    if (!done.length) return { kind: 'none', text: 'No sets logged.' };
    const W = +done[done.length - 1].w || 0;
    const tw = W > 0 ? W : (+target.w || 0);
    if (done.some(s => s.pain)) return { kind: 'pain', w: tw, reps: target.lo, text: 'Pain logged. Skip this one next time and pick a swap. If it keeps hurting, get it looked at.' };
    const work = done.filter(s => (+s.w || 0) === W);
    const dropped = target.w > 0 && W > 0 && W < target.w;
    const maxCap = opts.capPct ?? 10;
    const best = Math.max(...work.map(s => L.epley(s.w, s.reps)));
    const top = work.reduce((a, s) => (L.epley(s.w, s.reps) > L.epley(a.w, a.reps) ? s : a));
    const hitAll = work.length >= target.sets && work.every(s => s.reps >= target.lo);
    const hitTop = work.length >= target.sets && work.every(s => s.reps >= target.hi);
    const missed = work.filter(s => s.reps < target.lo).length;
    // Way past the range on any set (e.g. 11 reps when 5 was the target): the weight is too light.
    if (top.reps >= target.hi + 3 && step > 0) {
      const fit = L.weightForReps(best, target.lo);
      const cap = tw * (1 + maxCap / 100);
      let w = L.roundDown(Math.min(fit, cap), step);
      if (w <= tw) w = tw + step;
      return { kind: 'jump', w, reps: target.lo, e1rm: Math.round(best),
        text: `You did ${top.reps} reps at ${top.w} lb${top.fail ? ' to failure' : ''}, so your ${target.lo}-rep weight is about ${Math.round(L.roundNear(L.weightForReps(best, target.lo), step))} lb. Go to ${w} lb x ${target.lo}${w < fit - step ? ' (capped at +' + maxCap + '% per step)' : ''}.` };
    }
    if (hitTop && step > 0) return { kind: 'up', w: tw + step, reps: target.lo, e1rm: Math.round(best), text: `All sets hit the top of the range. Add ${step} lb: ${tw + step} lb x ${target.lo}.` };
    if (hitTop) return { kind: 'reps', w: tw, reps: target.hi + 1, text: `All sets hit ${target.hi}. Go for ${target.hi + 1} reps, or add load.` };
    if (hitAll) {
      const minReps = Math.min(...work.map(s => s.reps));
      return { kind: 'reps', w: tw, reps: Math.min(target.hi, minReps + 1), e1rm: Math.round(best), text: `Target hit. Same weight, aim for ${Math.min(target.hi, minReps + 1)} reps per set.` };
    }
    if (!dropped && missed >= 2 && opts.missedLastTime && step > 0) {
      const w = L.roundDown(tw * 0.9, step);
      return { kind: 'down', w, reps: target.lo, text: `Missed the range two sessions in a row. Drop to ${w} lb and build back up.` };
    }
    const minW = Math.min(...work.map(s => s.reps));
    const unit = W > 0 ? ` at ${tw} lb` : '';
    if (dropped) return { kind: 'hold', w: tw, reps: target.lo, e1rm: Math.round(best), text: `You dropped to ${tw} lb and got ${minW}. Stay at ${tw} lb and work up to ${target.lo} reps on every set, then move up.` };
    return { kind: 'hold', w: tw, reps: target.lo, e1rm: Math.round(best), text: `Best this time was ${minW} reps${unit}. Stay${unit} and work up to ${target.lo} on every set.` };
  };

  // Safe first weight for a lift you've never logged. Deliberately light: a fraction of body weight
  // by lift type and gear, scaled by fitness level, sex and rep range. Dumbbells/kettlebells are per hand.
  // Returns null for gear with no set weight (bands, sleds, medicine balls...).
  L.START_RATIO = {
    // [compound, isolation] fractions of body weight for a beginner man at ~10 reps
    bar: { legs: [0.35, 0.15], hinge: [0.45, 0.25], chest: [0.3, 0.12], shoulders: [0.2, 0.08], back: [0.3, 0.15], arms: [0.15, 0.12], core: [0.1, 0.05] },
    db: { legs: [0.08, 0.05], hinge: [0.1, 0.06], chest: [0.1, 0.05], shoulders: [0.07, 0.03], back: [0.1, 0.05], arms: [0.06, 0.05], core: [0.05, 0.04] },
    machine: { legs: [0.4, 0.2], hinge: [0.35, 0.2], chest: [0.25, 0.12], shoulders: [0.15, 0.06], back: [0.3, 0.15], arms: [0.15, 0.1], core: [0.15, 0.1] },
  };
  const START_GEAR = { barbell: 'bar', rack: 'bar', smith: 'bar', 'ez-curl-bar': 'bar', trapbar: 'bar', dumbbell: 'db', kettlebell: 'db', plates: 'db', 'cable-tower': 'machine', 'smith-cable': 'machine', 'hack-legpress': 'machine', legext: 'machine' };
  const START_AREA = { quadriceps: 'legs', glutes: 'legs', adductors: 'legs', abductors: 'legs', calves: 'legs', hamstrings: 'hinge', 'lower back': 'hinge', chest: 'chest', shoulders: 'shoulders', traps: 'back', lats: 'back', 'middle back': 'back', biceps: 'arms', triceps: 'arms', forearms: 'arms', abdominals: 'core' };
  L.startWeight = (ex, profile = {}, scheme = 'build', step = 2.5) => {
    const kind = ex && START_GEAR[ex.g];
    if (!kind) return null;
    const area = START_AREA[(ex.pm || [])[0]] || 'arms';
    const r = L.START_RATIO[kind][area][ex.mech === 'compound' ? 0 : 1];
    const bw = Math.min(300, Math.max(100, +profile.weightLb || 170));
    const lvl = { beginner: 1, intermediate: 1.4, advanced: 1.8 }[profile.level] || 1;
    const sex = profile.sex === 'female' ? 0.65 : 1;
    const reps = { strength: 1.1, build: 1, endurance: 0.75 }[scheme] || 1;
    let w = L.roundDown(bw * r * lvl * sex * reps, step);
    const min = kind === 'bar' ? (ex.g === 'ez-curl-bar' ? 20 : ex.g === 'smith' ? 0 : 45) : step * 2;
    // A bare bar is the floor for barbell lifts; light curls/raises still get the minimum dumbbell.
    return Math.max(w, min || step);
  };

  // ---------- Weekly muscle balance ----------
  // Primary muscle = 1 set, helper (secondary) muscle = half a set.
  L.setsByMuscle = (items, exById) => {
    const out = Object.fromEntries(L.MUSCLES.map(m => [m, 0]));
    for (const it of items) {
      const e = exById[it.ex];
      if (!e) continue;
      for (const m of e.pm) if (m in out) out[m] += it.sets;
      for (const m of e.sm) if (m in out) out[m] += it.sets * 0.5;
    }
    return out;
  };
  L.balanceStatus = (sets, tgt) => sets < tgt.min ? 'under' : sets > tgt.max ? 'over' : 'on';

  // ---------- Plan builder ----------
  // Preferred lifts per muscle, best first. The builder takes the first one the gear allows.
  L.STAPLES = {
    chest: ['Smith_Machine_Bench_Press', 'Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'Smith_Machine_Incline_Bench_Press', 'Pushups', 'Dumbbell_Flyes', 'Incline_Dumbbell_Flyes', 'Decline_Dumbbell_Bench_Press'],
    lats: ['Pullups', 'Wide-Grip_Lat_Pulldown', 'Chin-Up', 'V-Bar_Pulldown', 'Straight-Arm_Pulldown'],
    'middle back': ['One-Arm_Dumbbell_Row', 'Seated_Cable_Rows', 'Bent_Over_Barbell_Row', 'Inverted_Row', 'Smith_Machine_Bent_Over_Row'],
    'lower back': ['Barbell_Deadlift', 'Superman'],
    traps: ['Dumbbell_Shrug', 'Barbell_Shrug'],
    shoulders: ['Dumbbell_Shoulder_Press', 'Smith_Machine_Overhead_Shoulder_Press', 'Side_Lateral_Raise', 'Face_Pull', 'Reverse_Flyes', 'Seated_Side_Lateral_Raise'],
    biceps: ['Dumbbell_Bicep_Curl', 'EZ-Bar_Curl', 'Hammer_Curls', 'Barbell_Curl', 'Incline_Hammer_Curls', 'Cable_Hammer_Curls_-_Rope_Attachment'],
    triceps: ['Triceps_Pushdown', 'EZ-Bar_Skullcrusher', 'Smith_Machine_Close-Grip_Bench_Press', 'Bench_Dips', 'Triceps_Pushdown_-_Rope_Attachment'],
    forearms: ['Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', 'Reverse_Barbell_Curl'],
    abdominals: ['Plank', 'Crunches', 'Dead_Bug', 'Hanging_Leg_Raise', 'Russian_Twist', 'Barbell_Ab_Rollout_-_On_Knees'],
    quadriceps: ['Goblet_Squat', 'Smith_Machine_Squat', 'Leg_Press', 'Hack_Squat', 'Smith_Single-Leg_Split_Squat', 'Dumbbell_Lunges', 'Split_Squat_with_Dumbbells', 'Dumbbell_Step_Ups', 'Bodyweight_Squat'],
    hamstrings: ['Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Smith_Machine_Stiff-Legged_Deadlift'],
    glutes: ['Barbell_Hip_Thrust', 'Barbell_Glute_Bridge', 'Single_Leg_Glute_Bridge'],
    calves: ['Smith_Machine_Calf_Raise', 'Standing_Dumbbell_Calf_Raise', 'Calf_Press_On_The_Leg_Press_Machine'],
    adductors: [], abductors: [],
  };
  // Leg moves that rotate through the "daily minimum" so it isn't squats every day.
  L.LEG_ROTATION = ['Goblet_Squat', 'Smith_Single-Leg_Split_Squat', 'Romanian_Deadlift', 'Dumbbell_Lunges', 'Barbell_Glute_Bridge', 'Smith_Machine_Calf_Raise', 'Dumbbell_Step_Ups'];
  // One gentle set per group for the morning slot.
  L.MORNING = { Chest: ['Pushups'], Back: ['Inverted_Row', 'Pullups'], Shoulders: ['Side_Lateral_Raise'], Arms: ['Hammer_Curls'], Core: ['Plank', 'Dead_Bug'], Legs: ['Bodyweight_Squat', 'Single_Leg_Glute_Bridge'] };

  L.PRIORITY = ['quadriceps', 'chest', 'lats', 'middle back', 'hamstrings', 'shoulders', 'glutes', 'lower back', 'triceps', 'biceps', 'calves', 'traps', 'forearms', 'adductors', 'abductors', 'abdominals'];
  L.available = (ex, ownedGear) => ex.g === 'bodyweight' || ownedGear.has(ex.g);

  // Builds each training day's exercise list from the chosen muscle groups.
  // days: [{groups:[...], off:bool}] (7 items, Sun..Sat). Returns [{ex, sets, scheme}] per day.
  L.buildWeek = ({ days, exById, ownedGear, stars, focus, targets, perDayMax = 6, maxSets = 4, dailyMin = {} }) => {
    const ok = id => exById[id] && L.available(exById[id], ownedGear);
    const pick = (m, used) => {
      const list = [...(L.STAPLES[m] || [])].filter(ok);
      // Starred lifts first, then staples order, then anything else for that muscle.
      const extra = Object.values(exById).filter(e => e.pm.includes(m) && L.available(e, ownedGear) && e.cat === 'strength' && !list.includes(e.id)).map(e => e.id);
      const all = [...list, ...extra];
      const starred = all.filter(id => stars.has(id));
      const order = [...starred, ...all.filter(id => !stars.has(id))];
      return order.find(id => !used.has(id)) || order[0];
    };
    const trainingDays = days.map((d, i) => ({ ...d, i })).filter(d => !d.off && d.groups.length);
    // How many days hit each muscle, to spread the weekly target.
    const hits = {};
    for (const d of trainingDays) for (const g of d.groups) for (const m of L.GROUPS[g]) hits[m] = (hits[m] || 0) + 1;
    const week = days.map(() => []);
    const usedWeek = new Set();
    for (const d of trainingDays) {
      const muscles = d.groups.flatMap(g => L.GROUPS[g]).filter(m => L.TARGETED.includes(m) || focus.has(m));
      // Big muscles first so compounds land early in the session; core last.
      muscles.sort((a, b) => L.PRIORITY.indexOf(a) - L.PRIORITY.indexOf(b));
      const usedDay = new Set();
      const cap = perDayMax + (d.groups.length > 2 ? 1 : 0);
      for (const m of muscles) {
        const t = targets[m] || { min: 10, max: 20 };
        const want = (focus.has(m) ? t.max : (t.min + t.max) / 2) / Math.max(1, hits[m]);
        // Up to two exercises per muscle, at most 4 sets each. Earlier picks count (bench covers some triceps).
        for (let k = 0; k < 2 && week[d.i].length < cap; k++) {
          const left = want - L.setsByMuscle(week[d.i], exById)[m];
          if (left < 2 && !(k === 0 && left >= 1.5)) break;
          const id = pick(m, new Set([...usedDay, ...usedWeek]));
          if (!id || usedDay.has(id)) break;
          usedDay.add(id); usedWeek.add(id);
          const e = exById[id];
          const sets = Math.max(2, Math.min(maxSets, Math.round(left)));
          const scheme = e.mech === 'compound' && m !== 'abdominals' ? 'build' : 'endurance';
          week[d.i].push({ ex: id, sets, scheme });
        }
      }
    }
    // Daily minimums (e.g. 1 leg set every day), rotating the move.
    let rot = 0;
    for (let i = 0; i < 7; i++) {
      for (const [g, n] of Object.entries(dailyMin)) {
        if (!n || days[i].groups.includes(g)) continue;
        const pool = (g === 'Legs' ? L.LEG_ROTATION : L.GROUPS[g].flatMap(m => L.STAPLES[m] || [])).filter(ok);
        if (!pool.length) continue;
        week[i].push({ ex: pool[rot++ % pool.length], sets: n, scheme: 'endurance', daily: true });
      }
    }
    return week;
  };

  L.morningMovement = (exById, ownedGear, dayIndex) => Object.entries(L.MORNING).map(([g, ids]) => {
    const pool = ids.filter(id => exById[id] && L.available(exById[id], ownedGear));
    return pool.length ? { ex: pool[dayIndex % pool.length], sets: 1, scheme: 'endurance', group: g } : null;
  }).filter(Boolean);

  // ---------- Review checks ----------
  // ctx carries everything the checks read. Each returns {id, level: info|warn|alert, area, title, detail, action?}.
  L.review = ctx => {
    const out = [];
    const { today, modules } = ctx;
    const dayMs = 864e5;
    const daysAgo = d => Math.round((new Date(today) - new Date(d)) / dayMs);
    if (modules.workout) {
      const sessions = ctx.sessions;
      // Muscle untouched > 7 days.
      for (const m of ['chest', 'lats', 'shoulders', 'quadriceps', 'hamstrings', 'abdominals']) {
        const last = sessions.filter(s => s.sets.some(st => ctx.exById[st.ex]?.pm.includes(m))).map(s => s.date).sort().pop();
        const n = last ? daysAgo(last) : null;
        if (n === null || n > 7) out.push({ id: 'untouched-' + m, level: 'warn', area: 'Training', title: `${cap(m)} not trained in ${n === null ? 'over a week' : n + ' days'}`, detail: 'Add it to this week or rely on the daily minimum.', action: 'Add to plan' });
      }
      // Rest days.
      const trainedDays = new Set(sessions.filter(s => !s.morning).map(s => s.date));
      let streak = 0;
      for (let i = 0; i < 14; i++) { const d = iso(new Date(new Date(today) - i * dayMs)); if (trainedDays.has(d)) streak++; else break; }
      if (streak >= 6) out.push({ id: 'rest', level: 'alert', area: 'Recovery', title: `${streak} training days in a row`, detail: 'Take a full rest day. Muscles grow during recovery, not during the workout.', action: 'Make today a rest day' });
      const last7 = [...Array(7)].map((_, i) => iso(new Date(new Date(today) - i * dayMs)));
      const restDays = last7.filter(d => !trainedDays.has(d)).length;
      const minRest = ctx.level === 'beginner' ? 2 : 1;
      if (restDays < minRest) out.push({ id: 'rest-week', level: 'warn', area: 'Recovery', title: `Only ${restDays} rest day${restDays === 1 ? '' : 's'} in the last week`, detail: `Aim for at least ${minRest} as a ${ctx.level}.` });
      // Same muscle hard within 48 h.
      const recent = sessions.filter(s => !s.morning && daysAgo(s.date) <= 1);
      if (recent.length >= 2) {
        const a = new Set(recent[0].sets.flatMap(st => ctx.exById[st.ex]?.pm || []));
        const b = recent[1].sets.flatMap(st => ctx.exById[st.ex]?.pm || []).filter(m => a.has(m));
        if (b.length) out.push({ id: 'recovery48', level: 'warn', area: 'Recovery', title: `${cap(b[0])} trained hard two days running`, detail: 'Give a muscle about 48 hours between hard sessions.' });
      }
      // Soreness.
      const sore = Object.entries(ctx.soreness || {}).filter(([, v]) => v >= 2);
      if (sore.length) out.push({ id: 'sore', level: sore.some(([, v]) => v >= 3) ? 'alert' : 'warn', area: 'Recovery', title: `Sore: ${sore.map(([m]) => m).join(', ')}`, detail: 'Today\'s plan lightens these: fewer sets, lighter weight, or a swap.', action: 'Lighten today' });
      // Volume jump week over week.
      if (ctx.volumePrev > 0 && ctx.volumeThis > ctx.volumePrev * 1.2) out.push({ id: 'vol-jump', level: 'warn', area: 'Training', title: `Volume up ${Math.round((ctx.volumeThis / ctx.volumePrev - 1) * 100)}% this week`, detail: 'Jumps over 20% raise injury risk. Hold here for a week.' });
      if (ctx.volumePrev > 0 && ctx.volumeThis < ctx.volumePrev * 0.7) out.push({ id: 'vol-drop', level: 'info', area: 'Training', title: `Volume down ${Math.round((1 - ctx.volumeThis / ctx.volumePrev) * 100)}% this week`, detail: 'Fine for a planned light week. Otherwise check the schedule.' });
      // Stalls.
      for (const s of ctx.stalls || []) out.push({ id: 'stall-' + s.ex, level: 'info', area: 'Progress', title: `${s.name}: same weight ${s.n} sessions`, detail: `Try +${s.step} lb next time, or add a rep per set.`, action: 'Apply' });
      if ((ctx.stalls || []).length >= 3 || ctx.weeksHard >= 7) out.push({ id: 'deload', level: 'info', area: 'Recovery', title: 'Time for a lighter week', detail: ctx.weeksHard >= 7 ? `${ctx.weeksHard} hard weeks in a row. Do one week at about 60% of your sets.` : 'Several lifts have stalled. A light week usually breaks it.', action: 'Plan a deload' });
      // Push/pull balance.
      if (ctx.pushSets > 0 && ctx.pullSets > 0 && ctx.pushSets / ctx.pullSets > 2) out.push({ id: 'pushpull', level: 'warn', area: 'Balance', title: `Push ${ctx.pushSets} sets vs pull ${ctx.pullSets}`, detail: 'Add rows or pulldowns to protect your shoulders.' });
      // Morning movement.
      if (ctx.morningSkipped >= 3) out.push({ id: 'morning', level: 'info', area: 'Habits', title: `Morning movement skipped ${ctx.morningSkipped} of the last 5 days`, detail: 'Even the 10-minute version keeps the habit.' });
      if (ctx.adherence !== null && ctx.adherence < 0.5) out.push({ id: 'adherence', level: 'warn', area: 'Habits', title: `${Math.round(ctx.adherence * 100)}% of planned workouts done this week`, detail: 'If the plan doesn\'t fit your week, make it smaller so you can hit it.', action: 'Adjust schedule' });
      for (const pr of ctx.prs || []) out.push({ id: 'pr-' + pr.ex, level: 'good', area: 'Progress', title: `New best: ${pr.name} ${pr.w} lb x ${pr.reps}`, detail: `Estimated 1-rep max ${pr.e1rm} lb.` });
      for (const p of ctx.pains || []) out.push({ id: 'pain-' + p.ex, level: 'alert', area: 'Safety', title: `Pain logged on ${p.name}`, detail: 'Pain is different from soreness. Swap this exercise for now. If it keeps up, get it checked.', action: 'Swap it' });
      // Watch data via Health Connect.
      if (ctx.rhrToday && ctx.rhrBase && ctx.rhrToday >= ctx.rhrBase + 7) out.push({ id: 'rhr', level: 'warn', area: 'Recovery', title: `Resting heart rate ${ctx.rhrToday} bpm, usually ${ctx.rhrBase}`, detail: 'A jump like this often means poor recovery or getting sick. Go easier today.' });
      if (ctx.sleepHrs && ctx.sleepHrs < 6) out.push({ id: 'sleep', level: 'warn', area: 'Recovery', title: `${ctx.sleepHrs.toFixed(1)} h sleep last night`, detail: 'Keep today\'s weights the same rather than chasing a PR.' });
    }
    if (modules.food) {
      const pg = ctx.proteinAvg7, w = ctx.weightLb;
      if (pg && w && pg < 0.7 * w) out.push({ id: 'protein', level: 'warn', area: 'Nutrition', title: `Protein averaging ${Math.round(pg)} g a day`, detail: `Aim for at least ${Math.round(0.7 * w)} g (0.7 g per lb) to keep and build muscle.` });
      if (ctx.calAvg7 && ctx.calFloor && ctx.calAvg7 < ctx.calFloor) out.push({ id: 'cal-floor', level: 'alert', area: 'Nutrition', title: `Eating about ${Math.round(ctx.calAvg7)} kcal a day`, detail: `That's under your safe floor of ${Math.round(ctx.calFloor)}. Eat more, even while cutting.` });
      if (ctx.trend) {
        const { actual, target, weeks } = ctx.trend;
        if (weeks >= 2) {
          const diff = actual - target;
          if (target < 0 && diff > 0.25) out.push({ id: 'trend', level: 'info', area: 'Nutrition', title: `Losing ${Math.abs(actual).toFixed(1)} lb/week, target ${Math.abs(target).toFixed(1)}`, detail: `Reduce calories by about ${Math.round(diff * 500 / 50) * 50} a day.`, action: 'Apply' });
          if (target < 0 && actual < target * 1.5) out.push({ id: 'trend-fast', level: 'warn', area: 'Nutrition', title: `Losing ${Math.abs(actual).toFixed(1)} lb/week, faster than planned`, detail: 'Fast loss eats muscle. Add about 200 kcal a day.', action: 'Apply' });
          if (target > 0 && actual > target + 0.25) out.push({ id: 'trend-gain', level: 'info', area: 'Nutrition', title: `Gaining ${actual.toFixed(1)} lb/week, target ${target.toFixed(1)}`, detail: 'Trim about 150 kcal a day to keep the gain lean.', action: 'Apply' });
        } else out.push({ id: 'trend-wait', level: 'info', area: 'Nutrition', title: 'Calorie advice starts after 2 weeks of weigh-ins', detail: `${Math.max(0, 14 - (ctx.weighDays || 0))} more days of data needed.` });
      }
      if (ctx.foodDaysSkipped >= 2) out.push({ id: 'food-skip', level: 'info', area: 'Habits', title: `No food logged ${ctx.foodDaysSkipped} of the last 3 days`, detail: 'Turn food tracking off in Settings if you\'re taking a break.' });
    }
    const rank = { alert: 0, warn: 1, info: 2, good: 3 };
    return out.sort((a, b) => rank[a.level] - rank[b.level]);
  };


  // ---------- Plan check (coach review of a draft week, plain code) ----------
  // week: 7 lists of {ex, sets, scheme, daily?}; days: [{groups, off}]. Returns findings, worst first.
  // fix: {type:'addSets'|'cutSets', muscle} tells the app what "Apply" should do.
  L.planCheck = ({ week, days, exById, targets, focus }) => {
    const out = [];
    const sets = L.setsByMuscle(week.flat(), exById);
    for (const m of L.TARGETED) {
      const t = targets[m] || { min: 10, max: 20 }, v = sets[m];
      if (v < t.min) out.push({ id: 'under-' + m, level: v < t.min / 2 ? 'warn' : 'info', title: `${cap(m)}: ${Math.round(v * 10) / 10} sets, target ${t.min}-${t.max}`, detail: 'Below the weekly range. Add a set or an exercise on a day that trains it.', fix: { type: 'addSets', muscle: m } });
      else if (v > t.max + 4) out.push({ id: 'over-' + m, level: 'info', title: `${cap(m)}: ${Math.round(v * 10) / 10} sets, above ${t.max}`, detail: 'More than you can recover from well. Trim a set.', fix: { type: 'cutSets', muscle: m } });
      else if (focus && focus.has(m) && v < t.max - 1) out.push({ id: 'focus-' + m, level: 'info', title: `${cap(m)} is a focus but sits mid-range`, detail: `Focus muscles aim for ${t.max} sets.`, fix: { type: 'addSets', muscle: m } });
    }
    const push = L.PUSH.reduce((a, m) => a + sets[m], 0), pull = L.PULL.reduce((a, m) => a + sets[m], 0);
    if (push > pull * 1.4 + 2) out.push({ id: 'pushpull', level: 'warn', title: `Push ${Math.round(push)} vs pull ${Math.round(pull)} sets`, detail: 'Shoulders stay healthier with about as much pulling as pushing.', fix: { type: 'addSets', muscle: 'middle back' } });
    const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const main = week.map(d => d.filter(x => !x.daily));
    const groupsOn = main.map(d => new Set(d.flatMap(x => (exById[x.ex]?.pm || []).map(L.groupOf)).filter(Boolean)));
    for (let i = 0; i < 7; i++) {
      const j = (i + 1) % 7;
      for (const g of ['Chest', 'Back', 'Legs', 'Shoulders']) if (groupsOn[i].has(g) && groupsOn[j].has(g) && main[i].length && main[j].length) out.push({ id: `b2b-${g}-${i}`, level: 'info', title: `${g} two days in a row (${D[i]}, ${D[j]})`, detail: 'Give big muscles about 48 hours. Fine if one day is light.' });
      const n = main[i].reduce((a, x) => a + x.sets, 0);
      if (n > 24) out.push({ id: 'long-' + i, level: 'warn', title: `${D[i]} has ${n} sets`, detail: 'That is a long session (over about 75 minutes). Move some to another day.' });
    }
    const legDays = groupsOn.filter(s => s.has('Legs')).length;
    if (legDays < 2) out.push({ id: 'legs-freq', level: 'info', title: `Legs trained ${legDays} day${legDays === 1 ? '' : 's'} a week`, detail: 'Twice a week works better, or use the daily minimum.', fix: { type: 'addSets', muscle: 'quadriceps' } });
    const rest = days.filter((d, i) => d.off || !main[i].length).length;
    if (rest === 0) out.push({ id: 'no-rest', level: 'warn', title: 'No rest day', detail: 'Take at least one full day off each week.' });
    const rank = { alert: 0, warn: 1, info: 2 };
    return out.sort((a, b) => rank[a.level] - rank[b.level]);
  };

  // ---------- Levels and achievements ----------
  L.XP = { workout: 40, perSet: 2, morning: 15, pr: 50, foodDay: 15, macroDay: 25, weighIn: 5, quest: 100, streak7: 70 };
  L.levelFor = xp => Math.floor(Math.sqrt(xp / 50)) + 1;
  L.xpForLevel = lv => 50 * (lv - 1) * (lv - 1);
  L.TITLES = [[1, 'Recruit'], [3, 'Novice'], [5, 'Initiate'], [8, 'Squire'], [12, 'Knight'], [16, 'Veteran'], [20, 'Champion'], [25, 'Warlord'], [30, 'Legend'], [40, 'Mythic']];
  L.titleFor = lv => L.TITLES.filter(([n]) => lv >= n).pop()[1];
  // st: counts the app works out from history. Each achievement reads one number and has a goal.
  L.ACHIEVEMENTS = [
    { id: 'first', name: 'First Rep', desc: 'Finish your first workout', key: 'workouts', goal: 1, icon: 'sword' },
    { id: 'five', name: 'Getting Started', desc: 'Finish 5 workouts', key: 'workouts', goal: 5, icon: 'sword' },
    { id: 'regular', name: 'Iron Regular', desc: 'Finish 25 workouts', key: 'workouts', goal: 25, icon: 'shield' },
    { id: 'century', name: 'Centurion', desc: 'Finish 100 workouts', key: 'workouts', goal: 100, icon: 'crown' },
    { id: 'riser', name: 'Early Riser', desc: '10 morning movements', key: 'mornings', goal: 10, icon: 'sun' },
    { id: 'legday', name: 'Leg Day Survivor', desc: 'Train legs 10 times', key: 'legSessions', goal: 10, icon: 'leg' },
    { id: 'neverskip', name: 'Never Skip Legs', desc: 'Legs every day for 7 days', key: 'legStreak', goal: 7, icon: 'leg' },
    { id: 'pr', name: 'PR Hunter', desc: 'Set 10 personal bests', key: 'prs', goal: 10, icon: 'bolt' },
    { id: 'plate', name: 'Plate Club', desc: 'Lift 135 lb in any set', key: 'heaviest', goal: 135, icon: 'plate' },
    { id: 'macro', name: 'Macro Master', desc: 'Hit protein and calories 7 days', key: 'macroDays', goal: 7, icon: 'target' },
    { id: 'prep', name: 'Meal Prepper', desc: 'Log 20 recipe containers', key: 'containers', goal: 20, icon: 'pot' },
    { id: 'scale', name: 'Scale Watcher', desc: '30 weigh-ins', key: 'weighIns', goal: 30, icon: 'scale' },
    { id: 'collector', name: 'Collector', desc: 'Star 10 exercises', key: 'stars', goal: 10, icon: 'star' },
    { id: 'balanced', name: 'Balanced Warrior', desc: 'Every muscle in range for a week', key: 'balancedWeeks', goal: 1, icon: 'scales' },
    { id: 'heavy', name: 'Heavy Day', desc: 'Move 10,000 lb in one workout', key: 'bestVolume', goal: 10000, icon: 'anvil' },
    { id: 'streak', name: 'Unbroken', desc: '14-day streak', key: 'bestStreak', goal: 14, icon: 'flame' },
    { id: 'streak30', name: 'Iron Will', desc: '30-day streak', key: 'bestStreak', goal: 30, icon: 'flame' },
    { id: 'pr50', name: 'Record Breaker', desc: 'Set 50 personal bests', key: 'prs', goal: 50, icon: 'bolt' },
    { id: 'dawn', name: 'Dawn Patrol', desc: '50 morning movements', key: 'mornings', goal: 50, icon: 'sun' },
    { id: 'quads', name: 'Quad Squad', desc: 'Train legs 50 times', key: 'legSessions', goal: 50, icon: 'leg' },
    { id: 'twoplate', name: 'Two Plates', desc: 'Lift 225 lb in any set', key: 'heaviest', goal: 225, icon: 'plate' },
    { id: 'dialed', name: 'Dialed In', desc: 'Hit protein and calories 30 days', key: 'macroDays', goal: 30, icon: 'target' },
    { id: 'boss1', name: 'First Blood', desc: 'Defeat a weekly boss', key: 'bossKills', goal: 1, icon: 'sword' },
    { id: 'boss5', name: 'Monster Hunter', desc: 'Defeat 5 weekly bosses', key: 'bossKills', goal: 5, icon: 'sword' },
    { id: 'boss20', name: 'Dragonslayer', desc: 'Defeat 20 weekly bosses', key: 'bossKills', goal: 20, icon: 'crown' },
    { id: 'daily10', name: 'Daily Grinder', desc: 'Finish 10 daily quests', key: 'dailyDone', goal: 10, icon: 'check' },
    { id: 'daily100', name: 'Questmaster', desc: 'Finish 100 daily quests', key: 'dailyDone', goal: 100, icon: 'check' },
    { id: 'gold500', name: 'Coin Collector', desc: 'Earn 500 gold', key: 'goldEarned', goal: 500, icon: 'coin' },
    { id: 'gold5000', name: 'Treasure Hoard', desc: 'Earn 5,000 gold', key: 'goldEarned', goal: 5000, icon: 'coin' },
    { id: 'chest', name: 'Lucky Find', desc: 'Find a gold chest after a workout', key: 'chests', goal: 1, icon: 'chest' },
    { id: 'pet', name: 'Companion', desc: 'Get a pet from the shop', key: 'pets', goal: 1, icon: 'paw' },
    { id: 'geared', name: 'Fully Geared', desc: 'Own something for every slot', key: 'slotsFilled', goal: 6, icon: 'shield' },
    { id: 'lv10', name: 'Double Digits', desc: 'Reach level 10', key: 'level', goal: 10, icon: 'crown' },
    { id: 'lv25', name: 'Warlord', desc: 'Reach level 25', key: 'level', goal: 25, icon: 'crown' },
  ];
  L.achievements = st => L.ACHIEVEMENTS.map(a => ({ ...a, have: st[a.key] || 0, done: (st[a.key] || 0) >= a.goal }));
  // Weekly quests reset Sunday. Each reads one count for this week.
  L.QUESTS = [
    { id: 'q-legs', name: 'Train legs 3 days', key: 'legDaysWeek', goal: 3 },
    { id: 'q-food', name: 'Log food 6 days', key: 'foodDaysWeek', goal: 6 },
    { id: 'q-morning', name: 'Morning movement 5 days', key: 'morningsWeek', goal: 5 },
    { id: 'q-protein', name: 'Hit protein 5 days', key: 'proteinDaysWeek', goal: 5 },
  ];

  // ---------- Adventure: gold, loot, daily quests, weekly boss, shop ----------
  // Gold is earned next to XP. Some things give XP, some gold, some both.
  L.GOLD = { workout: 10, morning: 5, pr: 25, macroDay: 15, weighIn: 2, quest: 50, streak7: 40, boss: 120 };
  L.BOSS_XP = 150;
  L.hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  L.rand = seed => (L.hash(seed) % 100000) / 100000;
  // Some workouts drop loot. Same session id, same drop, every time.
  L.loot = sid => { const r = L.rand('loot:' + sid); return r < 0.05 ? { name: 'Gold chest', gold: 60, xp: 0 } : r < 0.2 ? { name: 'Coin pouch', gold: 20, xp: 0 } : r < 0.3 ? { name: 'Scroll of insight', gold: 0, xp: 40 } : null; };
  // Daily quests: three a day, picked from the pool by the date.
  L.DAILY = [
    { id: 'd-breakfast', name: 'Log breakfast', key: 'breakfast', goal: 1, xp: 20, gold: 5 },
    { id: 'd-meals', name: 'Log 3 meals', key: 'meals', goal: 3, xp: 30, gold: 10 },
    { id: 'd-protein', name: 'Hit your protein', key: 'protein', goal: 1, xp: 30, gold: 15 },
    { id: 'd-cal', name: 'Stay within calories', key: 'withinCal', goal: 1, xp: 25, gold: 10 },
    { id: 'd-sets', name: 'Log 12 sets', key: 'sets', goal: 12, xp: 40, gold: 15 },
    { id: 'd-leg', name: 'Do a leg set', key: 'legSets', goal: 1, xp: 20, gold: 10 },
    { id: 'd-morning', name: 'Do the morning movement', key: 'morning', goal: 1, xp: 20, gold: 5 },
    { id: 'd-weigh', name: 'Weigh in', key: 'weighIn', goal: 1, xp: 10, gold: 5 },
    { id: 'd-pr', name: 'Beat a personal best', key: 'prs', goal: 1, xp: 40, gold: 20 },
  ];
  L.dailyQuests = date => L.DAILY.map((q, i) => ({ q, r: L.rand(date + ':' + q.id + ':' + i) })).sort((a, b) => a.r - b.r).slice(0, 3).map(x => x.q);
  // Weekly boss: one per week (Sunday start). Your week's work is the damage.
  L.BOSSES = [
    { id: 'goblin', name: 'Gym Goblin', color: '#5a8f3a' },
    { id: 'troll', name: 'Couch Troll', color: '#7a6a55' },
    { id: 'wraith', name: 'Sugar Wraith', color: '#b05aa8' },
    { id: 'ogre', name: 'Skipped-Leg Ogre', color: '#8a5a3a' },
    { id: 'golem', name: 'Rust Golem', color: '#a0522d' },
    { id: 'dragon', name: 'Snooze Dragon', color: '#3a6ea5' },
    { id: 'slime', name: 'Takeout Slime', color: '#d4a017' },
    { id: 'lich', name: 'Excuse Lich', color: '#555b6e' },
  ];
  L.bossFor = (weekStart, lv) => { const b = L.BOSSES[L.hash('boss:' + weekStart) % L.BOSSES.length]; return { ...b, hp: 350 + 20 * lv }; };
  // Damage for one week of history. mult comes from your weapon.
  L.DMG = { set: 8, perLb: 1 / 250, morning: 15, foodDay: 10, macroDay: 20, weighIn: 5 };
  L.bossDamage = (w, mult = 1) => Math.round(mult * (w.sets * L.DMG.set + w.volume * L.DMG.perLb + w.mornings * L.DMG.morning + w.foodDays * L.DMG.foodDay + w.macroDays * L.DMG.macroDay + w.weighIns * L.DMG.weighIn));
  // Shop. Weapons hit the boss harder, pets find more gold, armor is for looks, the potion saves a streak.
  L.SHOP = [
    { id: 'w-wood', slot: 'weapon', name: 'Wooden sword', price: 30, lv: 1, dmg: 1.05 },
    { id: 'w-iron', slot: 'weapon', name: 'Iron sword', price: 150, lv: 5, dmg: 1.1 },
    { id: 'w-flame', slot: 'weapon', name: 'Flame sword', price: 450, lv: 12, dmg: 1.2 },
    { id: 'w-legend', slot: 'weapon', name: 'Legend blade', price: 1100, lv: 25, dmg: 1.3 },
    { id: 's-buckler', slot: 'shield', name: 'Buckler', price: 40, lv: 1 },
    { id: 's-kite', slot: 'shield', name: 'Kite shield', price: 160, lv: 8 },
    { id: 's-tower', slot: 'shield', name: 'Tower shield', price: 480, lv: 16 },
    { id: 'h-cap', slot: 'head', name: 'Leather cap', price: 25, lv: 1 },
    { id: 'h-helm', slot: 'head', name: 'Iron helm', price: 130, lv: 5 },
    { id: 'h-horns', slot: 'head', name: 'Horned helm', price: 350, lv: 12 },
    { id: 'h-crown', slot: 'head', name: 'Crown', price: 900, lv: 20 },
    { id: 'b-tunic', slot: 'body', name: 'Tunic', price: 20, lv: 1 },
    { id: 'b-chain', slot: 'body', name: 'Chainmail', price: 170, lv: 8 },
    { id: 'b-plate', slot: 'body', name: 'Plate armor', price: 520, lv: 16 },
    { id: 'c-red', slot: 'cape', name: 'Red cape', price: 90, lv: 3 },
    { id: 'c-royal', slot: 'cape', name: 'Royal cape', price: 600, lv: 20 },
    { id: 'p-cat', slot: 'pet', name: 'Gym cat', price: 200, lv: 5, gold: 2 },
    { id: 'p-owl', slot: 'pet', name: 'Owl', price: 320, lv: 10, gold: 4 },
    { id: 'p-dragon', slot: 'pet', name: 'Baby dragon', price: 850, lv: 20, gold: 8 },
    { id: 'x-freeze', slot: 'potion', name: 'Streak shield potion', price: 80, lv: 1, desc: 'Covers one missed day so your streak keeps going. Used up automatically.' },
  ];
  L.SLOTS = ['weapon', 'shield', 'head', 'body', 'cape', 'pet'];

  // ---------- Helpers ----------
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const iso = d => d.toISOString().slice(0, 10);
  L.cap = cap; L.iso = iso;
  // Rolling average of weigh-ins over the last n days ending at each point.
  L.rolling = (pts, n) => pts.map((p, i) => {
    const from = new Date(p.date) - (n - 1) * 864e5;
    const win = pts.slice(0, i + 1).filter(q => new Date(q.date) >= from);
    return { date: p.date, v: win.reduce((s, q) => s + q.lb, 0) / win.length };
  });
  // lb/week from the 7-day average, comparing first and last week of the window.
  L.weeklyRate = pts => {
    if (pts.length < 8) return null;
    const avg = L.rolling(pts, 7);
    const a = avg[6], b = avg[avg.length - 1];
    const weeks = (new Date(b.date) - new Date(a.date)) / (7 * 864e5);
    return weeks > 0 ? (b.v - a.v) / weeks : null;
  };

  root.Logic = L;
  if (typeof module !== 'undefined') module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
