// Health-Fitness preview (review 2): a clickable stand-in for the Android app, for UI and concept review.
// Logic lives in logic.js (becomes Kotlin core/). Example data is kept in this browser only.
(function () {
  const L = window.Logic;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r0 = n => Math.round(n), r1 = n => Math.round(n * 10) / 10;
  const DAY = 864e5;
  const today = L.iso(new Date());
  const dateAdd = (d, n) => L.iso(new Date(new Date(d + 'T12:00:00').getTime() + n * DAY));
  const dow = d => new Date(d + 'T12:00:00').getDay();
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = d => `${DAYS[dow(d)]} ${MONTHS[+d.slice(5, 7) - 1]} ${+d.slice(8)}`;
  const shortDate = d => `${+d.slice(5, 7)}/${+d.slice(8)}`;
  const GROUPS = Object.keys(L.GROUPS);
  const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const STEP = 2.5; // jake: assume 2.5 lb everywhere; odd weights get typed in by hand.

  // ---------- Icons ----------
  const I = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    food: '<path d="M7 3v8a3 3 0 0 0 6 0V3"/><path d="M10 3v18"/><path d="M17 3c-1.5 2-2 4-2 7h3v11"/>',
    train: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
    progress: '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-4 3 3 5-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 8v8M11 8v8M14 8v8M17 8v8"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    pot: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20M9 6c0-1 1-2 3-2s3 1 3 2"/>',
    dumbbell: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
    back: '<path d="M15 18l-6-6 6-6"/>', fwd: '<path d="M9 18l6-6-6-6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
    scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9a4 4 0 0 1 6 0l-3 3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
    chest: '<path d="M3 10h18v10H3zM3 10a9 5 0 0 1 18 0"/><path d="M10 12h4v3h-4z"/>',
    paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6.5" r="2"/><circle cx="17" cy="9" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 2-2 2-4 1.5C10 19 8 19 8 17z"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 20h8M10 17h4"/>',
    flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-3 5-3 8a6 6 0 0 0 6 6z"/>',
    // Achievement badges
    sword: '<path d="M14 4h6v6L9 21l-3-3z"/><path d="M5 15l4 4M3 21l3-3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
    crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    leg: '<path d="M9 3v8l-2 8h6l1-4 3 4h3l-5-8V3"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    scales: '<path d="M12 3v18M5 21h14M4 7h16M4 7l-2 6a3 3 0 0 0 4 0zM20 7l-2 6a3 3 0 0 0 4 0z"/>',
    anvil: '<path d="M3 8h13a5 5 0 0 0 5-3v6H16l-2 4h3v3H7v-3h3l-2-4H3z"/>',
  };
  const ic = (n, extra = '') => `<svg viewBox="0 0 24 24" ${extra}>${I[n] || ''}</svg>`;

  // ---------- Equipment ----------
  // Line drawings, one style (viewBox 120x70, stroke only).
  const EQ_ART = {
    bench: '<path d="M18 46h52l30-26"/><path d="M28 46v14M62 46v14M22 60h12M56 60h12"/><rect x="16" y="40" width="56" height="6" rx="3"/><path d="M70 42l30-26"/>',
    smith: '<path d="M22 8v56M98 8v56M14 64h20M86 64h20M18 8h84"/><path d="M8 30h104"/><circle cx="14" cy="30" r="6"/><circle cx="106" cy="30" r="6"/><path d="M22 18h6M22 42h6M92 18h6M92 42h6"/>',
    cable: '<path d="M30 6v58M90 6v58M30 10h60M60 10v20"/><path d="M44 30h32"/><path d="M60 56v-8M50 64h20"/><circle cx="60" cy="10" r="4"/>',
    pullup: '<path d="M10 16h100"/><path d="M18 16v-8h-8M102 16v-8h8"/><path d="M38 16v8M82 16v8"/><path d="M34 24h8M78 24h8"/>',
    powerblock: '<rect x="10" y="18" width="34" height="34" rx="4"/><rect x="76" y="18" width="34" height="34" rx="4"/><path d="M16 18v34M22 18v34M28 18v34M98 18v34M92 18v34M86 18v34M44 35h32"/>',
    dumbbell: '<rect x="14" y="20" width="10" height="30" rx="3"/><rect x="24" y="24" width="8" height="22" rx="2"/><rect x="96" y="20" width="10" height="30" rx="3"/><rect x="88" y="24" width="8" height="22" rx="2"/><path d="M32 35h56"/><path d="M8 35h6M106 35h6"/>',
    plates: '<circle cx="42" cy="36" r="26"/><circle cx="42" cy="36" r="6"/><circle cx="88" cy="40" r="18"/><circle cx="88" cy="40" r="4"/>',
    curlbar: '<path d="M6 36h18l8-6 8 12 8-12 8 12 8-12 8 12 8-6h18"/><rect x="10" y="22" width="8" height="28" rx="2"/><rect x="102" y="22" width="8" height="28" rx="2"/>',
    barbell: '<path d="M4 36h112"/><rect x="14" y="16" width="8" height="40" rx="2"/><rect x="22" y="22" width="6" height="28" rx="2"/><rect x="98" y="16" width="8" height="40" rx="2"/><rect x="92" y="22" width="6" height="28" rx="2"/><path d="M8 64h104" stroke-dasharray="4 5"/>',
    abmachine: '<path d="M14 58l92-36"/><path d="M14 58v6M106 22v42M100 64h12M8 64h12"/><rect x="44" y="36" width="22" height="10" rx="4" transform="rotate(-21 55 41)"/><path d="M96 26l8-14"/>',
    bag: '<path d="M60 4v10M50 14h20"/><path d="M48 14l-4 8M72 14l4 8"/><rect x="42" y="22" width="36" height="44" rx="10"/><path d="M42 34h36M42 54h36"/>',
    hack: '<path d="M16 62h88M24 62l52-48"/><path d="M76 14l12 8-44 40"/><rect x="56" y="40" width="26" height="10" rx="3" transform="rotate(-42 69 45)"/><path d="M92 62V30"/>',
    kettlebell: '<path d="M46 24c0-12 28-12 28 0"/><path d="M40 30h40l6 26a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8z"/>',
    bands: '<path d="M14 40c20-30 72-30 92 0"/><path d="M14 46c20-30 72-30 92 0"/><rect x="8" y="40" width="12" height="10" rx="3"/><rect x="100" y="40" width="12" height="10" rx="3"/>',
    dip: '<path d="M24 24h28M68 24h28M30 24v40M46 24v40M74 24v40M90 24v40M24 64h28M68 64h28"/>',
    wheel: '<circle cx="60" cy="36" r="20"/><circle cx="60" cy="36" r="6"/><path d="M16 36h88"/><rect x="10" y="31" width="14" height="10" rx="4"/><rect x="96" y="31" width="14" height="10" rx="4"/>',
    rack: '<path d="M24 6v58M96 6v58M16 64h16M88 64h16M24 6h72"/><path d="M24 20h7M24 32h7M89 20h7M89 32h7"/><path d="M6 26h108"/><rect x="10" y="18" width="6" height="16" rx="2"/><rect x="104" y="18" width="6" height="16" rx="2"/><path d="M30 50h60"/>',
    cabletower: '<path d="M20 4v60M100 4v60M14 64h12M94 64h12M20 4h80"/><rect x="24" y="34" width="10" height="24" rx="1"/><rect x="86" y="34" width="10" height="24" rx="1"/><path d="M29 34V12M91 34V12M29 12l20 26M91 12l-20 26"/><circle cx="49" cy="40" r="3"/><circle cx="71" cy="40" r="3"/>',
    legext: '<path d="M16 64h76M28 64V42M28 42h34l12-14"/><rect x="24" y="36" width="40" height="7" rx="3"/><path d="M74 28V12M68 12h14"/><path d="M62 43l14 15"/><circle cx="78" cy="60" r="4"/>',
    box: '<path d="M20 30h70l10-10H30z"/><path d="M20 30v34h70V30M90 64l10-10V20"/>',
    trx: '<path d="M60 4v8"/><path d="M60 12L40 56M60 12l20 44"/><rect x="34" y="56" width="12" height="6" rx="2"/><rect x="74" y="56" width="12" height="6" rx="2"/><circle cx="60" cy="12" r="3"/>',
    hyper: '<path d="M18 64l26-22M44 42l18 22M44 42h0"/><rect x="38" y="20" width="50" height="8" rx="3" transform="rotate(25 63 24)"/><path d="M84 40l12 24M84 50h14"/><rect x="88" y="44" width="16" height="6" rx="3"/>',
    trapbar: '<path d="M4 36h28M88 36h28"/><path d="M32 36l12-14h32l12 14-12 14H44z"/><path d="M54 22v28M66 22v28"/><rect x="10" y="18" width="7" height="36" rx="2"/><rect x="103" y="18" width="7" height="36" rx="2"/>',
    treadmill: '<path d="M10 60h84l10-6"/><path d="M10 60a4 4 0 0 1 0-8h86"/><path d="M96 52V18l12-4M90 18h18"/>',
    bike: '<path d="M22 64h76M34 64l12-38M40 26h-10M44 38h32l8 26M76 38l6-18h10"/><circle cx="60" cy="52" r="10"/>',
    rower: '<path d="M8 60h104M18 60V50h10v10M100 60V44"/><circle cx="100" cy="36" r="10"/><rect x="38" y="46" width="18" height="8" rx="2"/><path d="M90 36H68"/>',
    cardio: '<path d="M20 64h80M82 64V14l10-4M76 14h16"/><path d="M28 56l22-16 22 16"/><rect x="24" y="52" width="14" height="5" rx="2"/><rect x="62" y="52" width="14" height="5" rx="2"/>',
    jumprope: '<path d="M22 22v14M98 22v14"/><path d="M22 36c0 40 76 40 76 0"/><rect x="18" y="8" width="8" height="14" rx="3"/><rect x="94" y="8" width="8" height="14" rx="3"/>',
    roller: '<rect x="14" y="24" width="92" height="24" rx="12"/><path d="M30 24v24M46 24v24M62 24v24M78 24v24M94 24v24"/>',
    ball: '<circle cx="60" cy="34" r="28"/><path d="M34 24c18 8 34 8 52 0M34 46c18-8 34-8 52 0"/>',
    medball: '<circle cx="60" cy="36" r="26"/><path d="M34 36h52M60 10c-12 8-12 44 0 52M60 10c12 8 12 44 0 52"/>',
    ropes: '<path d="M14 32c10 0 10-14 22-14s12 28 24 28 12-28 24-28 12 14 22 14"/><path d="M14 42c10 0 10-14 22-14s12 28 24 28 12-28 24-28 12 14 22 14"/><rect x="4" y="30" width="10" height="14" rx="3"/>',
    sled: '<path d="M14 60h80l12-10M24 60V40h52v20M40 40V22h18v18"/><path d="M106 50l12-22"/>',
  };
  // gear = the key exercises use (several items can share one). cat groups the Gear screen.
  const EQUIPMENT = [
    ['bench', 'Adjustable bench', 'Flat, incline, decline', null, 'bench', 'own', 'Benches and racks'],
    ['smith', 'Smith machine', 'Rack lifts use this', 'smith', 'smith', 'own', 'Benches and racks'],
    ['smith-cable', 'Lat pull-down + low row', 'Smith attachments', 'smith-cable', 'cable', 'own', 'Machines'],
    ['pullup', 'Pull-up bar', '', 'pullup', 'pullup', 'own', 'Bodyweight'],
    ['powerblock', 'PowerBlock dumbbells', '2.5 lb steps', 'dumbbell', 'powerblock', 'own', 'Free weights'],
    ['spinlock', 'Spin-lock dumbbells', '', 'dumbbell', 'dumbbell', 'own', 'Free weights'],
    ['plates', '1-inch standard plates', '', 'plates', 'plates', 'own', 'Free weights'],
    ['curlbar', 'Curl bar', '', 'ez-curl-bar', 'curlbar', 'own', 'Free weights'],
    ['barbell', 'Barbell', 'No rack: floor lifts only', 'barbell', 'barbell', 'own', 'Free weights'],
    ['abmachine', 'Ab machine', 'Knee slider, incline', null, 'abmachine', 'own', 'Machines'],
    ['bag', 'Punching bag', 'May be removed', 'bag', 'bag', 'own', 'Conditioning'],
    ['hack', 'Hack squat / leg press', 'Black Friday?', 'hack-legpress', 'hack', 'wish', 'Machines'],
    ['rack', 'Power rack / squat stands', 'Barbell squat, bench, overhead', 'rack', 'rack', 'none', 'Benches and racks'],
    ['cabletower', 'Cable tower / functional trainer', 'High and low pulleys', 'cable-tower', 'cabletower', 'none', 'Machines'],
    ['legext', 'Leg extension / curl', 'Bench attachment or machine', 'legext', 'legext', 'none', 'Machines'],
    ['trapbar', 'Trap bar', 'Easier-on-the-back deadlifts', 'trapbar', 'trapbar', 'none', 'Free weights'],
    ['kettlebell', 'Kettlebell', '', 'kettlebell', 'kettlebell', 'none', 'Free weights'],
    ['dip', 'Dip station', '', 'dip', 'dip', 'none', 'Bodyweight'],
    ['trx', 'Suspension trainer (TRX)', 'Door or bar anchor', 'trx', 'trx', 'none', 'Bodyweight'],
    ['hyper', 'Back extension (hyper) bench', '', 'hyper', 'hyper', 'none', 'Benches and racks'],
    ['box', 'Plyo box', 'Step-ups, box jumps', 'box', 'box', 'none', 'Bodyweight'],
    ['bands', 'Resistance bands', '', 'bands', 'bands', 'none', 'Accessories'],
    ['wheel', 'Ab wheel', '', 'wheel', 'wheel', 'none', 'Accessories'],
    ['medball', 'Medicine ball', '', 'medball', 'medball', 'none', 'Accessories'],
    ['ball', 'Stability ball', '', 'ball', 'ball', 'none', 'Accessories'],
    ['roller', 'Foam roller', 'Recovery', 'foam-roller', 'roller', 'none', 'Accessories'],
    ['jumprope', 'Jump rope', '', 'jumprope', 'jumprope', 'none', 'Conditioning'],
    ['ropes', 'Battle ropes', '', 'ropes', 'ropes', 'none', 'Conditioning'],
    ['sled', 'Push sled', '', 'sled', 'sled', 'none', 'Conditioning'],
    ['treadmill', 'Treadmill', '', 'treadmill', 'treadmill', 'none', 'Cardio'],
    ['bike', 'Exercise bike', '', 'bike', 'bike', 'none', 'Cardio'],
    ['rower', 'Rowing machine', '', 'rower', 'rower', 'none', 'Cardio'],
    ['cardio', 'Elliptical / stair climber', '', 'cardio-machine', 'cardio', 'none', 'Cardio'],
  ].map(([id, name, note, gear, art, status, cat]) => ({ id, name, note, gear, art, status, cat }));
  const EQ_CATS = ['Free weights', 'Benches and racks', 'Machines', 'Bodyweight', 'Conditioning', 'Cardio', 'Accessories'];
  const eqArt = (e, cls = '') => S.eqPhotos[e.id] ? `<img src="${S.eqPhotos[e.id]}" alt="" class="${cls}">` : `<svg viewBox="0 0 120 70" class="eqsvg ${cls}">${EQ_ART[e.art]}</svg>`;

  // ---------- Foods (example pool) ----------
  const FOODS = [
    ['chicken', 'Chicken breast, cooked', 'USDA', 100, 'g', 165, 31, 0, 3.6],
    ['rice', 'White rice, cooked', 'USDA', 100, 'g', 130, 2.7, 28, 0.3],
    ['broccoli', 'Broccoli, raw', 'USDA', 100, 'g', 34, 2.8, 7, 0.4],
    ['sweetpotato', 'Sweet potato, baked', 'USDA', 100, 'g', 90, 2, 21, 0.2],
    ['beef', 'Ground beef 93/7, cooked', 'USDA', 100, 'g', 172, 25, 0, 7.6],
    ['salmon', 'Salmon, cooked', 'USDA', 100, 'g', 206, 22, 0, 12],
    ['egg', 'Egg, large', 'USDA', 1, 'egg', 72, 6.3, 0.4, 4.8],
    ['oats', 'Rolled oats, dry', 'USDA', 40, 'g', 150, 5, 27, 3],
    ['banana', 'Banana, medium', 'USDA', 1, 'banana', 105, 1.3, 27, 0.4],
    ['beans', 'Black beans, cooked', 'USDA', 100, 'g', 132, 8.9, 24, 0.5],
    ['avocado', 'Avocado', 'USDA', 100, 'g', 160, 2, 9, 15],
    ['oil', 'Olive oil', 'USDA', 1, 'tbsp', 119, 0, 0, 13.5],
    ['spinach', 'Spinach, raw', 'USDA', 100, 'g', 23, 2.9, 3.6, 0.4],
    ['almonds', 'Almonds', 'USDA', 28, 'g', 164, 6, 6, 14],
    ['apple', 'Apple, medium', 'USDA', 1, 'apple', 95, 0.5, 25, 0.3],
    ['pasta', 'Pasta, cooked', 'USDA', 100, 'g', 158, 5.8, 31, 0.9],
    ['shake', 'Protein shake (example)', 'OpenFoodFacts', 1, 'bottle', 170, 26, 8, 4.5, '0000000000017'],
    ['yogurt', 'Greek yogurt, nonfat (example)', 'OpenFoodFacts', 170, 'g', 90, 16, 6, 0, '0000000000024'],
    ['bar', 'Protein bar (example)', 'OpenFoodFacts', 1, 'bar', 200, 20, 22, 8, '0000000000031'],
    ['pb', 'Peanut butter (example)', 'OpenFoodFacts', 32, 'g', 190, 7, 8, 16, '0000000000048'],
    ['bread', 'Whole wheat bread (example)', 'OpenFoodFacts', 1, 'slice', 80, 4, 14, 1, '0000000000055'],
    ['tortilla', 'Flour tortilla (example)', 'OpenFoodFacts', 1, 'tortilla', 140, 4, 24, 3.5, '0000000000062'],
    ['tuna', 'Tuna, canned in water (example)', 'OpenFoodFacts', 1, 'can', 100, 22, 0, 1, '0000000000079'],
    ['milk', 'Whole milk', 'USDA', 1, 'cup', 150, 8, 12, 8],
    ['cheese', 'Cheddar cheese', 'USDA', 28, 'g', 115, 7, 0.4, 9.4],
    ['turkey', 'Turkey deli slices (example)', 'OpenFoodFacts', 56, 'g', 60, 11, 2, 1, '0000000000086'],
    ['potato', 'Potato, baked', 'USDA', 100, 'g', 93, 2.5, 21, 0.1],
    ['cottage', 'Cottage cheese 2%', 'USDA', 113, 'g', 92, 12, 5, 2.5],
  ].map(([id, name, src, serv, unit, cal, p, c, f, barcode]) => ({ id, name, src, serv, unit, cal, p, c, f, barcode }));

  // ---------- State ----------
  // REAL = running inside the installed app (not the review preview): start empty, no example data.
  const REAL = !!window.HFDev;
  const KEY = REAL ? 'hf-app-v1' : 'hf-preview-v2';
  const DEFAULT_DAYS = [[], ['Chest', 'Arms'], ['Back', 'Core'], ['Legs', 'Arms'], [], ['Chest', 'Shoulders'], ['Back', 'Legs']];
  const freshState = () => {
    const S = {
      v: 2, tab: 'home',
      modules: { food: true, workout: true },
      profile: { sex: 'male', age: 30, heightIn: 70, weightLb: 195, activity: 'moderate', level: 'beginner', setupDone: false },
      goal: { method: 'goal', preset: 'High protein', rate: -0.5, cal: 0, p: 0, c: 0, f: 0 },
      foods: FOODS.map(f => ({ ...f })),
      recent: [], favFoods: ['shake', 'r1', 'oats', 'yogurt'],
      recipes: [{ id: 'r1', name: 'Chicken Meal 1', containers: 4, ing: [{ foodId: 'chicken', qty: 800 }, { foodId: 'rice', qty: 600 }, { foodId: 'broccoli', qty: 400 }, { foodId: 'oil', qty: 2 }] },
        { id: 'r2', name: 'Beef chili', containers: 6, ing: [{ foodId: 'beef', qty: 900 }, { foodId: 'beans', qty: 800 }, { foodId: 'cheese', qty: 3 }] }],
      log: [], mealPlan: [], weights: [], sessions: [], soreness: {},
      equipment: Object.fromEntries(EQUIPMENT.map(e => [e.id, e.status])),
      eqPhotos: {}, wishLinks: { hack: '' },
      stars: ['Smith_Machine_Bench_Press', 'Romanian_Deadlift', 'Pullups', 'Goblet_Squat', 'Dumbbell_Bicep_Curl'],
      focus: ['chest'],
      targets: Object.fromEntries(L.MUSCLES.map(m => [m, { min: 10, max: 20 }])),
      schemes: JSON.parse(JSON.stringify(L.SCHEMES)),
      days: DEFAULT_DAYS.map(g => ({ groups: g, off: !g.length, time: '7:00 PM' })),
      morning: { on: true, time: '7:00 AM', off: [] },
      dailyMin: { Legs: 1 },
      planWeek: null, next: {}, myPrograms: [],
      mealOpen: { Breakfast: true, Lunch: true, Dinner: true, Snack: true },
      ai: { endpoint: '', key: '', model: '', vision: true },
      hc: { connected: true, read: { weight: true, hr: true, sleep: true, rhr: true }, write: { sessions: true }, conflict: 'merge' },
      dismissed: [],
      game: { items: [], equip: {} },
    };
    if (REAL) {
      Object.assign(S, { foods: FOODS.filter(f => !/\(example\)/.test(f.name)).map(f => ({ ...f })), favFoods: [], recipes: [], stars: [], focus: [], devPanel: false });
      S.hc = { connected: false, read: { weight: false, hr: false, sleep: false, rhr: false }, write: { sessions: false }, conflict: 'merge' };
      return S;
    }
    seedExamples(S);
    return S;
  };
  // Deterministic "random" so the example data looks the same on every load.
  const rnd = (i, k = 1) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  function seedExamples(S) {
    // Weigh-ins from the scale (via Health Connect): 4 months trending down about 0.6 lb/week.
    let w = 207;
    for (let i = 120; i >= 0; i--) {
      w -= 0.085 + (rnd(i) - 0.5) * 0.12;
      if (rnd(i, 2) > 0.18) S.weights.push({ date: dateAdd(today, -i), lb: r1(w + (rnd(i, 3) - 0.5) * 1.4), src: 'Health Connect' });
    }
    S.profile.weightLb = S.weights[S.weights.length - 1].lb;
    // Food: 5 weeks, mostly logged, today partly logged.
    const breakfasts = [[['oats', 1], ['shake', 1]], [['egg', 3], ['bread', 2]], [['yogurt', 1], ['banana', 1], ['almonds', 1]]];
    const dinners = [[['beef', 1.8], ['sweetpotato', 2], ['rice', 1.5]], [['salmon', 1.5], ['potato', 2], ['broccoli', 1]], [[null, 1.5, 'r2']], [['chicken', 2], ['pasta', 2], ['spinach', 1]]];
    for (let i = 90; i >= 0; i--) {
      const d = dateAdd(today, -i);
      if (i > 0 && rnd(i, 4) < (i > 40 ? 0.2 : 0.1)) continue; // a few unlogged days
      const rows = [];
      breakfasts[i % 3].forEach(([f, q]) => rows.push(['Breakfast', f, q]));
      rows.push(['Lunch', null, 1, 'r1']);
      rows.push(['Snack', 'bar', 1]);
      if (i > 0) { dinners[i % 4].forEach(([f, q, r]) => rows.push(['Dinner', f, q, r])); rows.push(['Snack', i % 2 ? 'yogurt' : 'cottage', 1], ['Snack', 'pb', 1]); }
      for (const [meal, foodId, qty, recipeId] of rows) S.log.push({ id: 'l' + i + '_' + S.log.length, date: d, meal, foodId: foodId || undefined, recipeId, qty });
    }
    S.recent = ['shake', 'r1', 'oats', 'bar', 'yogurt', 'beef', 'sweetpotato', 'rice', 'pb', 'egg', 'bread', 'salmon', 'potato', 'broccoli', 'cottage', 'chicken', 'pasta', 'spinach', 'banana', 'almonds', 'r2'];
    const thisWeek = dateAdd(today, -dow(today));
    for (let k = 0; k < 7; k++) {
      const d = dateAdd(thisWeek, k);
      if (d < today) continue;
      S.mealPlan.push({ id: 'p' + k + 'a', date: d, meal: 'Lunch', recipeId: 'r1', qty: 1 });
      if (k % 2) S.mealPlan.push({ id: 'p' + k + 'b', date: d, meal: 'Dinner', foodId: 'salmon', qty: 1.5 });
    }
    // Eight weeks of sessions: bench and RDL climbing, legs patchy at first.
    const plan = [[], ['Smith_Machine_Bench_Press', 'Dumbbell_Bicep_Curl', 'Triceps_Pushdown'], ['Pullups', 'One-Arm_Dumbbell_Row', 'Plank'], ['Goblet_Squat', 'Romanian_Deadlift', 'EZ-Bar_Curl'], [], ['Dumbbell_Bench_Press', 'Dumbbell_Shoulder_Press', 'Side_Lateral_Raise'], ['Wide-Grip_Lat_Pulldown', 'Romanian_Deadlift', 'Goblet_Squat']];
    const W = { Smith_Machine_Bench_Press: 75, Dumbbell_Bicep_Curl: 20, Triceps_Pushdown: 40, One_Arm: 35, Goblet_Squat: 30, Romanian_Deadlift: 75, 'EZ-Bar_Curl': 40, Dumbbell_Bench_Press: 40, Dumbbell_Shoulder_Press: 30, Side_Lateral_Raise: 12.5, 'Wide-Grip_Lat_Pulldown': 80, 'One-Arm_Dumbbell_Row': 35 };
    const GAIN = { Smith_Machine_Bench_Press: 2.5, Romanian_Deadlift: 5, Goblet_Squat: 2.5, 'Wide-Grip_Lat_Pulldown': 2.5, Dumbbell_Bench_Press: 2.5, Dumbbell_Bicep_Curl: 2.5, Dumbbell_Shoulder_Press: 2.5 };
    for (let i = 56; i >= 1; i--) {
      const d = dateAdd(today, -i), wd = dow(d);
      if (i % 2 === 0 || i < 9) S.sessions.push({ id: 'm' + i, date: d, morning: true, start: d + 'T07:00', min: 11, kcal: 38, sets: [{ ex: 'Pushups', w: 0, reps: 15 }, { ex: 'Bodyweight_Squat', w: 0, reps: 15 }, { ex: 'Plank', w: 0, reps: 1 }] });
      if (!plan[wd].length || (wd === 3 && i > 30 && i % 3)) continue; // skipped some early leg days
      const sets = [];
      for (const ex of plan[wd]) {
        const wt = ex === 'Pullups' || ex === 'Plank' ? 0 : (W[ex] || 30);
        const reps = ex === 'Smith_Machine_Bench_Press' ? 5 : ex === 'Plank' ? 1 : 10;
        for (let k = 0; k < 3; k++) sets.push({ ex, w: wt, reps: ex === 'Pullups' ? 6 - k + (i < 20 ? 1 : 0) : k === 2 && rnd(i, k) > 0.6 ? reps + 3 : reps, fail: k === 2 && rnd(i, k) > 0.6 });
        if (GAIN[ex] && W[ex] !== undefined && rnd(i, 7) > 0.35) W[ex] += GAIN[ex];
      }
      const hr = 116 + Math.round(rnd(i, 8) * 14);
      S.sessions.push({ id: 's' + i, date: d, start: d + 'T19:00', min: 44 + Math.round(rnd(i, 9) * 12), avgHr: hr, kcal: L.sessionCalories(S.profile, 48, hr), sets });
    }
    for (const [ex, w] of Object.entries(W)) if (S.sessions.some(s => s.sets.some(x => x.ex === ex))) S.next[ex] = { w, reps: ex === 'Smith_Machine_Bench_Press' ? 5 : 10, sets: 3 };
    S.soreness[dateAdd(today, -1)] = { Legs: 2, Chest: 1 };
    S.hcSamples = { rhrBase: 58, rhrToday: 66, sleepHrs: 6.4 };
    S.game = { items: [{ id: 'b-tunic', at: dateAdd(today, -40) }, { id: 'w-wood', at: dateAdd(today, -33) }, { id: 'h-cap', at: dateAdd(today, -20) }], equip: { body: 'b-tunic', weapon: 'w-wood', head: 'h-cap' } };
  }
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || S.v !== 2) S = freshState();
  S.game = S.game || { items: [], equip: {} };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // UI-only state (not saved)
  const U = {
    sub: { food: 'log', train: 'today', progress: 'overview' }, stack: [], sheet: null,
    meal: guessMeal(), foodDate: today, q: '', recentTab: 'recent', libQ: '', libGroup: 'All', libMine: true, libStar: false,
    toast: null, log: null, rest: null, reviewItems: null, strengthEx: 'Smith_Machine_Bench_Press', range: '1m', soreOpen: false, progOpen: {}, focusId: null,
  };
  function guessMeal() { const h = new Date().getHours(); return h < 10 ? 'Breakfast' : h < 14 ? 'Lunch' : h < 17 ? 'Snack' : 'Dinner'; }
  const topFull = () => U.stack[U.stack.length - 1] || null;
  const pushFull = f => { U.stack.push(f); render(); };
  const popFull = () => { U.stack.pop(); render(); };

  // ---------- Exercise data and art ----------
  let EX = [], EXB = {};
  const MEDIA = {}, ART = {}, EK = {};
  const loads = {};
  fetch('exercises.json').then(r => r.json()).then(list => {
    EX = list; EXB = Object.fromEntries(list.map(e => [e.id, e]));
    if (!S.planWeek) buildPlan();
    render();
    ['ek0', 'art0', 'art1'].forEach(loadPack);
    ['media0', 'media1', 'media2', 'media3', 'media4', 'media5'].reduce((p, n) => p.then(() => loadPack(n)), Promise.resolve());
  }).catch(() => render());
  function loadPack(name) {
    if (loads[name]) return loads[name];
    loads[name] = fetch(name + '.json').then(r => r.json()).then(p => { Object.assign(name.startsWith('ek') ? EK : name.startsWith('art') ? ART : MEDIA, p); refreshMedia(); }).catch(() => {});
    return loads[name];
  }
  const cleanSvg = s => s.replace(/\s(width|height)="\d+"/g, '');
  // Three picture lanes, never mixed in one animation:
  // draw = thin line drawings (everkinetic, else workout-guide's thin frames 1 and 3),
  // bold = workout-guide's bold frame, photo = free-exercise-db photos.
  const ART_MODES = [['draw', 'Drawing'], ['bold', 'Bold'], ['photo', 'Photo']];
  const framesFor = (id, k) => k === 'draw' ? (EK[id] || (ART[id] && [ART[id][0], ART[id][2]])) : k === 'bold' ? (ART[id] && [ART[id][1]]) : k === 'photo' ? MEDIA[id] : null;
  const artModes = id => ART_MODES.filter(([k]) => framesFor(id, k));
  function thumbHtml(id) {
    const d = framesFor(id, 'draw');
    if (d) return cleanSvg(d[0]);
    if (MEDIA[id]) return `<img src="data:image/webp;base64,${MEDIA[id][0]}" alt="">`;
    return '';
  }
  const exThumb = id => `<span class="thumb" data-thumb="${esc(id)}">${thumbHtml(id)}</span>`;
  function refreshMedia() {
    document.querySelectorAll('[data-thumb]').forEach(el => { if (!el.firstChild) el.innerHTML = thumbHtml(el.dataset.thumb); });
    document.querySelectorAll('[data-anim]').forEach(el => { if (!el.firstChild || el.dataset.kind !== animKind(el.dataset.anim)) drawAnim(el); });
    document.querySelectorAll('[data-artbar]').forEach(el => { el.outerHTML = artBar(el.dataset.artbar); });
  }
  const animKind = id => { const m = artModes(id).map(x => x[0]); return m.includes(U.artMode) ? U.artMode : m[0] || ''; };
  function drawAnim(el) {
    const id = el.dataset.anim, k = animKind(id);
    el.dataset.kind = k;
    const fr = framesFor(id, k);
    if (k === 'photo') el.innerHTML = fr.map((b, i) => `<img class="fr" style="opacity:${i ? 0 : 1}" src="data:image/webp;base64,${b}" alt="">`).join('');
    else if (k) el.innerHTML = fr.map((s, i) => `<div class="fr" style="opacity:${i ? 0 : 1}">${cleanSvg(s)}</div>`).join('');
    else el.innerHTML = '<div class="tiny muted" style="padding:20px;text-align:center">Loading pictures\u2026</div>';
  }
  // Tap the picture to cycle Drawing, Bold, Photo.
  const exAnim = id => `<div class="exmedia" data-anim="${esc(id)}" data-act="artNext" data-id="${esc(id)}" role="img" aria-label="${esc(EXB[id]?.n || '')} demonstration, tap for the next picture"></div>`;
  const planfit = id => `https://www.google.com/search?q=${encodeURIComponent('site:planfit.ai ' + (EXB[id]?.n || id))}`;
  const artBar = id => { const m = artModes(id), k = animKind(id); return `<div class="row artbar" data-artbar="${esc(id)}">${m.length > 1 ? `<div class="seg sm">${m.map(([v, t]) => `<button class="${k === v ? 'on' : ''}" data-act="artMode" data-v="${v}">${t}</button>`).join('')}</div>` : ''}<span class="grow"></span><span class="tiny muted">Find on</span><a class="linkbtn small" href="${darebee(id)}" target="_blank" rel="noopener">Darebee</a><a class="linkbtn small" href="${planfit(id)}" target="_blank" rel="noopener">Planfit</a></div>`; };
  let frameTick = 0;
  setInterval(() => {
    frameTick++;
    document.querySelectorAll('[data-anim]').forEach(el => { const fr = el.querySelectorAll('.fr'); if (!fr.length) return; const n = fr.length === 3 ? [0, 1, 2, 1][frameTick % 4] : frameTick % fr.length; fr.forEach((f, i) => { f.style.opacity = i === n ? 1 : 0; }); });
  }, 700);
  const darebee = id => `https://www.google.com/search?q=${encodeURIComponent('site:darebee.com ' + (EXB[id]?.n || id))}`;

  // ---------- Helpers ----------
  const foodsById = () => Object.fromEntries(S.foods.map(f => [f.id, f]));
  const recipesById = () => Object.fromEntries(S.recipes.map(r => [r.id, r]));
  const itemById = id => recipesById()[id] || foodsById()[id];
  const ownedGear = () => new Set(['bodyweight', ...EQUIPMENT.filter(e => S.equipment[e.id] === 'own' && e.gear).map(e => e.gear)]);
  // Gear where you lift your own body (no weight to pick).
  const BW_GEAR = new Set(['bodyweight', 'pullup', 'dip', 'trx', 'box', 'ball', 'wheel', 'jumprope', 'foam-roller', 'hyper']);
  const isBW = id => BW_GEAR.has(EXB[id]?.g);
  const stepFor = id => isBW(id) ? 0 : STEP;
  const goalNow = () => {
    if (S.goal.method === 'manual') return { cal: S.goal.cal, p: S.goal.p, c: S.goal.c, f: S.goal.f };
    const cal = S.goal.method === 'tdee' ? L.tdee(S.profile) : L.goalCalories(S.profile, S.goal.rate);
    return L.macrosFor(cal, S.goal.preset);
  };
  const dayEntries = d => S.log.filter(e => e.date === d);
  const totalsFor = d => L.dayTotals(dayEntries(d), foodsById(), recipesById());
  const entryName = e => e.recipeId ? (recipesById()[e.recipeId]?.name || 'Recipe') : (foodsById()[e.foodId]?.name || 'Food');
  const fmtW = lb => r1(lb) + ' lb';
  const ftIn = n => `${Math.floor(n / 12)}' ${r0(n % 12)}"`;
  const exName = id => EXB[id]?.n || id.replace(/_/g, ' ');
  const lastWeight = id => { for (let i = S.sessions.length - 1; i >= 0; i--) { const s = S.sessions[i].sets.filter(x => x.ex === id && x.w > 0); if (s.length) return Math.max(...s.map(x => x.w)); } return null; };
  const schemeOf = it => S.schemes[it.scheme] || S.schemes.build;
  // "3 x 6-12 @ 100 lb" for quick reference in every plan list.
  const targetLine = it => {
    const sc = schemeOf(it), bw = isBW(it.ex);
    const w = S.next[it.ex]?.w ?? lastWeight(it.ex);
    return `${it.sets} \u00d7 ${sc.lo}-${sc.hi}${bw ? ' \u00b7 body weight' : w ? ' @ ' + fmtW(w) : ' \u00b7 pick a weight'}`;
  };
  const bullets = (items, opts = {}) => items.length ? `<ul class="blist">${items.map((it, k) => `<li${opts.act ? ` data-act="${opts.act}" data-id="${esc(it.ex)}" data-i="${opts.i ?? ''}" data-k2="${k}"` : ''}><span class="bn">${esc(exName(it.ex))}${S.stars.includes(it.ex) ? ' <span class="starmark">\u2605</span>' : ''}${it.daily ? ' <span class="badge">daily min</span>' : ''}</span><span class="bt num">${targetLine(it)}</span></li>`).join('')}</ul>` : '';

  function buildPlan() {
    if (!EX.length) return;
    S.planWeek = buildFor(S.days, S.dailyMin);
    save();
  }
  function buildFor(days, dailyMin, opts = {}) {
    const d = days.map(x => ({ groups: x.off ? [] : x.groups, off: x.off }));
    return L.buildWeek({ days: d, exById: EXB, ownedGear: opts.gear || ownedGear(), stars: new Set(S.stars), focus: new Set(opts.focus || S.focus), targets: S.targets, dailyMin: dailyMin || {}, perDayMax: opts.perDayMax || (S.profile.level === 'beginner' ? 5 : 6), maxSets: S.profile.level === 'beginner' ? 3 : 4 });
  }
  const weekStart = (d = today) => dateAdd(d, -dow(d));
  const sessionsBetween = (a, b) => S.sessions.filter(s => s.date >= a && s.date <= b);
  const sessionsThisWeek = () => sessionsBetween(weekStart(), today);

  // ---------- Design (the panel edits window.DESIGN and calls App.render) ----------
  const HOME_CARDS = { macros: 'Food today', streak: 'Streak, level and quests', workout: 'Today\'s workout', weight: 'Weight', trends: 'Trends (food, weight, training)', soreness: 'How do you feel?', coach: 'Coach' };
  window.DESIGN = window.DESIGN || { homeOrder: Object.keys(HOME_CARDS), homeHidden: [], navLabels: true, macroStyle: 'rings' };
  const D = () => window.DESIGN;

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
      <div class="statusbar"><span>${time}</span><span>5G \u25ae\u25ae\u25ae 82%</span></div>
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
      boss: { ...boss, dmg, hits, won: dmg >= boss.hp, ends: dateAdd(ws0, 6) }, bosses: bosses.filter(b => b.dmg > 0).reverse(), freezesLeft: freezes.length - used,
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
    const calCell = c => c === null ? '<span class="muted">\u2014</span>' : `<span style="color:${c > g.cal * 1.1 ? 'var(--a-alert)' : c < g.cal * 0.8 ? 'var(--a-warn)' : 'inherit'}">${r0(c)}</span>`;
    return `<table class="tt num small"><thead><tr><th></th><th>kcal</th><th>Protein</th><th>Weight</th><th>Sets</th></tr></thead><tbody>
      ${daily.map(r => `<tr data-act="openFoodDay" data-d="${r.d}"><td>${r.label}</td><td>${calCell(r.cal)}</td><td>${r.cal ? r0(r.p) + 'g' : '\u2014'}</td><td>${r.w ? r1(r.w) : '<span class="muted">\u2014</span>'}</td><td>${r.sets || '<span class="muted">0</span>'}</td></tr>`).join('')}
      <tr class="sep"><td colspan="5"></td></tr>
      ${weekly.map(r => `<tr><td>${r.label}</td><td>${calCell(r.cal)}</td><td>${r.cal ? r0(r.p) + 'g' : '\u2014'}</td><td>${r.wc === null ? '\u2014' : (r.wc > 0 ? '+' : '') + r1(r.wc)}</td><td>${r.sets}</td></tr>`).join('')}</tbody></table>
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
          <div class="tiny muted">Today's quests ${doneQ}/${G.daily.length} \u00b7 weekly ${doneW}/${G.quests.length} \u00b7 ${esc(G.boss.name)} ${G.boss.won ? 'defeated' : Math.max(0, G.boss.hp - G.boss.dmg) + ' HP left'}</div>
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
        return `<div class="card" data-k="card-weight"><h2>Weight<span class="sp"></span><span class="num">${last ? fmtW(last.lb) : '\u2014'}</span></h2>
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
      <div class="tiny muted">${w.time} \u00b7 ${w.items.length} exercises \u00b7 ${w.items.reduce((a, x) => a + x.sets, 0)} sets \u00b7 tap to ${open ? 'hide' : 'see'} them</div></div>
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

  // ----- Food -----
  SCREENS['food:log'] = () => {
    const d = U.foodDate, g = goalNow(), t = totalsFor(d);
    const entries = dayEntries(d);
    const res = U.q ? searchFoods(U.q) : null;
    const listIds = U.recentTab === 'fav' ? S.favFoods : S.recent.slice(0, 25);
    return `
      <div class="datenav" data-k="food-date"><button class="iconbtn" data-act="foodDay" data-v="-1" aria-label="Previous day">${ic('back')}</button><button class="dn" data-act="foodDayPick"><b>${d === today ? 'Today' : d === dateAdd(today, -1) ? 'Yesterday' : fmtDate(d)}</b><span class="tiny muted">${d === today ? fmtDate(d) : ''}</span></button><button class="iconbtn" data-act="foodDay" data-v="1" aria-label="Next day" ${d >= today ? 'disabled style="opacity:.3"' : ''}>${ic('fwd')}</button></div>
      <div class="card tight" data-k="day-total"><div class="row num small"><span class="grow"><b class="big2">${r0(t.cal)}</b> / ${r0(g.cal)} kcal</span><span style="color:var(--a-p)">P${r0(t.p)}</span><span style="color:var(--a-c)">C${r0(t.c)}</span><span style="color:var(--a-f)">F${r0(t.f)}</span></div>${macroBar('kcal', t.cal, g.cal, 'var(--a-accent)', '').replace('class="macro"', 'class="macro solo"')}</div>
      ${d === today && REAL ? `<div class="row" data-k="scanner"><button class="btn grow" data-act="scanReal">${ic('scan')}Scan barcode</button><button class="btn soft" data-act="photoAI">${ic('camera')}Plate photo</button></div>` : ''}
      ${d === today && !REAL ? `<div class="viewfinder" data-k="scanner"><div class="frame"><div class="laser"></div></div>
        <div style="position:absolute;top:10px;left:12px;font-size:12px;opacity:.85">Point at a barcode</div>
        <div class="vf-actions"><button class="btn sm" data-act="simScan">${ic('scan')}Simulate scan</button><button class="btn sm" data-act="photoAI" aria-label="Photo of plate">${ic('camera')}Plate photo</button></div></div>` : ''}
      <div class="chips" data-k="meal-chips">${MEALS.map(m => `<button class="chip ${U.meal === m ? 'on' : ''}" data-act="meal" data-v="${m}">${m}</button>`).join('')}</div>
      <div class="row" data-k="food-search"><input class="f" id="foodq" placeholder="Search foods, recipes, barcodes" value="${esc(U.q)}" data-in="foodq" autocomplete="off"><button class="btn sm ghost" data-act="newFood">${ic('plus')}Custom</button></div>
      ${res ? `<div class="card" data-k="search-results">${res.length ? groupResults(res) : `<div class="muted small">No match in your foods. Online search (Open Food Facts) runs here in the real app.</div>`}</div>` : `
      <div class="card" data-k="recent-foods"><div class="seg" role="tablist"><button class="${U.recentTab === 'recent' ? 'on' : ''}" data-act="recentTab" data-v="recent">Recent</button><button class="${U.recentTab === 'fav' ? 'on' : ''}" data-act="recentTab" data-v="fav">${ic('star', 'class="inl"')}Favorites</button></div>
        <div class="list scroll5">${listIds.map(itemById).filter(Boolean).map(x => foodRow(x)).join('') || '<div class="muted small" style="padding:10px 0">Tap the star on any food to add it here.</div>'}</div>
        <div class="tiny muted">${U.recentTab === 'fav' ? listIds.length + ' favorites' : 'Last ' + Math.min(25, listIds.length) + ' foods'} \u00b7 scroll for more \u00b7 logs to ${U.meal}</div></div>`}
      ${MEALS.map(m => {
        const es = entries.filter(e => e.meal === m), open = S.mealOpen[m] !== false;
        const mt = L.dayTotals(es, foodsById(), recipesById());
        return `<div class="card meal" data-k="meal-${m.toLowerCase()}" data-drop="${m}"><h2 class="tap" data-act="mealToggle" data-v="${m}">${m}<span class="sp"></span><span class="small muted num">${es.length ? r0(mt.cal) + ' kcal' : ''}</span>${chev(open)}</h2>
          ${open ? `${es.map(e => { const mm = L.entryMacros(e, foodsById(), recipesById()); return `<div class="li tight" data-act="editEntry" data-id="${e.id}"><span class="grip" data-drag="${e.id}" data-act="noop" aria-label="Drag to another meal">${ic('grip')}</span><div class="grow"><div class="small">${esc(entryName(e))} <span class="muted">\u00d7${r1(e.qty)}</span></div><div class="tiny muted num">P${r0(mm.p)} C${r0(mm.c)} F${r0(mm.f)}</div></div><span class="num small">${r0(mm.cal)}</span><span class="muted">${ic('edit', 'class="inl"')}</span></div>`; }).join('') || '<div class="muted small">Nothing yet.</div>'}
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
    return `<div class="li" data-act="${act}" data-id="${x.id}" data-r="${isR ? 1 : ''}"><div class="grow"><div class="small">${esc(x.name)}</div><div class="tiny muted">${isR ? '1 container' : `${x.serv} ${esc(x.unit)}`} \u00b7 P${r0(m.p)} C${r0(m.c)} F${r0(m.f)}</div></div><span class="num small">${r0(m.cal)}</span><button class="iconbtn sm star ${fav ? 'on' : ''}" data-act="favFood" data-id="${x.id}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${ic('star')}</button></div>`;
  }
  SCREENS['food:recipes'] = () => `
    <div class="card" data-k="recipes-help"><div class="small muted">Put everything in the pot, say how many containers it fills, and log one container at a time.</div><button class="btn" data-act="newRecipe">${ic('plus')}New recipe</button></div>
    ${S.recipes.map(r => { const pc = L.recipePerContainer(r, foodsById()); return `<div class="card" data-k="recipe-card"><h2>${esc(r.name)}<span class="sp"></span><span class="badge">${r.containers} containers${r.cooked ? ' \u00b7 ' + r0(r.cooked / r.containers) + ' g each' : ''}</span></h2>
      <div class="small muted">${r.ing.map(i => esc(foodsById()[i.foodId]?.name || '?')).join(', ')}</div>
      <div class="row small num"><span class="grow">Per container</span><b>${r0(pc.cal)} kcal</b><span>P${r0(pc.p)} C${r0(pc.c)} F${r0(pc.f)}</span></div>
      <div class="row small"><span class="grow muted">Containers</span><button class="iconbtn sm" data-act="rcontQuick" data-id="${r.id}" data-v="-1" aria-label="Fewer containers">\u2212</button><b class="num">${r.containers}</b><button class="iconbtn sm" data-act="rcontQuick" data-id="${r.id}" data-v="1" aria-label="More containers">+</button></div>
      <div class="row"><button class="btn sm" data-act="pickFood" data-id="${r.id}" data-r="1">Log a container</button><button class="btn sm ghost" data-act="editRecipe" data-id="${r.id}">Edit</button></div></div>`; }).join('')}`;
  SCREENS['food:mealplan'] = () => {
    const start = dateAdd(weekStart(), 7 * (U.mpWeek || 0));
    const days = [...Array(7)].map((_, i) => dateAdd(start, i));
    if (!U.mpDay || U.mpDay < start || U.mpDay > days[6]) U.mpDay = days.includes(today) ? today : start;
    const planned = S.mealPlan.filter(p => p.date === U.mpDay), logged = dayEntries(U.mpDay);
    const pT = L.dayTotals(planned, foodsById(), recipesById()), aT = L.dayTotals(logged, foodsById(), recipesById()), g = goalNow();
    return `<div class="row" data-k="mp-weeknav"><button class="iconbtn" data-act="mpWeek" data-v="-1" aria-label="Previous week">${ic('back')}</button><b class="grow" style="text-align:center">${U.mpWeek ? (U.mpWeek > 0 ? 'Week of ' : 'Week of ') + shortDate(start) : 'This week'}</b><button class="iconbtn" data-act="mpWeek" data-v="1" aria-label="Next week">${ic('fwd')}</button></div>
      <div class="week" data-k="mealplan-week">${days.map(d => { const pc = L.dayTotals(S.mealPlan.filter(p => p.date === d), foodsById(), recipesById()).cal; return `<div class="d ${d === U.mpDay ? 'on' : ''}" data-act="mpDay" data-d="${d}">${DAYS[dow(d)]}<br><b>${+d.slice(8)}</b><br><span class="tiny num ${pc ? '' : 'muted'}">${pc ? r0(pc) : '\u2014'}</span></div>`; }).join('')}</div>
      <div class="row"><button class="btn sm" data-act="planAdd">${ic('plus')}Add food</button><button class="btn sm soft" data-act="planWeekSheet">${ic('copy')}Plan week</button></div>
      <div class="card" data-k="planned-vs-actual"><h2>${fmtDate(U.mpDay)}</h2>
        <div class="grid2 small num"><div><div class="muted tiny">Planned</div><b>${r0(pT.cal)}</b> / ${r0(g.cal)} kcal<br>P${r0(pT.p)} C${r0(pT.c)} F${r0(pT.f)}</div><div><div class="muted tiny">Eaten</div><b>${r0(aT.cal)}</b> kcal<br>P${r0(aT.p)} C${r0(aT.c)} F${r0(aT.f)}</div></div></div>
      ${MEALS.map(m => { const ps = planned.filter(p => p.meal === m); return `<div class="card tight" data-k="plan-${m.toLowerCase()}"><h2>${m}<span class="sp"></span><button class="btn sm ghost" data-act="planAdd" data-v="${m}">${ic('plus')}Add</button></h2>
        ${ps.map(p => { const done = logged.some(l => (l.recipeId || l.foodId) === (p.recipeId || p.foodId)); const mm = L.entryMacros(p, foodsById(), recipesById()); return `<div class="li tight"><div class="grow" data-act="editPlan" data-id="${p.id}"><div class="small">${esc(entryName(p))} <span class="muted">\u00d7${r1(p.qty)}</span></div><div class="tiny muted num">${r0(mm.cal)} kcal \u00b7 P${r0(mm.p)}</div></div>${done ? '<span class="badge good">Eaten</span>' : U.mpDay <= today ? `<button class="btn sm ghost" data-act="logPlanned" data-id="${p.id}">Log it</button>` : ''}<button class="iconbtn sm" data-act="unplan" data-id="${p.id}" aria-label="Remove">${ic('close')}</button></div>`; }).join('') || '<div class="tiny muted">Nothing planned.</div>'}</div>`; }).join('')}`;
  };
  SCREENS['food:goals'] = () => {
    const p = S.profile, g = goalNow(), tdee = L.tdee(p);
    const m = S.goal.method;
    return `<div class="card" data-k="goal-method"><h2>How to set your target</h2>
        <div class="chips">${[['manual', 'Type it in'], ['tdee', 'Maintenance (TDEE)'], ['goal', 'Goal-based'], ['ai', 'Ask AI']].map(([k, l]) => `<button class="chip ${m === k ? 'on' : ''}" data-act="goalMethod" data-v="${k}">${l}</button>`).join('')}</div>
        ${m === 'manual' ? `<div class="grid2">${['cal', 'p', 'c', 'f'].map(k => `<label class="fl">${{ cal: 'Calories', p: 'Protein g', c: 'Carbs g', f: 'Fat g' }[k]}<input class="f num" type="number" value="${S.goal[k] || g[k]}" data-in="goal" data-k2="${k}"></label>`).join('')}</div>` : ''}
        ${m === 'tdee' ? `<div class="small">Resting burn <b class="num">${r0(L.bmr(p))}</b> \u00d7 activity ${L.ACTIVITY[p.activity]} = <b class="num">${r0(tdee)}</b> kcal to stay the same.</div>` : ''}
        ${m === 'goal' ? `<div class="chips">${[['Lose fat', -0.75], ['Maintain', 0], ['Lean bulk', 0.35]].map(([l, v]) => `<button class="chip ${Math.sign(S.goal.rate) === Math.sign(v) ? 'on' : ''}" data-act="goalRate" data-v="${v}">${l}</button>`).join('')}</div>
          <label class="fl">Rate: <b class="num">${S.goal.rate > 0 ? '+' : ''}${S.goal.rate}% body weight / week</b> (${r1(Math.abs(p.weightLb * S.goal.rate / 100))} lb)<input type="range" min="-1.25" max="0.75" step="0.05" value="${S.goal.rate}" data-in="rate"></label>
          <div class="tiny muted">Suggested: lose 0.5-1%, lean bulk 0.25-0.5%. You can go outside these; the coach will flag it.</div>
          <div class="small">TDEE ${r0(tdee)} ${S.goal.rate < 0 ? '\u2212' : '+'} ${r0(Math.abs(p.weightLb * S.goal.rate / 100 * 500))} = <b class="num">${r0(g.cal)}</b> kcal</div>` : ''}
        ${m === 'ai' ? `<div class="small muted">Sends your stats, goal and the last 4 weeks of weight and intake to your AI. ${aiReady() ? '' : 'No AI set up, so it uses the copy-and-paste bridge.'}</div><button class="btn" data-act="bridge" data-v="goal">${ic(aiReady() ? 'spark' : 'copy')}${aiReady() ? 'Ask AI' : 'Copy prompt for Lumo / Claude'}</button>` : ''}
      </div>
      <div class="card" data-k="presets"><h2>Diet preset</h2><div class="chips">${Object.keys(L.PRESETS).map(k => `<button class="chip ${S.goal.preset === k ? 'on' : ''}" data-act="preset" data-v="${k}">${k}</button>`).join('')}</div>
        <div class="tiny muted">${S.goal.preset === 'Keto' ? 'Keto caps carbs at 30 g.' : 'Splits calories into protein, carbs and fat. Every number stays editable.'}</div>
        ${macroBar('Protein', g.p, g.p, 'var(--a-p)')}${macroBar('Carbs', g.c, g.c, 'var(--a-c)')}${macroBar('Fat', g.f, g.f, 'var(--a-f)')}
        <div class="small muted">Protein ${r1(g.p / p.weightLb)} g per lb of body weight.</div></div>`;
  };

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
      <div class="card" data-k="balance-bars"><div class="row tiny muted"><span class="grow">Sets per week \u00b7 helper muscle = \u00bd set</span><span><span class="dot" style="background:var(--a-accent)"></span> done</span><span><span class="dot" style="background:color-mix(in srgb,var(--a-accent) 35%,transparent)"></span> planned</span></div>
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
    ${S.myPrograms.length ? `<div class="tiny muted">My plans</div>${S.myPrograms.map((p, i) => { const open = U.progOpen['m' + i]; return `<div class="card" data-k="my-program"><h2 class="tap" data-act="progOpen" data-v="m${i}">${esc(p.name)}<span class="sp"></span><span class="badge">${p.days.filter(d => !d.off).length} days</span>${chev(open)}</h2>${open ? weekBullets(p.week, p.days) : `<div class="tiny muted">${p.days.map((d, k) => d.off ? '' : DAYS[k] + ' ' + d.groups.join('+')).filter(Boolean).join(' \u00b7 ')}</div>`}<div class="row"><button class="btn sm soft" data-act="useMine" data-i="${i}">Use this plan</button><button class="btn sm ghost" data-act="editMine" data-i="${i}">Edit</button><button class="btn sm ghost" data-act="delMine" data-i="${i}">Delete</button></div></div>`; }).join('')}` : ''}
    <div class="tiny muted">Ready-made programs (built from the gear you own)</div>
    ${PROGRAMS.map((p, i) => { const open = U.progOpen[i]; return `<div class="card" data-k="program"><h2 class="tap" data-act="progOpen" data-v="${i}">${esc(p[0])}<span class="sp"></span><span class="badge">${p[3]}</span>${chev(open)}</h2><div class="small muted">${esc(p[1])}</div>
      ${open ? (EX.length ? weekBullets(programWeek(i), splitDays(p[2])) : '') : ''}
      <div class="row"><button class="btn sm soft" data-act="adopt" data-i="${i}">Use this program</button>${open ? '' : `<button class="btn sm ghost" data-act="progOpen" data-v="${i}">Show the week</button>`}</div></div>`; }).join('')}`;

  // ----- Exercises -----
  SCREENS['train:library'] = () => {
    const own = ownedGear(), list0 = exerciseList({ q: U.libQ, group: U.libGroup, mine: U.libMine, star: U.libStar });
    const shown = list0.slice(0, 60);
    return `<div class="row" data-k="lib-search"><input class="f" placeholder="Search ${EX.length} exercises" value="${esc(U.libQ)}" data-in="libq" id="libq"></div>
      <div class="chips" data-k="lib-filters"><button class="chip ${U.libMine ? 'on' : ''}" data-act="libMine">My gear</button><button class="chip ${U.libStar ? 'on' : ''}" data-act="libStar">\u2605 Starred</button>${['All', ...GROUPS, 'Stretch'].map(g => `<button class="chip ${U.libGroup === g ? 'on' : ''}" data-act="libGroup" data-v="${g}">${g}</button>`).join('')}</div>
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
  const exRow = (e, act, own, extra = '') => { const avail = L.available(e, own); return `<div class="li" data-act="${act}" data-id="${e.id}" ${extra} style="${avail ? '' : 'opacity:.55'}">${exThumb(e.id)}<div class="grow"><div class="small">${esc(e.n)}</div><div class="tiny muted">${e.pm.map(L.cap).join(', ')} \u00b7 ${e.lv}${avail ? '' : ' \u00b7 needs ' + esc(gearName(e.g))}</div></div><button class="iconbtn sm star ${S.stars.includes(e.id) ? 'on' : ''}" data-act="star" data-id="${e.id}" aria-label="Star">${ic('star')}</button></div>`; };
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
    const card = e => { const st = S.equipment[e.id]; const n = e.gear && !own.has(e.gear) ? EX.filter(x => x.g === e.gear).length : 0; return `<div class="eq ${st === 'own' ? 'own' : ''}" data-act="eqTap" data-id="${e.id}" data-k="eq-${e.id}">${eqArt(e)}<div class="small" style="font-weight:600">${esc(e.name)}</div><div class="tiny muted">${esc(e.note || '')}</div>${st === 'own' ? `<span class="badge good">Owned</span>` : n ? `<span class="badge ${st === 'wish' ? 'info' : ''}">${st === 'wish' ? 'Wishlist \u00b7 ' : ''}+${n} exercises</span>` : `<span class="badge">${st === 'wish' ? 'Wishlist' : 'Not owned'}</span>`}</div>`; };
    return `<div class="card" data-k="unlock-rank"><h2>${ic('trophy', 'class="inl"')} If I buy this\u2026</h2><div class="tiny muted">Ranked by how many new exercises each piece opens up with what you already own. Tap one to see the list.</div>
        <ol class="rank">${rank.slice(0, 8).map(x => `<li data-act="unlocks" data-id="${x.e.id}"><span class="rsvg">${eqArt(x.e)}</span><span class="grow"><b class="small">${esc(x.e.name)}</b><span class="tiny muted">${x.str} strength moves${x.legs ? ` \u00b7 ${x.legs} for legs` : ''}${S.equipment[x.e.id] === 'wish' ? ' \u00b7 on your wishlist' : ''}</span></span><b class="num">+${x.n}</b></li>`).join('')}</ol></div>
      <div class="card" data-k="eq-ai"><div class="small muted">Got new gear? Snap it or paste a shopping link.</div><div class="row"><button class="btn sm soft" data-act="bridge" data-v="eqphoto">${ic('camera')}From photo</button><button class="btn sm ghost" data-act="bridge" data-v="eqlink">From link</button></div></div>
      <h3 class="sect">Owned \u00b7 ${EX.filter(e => L.available(e, own)).length} exercises available</h3><div class="eqgrid">${EQUIPMENT.filter(e => S.equipment[e.id] === 'own').map(card).join('')}</div>
      <h3 class="sect">Wishlist</h3><div class="eqgrid">${EQUIPMENT.filter(e => S.equipment[e.id] === 'wish').map(card).join('') || '<div class="muted small">Empty</div>'}</div>
      ${EQ_CATS.map(c => { const items = EQUIPMENT.filter(e => S.equipment[e.id] === 'none' && e.cat === c); return items.length ? `<h3 class="sect">${c}</h3><div class="eqgrid">${items.map(card).join('')}</div>` : ''; }).join('')}`;
  };

  // ----- History -----
  SCREENS['train:history'] = () => {
    const ss = [...S.sessions].sort((a, b) => b.date.localeCompare(a.date) || (b.morning ? -1 : 1)).slice(0, 30);
    return `<div class="card tight" data-k="history-list">${ss.map(s => { const exs = [...new Set(s.sets.map(x => x.ex))]; return `<div class="li" data-act="openSession" data-id="${s.id}"><div class="grow"><div class="small"><b>${s.morning ? 'Morning movement' : exs.map(exName).slice(0, 2).join(', ') + (exs.length > 2 ? ' +' + (exs.length - 2) : '')}</b></div><div class="tiny muted">${fmtDate(s.date)} \u00b7 ${s.sets.length} sets \u00b7 ${s.min} min \u00b7 ${s.kcal} kcal${s.avgHr ? ' \u00b7 HR ' + s.avgHr : ''}</div></div>${ic('fwd', 'class="inl muted"')}</div>`; }).join('')}</div>`;
  };

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
    if (n <= 31) nutri = foodDays.slice().reverse().map(x => `<div class="row small tap" data-act="openFoodDay" data-d="${x.d}"><span style="width:78px" class="muted">${DAYS[dow(x.d)]} ${shortDate(x.d)}</span><div class="bar grow"><i style="width:${Math.min(100, x.t.cal / g.cal * 100)}%;background:${x.t.cal > g.cal * 1.05 ? 'var(--a-alert)' : 'var(--a-accent)'}"></i></div><span class="num" style="width:44px;text-align:right">${x.t.cal ? r0(x.t.cal) : '\u2014'}</span>${ic('fwd', 'class="inl muted"')}</div>`).join('');
    else { const weeks = []; for (let k = 0; k * 7 < n; k++) { const a = dateAdd(today, -7 * (k + 1) + 1); const ds = [...Array(7)].map((_, i) => dateAdd(a, i)).map(totalsFor).filter(t => t.cal > 0); weeks.push({ a, cal: ds.length ? ds.reduce((s, t) => s + t.cal, 0) / ds.length : 0 }); }
      nutri = weeks.map(w => `<div class="row small tap" data-act="openFoodDay" data-d="${w.a}"><span style="width:78px" class="muted">Wk ${shortDate(w.a)}</span><div class="bar grow"><i style="width:${Math.min(100, w.cal / g.cal * 100)}%;background:var(--a-accent)"></i></div><span class="num" style="width:44px;text-align:right">${w.cal ? r0(w.cal) : '\u2014'}</span></div>`).join(''); }
    const wkN = Math.min(26, Math.ceil(n / 7));
    const vol = [...Array(wkN)].map((_, k) => { const a = dateAdd(today, -7 * (k + 1) + 1), b = dateAdd(today, -7 * k); const s2 = sessionsBetween(a, b); return { a, vol: s2.reduce((t, s) => t + s.sets.reduce((u, x) => u + (x.w || 0) * x.reps, 0), 0), sets: s2.reduce((t, s) => t + s.sets.length, 0) }; }).reverse();
    const vmax = Math.max(1, ...vol.map(v => v.vol));
    // One row per week: a dot per day (filled = workout, ring = morning only), then sets and pounds.
    const wkRows = vol.slice(-8).reverse().map(w => { const ds = [...Array(7)].map((_, i) => dateAdd(w.a, i)); return { ...w, dots: ds.map(d => { const ss = S.sessions.filter(s => s.date === d); return d > today ? 'f' : ss.some(s => !s.morning) ? 'w' : ss.length ? 'm' : 'n'; }), n: ds.filter(d => S.sessions.some(s => s.date === d && !s.morning)).length }; });
    return `<div class="row" data-k="range"><label class="small muted" for="rangeSel">Show</label><select class="f" id="rangeSel" data-in="range" style="width:auto">${RANGES.map(([k, l]) => `<option value="${k}" ${U.range === k ? 'selected' : ''}>Last ${l}</option>`).join('')}</select></div>
      <div class="card tight" data-k="ov-stats"><div class="grid4 stats"><div><b class="num">${wChange === null ? '\u2014' : (wChange > 0 ? '+' : '') + r1(wChange)}</b><span class="tiny muted">lb</span></div><div><b class="num">${avgCal ? r0(avgCal) : '\u2014'}</b><span class="tiny muted">avg kcal</span></div><div><b class="num">${workouts}</b><span class="tiny muted">workouts</span></div><div><b class="num">${ss.reduce((a, s) => a + s.sets.length, 0)}</b><span class="tiny muted">sets</span></div></div></div>
      <div class="card" data-k="ov-body"><h2>Body<span class="sp"></span><span class="tiny muted">dots = weigh-ins, line = 7-day avg</span></h2>${lineChart(pts.map(p => ({ x: p.date, y: p.lb })), avg.map(p => ({ x: p.date, y: p.v })))}
        <div class="grid2 small num"><div><div class="tiny muted">Actual</div>${rate === null ? '\u2014' : (rate > 0 ? '+' : '') + rate.toFixed(2) + ' lb/wk'}</div><div><div class="tiny muted">Target</div>${(target > 0 ? '+' : '') + target.toFixed(2)} lb/wk</div></div></div>
      ${S.modules.food ? `<div class="card" data-k="ov-nutrition"><h2>Nutrition<span class="sp"></span><span class="tiny muted">tap a day to open its log</span></h2><div class="small num">Average ${r0(avgCal)} kcal \u00b7 ${r0(avgP)} g protein \u00b7 ${logged.length} of ${n} days logged</div><div class="scroll-in">${nutri}</div></div>` : ''}
      ${S.modules.workout ? `<div class="card" data-k="ov-training"><h2>Training<span class="sp"></span><span class="tiny muted">last ${wkRows.length} weeks</span></h2>
        <div class="wkhead tiny muted"><span>Week of</span><span class="wkdots">${DAYS.map(x => `<i>${x[0]}</i>`).join('')}</span><span>Sets</span><span>Lifted</span></div>
        ${wkRows.map(w => `<div class="wkrow small"><span class="muted">${shortDate(w.a)}</span><span class="wkdots">${w.dots.map(t => `<i class="dt ${t}"></i>`).join('')}</span><b class="num">${w.sets}</b><span class="vcell"><span class="bar"><i style="width:${w.vol / vmax * 100}%;background:var(--a-accent)"></i></span><span class="num tiny">${(w.vol / 1000).toFixed(1)}k</span></span></div>`).join('')}
        <div class="tiny muted">Filled dot = workout, ring = morning movement only. Lifted = pounds moved (weight \u00d7 reps).</div></div>` : ''}
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
      <div class="small muted">Estimated 1-rep max \u00b7 ${(best / bw).toFixed(2)}\u00d7 body weight \u00b7 Epley formula, best set each session</div><button class="btn sm ghost" data-act="openEx" data-id="${id}" style="align-self:flex-start">${ic('history')}Full history</button></div>
      <h3 class="sect">${ic('trophy', 'class="inl"')} Highlights</h3>
      <div class="card" data-k="hl-jump"><h2>Biggest jump<span class="sp"></span><span class="tiny muted">1RM gained since first logged</span></h2>${jumps.map(j => `<div class="row small tap" data-act="strengthEx" data-v="${j.l}"><span style="width:110px" class="ell">${esc(exName(j.l))}</span><div class="bar grow"><i style="width:${j.gain / jmax * 100}%;background:var(--a-good)"></i></div><span class="num" style="width:52px;text-align:right">+${r1(j.gain)}</span></div>`).join('') || '<div class="small muted">Not enough history yet.</div>'}</div>
      ${prog ? `<div class="card" data-k="hl-progression"><h2>Best progression<span class="sp"></span><span class="badge good">+${r0(prog.pct)}%</span></h2><div class="small">${esc(exName(prog.l))}: ${fmtW(prog.s[0].y)} \u2192 ${fmtW(prog.s[prog.s.length - 1].y)} over ${prog.n} sessions</div>${lineChart(prog.s, prog.s, 110)}</div>` : ''}
      ${bestS ? `<div class="card" data-k="hl-workout" data-act="openSession" data-id="${bestS.s.id}"><h2>Best workout<span class="sp"></span><span class="num">${r0(bestS.vol).toLocaleString()} lb</span></h2><div class="small muted">${fmtDate(bestS.s.date)} \u00b7 ${bestS.s.sets.length} sets \u00b7 ${bestS.s.min} min</div><div class="tiny">${[...new Set(bestS.s.sets.map(x => x.ex))].map(exName).join(' \u00b7 ')}</div></div>` : ''}
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
    const head = `<div class="card" data-k="level"><div class="row">${heroSvg(S.game.equip, 'sm')}<div class="grow"><div class="row"><b class="head big2 grow">${G.title}</b>${goldTag(G.gold)}</div><div class="tiny muted">Level ${G.lv} \u00b7 ${G.xp.toLocaleString()} XP total${nextT ? ` \u00b7 "${nextT[1]}" at level ${nextT[0]}` : ''}</div>${xpBar(G.into, G.need)}<div class="tiny muted num">${(G.need - G.into).toLocaleString()} XP to level ${G.lv + 1}</div></div></div></div>
      <div class="seg" data-k="adv-tabs">${ADV_TABS.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="advTab" data-v="${k}">${l}</button>`).join('')}</div>`;
    const B = G.boss, left = Math.max(0, B.hp - B.dmg), daysLeft = Math.round((new Date(B.ends) - new Date(today)) / 864e5);
    const todayHit = B.hits.find(h => h.d === today)?.dmg || 0;
    if (tab === 'hero') return head + `
      <div class="card" data-k="boss"><h2>Weekly boss<span class="sp"></span><span class="tiny muted">${B.won ? 'Defeated!' : daysLeft ? daysLeft + ' days left' : 'last day'}</span></h2>
        <div class="arena ${U.fight ? 'fight' : ''}" data-act="fight">${heroSvg(S.game.equip, 'atk')}<div class="vs">${todayHit ? `<b class="dmgpop num">-${todayHit}</b>` : ''}</div>${monsterSvg(B, B.won ? 'dead' : 'hit')}</div>
        <div class="row small"><b class="grow">${esc(B.name)}</b><span class="num">${left} / ${B.hp} HP</span></div>
        <div class="bar hp"><i style="width:${left / B.hp * 100}%"></i></div>
        <div class="tiny muted">Every set, morning movement, logged food day, macro day and weigh-in this week hits it. Your weapon adds ${Math.round((G.mult - 1) * 100)}% damage. Tap the fight to replay.</div>
        <ul class="blist">${B.hits.map(h => `<li><span class="bn">${DAYS[dow(h.d)]} ${shortDate(h.d)}</span><span class="bt num">${h.dmg ? `${h.w.sets ? h.w.sets + ' sets \u00b7 ' : ''}${h.w.mornings ? 'morning \u00b7 ' : ''}${h.w.foodDays ? 'food \u00b7 ' : ''}<b>${h.dmg} dmg</b>` : 'no hits'}</span></li>`).join('')}</ul></div>
      <div class="card" data-k="campaign"><h2>Your road<span class="sp"></span><span class="tiny muted">titles by level</span></h2><div class="mapscroll" data-scrollx="${Math.max(0, (L.TITLES.filter(([n]) => G.lv >= n).length - 3) * 78)}">${campaignMap(G.lv)}</div></div>
      <div class="card tight" data-k="past-bosses"><h2>Past bosses<span class="sp"></span><span class="tiny muted">${G.st.bossKills} defeated</span></h2>${G.bosses.length ? '' : '<div class="small muted">Your first boss fight is this week.</div>'}${G.bosses.map(b => `<div class="row small"><span class="muted" style="width:56px">${shortDate(b.ws)}</span><span class="grow">${esc(b.boss.name)}</span><span class="num tiny">${b.dmg}/${b.boss.hp}</span><span class="badge ${b.won ? 'good' : ''}">${b.won ? 'Won' : 'Escaped'}</span></div>`).join('')}</div>
      <div class="card" data-k="xp-rules"><h2 class="tap" data-act="rulesToggle">How you earn XP and gold<span class="sp"></span>${chev(U.rulesOpen)}</h2>${U.rulesOpen ? `<ul class="blist">${earnRules().map(([a, b]) => `<li><span class="bn">${a}</span><span class="bt">${b}</span></li>`).join('')}</ul>` : ''}</div>
      <div class="card tight" data-k="xp-log"><h2>Recent rewards</h2>${G.ev.filter(e => !e.small).slice(0, 12).map(e => `<div class="row small"><span class="muted" style="width:46px">${shortDate(e.d)}</span><span class="grow">${esc(e.t)}</span>${e.xp ? `<b class="num" style="color:var(--a-good)">+${e.xp}</b>` : ''}${e.gold ? `<span class="gold num tiny">+${e.gold}g</span>` : ''}</div>`).join('')}</div>`;
    if (tab === 'quests') return head + `
      <div class="card" data-k="daily"><h2>Today's quests<span class="sp"></span><span class="tiny muted">new ones tomorrow</span></h2>${G.daily.map(q => questRow(q, `+${q.xp} XP \u00b7 +${q.gold}g`)).join('')}</div>
      <div class="card" data-k="quests"><h2>Weekly quests<span class="sp"></span><span class="tiny muted">reset Sunday</span></h2>${G.quests.map(q => questRow(q, `+${L.XP.quest} XP \u00b7 +${L.GOLD.quest}g`)).join('')}</div>
      <div class="card tight" data-k="boss-mini"><div class="row small"><span class="achi sm">${ic('sword')}</span><span class="grow">Weekly boss: <b>${esc(B.name)}</b></span><span class="num">${B.won ? 'Defeated' : left + ' HP left'}</span></div></div>`;
    if (tab === 'shop') {
      const ownedIds = new Set(S.game.items.map(x => x.id));
      return head + `<div class="card tight" data-k="shop-head"><div class="row small"><span class="grow">Weapons hit the boss harder. Pets find extra gold each workout. Armor is for looks. Potions save a streak.</span></div>${G.freezesLeft ? `<div class="tiny muted">${G.freezesLeft} streak shield${G.freezesLeft > 1 ? 's' : ''} ready.</div>` : ''}</div>
        ${Object.keys(SLOT_NAMES).map(slot => `<div class="card" data-k="shop-${slot}"><h2>${SLOT_NAMES[slot]}</h2>${L.SHOP.filter(x => x.slot === slot).map(x => {
          const own = ownedIds.has(x.id) && slot !== 'potion', on = S.game.equip[slot] === x.id, locked = G.lv < x.lv, poor = G.gold < x.price;
          const perk = x.dmg ? `+${Math.round((x.dmg - 1) * 100)}% boss damage` : x.gold ? `+${x.gold} gold per workout` : x.desc || 'Looks';
          return `<div class="row small shoprow ${locked ? 'locked' : ''}"><span class="grow"><b>${esc(x.name)}</b><br><span class="tiny muted">${perk}${locked ? ` \u00b7 level ${x.lv}` : ''}</span></span>${own ? `<button class="btn sm ${on ? '' : 'ghost'}" data-act="equip" data-id="${x.id}">${on ? 'Equipped' : 'Equip'}</button>` : `<button class="btn sm ${locked || poor ? 'ghost' : ''}" data-act="buy" data-id="${x.id}" ${locked || poor ? 'disabled' : ''}>${ic('coin', 'class="inl"')}${x.price}</button>`}</div>`;
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
      <div class="card" data-k="setup-gear"><h2>Your gear</h2><div class="small muted">We filled in your home gym. Fix anything in Train \u2192 Gear later.</div><ul class="blist">${EQUIPMENT.filter(e => S.equipment[e.id] === 'own').map(e => `<li><span class="bn">${esc(e.name)}</span></li>`).join('')}</ul><div class="tiny muted">Wishlist</div><ul class="blist">${EQUIPMENT.filter(e => S.equipment[e.id] === 'wish').map(e => `<li><span class="bn">${esc(e.name)}</span></li>`).join('')}</ul></div>
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
    <div class="card" data-k="set-ai"><h2>AI (optional)</h2>
      <div class="small"><b>Leave all three blank</b> and every AI button gives you a prompt to copy into Lumo or the Claude app, then you paste the answer back. Free, nothing to set up.</div>
      <div class="small">Fill them in only if you want the app to call an AI directly. Any service that speaks the "OpenAI-compatible" format works.</div>
      <label class="fl"><span><b>Endpoint URL</b> \u00b7 required for direct AI</span><input class="f" placeholder="https://api.example.com/v1" value="${esc(S.ai.endpoint)}" data-in="ai" data-k2="endpoint"><span class="tiny">The service's API address, from its API docs. Examples: Anthropic <code>https://api.anthropic.com/v1/</code>, Groq <code>https://api.groq.com/openai/v1</code>, OpenRouter <code>https://openrouter.ai/api/v1</code>.</span></label>
      <label class="fl"><span><b>Model</b> \u00b7 required for direct AI</span><input class="f" placeholder="model ID" value="${esc(S.ai.model)}" data-in="ai" data-k2="model"><span class="tiny">The exact model ID from the same docs page (copy it, spelling matters). Pick one that can read photos if you want plate and gear photos.</span></label>
      <label class="fl"><span><b>API key</b> \u00b7 required by most services</span><input class="f" type="password" placeholder="${REAL ? (window.HFDev.hasSecret('ai_key') ? 'Key saved on this phone (type to replace)' : 'Paste your key') : 'Don\'t enter a real key in this preview'}" data-in="ai" data-k2="key"><span class="tiny">Made in the service's console (for Anthropic: console.anthropic.com \u2192 API keys). It costs money per use on paid services. The app keeps it in its private storage on the phone (not in backup files) and only sends it to the endpoint above.</span></label>
      <div class="row small"><span class="grow">Model can read photos</span>${sw(S.ai.vision, 'aiVision')}</div>
      <button class="btn sm ghost" data-act="aiTest" style="align-self:flex-start">Test connection</button></div>
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
      ${S.next[id] ? `<div class="card tight" data-k="ex-next"><div class="row small"><b class="grow">Next time</b><span class="num">${fmtW(S.next[id].w)} \u00d7 ${S.next[id].reps}</span></div></div>` : ''}
      <div class="card" data-k="ex-history"><h2>Your history<span class="sp"></span>${best ? `<span class="small num">1RM est. ${fmtW(best)}</span>` : ''}</h2>${hist.length > 1 && best ? lineChart(liftSeries(id), liftSeries(id), 100) : ''}
        ${hist.map(s => { const ss = s.sets.filter(x => x.ex === id); const b = Math.max(...ss.map(x => L.epley(x.w, x.reps))); return `<div class="row small"><span class="muted" style="width:76px">${DAYS[dow(s.date)]} ${shortDate(s.date)}</span><span class="grow num">${ss.map(x => (x.w ? r1(x.w) + '\u00d7' : '') + x.reps + (x.fail ? 'F' : '')).join(', ')}</span>${b && x0(ss) ? `<span class="tiny muted num">${r0(b)}</span>` : ''}</div>`; }).join('') || '<div class="small muted">Not logged yet.</div>'}</div>
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
      <div class="card" data-k="containers"><h2>Containers</h2><div class="row"><button class="btn ghost" data-act="rcont" data-v="-1">\u2212</button><span class="num grow" style="text-align:center;font-size:1.6em;font-weight:700">${r.containers}</span><button class="btn ghost" data-act="rcont" data-v="1">+</button></div>
        <div class="row small num"><span class="grow">Each container</span><b>${r0(pc.cal)} kcal</b><span>P${r0(pc.p)} C${r0(pc.c)} F${r0(pc.f)}</span></div>
        <label class="fl">Cooked weight of the whole pot (g, optional)<input class="f num" type="number" inputmode="decimal" value="${r.cooked || ''}" placeholder="weigh the pot minus the pot" data-in="rcooked"></label>
        ${r.cooked ? `<div class="small num">Each container: <b>${r0(r.cooked / r.containers)} g</b> of cooked food</div>` : ''}
        <div class="tiny muted">Not sure yet? Save now and change this later: Food \u2192 Recipes \u2192 Edit, or the \u2212 + on the recipe card. Food you already logged from this recipe updates to the new count. Ingredient amounts are raw weight.</div></div>
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
      ${opts.map(n => { const c = tot.cal / n, p = tot.p / n; return `<div class="row small num ${n === best ? 'pick' : ''}"><b style="width:28px">${n}</b><span class="grow">${r0(c)} kcal \u00b7 P${r0(p)}${r.cooked ? ` \u00b7 ${r0(r.cooked / n)} g each` : ''}<br><span class="tiny muted">${r0(c / g.cal * 100)}% of calories, ${r0(p / g.p * 100)}% of protein</span></span>${n === best ? '<span class="badge good">Best fit</span>' : ''}${r.containers === n ? '<span class="badge">Current</span>' : `<button class="btn sm ghost" data-act="rcontSet" data-v="${n}">Use ${n}</button>`}</div>`; }).join('')}
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
          <div class="setrow tiny muted"><span>Set</span><span>lb</span><span>Reps</span><span title="To failure">F</span><span title="Pain">!</span></div>
          ${sets.map((s, j) => `<div class="setrow ${s.done ? 'done' : j === c ? 'cur' : ''}"><b class="num">${s.drop ? 'D' : j + 1}</b><input type="number" inputmode="decimal" step="2.5" value="${s.w === '' ? '' : s.w}" placeholder="\u2014" data-in="setw" data-i="${j}"><input type="number" inputmode="numeric" value="${s.reps}" data-in="setr" data-i="${j}"><button class="tog fail ${s.fail ? 'on' : ''}" data-act="setFail" data-i="${j}" aria-label="To failure">F</button><button class="tog pain ${s.pain ? 'on' : ''}" data-act="setPain" data-i="${j}" aria-label="Pain">!</button></div>`).join('')}
          <div class="row wrap"><button class="btn sm ghost" data-act="addSet">${ic('plus')}Set</button><button class="btn sm ghost" data-act="dropSet">Drop set</button><button class="btn sm ghost" data-act="swapLog">${ic('swap')}Swap</button><button class="btn sm ghost" data-act="openEx" data-id="${it.ex}">${ic('history')}History</button></div>
          <div class="tiny muted">${sch.name} ${sch.lo}-${sch.hi} reps, rest ${sch.rest}s. F = went to failure. ! = pain (not soreness): the coach will suggest a swap.</div></div></div>`;
      }).join('')}
      <button class="btn sm ghost" data-act="logAddEx" style="align-self:flex-start">${ic('plus')}Add exercise</button></div>
      <div class="row bottombar"><button class="btn ghost" data-act="finishLog">Finish</button><button class="btn block" data-act="nextSet" data-k="next-set">${allDone ? 'Finish workout' : cur === -1 ? 'Next exercise' : `Log set ${cur + 1} of ${st.sets[st.idx].length}`}</button></div>`;
  };

  FULL.summary = (st) => `<div class="appbar"><h1>Workout done</h1></div><div class="scroll">
    <div class="card tight" data-k="sum-stats"><div class="grid4 stats"><div><b class="num">${st.min}</b><span class="tiny muted">min</span></div><div><b class="num">${st.setCount}</b><span class="tiny muted">sets</span></div><div><b class="num">${st.kcal}</b><span class="tiny muted">kcal \u00b110%</span></div><div><b class="num" style="color:var(--a-good)">+${st.xp}</b><span class="tiny muted">XP</span></div></div>
      <div class="row small"><span class="gold num">${ic('coin', 'class="inl"')}+${st.gold} gold</span>${st.loot ? `<span class="badge good">${ic(st.loot.name === 'Gold chest' ? 'chest' : 'coin', 'class="inl"')}Loot: ${esc(st.loot.name)}</span>` : ''}<span class="grow"></span><span class="tiny muted">${st.bossHit > 0 ? `Hit ${esc(st.boss.name)} for ${st.bossHit}` : ''}${st.boss.won ? ' \u00b7 defeated!' : ''}</span></div>
      ${st.levelUp ? `<div class="levelup">${lvBadge(st.levelUp.lv)}<b>Level up! You are now a ${st.levelUp.title}.</b></div>` : ''}
      <div class="tiny muted">${st.avgHr ? 'Heart rate ' + st.avgHr + ' bpm avg from your watch (Keytel formula).' : 'No heart rate, so MET formula.'} Shown under your food, not taken off it.</div></div>
    <div class="card tight" data-k="sum-recs"><h2>Next time<span class="sp"></span><span class="tiny muted">tap for history</span></h2>
      ${st.recs.map(r => `<div class="li tight" data-act="openEx" data-id="${r.ex}" data-k="sum-rec"><div class="grow"><div class="row" style="gap:6px"><b class="small">${esc(r.name)}</b>${r.pr ? '<span class="badge good">New best</span>' : ''}</div><div class="tiny">${esc(r.rec.text)}</div><div class="tiny muted num">${r.sets.map(x => (x.w ? r1(x.w) + '\u00d7' : '') + x.reps + (x.fail ? 'F' : '') + (x.pain ? '!' : '')).join('  ')}</div></div><span class="badge ${r.rec.kind === 'pain' ? 'alert' : r.rec.kind === 'jump' || r.rec.kind === 'up' ? 'good' : 'info'}">${{ jump: 'Go heavier', up: 'Add weight', reps: 'Add reps', hold: 'Hold', down: 'Drop back', pain: 'Swap', none: '' }[r.rec.kind]}</span></div>`).join('')}</div>
    ${st.dup ? `<div class="card" data-k="hc-dup"><h2>Your watch logged this too</h2><div class="small">Samsung Health recorded a workout ${esc(st.dup)}. Pick what goes to Health Connect:</div>
      ${HC_CHOICES.map(([k, l]) => `<button class="choice ${st.hcPick === k ? 'on' : ''}" data-act="hcPick" data-v="${k}"><b>${l}</b><span class="tiny muted">${{ merge: 'One workout: your sets and times from the app, heart rate and calories from the watch. The watch copy is removed.', app: 'Keeps only this app\'s workout. The watch copy is removed; heart rate is lost.', watch: 'Keeps the watch\'s workout. Your sets stay in this app only.', skip: 'Sends nothing. Both stay where they are.' }[k]}</span></button>`).join('')}
      <div class="tiny muted">Change the default in Settings \u2192 Health Connect.</div></div>` : ''}
    <div class="card" data-k="sum-sore"><h2 class="tap" data-act="soreToggle">Anything sore?<span class="sp"></span>${chev(U.soreOpen)}</h2>${U.soreOpen ? soreGrid() + '<div class="tiny muted">Pain goes on the set with the ! button.</div>' : ''}</div>
    <button class="btn block" data-act="closeSummary">Save</button></div>`;

  // Swap or add: full-screen search.
  FULL.swap = (f) => {
    const own = ownedGear();
    const base = f.from ? EXB[f.from] : null;
    const list = exerciseList({ q: f.q || '', group: f.group || 'All', mine: f.mine !== false, star: !!f.star, muscle: f.same && base ? base.pm[0] : null }).filter(e => e.id !== f.from);
    return `${bar(f.mode === 'add' ? 'Add exercise' : 'Replace ' + esc(exName(f.from)))}
      <div class="scroll"><input class="f" id="swapq" placeholder="Search exercises" value="${esc(f.q || '')}" data-in="swapq" autocomplete="off">
      <div class="chips">${base ? `<button class="chip ${f.same ? 'on' : ''}" data-act="swapOpt" data-v="same">Same muscle (${esc(L.cap(base.pm[0]))})</button>` : ''}<button class="chip ${f.mine !== false ? 'on' : ''}" data-act="swapOpt" data-v="mine">My gear</button><button class="chip ${f.star ? 'on' : ''}" data-act="swapOpt" data-v="star">\u2605 Starred</button></div>
      ${f.same ? '' : `<div class="chips">${['All', ...GROUPS].map(g => `<button class="chip sm ${(f.group || 'All') === g ? 'on' : ''}" data-act="swapGroup" data-v="${g}">${g}</button>`).join('')}</div>`}
      <div class="card tight"><div class="tiny muted">${list.length} matches${list.length > 50 ? ', showing 50' : ''}. Tap to pick.</div><div class="list">${list.slice(0, 50).map(e => exRow(e, 'swapPick', own)).join('')}</div></div></div>`;
  };

  // Day editor (week or builder draft): dropdowns and steppers, no arrows.
  const ctxRef = ctx => ctx === 'draft' ? { days: U.wiz.days, week: U.wiz.week } : { days: S.days, week: S.planWeek };
  FULL.dayedit = ({ ctx, i }) => {
    const { days, week } = ctxRef(ctx), d = days[i], items = week[i];
    return `${bar(DAYS[i] + ' exercises', `<button class="btn sm" data-act="closeFull">Done</button>`)}
      <div class="scroll"><div class="card tight"><div class="small muted">Muscles this day</div><div class="chips">${GROUPS.map(g => `<button class="chip sm ${d.groups.includes(g) && !d.off ? 'on' : ''}" data-act="deGroup" data-v="${g}">${g}</button>`).join('')}</div></div>
      ${items.map((x, k) => `<div class="card tight exedit" data-k="day-item"><div class="row">${exThumb(x.ex)}<div class="grow"><button class="linkbtn" data-act="deSwap" data-k2="${k}"><b class="small">${esc(exName(x.ex))}</b>${ic('down', 'class="inl"')}</button><div class="tiny muted num">${targetLine(x)}${x.daily ? ' \u00b7 daily min' : ''}</div></div><button class="iconbtn sm" data-act="deDel" data-k2="${k}" aria-label="Remove">${ic('trash')}</button></div>
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
      <div class="small muted num">${w.days.filter(d => !d.off).length} training days \u00b7 ${total} sets a week</div>
      <div class="row">${w.mode === 'coach' ? `<button class="btn block" data-act="wizReview">${ic('spark')}Coach review${w.round ? ' (round ' + (w.round + 1) + ')' : ''}</button>` : `<button class="btn ghost" data-act="wizReview">Coach check</button><button class="btn block" data-act="wizSave">Save plan</button>`}</div></div>`;
  };

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
    return `<div class="row"><div class="small muted grow">${s.r ? 'Containers' : `Servings (1 = ${x.serv} ${esc(x.unit)})`} \u00b7 ${esc(x.src || 'Recipe')}${x.barcode ? ' \u00b7 ' + x.barcode : ''}</div><button class="iconbtn star ${fav ? 'on' : ''}" data-act="favFood" data-id="${s.id}" aria-label="Favorite">${ic('star')}</button></div>
      <div class="row"><button class="btn ghost" data-act="qty" data-v="-0.5">\u2212</button><input class="f num" style="text-align:center;font-size:1.3em" type="number" step="0.25" value="${s.qty}" data-in="qty"><button class="btn ghost" data-act="qty" data-v="0.5">+</button></div>
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
    return `<div class="small">${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' \u00b7 ')}</div>
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
    return `<div class="small muted">${fmtDate(s.date)} \u00b7 ${s.min} min \u00b7 ${s.kcal} kcal${s.avgHr ? ' \u00b7 avg HR ' + s.avgHr : ''}</div>
      <div class="list">${exs.map(ex => `<div class="li" data-act="openEx" data-id="${ex}">${exThumb(ex)}<div class="grow"><div class="small">${esc(exName(ex))}</div><div class="tiny muted num">${s.sets.filter(x => x.ex === ex).map(x => (x.w ? r1(x.w) + '\u00d7' : '') + x.reps + (x.fail ? 'F' : '')).join(', ')}</div></div>${ic('history', 'class="inl muted"')}</div>`).join('')}</div>`;
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
    const name = [p.product_name, p.brands && p.brands.split(',')[0]].filter(Boolean).join(' \u00b7 ') || 'Barcode ' + code;
    return { id: 'off' + code, name, src: 'OpenFoodFacts', serv: per === 'serving' ? q : 100, unit: per === 'serving' ? (p.serving_size || 'g').replace(/^[\d.,\s]+/, '').trim() || 'g' : 'g', cal: r1(v('energy-kcal')), p: r1(v('proteins')), c: r1(v('carbohydrates')), f: r1(v('fat')), barcode: code };
  }
  A.scanReal = async () => {
    const r = await native('scan');
    if (r.cancelled) return;
    if (r.error || !r.code) return toast('Scanner: ' + (r.error || 'nothing read'));
    const code = r.code;
    let f = S.foods.find(x => x.barcode === code);
    if (!f) {
      toast('Looking up ' + code + '\u2026');
      const res = await native('http', { url: `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity` });
      let j = null; try { j = JSON.parse(res.body || ''); } catch (e) {}
      if (j && j.status === 1 && j.product) { f = offFood(code, j.product); S.foods.push(f); save(); }
    }
    if (!f) { U.scanCode = code; U.sheet = { kind: 'scan', title: 'Not found', code }; return render(); }
    U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render();
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
    toast('Testing\u2026');
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
      <button class="btn" data-act="aiSend" ${s.busy ? 'disabled' : ''}>${ic('spark')}${s.busy ? 'Asking\u2026' : s.answer ? 'Ask again' : 'Ask AI'}</button>
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
    if (j.exercises) return `<b class="small">${esc(j.routine_name || 'Workout')}</b><ul class="blist">${j.exercises.map(x => `<li><span class="bn">${esc(x.name)}${aiEx(x.name) ? '' : ' <span class="muted">(not in your list)</span>'}</span><span class="bt num">${x.sets} \u00d7 ${esc(String(x.reps))}</span></li>`).join('')}</ul>`;
    if (j.foods) return `<ul class="blist">${j.foods.map(x => `<li><span class="bn">${esc(x.name)}</span><span class="bt num">${r0(x.grams)} g</span></li>`).join('')}</ul><div class="small num">${r0(j.total_calories)} kcal \u00b7 P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div>`;
    if (j.calories) return `<div class="small num">${r0(j.calories)} kcal \u00b7 P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div><div class="tiny muted">${esc(j.reason || '')}</div>`;
    if (j.matches) return `<div class="small">Found: ${j.matches.map(esc).join(', ') || 'nothing from your list'}</div>`;
    if (j.why) return `<div class="small">${esc(j.why)}</div>`;
    return '';
  }
  const aiEx = name => { const n = String(name).toLowerCase().replace(/[^a-z0-9 ]/g, ''); return EX.find(e => e.n.toLowerCase().replace(/[^a-z0-9 ]/g, '') === n) || EX.find(e => e.n.toLowerCase().includes(n) || n.includes(e.n.toLowerCase())); };
  const applyRecipe = A.bridgeApply;
  A.bridgeApply = d => {
    if (!REAL || d.v === 'recipe') return applyRecipe(d);
    const j = parseJson($('#bridgeIn').value);
    if (!j) return toast('That answer isn\'t valid JSON.');
    if (d.v === 'food') {
      const f = { id: 'c' + Date.now(), name: 'Plate: ' + (j.foods || []).map(x => x.name).slice(0, 3).join(', '), src: 'Custom', serv: 1, unit: 'plate', cal: r0(j.total_calories), p: r0(j.protein_g), c: r0(j.carbs_g), f: r0(j.fat_g) };
      S.foods.push(f); S.log.push({ id: 'l' + Date.now(), date: U.foodDate, meal: U.meal, foodId: f.id, qty: 1 }); toast('Logged to ' + U.meal.toLowerCase() + '.');
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
  render();
  if (REAL) hcSync();
})();
