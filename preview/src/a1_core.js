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
  // v2 = fresh start with 1.0.7 (jake asked for a data reset). The AI key and Health Connect
  // permissions live outside this and stay.
  const KEY = REAL ? 'hf-app-v2' : 'hf-preview-v2';
  if (REAL) { try { localStorage.removeItem('hf-app-v1'); } catch (e) {} }
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
      ai: { endpoint: '', key: '', model: '', vision: true, notes: '' },
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
    else el.innerHTML = '<div class="tiny muted" style="padding:20px;text-align:center">Loading pictures…</div>';
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
  const lastWeight = id => { for (let i = S.sessions.length - 1; i >= 0; i--) { const s = S.sessions[i].sets.filter(x => x.ex === id && x.w > 0); if (s.length) return s[s.length - 1].w; } return null; };
  // Safe first weight from fitness level, body weight and the lift (logic.js startWeight).
  const startW = (id, scheme) => isBW(id) ? null : L.startWeight(EXB[id], S.profile, scheme, STEP);
  const schemeOf = it => S.schemes[it.scheme] || S.schemes.build;
  // "3 x 6-12 @ 100 lb" for quick reference in every plan list.
  const targetLine = it => {
    const sc = schemeOf(it), bw = isBW(it.ex);
    const w = S.next[it.ex]?.w ?? lastWeight(it.ex);
    const sw = w ? null : startW(it.ex, it.scheme);
    return `${it.sets} × ${sc.lo}-${sc.hi}${bw ? ' · body weight' : w ? ' @ ' + fmtW(w) : sw ? ' · start @ ' + fmtW(sw) : ' · pick a weight'}`;
  };
  const bullets = (items, opts = {}) => items.length ? `<ul class="blist">${items.map((it, k) => `<li${opts.act ? ` data-act="${opts.act}" data-id="${esc(it.ex)}" data-i="${opts.i ?? ''}" data-k2="${k}"` : ''}><span class="bn">${esc(exName(it.ex))}${S.stars.includes(it.ex) ? ' <span class="starmark">★</span>' : ''}${it.daily ? ' <span class="badge">daily min</span>' : ''}</span><span class="bt num">${targetLine(it)}</span></li>`).join('')}</ul>` : '';

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
