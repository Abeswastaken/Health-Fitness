// Health-Fitness preview (review 2): a clickable stand-in for the Android app, for UI and concept review.
// Logic lives in logic.js (becomes Kotlin core/). Example data is kept in this browser only.
(function () {
  const L = window.Logic;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r0 = n => Math.round(n), r1 = n => Math.round(n * 10) / 10;
  const DAY = 864e5;
  // The phone's own calendar day (toISOString is UTC, which flips to tomorrow at 5 PM in MST).
  const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = localDay();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && localDay() !== today) location.reload(); });
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
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    syringe: '<path d="M18 2l4 4M20 4l-3 3M17 7l-9.5 9.5-3 .5.5-3L14.5 4.5zM11 7l2 2M8.5 9.5l2 2M3 21l2.5-2.5"/>',
    vial: '<path d="M9 2h6M10 2v3h4V2M8 5h8v3H8zM9 8v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8"/><path d="M9 14h6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h2M16 15v3"/>',
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
  S.meals = S.meals || [];
  if (S.modules.peptides === undefined) S.modules.peptides = true;
  if (S.restVoice === undefined) S.restVoice = true;
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
  const entryName = e => e.quick ? (e.quick.name || 'Quick add') : e.recipeId ? (recipesById()[e.recipeId]?.name || 'Recipe') : (foodsById()[e.foodId]?.name || 'Food');
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
    return `${it.sets} \u00d7 ${sc.lo}-${sc.hi}${bw ? ' \u00b7 body weight' : w ? ' @ ' + fmtW(w) : sw ? ' \u00b7 start @ ' + fmtW(sw) : ' \u00b7 pick a weight'}`;
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
    food: [['log', 'Log'], ['recipes', 'Recipes'], ['mealplan', 'Meal plan']],
    train: [['today', 'Today'], ['week', 'Week'], ['balance', 'Balance'], ['programs', 'Programs'], ['library', 'Exercises'], ['equipment', 'Gear'], ['history', 'History']],
    progress: [['overview', 'Overview'], ['strength', 'Strength'], ['goals', 'Goals'], ['achievements', 'Adventure']],
    more: [['today', 'Today'], ['vials', 'Vials'], ['calc', 'Calculator'], ['plan', 'Schedules'], ['guide', 'Guide'], ['history', 'History']],
  };
  function render() {
    const m = S.modules;
    const tabs = [['home', 'Home', 'home'], m.food && ['food', 'Food', 'food'], m.workout && ['train', 'Train', 'train'], ['progress', 'Progress', 'progress'], m.peptides && ['more', 'More', 'dots']].filter(Boolean);
    if (!tabs.find(t => t[0] === S.tab)) S.tab = 'home';
    const title = { home: 'Today', food: 'Food', train: 'Train', progress: 'Progress', more: 'Peptides' }[S.tab];
    if (U.goalEdit && !(S.tab === 'progress' && U.sub.progress === 'goals' && !U.stack.length)) A.goalCancel(true);
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
        const todays = S.sessions.filter(s => s.date === today);
        const burn = todays.reduce((a, s) => a + (s.kcal || 0), 0);
        const src = todays.length ? (todays.every(s => s.kcalSrc === 'watch') ? 'from your watch' : todays.some(s => s.avgHr) ? 'from heart rate' : 'estimated from time') : '';
        const planned = todaysWorkout().filter(w => !w.done && !w.off).reduce((a, w) => a + (w.kind === 'main' ? L.sessionCalories(S.profile, 50) : 35), 0);
        return `<div class="card" data-k="card-macros" data-act="goFood">
          <h2>Food today<span class="sp"></span><span class="tiny muted">tap to log</span></h2>
          <div class="netline"><span class="num big">${r0(net)}</span><span class="muted small">kcal ${net >= 0 ? 'left' : 'over'} of ${r0(g.cal)}</span></div>
          ${D().macroStyle === 'rings' ? `<div class="ringgrid">${ring('Calories', t.cal, g.cal, 'var(--a-accent)', '')}${ring('Protein', t.p, g.p, 'var(--a-p)')}${ring('Carbs', t.c, g.c, 'var(--a-c)')}${ring('Fat', t.f, g.f, 'var(--a-f)')}</div>` :
          macroBar('Calories', t.cal, g.cal, 'var(--a-accent)', '') + macroBar('Protein', t.p, g.p, 'var(--a-p)') + macroBar('Carbs', t.c, g.c, 'var(--a-c)') + macroBar('Fat', t.f, g.f, 'var(--a-f)')}
          <div class="row small hr" data-k="burn-line"><span class="grow muted">Workout burn${src ? ', ' + src : ''} (not counted in net)</span><span class="num">${burn ? r0(burn) + ' kcal' : planned ? '~' + planned + ' kcal planned' : '0 kcal'}</span></div>
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
      <div class="card tight" data-k="day-total"><div class="row num small"><span class="grow"><b class="big2">${r0(t.cal)}</b> / ${r0(g.cal)} kcal</span><span style="color:var(--a-p)">P${r0(t.p)}</span><span style="color:var(--a-c)">C${r0(t.c)}</span><span style="color:var(--a-f)">F${r0(t.f)}</span></div>${macroBar('kcal', t.cal, g.cal, 'var(--a-accent)', '').replace('class="macro"', 'class="macro solo"')}${d === today ? leftLine(t, g) : ''}</div>
      ${d === today && REAL ? `<div class="row" data-k="scanner"><button class="btn grow" data-act="scanReal">${ic('scan')}Scan barcode</button><button class="btn soft" data-act="photoAI">${ic('camera')}Plate photo</button></div>` : ''}
      ${d === today && !REAL ? `<div class="viewfinder" data-k="scanner"><div class="frame"><div class="laser"></div></div>
        <div style="position:absolute;top:10px;left:12px;font-size:12px;opacity:.85">Point at a barcode</div>
        <div class="vf-actions"><button class="btn sm" data-act="simScan">${ic('scan')}Simulate scan</button><button class="btn sm" data-act="photoAI" aria-label="Photo of plate">${ic('camera')}Plate photo</button></div></div>` : ''}
      <div class="chips" data-k="meal-chips">${MEALS.map(m => `<button class="chip ${U.meal === m ? 'on' : ''}" data-act="meal" data-v="${m}">${m}</button>`).join('')}</div>
      <div class="row" data-k="food-search"><input class="f" id="foodq" placeholder="Search foods, meals, barcodes" value="${esc(U.q)}" data-in="foodq" autocomplete="off"><button class="btn sm ghost" data-act="quickAdd" aria-label="Add your own food or numbers">${ic('plus')}Add your own</button></div>
      ${res ? `<div class="card" data-k="search-results">${res.length ? groupResults(res) : `<div class="muted small">No match in your foods. Search online or ask the AI without leaving the app:</div>`}${offBlock()}</div>` : `
      ${usualBlock(d)}
      <div class="card tight" data-k="recent-foods"><div class="row"><div class="seg grow" role="tablist"><button class="${U.recentTab === 'recent' ? 'on' : ''}" data-act="recentTab" data-v="recent">Recent</button><button class="${U.recentTab === 'fav' ? 'on' : ''}" data-act="recentTab" data-v="fav">${ic('star', 'class="inl"')}Favorites</button><button class="${U.recentTab === 'meals' ? 'on' : ''}" data-act="recentTab" data-v="meals">Meals</button></div><button class="iconbtn sm" data-act="recentFold" aria-label="${S.recentClosed ? 'Show' : 'Hide'} list">${chev(!S.recentClosed)}</button></div>
        ${S.recentClosed ? '' : U.recentTab === 'meals' ? `<div class="list scroll5">${S.meals.map(savedMealRow).join('') || '<div class="muted small" style="padding:10px 0">No saved meals yet. Open a meal\'s menu (\u22ef) and tap "Save as a meal".</div>'}</div><div class="tiny muted">${S.meals.length} saved meals \u00b7 logs to ${U.meal}</div>` : `
        <div class="list scroll5">${listIds.map(itemById).filter(Boolean).map(x => foodRow(x)).join('') || '<div class="muted small" style="padding:10px 0">Tap the star on any food to add it here.</div>'}</div>
        <div class="tiny muted">${U.recentTab === 'fav' ? listIds.length + ' favorites' : 'Last ' + Math.min(25, listIds.length) + ' foods'} \u00b7 hold a food for more \u00b7 logs to ${U.meal}</div>`}</div>`}
      ${MEALS.map(m => {
        const es = entries.filter(e => e.meal === m), open = S.mealOpen[m] !== false;
        const mt = L.dayTotals(es, foodsById(), recipesById());
        const sel = U.sel && U.sel.meal === m && U.sel.date === d ? U.sel : null;
        return `<div class="card meal" data-k="meal-${m.toLowerCase()}" data-drop="${m}"><h2 class="tap" data-act="mealToggle" data-v="${m}">${m}<span class="sp"></span><span class="small muted num">${es.length ? r0(mt.cal) + ' kcal' : ''}</span><button class="iconbtn sm" data-act="mealMenu" data-v="${m}" aria-label="${m} options">\u22ef</button>${chev(open)}</h2>
          ${open && sel ? selBlock(m, es, sel) : open ? `${es.map(e => { const mm = L.entryMacros(e, foodsById(), recipesById()); return `<div class="li tight" data-act="editEntry" data-id="${e.id}"><span class="grip" data-drag="${e.id}" data-act="noop" aria-label="Drag to another meal">${ic('grip')}</span><div class="grow"><div class="small">${esc(entryName(e))} <span class="muted">${qtyTxt(e)}</span></div><div class="tiny muted num">P${r0(mm.p)} C${r0(mm.c)} F${r0(mm.f)}</div></div><span class="num small">${r0(mm.cal)}</span><span class="muted">${ic('edit', 'class="inl"')}</span></div>`; }).join('') || '<div class="muted small">Nothing yet.</div>'}
          <button class="btn sm ghost" data-act="addToMeal" data-v="${m}" style="align-self:flex-start">${ic('plus')}Add to ${m.toLowerCase()}</button>` : ''}</div>`;
      }).join('')}
      ${entries.length ? `<div class="tiny muted" style="text-align:center">Hold ${ic('grip', 'class="inl"')} and drag to move a food to another meal.</div>` : ''}`;
  };
  function searchFoods(q, opts = {}) {
    const s = q.toLowerCase().trim();
    // Whole text anywhere = strong match. Otherwise every typed word has to start a word in the name
    // ("chick bre" finds "Chicken breast"). Loose letter-by-letter matching let "mango" hit long product names.
    const words = s.split(/\s+/).filter(Boolean);
    const fuzzy = (name) => { const n = name.toLowerCase(); if (n.includes(s)) return 2; const nw = n.split(/[^a-z0-9%]+/).filter(Boolean); return words.length && words.every(w => nw.some(x => x.startsWith(w))) ? 1 : 0; };
    const out = [];
    for (const r of S.recipes) { const sc = fuzzy(r.name); if (sc) out.push({ type: 'Recipes', item: r, sc: sc + 1 }); }
    for (const m of S.meals || []) { const sc = fuzzy(m.name); if (sc && !opts.noMeals) out.push({ type: 'Saved meals', item: m, sc: sc + 2 }); }
    for (const f of S.foods) { if (f.hidden) continue; const sc = fuzzy(f.name) || (f.barcode && f.barcode.includes(s) ? 2 : 0); if (sc) out.push({ type: f.src === 'OpenFoodFacts' ? 'Scanned' : f.src === 'USDA' ? 'USDA' : 'My foods', item: f, sc: sc + (S.recent.includes(f.id) ? 1 : 0) + (S.favFoods.includes(f.id) ? 1 : 0) }); }
    return out.sort((a, b) => b.sc - a.sc);
  }
  function groupResults(res, act = 'pickFood') {
    const by = {}; res.forEach(r => (by[r.type] = by[r.type] || []).push(r.item));
    return Object.entries(by).map(([k, items]) => `<div class="tiny muted">${k}</div><div class="list">${items.map(x => x.items ? savedMealRow(x) : foodRow(x, act)).join('')}</div>`).join('');
  }
  function foodRow(x, act = 'pickFood') {
    const isR = !!x.ing;
    const m = isR ? L.recipePerContainer(x, foodsById()) : x;
    const fav = S.favFoods.includes(x.id);
    return `<div class="li" data-act="${act}" data-id="${x.id}" data-r="${isR ? 1 : ''}" data-long="foodMenu"><div class="grow"><div class="small">${esc(x.name)}</div><div class="tiny muted">${isR ? '1 container' : `${x.serv} ${esc(x.unit)}`} \u00b7 P${r0(m.p)} C${r0(m.c)} F${r0(m.f)}</div></div><span class="num small">${r0(m.cal)}</span><button class="iconbtn sm star ${fav ? 'on' : ''}" data-act="favFood" data-id="${x.id}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${ic('star')}</button></div>`;
  }
  SCREENS['food:recipes'] = () => `
    <div class="card" data-k="recipes-help"><div class="small muted">Put everything in the pot, say how many containers it fills, and log one container at a time.</div><div class="row wrap"><button class="btn" data-act="newRecipe">${ic('plus')}New recipe</button><button class="btn soft" data-act="recipeImport">${ic('spark')}From Lumo, a link or an idea</button></div><div class="tiny muted">Plan meals in Lumo, then paste the app's prompt into that chat. Its answer adds the recipes with every ingredient and its macros.</div></div>
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
        ${ps.map(p => { const done = logged.some(l => (l.recipeId || l.foodId) === (p.recipeId || p.foodId)); const mm = L.entryMacros(p, foodsById(), recipesById()); return `<div class="li tight"><div class="grow" data-act="editPlan" data-id="${p.id}"><div class="small">${esc(entryName(p))} <span class="muted">${qtyTxt(p)}</span></div><div class="tiny muted num">${r0(mm.cal)} kcal \u00b7 P${r0(mm.p)}</div></div>${done ? '<span class="badge good">Eaten</span>' : U.mpDay <= today ? `<button class="btn sm ghost" data-act="logPlanned" data-id="${p.id}">Log it</button>` : ''}<button class="iconbtn sm" data-act="unplan" data-id="${p.id}" aria-label="Remove">${ic('close')}</button></div>`; }).join('') || '<div class="tiny muted">Nothing planned.</div>'}</div>`; }).join('')}`;
  };
  SCREENS['progress:goals'] = () => {
    const p = S.profile, g = goalNow(), tdee = L.tdee(p);
    const m = S.goal.method;
    // Locked until "Edit goals" so a stray tap can't change them; Save or Cancel ends editing.
    const lock = !U.goalEdit;
    return `<div class="card tight" data-k="goal-lock"><div class="row">${lock ? `<span class="grow small muted">Calories ${r0(g.cal)} \u00b7 P${r0(g.p)} C${r0(g.c)} F${r0(g.f)}</span><button class="btn sm" data-act="goalEdit">${ic('edit')}Edit goals</button>` : `<span class="grow small"><b>Editing.</b> Nothing changes until you save.</span><button class="btn sm ghost" data-act="goalCancel">Cancel</button><button class="btn sm" data-act="goalSave">Save</button>`}</div></div>
      <div class="${lock ? 'locked' : ''}"><div class="card" data-k="goal-method"><h2>How to set your target</h2>
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
        <div class="small muted">Protein ${r1(g.p / p.weightLb)} g per lb of body weight.</div></div></div>`;
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
      <button class="btn soft sm" data-act="bridge" data-v="plan" style="align-self:flex-start">${ic('spark')}Ask AI coach for more</button>${planReopenBtn('plan')}</div>
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
      <div class="row"><span class="grow">Workouts</span>${sw(S.modules.workout, 'modWorkout')}</div>
      <div class="row"><span class="grow">Peptides <span class="tiny muted">(under More)</span></span>${sw(S.modules.peptides, 'modPep')}</div>
      <div class="row"><span class="grow">Spoken rest timer <span class="tiny muted">(time left every 30 s, then 10, 3, 2, 1)</span></span>${sw(S.restVoice, 'restVoice')}</div></div>
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
      <label class="fl"><span><b>Endpoint URL</b> \u00b7 required for direct AI</span><input class="f" placeholder="https://api.example.com/v1" value="${esc(S.ai.endpoint)}" data-in="ai" data-k2="endpoint"><span class="tiny">The service's API address, from its API docs. Examples: Anthropic <code>https://api.anthropic.com/v1/</code>, Groq <code>https://api.groq.com/openai/v1</code>, OpenRouter <code>https://openrouter.ai/api/v1</code>.</span></label>
      <label class="fl"><span><b>Model</b> \u00b7 required for direct AI</span><input class="f" placeholder="model ID" value="${esc(S.ai.model)}" data-in="ai" data-k2="model"><span class="tiny">The exact model ID from the same docs page (copy it, spelling matters). Pick one that can read photos if you want plate and gear photos.</span></label>
      <label class="fl"><span><b>API key</b> \u00b7 required by most services</span><input class="f" type="password" placeholder="${REAL ? (window.HFDev.hasSecret('ai_key') ? 'Key saved on this phone (type to replace)' : 'Paste your key') : 'Don\'t enter a real key in this preview'}" data-in="ai" data-k2="key"><span class="tiny">Made in the service's console (for Anthropic: console.anthropic.com \u2192 API keys). It costs money per use on paid services. The app keeps it in its private storage on the phone (not in backup files) and only sends it to the endpoint above.</span></label>
      <div class="row small"><span class="grow">Model can read photos</span>${sw(S.ai.vision, 'aiVision')}</div>
      <button class="btn sm ghost" data-act="aiTest" style="align-self:flex-start">Test connection</button>` : ''}</div>
    ${freeKeysCard()}
    <div class="card" data-k="set-schemes"><h2>Rep schemes</h2>${Object.entries(S.schemes).map(([k, s]) => `<div class="row small"><b style="width:76px">${s.name}</b><input class="f num w56" type="number" value="${s.lo}" data-in="scheme" data-s="${k}" data-k2="lo"><span>to</span><input class="f num w56" type="number" value="${s.hi}" data-in="scheme" data-s="${k}" data-k2="hi"><span class="muted nw">reps, rest</span><input class="f num w56" type="number" value="${s.rest}" data-in="scheme" data-s="${k}" data-k2="rest"><span class="muted">s</span></div><div class="tiny muted">${esc(s.tip)}</div>`).join('')}
      <button class="btn sm soft" data-act="bridge" data-v="schemes" style="align-self:flex-start">${ic('spark')}Ask AI to review these against my history</button>
      <div class="tiny muted">Weight jumps are 2.5 lb. If a suggested weight doesn't fit your gear, type the real one in the logger.</div></div>
    ${REAL ? `<div class="card" data-k="set-hc"><h2>Health Connect</h2><div class="small muted">Samsung Health shares your scale and watch through Health Connect. Weigh-ins you add by hand stay in this app only.</div>
      ${S.hc.connected ? `${[['weight', 'Read body weight'], ['hr', 'Read heart rate (workout calories)'], ['rhr', 'Read resting heart rate'], ['sleep', 'Read sleep']].map(([k, l]) => `<div class="row small"><span class="grow">${l}${(S.hc.granted || []).includes(k) ? '' : ' <span class="muted">(not allowed)</span>'}</span>${sw(S.hc.read[k], 'hcRead', `data-k2="${k}"`)}</div>`).join('')}
      <div class="row small"><span class="grow">Write workouts${(S.hc.granted || []).includes('exercise') ? '' : ' <span class="muted">(not allowed)</span>'}</span>${sw(S.hc.write.sessions, 'hcWrite')}</div>
      <div class="row small"><span class="grow">Read the watch's active calories (live workout burn)</span><span class="tiny ${(S.hc.granted || []).includes('caloriesRead') ? '' : 'muted'}">${(S.hc.granted || []).includes('caloriesRead') ? 'Allowed' : 'Not allowed yet: tap Permissions'}</span></div>
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
    const res = q ? searchFoods(q, { noMeals: true }).filter(x => !x.item.ing) : null;
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
    const lk = liveKcal(st);
    return `<div class="appbar"><button class="iconbtn" data-act="quitLog" aria-label="Close">${ic('close')}</button><h1 class="h1sm">${esc(st.name)}</h1><span class="small muted num" data-k="live-burn" title="${lk.src}">${elapsed} min \u00b7 ${r0(lk.kcal)} kcal</span></div>
      ${rest > 0 ? `<div class="restbar" data-k="rest-timer"><span class="small">Rest</span><b class="num">${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}</b><span class="grow"></span><button class="iconbtn sm" data-act="restVoice" aria-label="${S.restVoice ? 'Mute' : 'Turn on'} the spoken countdown">${ic(S.restVoice ? 'bell' : 'minus')}</button><button class="btn ghost sm" data-act="restAdd">+30 s</button><button class="btn sm" data-act="restSkip">Skip</button></div>` : ''}
      <div class="row tiny" data-k="logger-tools" style="padding:0 14px 4px"><span class="grow muted">${st.order ? 'Use the arrows to move exercises.' : ''}</span>${st.order ? `${st.kind === 'main' ? '<button class="btn sm ghost" data-act="logOrderSave">Save order to plan</button>' : ''}<button class="btn sm" data-act="logOrder">Done</button>` : `<button class="btn sm ghost" data-act="logFoldAll">${ic('up')}Collapse all</button><button class="btn sm ghost" data-act="logOrder">${ic('swap')}Reorder</button>`}</div>
      <div class="scroll" data-k="logger-list">
      ${st.items.map((it, k) => {
        const sets = st.sets[k], doneN = sets.filter(s => s.done).length, open = k === st.idx && !st.fold && !st.order, sch = schemeOf(it);
        const head = `<div class="acc-h" data-act="${st.order ? 'noop' : 'logGo'}" data-i="${k}"><span class="accn ${doneN === sets.length ? 'done' : k === st.idx ? 'cur' : ''}">${doneN === sets.length ? ic('check') : k + 1}</span><div class="grow"><b class="small">${esc(exName(it.ex))}</b><div class="tiny muted num">${targetLine(it)}</div></div>${st.order ? `<button class="iconbtn sm" data-act="logMove" data-i="${k}" data-v="-1" aria-label="Move up" ${k ? '' : 'disabled style="opacity:.3"'}>${ic('up')}</button><button class="iconbtn sm" data-act="logMove" data-i="${k}" data-v="1" aria-label="Move down" ${k < st.items.length - 1 ? '' : 'disabled style="opacity:.3"'}>${ic('down')}</button>` : `<span class="tiny num muted">${doneN}/${sets.length}</span>${chev(open)}`}</div>`;
        if (!open) return `<div class="acc" data-k="logger-ex">${head}</div>`;
        const c = sets.findIndex(s => !s.done);
        return `<div class="acc open" data-k="logger-ex">${head}
          <div class="acc-b">${exAnim(it.ex).replace('class="exmedia"', 'class="exmedia sm"')}${artBar(it.ex)}
          ${sets.some(s => s.start && !s.done) ? `<div class="tiny muted" data-k="start-weight">Starting weight picked from your ${esc(S.profile.level || 'beginner')} level and body weight. It's meant to feel easy. If a set feels too heavy, drop the weight: the rest of the sets follow, and next time starts from what you actually lifted.</div>` : ''}
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
        <button class="btn soft sm" data-act="bridge" data-v="draft" style="align-self:flex-start">${ic('spark')}Ask AI coach too</button>${planReopenBtn('draft')}</div>
      <div class="row"><button class="btn ghost block" data-act="wizBack">Back to editing</button><button class="btn block" data-act="wizSave">Save plan</button></div></div>`;
    return `${bar(w.mode === 'coach' ? 'Coach-assisted plan' : 'Create my own', '', 'wizClose')}<div class="scroll">
      ${w.mode === 'coach' ? `<div class="steps3"><span>1 Questions</span><span class="on">2 Draft and edit</span><span>3 Coach review</span></div><div class="card tight coachnote"><div class="small">${ic('spark', 'class="inl"')} ${esc(w.note || '')}</div></div>` : `<div class="card tight"><div class="small muted">Turn on your training days, pick muscles, then add exercises. "Fill" builds a day from its muscles if you want a start.</div></div>`}
      <label class="fl">Plan name<input class="f" value="${esc(w.name)}" data-in="wizName"></label>
      ${w.days.map((d, i) => `<div class="card day tight"><div class="row"><h2 class="grow">${DAYS[i]}</h2><span class="small muted num">${d.off ? 'Rest' : w.week[i].reduce((a, x) => a + x.sets, 0) + ' sets'}</span>${sw(!d.off, 'wizDay', `data-i="${i}" aria-label="Train on ${DAYS[i]}"`)}</div>
        ${d.off ? (w.week[i].length ? bullets(w.week[i]) : '') : `<div class="chips">${GROUPS.map(g => `<button class="chip sm ${d.groups.includes(g) ? 'on' : ''}" data-act="wizGroup" data-i="${i}" data-v="${g}">${g}</button>`).join('')}</div>${bullets(w.week[i])}<button class="btn sm ghost" data-act="wizEditDay" data-i="${i}" style="align-self:flex-start">${ic('edit')}${w.week[i].length ? 'Edit exercises' : 'Add exercises'}</button>`}</div>`).join('')}
      <div class="small muted num">${w.days.filter(d => !d.off).length} training days \u00b7 ${total} sets a week</div>
      <button class="btn soft" data-act="bridge" data-v="draft" data-k="ask-ai-coach">${ic('spark')}Ask AI coach to improve this week</button>${planReopenBtn('draft')}
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
    const gps = gramsPer(x, s.r), gm = gps && s.gm !== false;
    const what = s.r ? `1 container${gps ? ' = ' + r0(gps) + ' g' : ''}` : `1 serving = ${x.servName ? esc(x.servName) : r1(x.serv) + ' ' + esc(x.unit)}${gps && !['g', 'ml'].includes(x.unit) ? ' (' + r0(gps) + ' g)' : ''}`;
    return `<div class="row"><div class="small muted grow">${what} \u00b7 ${esc(x.src || 'Recipe')}${x.barcode ? ' \u00b7 ' + x.barcode : ''}</div><button class="iconbtn star ${fav ? 'on' : ''}" data-act="favFood" data-id="${s.id}" aria-label="Favorite">${ic('star')}</button></div>
      ${gps ? `<div class="seg" data-k="qty-mode"><button class="${gm ? 'on' : ''}" data-act="qtyMode" data-v="g">Grams</button><button class="${gm ? '' : 'on'}" data-act="qtyMode" data-v="s">${s.r ? 'Containers' : x.servName ? esc(x.servName.replace(/\s*\(.*\)\s*$/, '')) : 'Servings'}</button></div>` : ''}
      ${gm ? `<div class="row"><button class="btn ghost" data-act="qtyG" data-v="-10">\u2212</button><input class="f num" style="text-align:center;font-size:1.3em" type="number" inputmode="decimal" step="1" value="${r0(s.qty * gps)}" data-in="qtyg"><span class="small muted">g</span><button class="btn ghost" data-act="qtyG" data-v="10">+</button></div>`
      : `<div class="row"><button class="btn ghost" data-act="qty" data-v="-0.5">\u2212</button><input class="f num" style="text-align:center;font-size:1.3em" type="number" step="0.25" value="${s.qty}" data-in="qty"><button class="btn ghost" data-act="qty" data-v="0.5">+</button></div>`}
      <div class="grid2 small num" data-k="qty-macros"><div><b>${r0(m.cal)}</b> kcal</div><div>P${r0(m.p)} C${r0(m.c)} F${r0(m.f)}</div></div>
      <div class="chips">${MEALS.map(mm => `<button class="chip ${s.meal === mm ? 'on' : ''}" data-act="sheetMeal" data-v="${mm}">${mm}</button>`).join('')}</div>
      ${s.mode === 'edit' && s.r && !s.plan ? `<button class="btn sm ghost" data-act="explode" data-id="${s.entry}" style="align-self:flex-start">Split into its foods</button>` : ''}
      ${s.mode === 'edit' ? `<div class="row"><button class="btn ghost" data-act="${s.plan ? 'unplan' : 'delEntry'}" data-id="${s.entry}">${ic('trash')}Delete</button><button class="btn block" data-act="${s.plan ? 'savePlan' : 'saveEntry'}">Save changes</button></div>` :
      s.plan ? `<button class="btn block" data-act="addPlan">Add to ${fmtDate(U.mpDay)}</button>` : `<button class="btn block" data-act="logFood">Log to ${U.foodDate === today ? 'today' : fmtDate(U.foodDate)}</button>`}`;
  };
  const gramsPer = (x, r) => r ? (x.cooked ? x.cooked / Math.max(1, x.containers) : null) : ['g', 'ml'].includes(x.unit) ? x.serv : (+x.grams || null);
  // "90 g" when the food has a gram weight, else "x1.5" servings.
  const qtyTxt = e => { if (e.quick) return ''; const x = e.recipeId ? recipesById()[e.recipeId] : foodsById()[e.foodId]; const g = x && gramsPer(x, !!e.recipeId); return g ? r0(e.qty * g) + ' g' : '\u00d7' + r1(e.qty); };
  SHEETS.scan = ({ code }) => `<div class="small">Barcode <b class="num">${esc(code)}</b> isn't in Open Food Facts.</div>
      <label class="fl">What is it? (helps the AI)<input class="f" id="scanName" placeholder="e.g. Kirkland protein bar, chocolate"></label>
      <button class="btn" data-act="labelAI">${ic('camera')}Photo of the nutrition label</button>
      <button class="btn soft" data-act="foodAI" data-src="scan">${ic('spark')}Look it up with AI</button>
      <button class="btn ghost" data-act="newFood">Enter it by hand</button>`;
  SHEETS.newFood = () => `<label class="fl">Name<input class="f" id="nf-name" placeholder="e.g. Mom's chili"></label><div class="grid2"><label class="fl">Serving size<input class="f" id="nf-serv" type="number" value="100"></label><label class="fl">Unit<input class="f" id="nf-unit" value="g"></label>${['cal', 'p', 'c', 'f'].map(k => `<label class="fl">${{ cal: 'Calories', p: 'Protein g', c: 'Carbs g', f: 'Fat g' }[k]}<input class="f num" id="nf-${k}" type="number" value="0"></label>`).join('')}</div><button class="btn block" data-act="saveFood">Save and log</button>`;
  SHEETS.weight = () => `<label class="fl">Today's weight (lb)<input class="f num" id="wt" type="number" step="0.1" value="${S.weights[S.weights.length - 1]?.lb || S.profile.weightLb}"></label><div class="tiny muted">Usually comes from your scale through Health Connect. Typed weights stay in this app.</div><button class="btn block" data-act="saveWeight">Save</button>`;
  SHEETS.bridge = (sh) => {
    const v = sh.v;
    const prompt = bridgePrompt(v);
    const has = S.ai.endpoint && S.ai.model;
    return `${has ? `<div class="small">Would send this to <b>${esc(S.ai.model)}</b>. (The preview doesn't call AI.)</div>` : `<div class="small">No AI set up. Copy this, paste it into Lumo or the Claude app, then paste the answer back.</div>`}
      ${extraBox(sh)}
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
    const res = s.q ? searchFoods(s.q, { noMeals: true }) : null;
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

  // Everything sent to the AI gets "Always tell the AI" (Settings) and this request's extra details.
  function bridgePrompt(v) {
    const p = bridgePromptBase(v), x = [S.ai.notes, U.sheet?.extra].map(t => (t || '').trim()).filter(Boolean).join('\n');
    if (!x) return p;
    const add = '\n\nImportant details from me (these override anything above, follow them):\n' + x + '\n\n';
    const k = ['\n\nSuggest 3-8', '\n\nReturn ONLY', 'Return ONLY'].map(m => p.lastIndexOf(m)).find(i => i >= 0);
    return k >= 0 ? p.slice(0, k) + add + p.slice(k).replace(/^\n+/, '') : p + add;
  }
  const extraBox = s => `<label class="fl" data-k="ai-extra"><span>Add details for the AI <span class="muted">(optional)</span></span><textarea class="f small" rows="2" data-in="bextra" placeholder="e.g. Monday and Wednesday don't work, I have night school">${esc(s.extra || '')}</textarea>${S.ai.notes ? `<span class="tiny muted">Also sends your "Always tell the AI" note from Settings.</span>` : ''}</label>`;
  function bridgePromptBase(v) {
    const own = EQUIPMENT.filter(e => S.equipment[e.id] === 'own').map(e => e.name).join(', ');
    const me = `I'm a ${S.profile.age}-year-old male, ${S.profile.level}, ${S.profile.weightLb} lb, ${ftIn(S.profile.heightIn)}, training at home with: ${own}.`;
    const weekText = (week, days) => week.map((d, i) => d.length ? `${DAYS[i]} (${days[i].groups.join('+') || 'daily min'}): ${d.map(x => `${exName(x.ex)} ${x.sets}x${schemeOf(x).lo}-${schemeOf(x).hi}`).join('; ')}` : `${DAYS[i]}: rest`).join('\n');
    if (v === 'workout') return `You are a fitness expert. Generate a workout routine based on these constraints:\n\nAvailable Equipment: ${own}\nFitness Level: ${S.profile.level}\nDuration Minutes: 45\nFocus Muscles: ${($('#genq')?.value || 'chest')}\nUser Goal: ${S.goal.rate < 0 ? 'lose fat, keep muscle' : S.goal.rate > 0 ? 'build muscle' : 'maintain'}\n\nReturn ONLY valid JSON in this exact format:\n{"routine_name":"string","exercises":[{"name":"string","sets":number,"reps":"string","rest_seconds":number,"notes":"string or null"}],"estimated_duration_minutes":number}\n\nDo not include any text outside the JSON object.`;
    if (v === 'plan' || v === 'draft') {
      const week = v === 'draft' ? U.wiz.week : S.planWeek || [], days = v === 'draft' ? U.wiz.days : S.days;
      const items = L.planCheck({ week, days, exById: EXB, targets: S.targets, focus: new Set(S.focus) }).map(x => `- ${x.title}: ${x.detail}`).join('\n');
      const planned = L.setsByMuscle(week.flat(), EXB), gear = ownedGear();
      const allowed = EX.filter(e => gear.has(e.g) && e.cat === 'strength').map(e => e.n);
      return `You are my strength coach. ${me}\nGoal: ${S.goal.rate}% body weight per week. Focus muscles: ${S.focus.join(', ') || 'none'}. I struggle with legs and squats, so I keep a daily leg minimum.\n\n${v === 'draft' ? 'My draft week' : 'My week'} (day: exercise sets x reps):\n${weekText(week, days)}\n\nSets per muscle per week: ${Object.entries(planned).filter(([, n]) => n).map(([m, n]) => `${m} ${n}`).join(', ')}\n\nMy app's automatic checks found:\n${items || '- nothing'}\n\nSuggest 3-8 specific changes to this week. My app applies them automatically, so each change must be one of these actions:\n- add: put "exercise" on "day" for "sets" sets\n- remove: take "exercise" off "day"\n- swap: replace "exercise" with "new_exercise" on "day" (or every day if day is null)\n- sets: set "exercise" on "day" to "sets" sets\n- rest_day: make "day" a rest day\n- move_day: move everything from "day" to "to_day" (which becomes a training day)\nIf my details rule out a day, use move_day or rest_day for it. Answer with the JSON only, no other text, even if my details ask a question.\nDays are Sun, Mon, Tue, Wed, Thu, Fri, Sat. Exercise names must be copied exactly from this list (my equipment):\n${allowed.join('; ')}\n\nReturn ONLY JSON: {"summary":"string","changes":[{"title":"short string","why":"string","action":"add|remove|swap|sets|rest_day|move_day","day":"Mon","exercise":"string or null","new_exercise":"string or null","sets":number or null,"to_day":"string or null"}]}`;
    }
    if (v === 'coach') {
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
    if (v === 'food') return `Analyze this food photo. Estimate each food's weight in grams and its macros. Return ONLY valid JSON:\n{"foods":[{"name":"string","grams":number,"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"confidence":number}],"total_calories":number,"protein_g":number,"carbs_g":number,"fat_g":number}\n\n(Attach the photo when you paste this.)`;
    if (v === 'recipes') return recipesPrompt();
    if (v === 'label') { const s = U.sheet || {}; return `Read the Nutrition Facts label in this photo${s.name ? ` (it's ${s.name})` : ''}. Use the label's serving size and its gram weight. If the label only gives a household measure, estimate the grams.\nReturn ONLY valid JSON: {"name":"string","brand":"string or null","serving":"string, e.g. 2 cookies","serving_g":number,"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"source":"label","confidence":number}\n\n(Attach the photo when you paste this.)`; }
    if (v === 'foodai') { const s = U.sheet || {}; return `Find the nutrition facts for this food${s.code ? ` (barcode ${s.code}, UPC/EAN)` : ''}${s.name ? `: ${s.name}` : ''}. Use the product's label if you know it, otherwise a close typical match, and say which.\nGive values for ONE serving and the serving's weight in grams.\nReturn ONLY valid JSON: {"name":"string","brand":"string or null","serving":"string, e.g. 1 bar","serving_g":number,"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"source":"label | typical estimate","confidence":number}`; }
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
  // Long-press a food in Recent/Favorites/search: remove it from the lists.
  A.foodMenu = d => { const x = itemById(d.id); if (!x) return; U.sheet = { kind: 'foodMenu', title: x.name, id: d.id }; render(); };
  SHEETS.foodMenu = ({ id }) => `${S.foods.some(f => f.id === id) ? `<button class="btn ghost" data-act="foodEdit" data-id="${id}">${ic('edit')}Edit food</button>` : ''}${S.recent.includes(id) ? `<button class="btn ghost" data-act="recentDel" data-id="${id}">${ic('trash')}Remove from Recent</button>` : ''}
      ${S.favFoods.includes(id) ? `<button class="btn ghost" data-act="favFood" data-id="${id}">${ic('star')}Remove from Favorites</button>` : ''}
      ${S.foods.some(f => f.id === id) && !S.log.some(e => e.foodId === id) && !S.recipes.some(r => r.ing.some(i => i.foodId === id)) ? `<button class="btn ghost" data-act="foodDel" data-id="${id}">${ic('trash')}Delete this food</button>` : `<div class="tiny muted">Logged foods stay in your food list so past days keep their numbers.</div>`}`;
  A.recentDel = d => { S.recent = S.recent.filter(x => x !== d.id); U.sheet = null; save(); toast('Removed from Recent.'); };
  A.foodDel = d => { S.foods = S.foods.filter(f => f.id !== d.id); S.recent = S.recent.filter(x => x !== d.id); S.favFoods = S.favFoods.filter(x => x !== d.id); U.sheet = null; save(); toast('Food deleted.'); };
  A.recentTab = d => { U.recentTab = d.v; if (S.recentClosed) { S.recentClosed = false; save(); } render(); };
  A.recentFold = () => { S.recentClosed = !S.recentClosed; save(); render(); };
  // Goals: edits go live on screen but only stick after Save (Cancel puts the old ones back).
  A.goalEdit = () => { U.goalEdit = JSON.parse(JSON.stringify({ goal: S.goal, profile: S.profile })); render(); };
  A.goalSave = () => { U.goalEdit = null; save(); toast('Goals saved.'); };
  A.goalCancel = quiet => { if (!U.goalEdit) return; S.goal = U.goalEdit.goal; S.profile = U.goalEdit.profile; U.goalEdit = null; save(); if (quiet !== true) render(); };
  A.mealToggle = d => { S.mealOpen[d.v] = S.mealOpen[d.v] === false; save(); render(); };
  A.addToMeal = d => { U.meal = d.v; U.focusId = 'foodq'; render(); if ($('#scroll')) $('#scroll').scrollTop = 0; };
  A.favFood = d => { const i = S.favFoods.indexOf(d.id); if (i >= 0) S.favFoods.splice(i, 1); else S.favFoods.unshift(d.id); save(); render(); };
  A.simScan = () => { const pool = S.foods.filter(f => f.barcode); const f = pool[Math.floor(Math.random() * pool.length)]; U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render(); };
  A.photoAI = () => { U.sheet = { kind: 'bridge', title: 'Plate photo', v: 'food' }; render(); };
  A.pickFood = d => { const r = !!d.r; const x = r ? recipesById()[d.id] : foodsById()[d.id]; U.sheet = { kind: 'food', title: x.name, id: d.id, r, qty: 1, meal: U.meal }; render(); };
  A.qty = d => { U.sheet.qty = Math.max(0.25, r1(U.sheet.qty + +d.v)); render(); };
  const sheetGps = () => { const s = U.sheet; return gramsPer(s.r ? recipesById()[s.id] : foodsById()[s.id], s.r); };
  A.aiOpen = () => { U.aiOpen = !U.aiOpen; render(); };
  const aiReadyTxt = () => S.ai.endpoint && S.ai.model ? 'Direct: ' + esc(S.ai.model) : 'Copy and paste';
  A.qtyMode = d => { U.sheet.gm = d.v === 'g'; render(); };
  A.qtyG = d => { const g = sheetGps(); U.sheet.qty = Math.max(1, Math.round(U.sheet.qty * g) + +d.v) / g; render(); };
  // AI macros for a food by barcode and/or name (scan miss, or no match in search).
  A.labelAI = () => { U.sheet = { kind: 'bridge', title: 'Read the label', v: 'label', code: U.scanCode, name: ($('#scanName')?.value || '').trim() }; render(); };
  A.foodAI = d => { const name = d.src === 'scan' ? ($('#scanName')?.value || '').trim() : U.q; U.sheet = { kind: 'bridge', title: 'Macros from AI', v: 'foodai', code: d.src === 'scan' ? U.scanCode : '', name }; render(); };
  A.sheetMeal = d => { U.sheet.meal = d.v; render(); };
  A.logFood = () => { const s = U.sheet; S.log.push({ id: 'l' + Date.now(), date: U.foodDate, meal: s.meal, [s.r ? 'recipeId' : 'foodId']: s.id, qty: s.qty }); S.recent = [s.id, ...S.recent.filter(x => x !== s.id)].slice(0, 25); U.sheet = null; U.q = ''; save(); toast('Logged.'); };
  A.editEntry = d => { const e = S.log.find(x => x.id === d.id); if (!e) return; if (e.quick) return A.quickAdd({ entry: e.id }); U.sheet = { kind: 'food', mode: 'edit', title: entryName(e), entry: e.id, id: e.recipeId || e.foodId, r: !!e.recipeId, qty: e.qty, meal: e.meal }; render(); };
  A.saveEntry = () => { const s = U.sheet, e = S.log.find(x => x.id === s.entry); if (e) { e.qty = s.qty; e.meal = s.meal; } U.sheet = null; save(); toast('Updated.'); };
  A.delEntry = d => { S.log = S.log.filter(e => e.id !== d.id); U.sheet = null; save(); toast('Removed.'); };
  A.newFood = () => foodCard({ name: U.scanCode ? '' : (U.q || '').trim() }, { code: U.scanCode });
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
  const newSet = (id, scheme) => { const sch = S.schemes[scheme] || S.schemes.build; const nx = S.next[id]; const bw = isBW(id); return { w: bw ? 0 : nx ? nx.w : (lastWeight(id) ?? startW(id, scheme) ?? ''), start: !bw && !nx && lastWeight(id) == null, reps: nx ? nx.reps : sch.lo, fail: false, pain: false, done: false }; };
  A.startWorkout = d => {
    const w = todaysWorkout()[+d.i];
    if (!w || !w.items.length) return;
    U.log = { kind: w.kind, name: w.name, wd: dow(today), items: w.items.map(it => ({ ...it })), idx: 0, sets: w.items.map(it => [...Array(it.sets)].map(() => newSet(it.ex, it.scheme))), start: Date.now() };
    U.stack = [{ kind: 'logger' }]; U.keepFullScroll = false; render(); logLive();
  };
  // Tap the open exercise to fold it; tap another to open that one.
  A.logGo = d => { const st = U.log; if (+d.i === st.idx) st.fold = !st.fold; else { st.idx = +d.i; st.fold = false; } render(); };
  A.logFoldAll = () => { U.log.fold = true; render(); };
  A.logOrder = () => { U.log.order = !U.log.order; render(); };
  A.logMove = (d, el, ev) => {
    ev?.stopPropagation?.();
    const st = U.log, i = +d.i, j = i + +d.v; if (j < 0 || j >= st.items.length) return;
    [st.items[i], st.items[j]] = [st.items[j], st.items[i]];
    [st.sets[i], st.sets[j]] = [st.sets[j], st.sets[i]];
    if (st.idx === i) st.idx = j; else if (st.idx === j) st.idx = i;
    render();
  };
  // Today's order becomes this weekday's order in the plan (exercises added today come along).
  A.logOrderSave = () => { const st = U.log; if (!S.planWeek || st.wd == null) return; S.planWeek[st.wd] = st.items.map(it => ({ ...it })); save(); st.order = false; toast('Saved this order to your ' + DAYS[st.wd] + ' plan.'); };
  A.restVoice = () => { S.restVoice = !S.restVoice; save(); if (!S.restVoice) voiceStop(); else if (U.rest) voiceStart(); render(); };
  A.modPep = () => { S.modules.peptides = !S.modules.peptides; save(); render(); };

  // Spoken rest countdown. The installed app does it natively (keeps time with the screen off);
  // the preview uses the browser's voice.
  function voiceStart() {
    if (!S.restVoice || !U.rest) return;
    const secs = Math.max(0, Math.round((U.rest.until - Date.now()) / 1000));
    if (REAL && window.HFDev.restStart) return window.HFDev.restStart(secs);
    U.rest.cues = {};
  }
  function voiceStop() { if (REAL && window.HFDev.restStop) window.HFDev.restStop(); if (U.rest) U.rest.cues = null; }
  function voiceTick(r) {
    if (REAL || !S.restVoice || !U.rest || !U.rest.cues || !window.speechSynthesis) return;
    const c = U.rest.cues; if (c[r]) return;
    const txt = r === 0 ? 'Go' : r <= 3 ? String(r) : r === 10 ? '10 seconds' : r % 30 === 0 && r < U.rest.total ? (r <= 90 ? r + ' seconds remaining' : r % 60 ? Math.floor(r / 60) + ' minutes ' + (r % 60) + ' seconds remaining' : r / 60 + ' minutes remaining') : '';
    if (!txt) return; c[r] = 1;
    try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(txt)); } catch (e) {}
  }

  // Live burn while you lift: the watch's calories if Health Connect has them, else heart rate, else time.
  function liveKcal(st) {
    const min = Math.max(0, (Date.now() - st.start) / 60000);
    if (st.watchKcal > 0) return { kcal: st.watchKcal, src: 'From your watch' };
    if (st.liveHr) return { kcal: L.sessionCalories(S.profile, min, st.liveHr), src: 'From your heart rate (' + st.liveHr + ' bpm avg)' };
    return { kcal: L.sessionCalories(S.profile, min, null, st.kind === 'morning' ? L.MET.light : L.MET.strength), src: 'Estimated from time' };
  }
  function logLive() {
    clearInterval(logLive.t);
    if (REAL && window.HFDev.keepScreen) window.HFDev.keepScreen(true);
    const poll = () => {
      const st = U.log; if (!st) { clearInterval(logLive.t); if (REAL && window.HFDev.keepScreen) window.HFDev.keepScreen(false); return; }
      if (REAL && S.hc.connected) {
        const a = { start: new Date(st.start).toISOString(), end: new Date().toISOString() };
        native('hcHeartRate', a).then(r => { if (r.avg && U.log === st) st.liveHr = r.avg; });
        native('hcCalories', a).then(r => { if (r.kcal && U.log === st) st.watchKcal = r.kcal; });
      }
      const el = document.querySelector('[data-k="live-burn"]');
      if (el && topFull()?.kind === 'logger') { const lk = liveKcal(st); el.textContent = `${Math.max(0, Math.round((Date.now() - st.start) / 60000))} min \u00b7 ${r0(lk.kcal)} kcal`; el.title = lk.src; }
    };
    logLive.t = setInterval(poll, 30000);
  }
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
    const secs = st.kind === 'morning' ? 20 : schemeOf(st.items[st.idx]).rest;
    U.rest = { until: Date.now() + secs * 1000, total: secs };
    st.fold = false;
    if (cur === ss.length - 1) { const nx = st.sets.findIndex(x => x.some(s => !s.done)); if (nx >= 0) st.idx = nx; }
    render(); voiceStart(); tickRest();
  };
  function tickRest() { clearInterval(tickRest.t); tickRest.t = setInterval(() => { const r = U.rest ? Math.max(0, Math.ceil((U.rest.until - Date.now()) / 1000)) : 0; if (U.rest) voiceTick(r); if (!U.rest || Date.now() > U.rest.until) { clearInterval(tickRest.t); U.rest = null; } if (topFull()?.kind === 'logger') { const el = $('.restbar b'); if (el && U.rest) { el.textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; } else render(); } }, 1000); }
  A.restAdd = () => { if (U.rest) { U.rest.until += 30000; U.rest.total = Math.round((U.rest.until - Date.now()) / 1000); voiceStart(); } render(); };
  A.restSkip = () => { voiceStop(); U.rest = null; render(); };
  A.quitLog = () => { voiceStop(); U.stack = []; U.log = null; U.rest = null; toast('Workout discarded.'); };
  A.finishLog = () => {
    const st = U.log; voiceStop(); U.rest = null;
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
    const kcal = st.watchKcal > 0 ? r0(st.watchKcal) : L.sessionCalories(S.profile, min, st.kind === 'morning' ? null : (st.liveHr || avgHr), st.kind === 'morning' ? L.MET.light : L.MET.strength);
    S.sessions.push({ id: 's' + Date.now(), date: today, morning: st.kind === 'morning', start: new Date().toISOString(), min, avgHr: st.liveHr || avgHr, kcal, kcalSrc: st.watchKcal > 0 ? 'watch' : (st.liveHr || avgHr) ? 'hr' : 'time', sets });
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
  // Changing the weight carries it to the sets you haven't done yet (drop to 80 -> the rest are 80).
  IN.bextra = el => { U.sheet.extra = el.value; const o = $('#bridgeOut'); if (o) o.value = bridgePrompt(U.sheet.v); };
  IN.qtyg = el => { const g = sheetGps(); if (g && +el.value > 0) U.sheet.qty = +el.value / g; const m = $('[data-k="qty-macros"]'); if (m) { const s = U.sheet, x = s.r ? recipesById()[s.id] : foodsById()[s.id]; const t = s.r ? L.scale(L.recipePerContainer(x, foodsById()), s.qty) : L.scale(x, s.qty); m.innerHTML = `<div><b>${r0(t.cal)}</b> kcal</div><div>P${r0(t.p)} C${r0(t.c)} F${r0(t.f)}</div>`; } };
  IN.setw = el => {
    const i = +el.dataset.i, w = el.value === '' ? '' : +el.value, sets = U.log.sets[U.log.idx];
    sets[i].w = w; sets[i].start = false;
    sets.forEach((s, j) => { if (j > i && !s.done) { s.w = w; s.start = false; const inp = document.querySelector(`[data-in="setw"][data-i="${j}"]`); if (inp) inp.value = w; } });
  };
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
  const LIVE = ['ingq', 'foodq', 'libq', 'swapq', 'planq', 'rate', 'setw', 'setr', 'qty', 'qtyg', 'bextra', 'rname', 'wizName'];
  const onIn = ev => { const el = ev.target.closest('[data-in]'); if (!el) return; const fn = IN[el.dataset.in]; if (fn) fn(el, ev); };
  phone.addEventListener('input', ev => { if (LIVE.includes(ev.target.dataset?.in)) onIn(ev); });
  phone.addEventListener('change', ev => { const k = ev.target.dataset?.in; if (!LIVE.includes(k)) onIn(ev); if (k === 'qty') render(); });

  // Drag a logged food by its grip to another meal.
  let drag = null;
  // Long press (about half a second) on anything with data-long.
  let longT = null, longFired = false, longXY = null;
  phone.addEventListener('pointerdown', ev => {
    longFired = false;
    const el = ev.target.closest('[data-long]'); if (!el || ev.target.closest('button,[data-drag]')) return;
    longXY = [ev.clientX, ev.clientY]; clearTimeout(longT);
    longT = setTimeout(() => { longFired = true; navigator.vibrate?.(20); const fn = A[el.dataset.long]; if (fn) fn(el.dataset, el); }, 550);
  });
  const longCancel = ev => { if (longT && (!ev || ev.type !== 'pointermove' || Math.hypot(ev.clientX - longXY[0], ev.clientY - longXY[1]) > 10)) { clearTimeout(longT); longT = null; } };
  ['pointerup', 'pointercancel', 'pointermove'].forEach(t => phone.addEventListener(t, longCancel));
  phone.addEventListener('click', ev => { if (longFired) { longFired = false; ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
  phone.addEventListener('contextmenu', ev => { if (ev.target.closest('[data-long]')) ev.preventDefault(); });
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
      toast('Looking up ' + code + '\u2026');
      const res = await native('http', { url: `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity` });
      let j = null; try { j = JSON.parse(res.body || ''); } catch (e) {}
      if (j && j.status === 1 && j.product) { f = offFood(code, j.product); S.foods.push(f); save(); }
    }
    if (!f) { U.scanCode = code; U.sheet = { kind: 'scan', title: 'Not found', code }; return render(); }
    U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render();
  };

  // ----- Online food search (Open Food Facts), right inside the food log -----
  // Gives up after ms so a slow service can't leave "Searching\u2026" up forever.
  const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(what + ' took too long')), ms))]);
  async function getJson(url, ms = 12000) { return withTimeout(getJson0(url), ms, 'Open Food Facts'); }
  async function getJson0(url) {
    if (REAL) { const r = await native('http', { url }); if (r.error) throw new Error(r.error); if (r.status < 200 || r.status > 299) throw new Error('HTTP ' + r.status); return JSON.parse(r.body || 'null'); }
    const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
  }
  A.offSearch = async () => {
    const q = (U.q || '').trim(); if (!q) return;
    U.off = { q, busy: true, items: [] }; render();
    const fields = 'code,product_name,brands,nutriments,serving_size,serving_quantity';
    // Open Food Facts' two searches and USDA's branded foods run at once. Results show as each one answers;
    // a slow one gives up after its time limit instead of leaving "Searching\u2026" up.
    const ok = p => p && p.code && p.product_name && p.nutriments && (p.nutriments['energy-kcal_100g'] != null || p.nutriments['energy-kcal_serving'] != null);
    const got = { a: [], b: [], br: [] }, errs = [];
    let left = 3;
    const show = () => {
      if (U.off?.q !== q) return;
      const seen = new Set();
      const off = [...got.a, ...got.b].filter(p => ok(p) && !seen.has(p.code) && seen.add(p.code)).map(p => offFood(p.code, p));
      const items = [...off, ...got.br];
      U.off = { q, busy: left > 0 && !items.length, more: left > 0, items, err: !items.length && !left ? errs[0] || '' : '' }; render();
    };
    const run = (k, pr) => pr.then(v => { got[k] = v || []; }, e => { errs.push(e.message); }).finally(() => { left--; show(); });
    run('a', getJson(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=20&fields=${fields}`).then(j => (j && j.hits) || []));
    run('b', getJson(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=20&fields=${fields}`, 15000).then(j => (j && j.products) || []));
    run('br', window.usdaBranded ? withTimeout(window.usdaBranded(q), 12000, 'USDA') : Promise.resolve([]));
  };
  A.offPick = d => {
    const f = (d.id && U.off?.items?.find(x => x.id === d.id)) || U.off?.items?.[+d.i]; if (!f) return;
    if (!S.foods.some(x => x.id === f.id)) { S.foods.push(f); save(); }
    if (topFull()?.kind === 'ingPick') return A.ingAdd({ id: f.id });
    U.sheet = { kind: 'food', title: f.name, id: f.id, r: false, qty: 1, meal: U.meal }; render();
  };
  // Results card shown under "No match in your foods" (and below your own matches).
  window.offBlock = () => {
    const o = U.off && U.off.q === (U.q || '').trim() ? U.off : null;
    const btns = `<div class="row wrap"><button class="btn sm" data-act="offSearch" ${o?.busy ? 'disabled' : ''}>${ic('search')}${o?.busy ? 'Searching\u2026' : 'Search online'}</button><button class="btn sm soft" data-act="foodAI" data-src="search">${ic('spark')}Ask AI for macros</button><button class="btn sm ghost" data-act="newFood">${ic('plus')}By hand</button></div>`;
    if (!o || o.busy) return btns;
    return `${o.items.length ? `<div class="tiny muted caps">Packaged foods (Open Food Facts, USDA)${o.more ? ' \u00b7 still checking\u2026' : ''}</div><div class="list">${o.items.map((f, i) => `<div class="li" data-act="offPick" data-i="${i}" data-id="${esc(f.id)}"><div class="grow"><div class="small">${esc(f.name)}</div><div class="tiny muted num">${r0(f.cal)} kcal \u00b7 P${r0(f.p)} C${r0(f.c)} F${r0(f.f)} per ${f.servName ? esc(f.servName) : r0(f.serv) + ' g'}</div></div></div>`).join('')}</div>` : `<div class="small muted">${o.err ? 'Online search failed: ' + esc(o.err) : 'Nothing online for "' + esc(o.q) + '".'} Try fewer words, or ask the AI.</div>`}${btns}`;
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
    if (!REAL || !S.hc.connected) return;
    const a = { start: new Date(startMs).toISOString(), end: new Date().toISOString() };
    sess.win = a;
    const upd = () => { const f = U.stack.find(x => x.kind === 'summary'); if (f) { f.avgHr = sess.avgHr; f.kcal = sess.kcal; } save(); render(); };
    native('hcCalories', a).then(r => {
      if (r.kcal > 0) { sess.kcal = r0(r.kcal); sess.kcalSrc = 'watch'; return upd(); }
      if (!S.hc.read.hr) return;
      native('hcHeartRate', a).then(h => {
        if (!h.avg || sess.kcalSrc === 'watch') return;
        sess.avgHr = h.avg; sess.kcalSrc = 'hr';
        sess.kcal = L.sessionCalories(S.profile, sess.min, h.avg, sess.morning ? L.MET.light : L.MET.strength);
        upd();
      });
    });
  }
  // The watch often syncs to Health Connect later, so today's workouts check again when the app comes back.
  function hcRecheckBurn() {
    if (!REAL || !S.hc.connected) return;
    S.sessions.filter(s => s.date === today && s.win && s.kcalSrc !== 'watch').forEach(s => native('hcCalories', s.win).then(r => { if (r.kcal > 0) { s.kcal = r0(r.kcal); s.kcalSrc = 'watch'; save(); render(); } }));
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) hcRecheckBurn(); });
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
    const r = await native('http', { url: aiUrl(), method: 'POST', useAiKey: true, body: JSON.stringify({ model: S.ai.model, max_tokens: 4096, messages: [{ role: 'user', content }] }) });
    if (r.error) throw new Error(r.error);
    let j = null; try { j = JSON.parse(r.body); } catch (e) {}
    if (r.status < 200 || r.status > 299) throw new Error(`${r.status}: ${(j && (j.error?.message || j.message)) || (r.body || '').slice(0, 160)}`);
    const ch = j?.choices?.[0], msg = ch?.message?.content;
    const out = Array.isArray(msg) ? msg.map(x => x.text || '').join('') : (msg || '');
    if (!out.trim()) throw new Error(`The AI sent back an empty answer${ch?.finish_reason ? ' (' + ch.finish_reason + ')' : ''}. Tap Ask AI again; if it keeps happening, try another model.`);
    return out;
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
    const needsImg = ['food', 'eqphoto', 'label'].includes(s.v);
    if (needsImg && !s.img) return toast('Add a photo first.');
    s.busy = true; s.err = ''; s.noChanges = false; render();
    try { s.answer = await aiCall(bridgePrompt(s.v).replace(/\n\n\(Attach the photo when you paste this\.\)/, ''), needsImg ? s.img : null); }
    catch (e) { s.err = e.message; }
    s.busy = false; render();
  };
  const bridgeBase = SHEETS.bridge;
  SHEETS.bridge = s => {
    if (!aiReady()) return bridgeBase(s);
    const needsImg = ['food', 'eqphoto', 'label'].includes(s.v);
    return `<div class="small">Sends to <b>${esc(S.ai.model)}</b>${window.HFDev.hasSecret('ai_key') ? '' : ' (no API key saved)'}.</div>
      ${needsImg ? `<div class="row wrap"><label class="btn ghost sm" style="cursor:pointer">${ic('camera')}${s.img ? 'Retake' : 'Take photo'}<input type="file" accept="image/*" capture="environment" data-in="aiImg" hidden></label><label class="btn ghost sm" style="cursor:pointer">${ic('plate')}${s.img ? 'Pick another' : 'Choose photo'}<input type="file" accept="image/*" data-in="aiImg" hidden></label></div>${s.img ? `<img src="${s.img}" alt="" style="max-height:160px;border-radius:8px;align-self:flex-start">` : ''}` : ''}
      ${extraBox(s)}
      <button class="btn" data-act="aiSend" ${s.busy ? 'disabled' : ''}>${ic('spark')}${s.busy ? 'Asking\u2026' : s.answer ? 'Ask again' : 'Ask AI'}</button>
      ${s.err ? `<div class="small" style="color:var(--a-alert)">${esc(s.err)}</div>` : ''}
      ${s.answer ? aiAnswerView(s) : ''}
      <label class="fl">Answer<textarea class="f small" rows="4" id="bridgeIn" placeholder='{ ... }'>${esc(s.answer || '')}</textarea></label>
      <button class="btn soft" data-act="bridgeApply" data-v="${s.v}">Apply</button>
      <details class="tiny"><summary>Prompt</summary><textarea class="f small" rows="6" readonly id="bridgeOut">${esc(bridgePrompt(s.v))}</textarea></details>`;
  };
  const parseJson = t => {
    t = String(t || '');
    const tries = [], fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) tries.push(fence[1]);
    tries.push((t.match(/\{[\s\S]*\}/) || [''])[0]);
    // Every balanced {...} block, biggest first.
    for (let i = t.indexOf('{'); i >= 0; i = t.indexOf('{', i + 1)) {
      let d = 0, q = false;
      for (let k = i; k < t.length; k++) { const c = t[k]; if (q) { if (c === '\\') k++; else if (c === '"') q = false; } else if (c === '"') q = true; else if (c === '{') d++; else if (c === '}' && --d === 0) { tries.push(t.slice(i, k + 1)); break; } }
    }
    for (const s of tries.sort((a, b) => b.length - a.length)) { try { const j = JSON.parse(s); if (j && typeof j === 'object') return j; } catch (e) {} }
    return null;
  };
  // Readable view of the answer before applying it.
  function aiAnswerView(s) {
    const j = parseJson(s.answer); if (!j) return '';
    if (j.suggestions) return `<ul class="blist">${j.suggestions.map(x => `<li><span class="bn"><b>${esc(x.title)}</b>: ${esc(x.change || '')} <span class="muted">${esc(x.why || '')}</span></span></li>`).join('')}</ul>`;
    if (j.exercises) return `<b class="small">${esc(j.routine_name || 'Workout')}</b><ul class="blist">${j.exercises.map(x => `<li><span class="bn">${esc(x.name)}${aiEx(x.name) ? '' : ' <span class="muted">(not in your list)</span>'}</span><span class="bt num">${x.sets} \u00d7 ${esc(String(x.reps))}</span></li>`).join('')}</ul>`;
    if (j.serving_g != null) return `<div class="small"><b>${esc(j.name || '')}</b>${j.brand ? ' \u00b7 ' + esc(j.brand) : ''}</div><div class="small num">${esc(j.serving || '1 serving')} (${r0(j.serving_g)} g): ${r0(j.calories)} kcal \u00b7 P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div><div class="tiny muted">${esc(j.source || '')}</div>`;
    if (j.foods) return `<ul class="blist">${j.foods.map(x => `<li><span class="bn">${esc(x.name)}</span><span class="bt num">${r0(x.grams)} g${x.calories != null ? ' \u00b7 ' + r0(x.calories) + ' kcal' : ''}</span></li>`).join('')}</ul><div class="small num">${r0(j.total_calories)} kcal \u00b7 P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div>`;
    if (j.calories) return `<div class="small num">${r0(j.calories)} kcal \u00b7 P${r0(j.protein_g)} C${r0(j.carbs_g)} F${r0(j.fat_g)}</div><div class="tiny muted">${esc(j.reason || '')}</div>`;
    if (j.matches) return `<div class="small">Found: ${j.matches.map(esc).join(', ') || 'nothing from your list'}</div>`;
    if (j.why) return `<div class="small">${esc(j.why)}</div>`;
    return '';
  }
  const aiEx = name => { const n = String(name).toLowerCase().replace(/[^a-z0-9 ]/g, ''); return EX.find(e => e.n.toLowerCase().replace(/[^a-z0-9 ]/g, '') === n) || EX.find(e => e.n.toLowerCase().includes(n) || n.includes(e.n.toLowerCase())); };
  const applyRecipe = A.bridgeApply;
  A.bridgeApply = d => {
    if (d.v === 'recipe' || (!REAL && d.v !== 'foodai' && d.v !== 'label')) return applyRecipe(d);
    const j = parseJson($('#bridgeIn').value);
    if (!j) return toast('That answer isn\'t valid JSON.');
    if (d.v === 'food') {
      // Each food on the plate becomes its own entry, in grams, so every portion can be adjusted.
      const t = Date.now(), parts = (j.foods || []).filter(x => +x.grams > 0 && x.calories != null);
      const add = (k, name, grams, m) => { const f = { id: 'c' + t + '_' + k, name, src: 'AI photo', serv: Math.round(grams), unit: 'g', cal: r1(+m.cal || 0), p: r1(+m.p || 0), c: r1(+m.c || 0), f: r1(+m.f || 0) }; S.foods.push(f); S.log.push({ id: 'l' + t + '_' + k, date: U.foodDate, meal: U.meal, foodId: f.id, qty: 1 }); };
      if (parts.length) parts.forEach((x, k) => add(k, x.name, +x.grams, { cal: x.calories, p: x.protein_g, c: x.carbs_g, f: x.fat_g }));
      else add(0, 'Plate: ' + (j.foods || []).map(x => x.name).slice(0, 3).join(', '), (j.foods || []).reduce((a, x) => a + (+x.grams || 0), 0) || 300, { cal: j.total_calories, p: j.protein_g, c: j.carbs_g, f: j.fat_g });
      toast(`Logged ${parts.length || 1} item${parts.length > 1 ? 's' : ''} to ${U.meal.toLowerCase()}. Tap any to change the grams.`);
    } else if (d.v === 'foodai' || d.v === 'label') {
      const s = U.sheet;
      return foodCard({ name: [j.name || s.name || 'Food', j.brand].filter(Boolean).join(' \u00b7 '), servName: j.serving || '', grams: +j.serving_g || 100, cal: +j.calories || 0, p: +j.protein_g || 0, c: +j.carbs_g || 0, f: +j.fat_g || 0 },
        { review: d.v === 'label' ? 'Read from the label.' : 'Looked up by AI' + (j.source ? ' (' + j.source + ')' : '') + '.', code: s.code || '', src: d.v === 'label' ? 'Label photo' : 'AI' });
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
      U.log = { kind: 'main', name: j.routine_name || 'AI workout', wd: null, items, idx: 0, sets: items.map(it => [...Array(it.sets)].map(() => newSet(it.ex, it.scheme))), start: Date.now() };
      U.stack = [{ kind: 'logger' }]; U.keepFullScroll = false; render(); return logLive();
    } else { U.sheet = null; return render(); }
    U.sheet = null; gameCache = null; save(); render();
  };

  // ----- AI coach changes to a plan: pick which ones, then apply them for real -----
  const PLAN_V = ['draft', 'plan'];
  const planRef = v => v === 'draft' ? U.wiz : { get days() { return S.days; }, get week() { return S.planWeek || (S.planWeek = [...Array(7)].map(() => [])); } };
  const dayIx = n => { const t = String(n || '').trim().slice(0, 3).toLowerCase(); return DAYS.findIndex(d => d.toLowerCase() === t); };
  const exOf = n => n ? aiEx(n) : null;
  const sameEx = (a, b) => a === b;
  // Checks a change against the current week. Returns why it can't apply, or ''.
  function planWhyNot(c, ref) {
    const a = String(c.action || '').toLowerCase(), i = dayIx(c.day), e = exOf(c.exercise);
    if (!['add', 'remove', 'swap', 'sets', 'rest_day', 'move_day'].includes(a)) return 'unknown change type';
    if (a !== 'swap' && i < 0) return 'no day given';
    if (a === 'move_day' && dayIx(c.to_day) < 0) return 'no target day';
    if (['add', 'remove', 'swap', 'sets'].includes(a) && !e) return `"${c.exercise}" isn't in your exercise list`;
    if (a === 'swap' && !exOf(c.new_exercise)) return `"${c.new_exercise}" isn't in your exercise list`;
    if ((a === 'remove' || a === 'sets') && !ref.week[i].some(x => sameEx(x.ex, e.id))) return `${e.n} isn't on ${DAYS[i]}`;
    if (a === 'swap' && !(i >= 0 ? ref.week[i] : ref.week.flat()).some(x => sameEx(x.ex, e.id))) return `${e.n} isn't in the week`;
    return '';
  }
  function planText(c) {
    const a = String(c.action || '').toLowerCase(), d = DAYS[dayIx(c.day)] || 'every day', e = exOf(c.exercise)?.n || c.exercise, n = exOf(c.new_exercise)?.n || c.new_exercise;
    return { add: `${d}: add ${e}, ${c.sets || 3} sets`, remove: `${d}: remove ${e}`, swap: `${d}: ${e} \u2192 ${n}`, sets: `${d}: ${e} to ${c.sets} sets`, rest_day: `${d}: rest day`, move_day: `Move ${d} to ${DAYS[dayIx(c.to_day)] || c.to_day}` }[a] || a;
  }
  function planDo(c, ref) {
    const a = String(c.action || '').toLowerCase(), i = dayIx(c.day), e = exOf(c.exercise), sets = Math.max(1, Math.min(10, Math.round(+c.sets || 3)));
    if (a === 'add') { ref.days[i].off = false; const it = ref.week[i].find(x => x.ex === e.id); if (it) it.sets = sets; else ref.week[i].push({ ex: e.id, sets, scheme: 'build' }); }
    else if (a === 'remove') ref.week[i] = ref.week[i].filter(x => x.ex !== e.id);
    else if (a === 'sets') ref.week[i].forEach(x => { if (x.ex === e.id) x.sets = sets; });
    else if (a === 'swap') { const to = exOf(c.new_exercise); (i >= 0 ? [ref.week[i]] : ref.week).forEach(list => list.forEach(x => { if (x.ex === e.id) x.ex = to.id; })); }
    else if (a === 'rest_day') { ref.days[i].off = true; ref.week[i] = ref.week[i].filter(x => x.daily); }
    else if (a === 'move_day') { const j = dayIx(c.to_day); ref.days[j] = { ...ref.days[i], off: false }; ref.week[j] = [...ref.week[j].filter(x => x.daily), ...ref.week[i].filter(x => !x.daily)]; ref.days[i] = { ...ref.days[i], off: true, groups: [] }; ref.week[i] = ref.week[i].filter(x => x.daily); }
  }
  // Finds the "changes" list even if the AI wrapped it in another object.
  const changesIn = j => { if (!j || typeof j !== 'object') return null; if (Array.isArray(j.changes) && j.changes.length) return j; for (const v of Object.values(j)) { const r = v && typeof v === 'object' && !Array.isArray(v) ? changesIn(v) : null; if (r) return r; } return null; };
  const planLoad = (s, j) => {
    s.changes = j.changes; s.summary = j.summary || ''; s.pick = j.changes.map(c => !planWhyNot(c, planRef(s.v))); s.noChanges = false;
    U.lastAi = U.lastAi || {}; U.lastAi[s.v] = { answer: s.answer || $('#bridgeIn')?.value || JSON.stringify(j), extra: s.extra || '' };
  };
  // "Show last AI answer": reopens the pick-list after the sheet was closed.
  A.planReopen = d => {
    const last = U.lastAi?.[d.v]; if (!last) return;
    U.sheet = { kind: 'bridge', title: 'Last AI coach answer', v: d.v, answer: last.answer, extra: last.extra };
    const j = changesIn(parseJson(last.answer)); if (j) planLoad(U.sheet, j);
    render();
  };
  window.planReopenBtn = v => U.lastAi?.[v] ? `<button class="btn ghost sm" data-act="planReopen" data-v="${v}" style="align-self:flex-start">Show last AI answer</button>` : '';
  const bridgeSheet2 = SHEETS.bridge;
  SHEETS.bridge = s => {
    if (!s.changes) return (s.noChanges ? `<div class="small" style="color:var(--a-warn)">The AI answered, but not with changes the app can apply. Tap Ask AI again (your details are kept).</div>` : '') + bridgeSheet2(s) + (s.answer && changesIn(parseJson(s.answer)) ? `<button class="btn block" data-act="planShow">Review and apply changes</button>` : '');
    const ref = planRef(s.v), n = s.pick.filter(Boolean).length;
    return `${s.summary ? `<div class="small">${esc(s.summary)}</div>` : ''}<div class="tiny muted">Tap to choose which changes to apply. Unchecked ones are left out.</div>
      ${s.changes.map((c, i) => { const no = planWhyNot(c, ref); return `<div class="card tight row" data-k="plan-change" data-act="${no ? 'noop' : 'planTog'}" data-i="${i}" style="cursor:pointer;flex-direction:row;gap:12px;align-items:flex-start;${no ? 'opacity:.55' : ''}"><span class="ckbox ${s.pick[i] ? 'on' : ''}">${s.pick[i] ? ic('check') : ''}</span><div class="grow"><b class="small">${esc(c.title || planText(c))}</b><div class="tiny num">${esc(planText(c))}</div>${c.why ? `<div class="tiny muted">${esc(c.why)}</div>` : ''}${no ? `<div class="tiny" style="color:var(--a-warn)">Can't apply: ${esc(no)}</div>` : ''}</div></div>`; }).join('')}
      <div class="row"><button class="btn ghost" data-act="planBackAi">Back</button><button class="btn block" data-act="planApply" ${n ? '' : 'disabled'}>Apply ${n} change${n === 1 ? '' : 's'}</button></div>`;
  };
  A.planTog = d => { U.sheet.pick[+d.i] = !U.sheet.pick[+d.i]; render(); };
  A.planShow = () => { const s = U.sheet, j = changesIn(parseJson(s.answer)); if (j) { planLoad(s, j); render(); } };
  A.planBackAi = () => { const s = U.sheet; delete s.changes; render(); };
  A.planApply = () => {
    const s = U.sheet, ref = planRef(s.v); let ok = 0;
    s.changes.forEach((c, i) => { if (s.pick[i] && !planWhyNot(c, ref)) { planDo(c, ref); ok++; } });
    U.sheet = null;
    if (s.v === 'plan') { gameCache = null; save(); }
    toast(`Applied ${ok} change${ok === 1 ? '' : 's'}.${s.v === 'draft' ? ' Review the week, then save.' : ''}`);
    if (s.v === 'draft' && U.wiz.step === 'review') U.wiz.step = 'edit';
    render();
  };
  const bridgeApply2 = A.bridgeApply;
  A.bridgeApply = d => {
    if (!PLAN_V.includes(d.v)) return bridgeApply2(d);
    const raw = $('#bridgeIn').value, j = changesIn(parseJson(raw));
    if (!j) { U.sheet.noChanges = true; render(); return toast('That answer has no changes the app can apply.'); }
    if (!U.sheet.answer) U.sheet.answer = raw;
    planLoad(U.sheet, j); render();
  };
  const aiSend2 = A.aiSend;
  A.aiSend = async () => {
    await aiSend2();
    const s = U.sheet;
    if (s && PLAN_V.includes(s.v) && s.answer) { const j = changesIn(parseJson(s.answer)); if (j) planLoad(s, j); else s.noChanges = true; render(); }
  };

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
    return `<div class="card tight" data-k="usual-now"><div class="tiny muted">Usually at ${U.meal.toLowerCase()} \u00b7 tap to log</div><div class="chips">${us.map(x => `<button class="chip" data-act="usualLog" data-id="${x.key}" data-r="${x.recipeId ? 1 : ''}" data-q="${x.qty}">${ic('plus', 'class="inl"')}${esc(itemName(x))} <span class="muted">${qtyTxt(x)}</span></button>`).join('')}</div></div>`;
  }
  A.usualLog = d => { const it = d.r ? { recipeId: d.id, qty: +d.q } : { foodId: d.id, qty: +d.q }; logItem(it, U.foodDate, U.meal); save(); toast(`Logged ${itemName(it)}.`); };

  // ----- Quick add (#4) -----
  // One "Add your own" sheet: log numbers once, or flip "Save to my foods" to keep it for next time.
  A.quickAdd = d => { const e = d && d.entry ? S.log.find(x => x.id === d.entry) : null; U.sheet = { kind: 'quick', title: e ? 'Quick add' : 'Add your own', entry: e?.id, meal: e?.meal || U.meal, keep: false, q: e ? { ...e.quick } : { name: U.q ? U.q.trim() : '', cal: '', p: '', c: '', f: '', servName: '', grams: '' } }; render(); };
  const qaRead = s => { ['name', 'servName'].forEach(k => { const el = $('#qa-' + k); if (el) s.q[k] = el.value; }); ['cal', 'p', 'c', 'f', 'grams'].forEach(k => { const el = $('#qa-' + k); if (el) s.q[k] = el.value === '' ? '' : +el.value; }); };
  A.quickKeep = () => { const s = U.sheet; qaRead(s); s.keep = !s.keep; render(); };
  SHEETS.quick = s => `${s.entry ? '<div class="small muted">A one-time entry. No food is saved.</div>' : `<div class="row"><span class="grow small"><b>Save to my foods</b><br><span class="tiny muted">${s.keep ? 'Kept for next time, with its barcode if you scanned one.' : 'Off: logs these numbers once (restaurant meals, guesses).'}</span></span>${sw(s.keep, 'quickKeep')}</div>`}
    <label class="fl">${s.keep ? 'Name' : 'What was it? (optional)'}<input class="f" id="qa-name" value="${esc(s.q.name || '')}" placeholder="${s.keep ? 'e.g. Kirkland protein bar' : 'e.g. Chipotle bowl'}"></label>
    ${s.keep ? `<div class="grid2"><label class="fl">One serving is<input class="f" id="qa-servName" value="${esc(s.q.servName || '')}" placeholder="e.g. 1 bar"></label><label class="fl">Weighs (g)<input class="f num" id="qa-grams" type="number" inputmode="decimal" value="${s.q.grams === '' || s.q.grams == null ? '' : s.q.grams}" placeholder="100"></label></div><div class="tiny muted">Numbers below are for one serving.</div>` : ''}
    <div class="grid2">${[['cal', 'Calories'], ['p', 'Protein g'], ['c', 'Carbs g'], ['f', 'Fat g']].map(([k, l]) => `<label class="fl">${l}<input class="f num" id="qa-${k}" type="number" inputmode="decimal" value="${s.q[k] === '' ? '' : r0(s.q[k])}"></label>`).join('')}</div>
    <div class="tiny muted">Leave calories blank and it's worked out from the macros.</div>
    <div class="chips">${MEALS.map(m => `<button class="chip ${s.meal === m ? 'on' : ''}" data-act="sheetMeal" data-v="${m}">${m}</button>`).join('')}</div>
    ${s.entry ? `<div class="row"><button class="btn ghost" data-act="delEntry" data-id="${s.entry}">${ic('trash')}Delete</button><button class="btn block" data-act="quickSave">Save changes</button></div>` : `<button class="btn block" data-act="quickSave">Log to ${U.foodDate === today ? 'today' : fmtDate(U.foodDate)}</button>`}`;
  A.quickSave = () => {
    const s = U.sheet, v = k => +($('#qa-' + k).value) || 0;
    const q = { name: $('#qa-name').value.trim(), p: v('p'), c: v('c'), f: v('f') };
    q.cal = v('cal') || r0(q.p * 4 + q.c * 4 + q.f * 9);
    if (!q.cal) return toast('Enter calories or macros.');
    if (s.keep && !s.entry) {
      const f = { id: nid('c'), src: 'Custom', name: q.name || 'My food', servName: ($('#qa-servName')?.value || '').trim(), serv: v('grams') || 100, unit: 'g', cal: q.cal, p: q.p, c: q.c, f: q.f };
      if (U.scanCode) { f.barcode = U.scanCode; U.scanCode = null; }
      S.foods.push(f); logItem({ foodId: f.id, qty: 1 }, U.foodDate, s.meal);
      U.sheet = null; save(); return toast(`Saved ${f.name} and logged it.`);
    }
    if (s.entry) { const e = S.log.find(x => x.id === s.entry); if (e) { e.quick = q; e.meal = s.meal; } }
    else logItem({ quick: q, qty: 1 }, U.foodDate, s.meal);
    U.sheet = null; save(); toast(s.entry ? 'Updated.' : 'Logged.');
  };

  // ----- Meal menu (\u22ef): copy yesterday, select, save as meal (#1 #2 #3) -----
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
    return `<div class="li" data-act="openMeal" data-id="${m.id}" data-long="mealSavedMenu"><div class="grow"><div class="small">${ic('star', 'class="inl"')} ${esc(m.name)}</div><div class="tiny muted">${m.items.length} items \u00b7 P${r0(t.p)} C${r0(t.c)} F${r0(t.f)}</div></div><span class="num small">${r0(t.cal)}</span></div>`;
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
      <div class="small num"><b>${r0(t.cal)}</b> kcal \u00b7 P${r0(t.p)} C${r0(t.c)} F${r0(t.f)}</div>
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
  async function usdaSearch(q, types = 'Foundation,SR Legacy,Survey (FNDDS)') {
    const branded = types === 'Branded';
    const base = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=15&dataType=${encodeURIComponent(types)}`;
    let j;
    if (REAL) { const r = await native('http', { url: base, secretQuery: { param: 'api_key', secret: 'usda_key', fallback: 'DEMO_KEY' } }); if (r.error) throw new Error(r.error); if (r.status < 200 || r.status > 299) throw new Error('USDA ' + r.status + (r.status === 429 ? ' (too many searches: add your free key in Settings)' : '')); j = JSON.parse(r.body || '{}'); }
    else { const r = await fetch(base + '&api_key=DEMO_KEY'); if (!r.ok) throw new Error('USDA ' + r.status); j = await r.json(); }
    const num = (fn, ...ids) => { for (const id of ids) { const x = fn.find(n => String(n.nutrientNumber) === id && (id !== '208' || /kcal/i.test(n.unitName || 'kcal'))); if (x && x.value != null) return +x.value; } return null; };
    return (j.foods || []).map(x => {
      const fn = x.foodNutrients || [], p = num(fn, '203') || 0, c = num(fn, '205') || 0, f = num(fn, '204') || 0;
      const cal = num(fn, '208', '957', '958') ?? (p * 4 + c * 4 + f * 9);
      const name = L.cap(String(x.description || '').toLowerCase()) + (branded && x.brandName ? ' \u00b7 ' + x.brandName : branded && x.brandOwner ? ' \u00b7 ' + x.brandOwner : '');
      // Branded numbers are per 100 g too; keep the label's serving as the household name when it's in grams.
      const sg = branded && /^g$|^grm$/i.test(x.servingSizeUnit || '') ? +x.servingSize : 0;
      const k = sg > 0 ? sg / 100 : 1;
      return { id: 'usda' + x.fdcId, name, src: 'USDA', serv: sg > 0 ? r1(sg) : 100, unit: 'g', servName: sg > 0 ? (x.householdServingFullText || '') : '', cal: r1(cal * k), p: r1(p * k), c: r1(c * k), f: r1(f * k), ...(branded && x.gtinUpc ? { barcode: String(x.gtinUpc) } : {}) };
    }).filter(x => x.cal > 0 || x.p > 0);
  }
  window.usdaBranded = q => usdaSearch(q, 'Branded');
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
    const usda = !u ? '' : u.busy ? '<div class="tiny muted">Searching USDA\u2026</div>' : u.items.length ? `<div class="tiny muted caps">USDA (plain foods, per 100 g)</div><div class="list">${u.items.map((f, i) => `<div class="li" data-act="usdaPick" data-i="${i}"><div class="grow"><div class="small">${esc(f.name)}</div><div class="tiny muted num">${r0(f.cal)} kcal \u00b7 P${r0(f.p)} C${r0(f.c)} F${r0(f.f)} per 100 g</div></div></div>`).join('')}</div>` : `<div class="small muted">${u.err ? 'USDA search failed: ' + esc(u.err) : 'Nothing at USDA for "' + esc(u.q) + '".'}</div>`;
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
      ${s.recs.map((r, i) => { const pp = recPer(r), on = s.recOn[i]; return `<div class="card tight" data-k="rec-import" data-act="recTog" data-i="${i}" style="cursor:pointer;flex-direction:row;gap:12px;align-items:flex-start"><span class="ckbox ${on ? 'on' : ''}">${on ? ic('check') : ''}</span><div class="grow"><b class="small">${esc(r.name)}</b><div class="tiny num">${+r.portions || 1} portions \u00b7 ${r0(pp.cal)} kcal, P${r0(pp.p)} C${r0(pp.c)} F${r0(pp.f)} each</div><div class="tiny muted">${r.ingredients.map(x => `${esc(x.name)} ${r0(x.grams)} g${recMatch(x.name) ? ' \u2713' : ''}`).join(' \u00b7 ')}</div></div></div>`; }).join('')}
      <div class="tiny muted">\u2713 = already in your foods.</div>
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
        <div class="tiny muted">${x.late ? `<b style="color:var(--a-warn)">${x.late} day${x.late > 1 ? 's' : ''} late</b> (window ${x.s.missWin} days) \u00b7 ` : ''}${time12(x.s.time)}${st === 'done' ? ` \u00b7 done${x.shot.site ? ', ' + esc(siteName(x.shot.site)) : ''}` : st === 'skipped' ? ' \u00b7 skipped' : av ? ` \u00b7 vial mixed ${shortDate(av.v.mixed)}${av.st.expired ? ' <b style="color:var(--a-alert)">past use-by</b>' : ''}` : ' \u00b7 <b>no vial mixed yet</b>'}</div></div>
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
      <div class="card" data-k="pep-next"><h2>Next 7 days</h2>${up.length ? up.map(x => `<div class="row small"><span style="width:70px" class="muted">${DAYS[dow(x.date)]} ${shortDate(x.date)}</span><span class="grow">${esc(x.c.name)} ${esc(doseTxt(x.dose, x.c))}</span><span class="tiny muted num">${unitsTxt(L.pepUnits(x.dose, concFor(x.c.id, x.date)))} u \u00b7 ${time12(x.s.time)}</span></div>`).join('') : '<div class="small muted">Nothing scheduled.</div>'}</div>
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
    return `<div class="row"><span class="calbig num">${unitsTxt(units)}</span><span class="small">units of ${esc(doseTxt(s.dose, c))}<br><span class="tiny muted">${fmtNum(r1(conc))} mg/ml \u00b7 ${r1(units / 100 * 1000) / 1000} ml</span></span></div>
      ${dh.html}
      <div class="grid2"><label class="fl">Dose this time (${c.unit})<input class="f num" type="number" inputmode="decimal" step="any" value="${c.unit === 'mcg' ? r0(s.dose * 1000) : fmtNum(s.dose)}" data-in="pepDoseNow"></label><label class="fl">Time<input class="f" type="time" value="${s.time}" data-in="pepTimeNow"></label></div>
      ${vs.length > 1 ? `<label class="fl">From vial<select class="f" data-in="pepVialNow">${vs.map(x => `<option value="${x.id}" ${x.id === (v && v.id) ? 'selected' : ''}>Mixed ${shortDate(x.mixed)} \u00b7 ${fmtNum(r1(L.pepVial(x, P().shots, today).left))} mg left</option>`).join('')}</select></label>` : ''}
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
      ${vs.map(v => { const st = L.pepVial(v, P().shots, today); return `<div class="li tight" style="cursor:default"><div class="grow"><div class="small"><b>${fmtNum(v.mg)} mg + ${fmtNum(v.ml)} ml</b> = ${fmtNum(r1(st.conc))} mg/ml \u00b7 mixed ${shortDate(v.mixed)}</div>
        <div class="tiny ${st.expired ? '' : 'muted'}" ${st.expired ? 'style="color:var(--a-alert)"' : ''}>${fmtNum(r1(st.left))} mg left (${r1(st.mlLeft)} ml) \u00b7 use by ${shortDate(st.expires)}${st.expired ? ' (past use-by: throw it out)' : ` (${st.daysLeft} days)`}</div></div>
        <button class="btn sm ghost" data-act="vialDone" data-v="${v.id}">Finished</button></div>`; }).join('') || '<div class="small muted">No mixed vial.</div>'}
      <div class="tiny muted">Default mix: ${fmtNum(c.vialMg)} mg + ${fmtNum(c.bacMl)} ml BAC = ${fmtNum(r1(L.pepConc(c.vialMg, c.bacMl)))} mg/ml \u00b7 good for ${c.useDays} days once mixed. <a class="linkbtn" data-act="compEdit" data-v="${c.id}">Edit</a></div>${c.note ? `<div class="tiny muted">${esc(c.note)}</div>` : ''}</div>`;
  }).join('')}
    <button class="btn ghost" data-act="compEdit" data-v="">${ic('plus')}Add a compound</button>
    <div class="tiny muted" style="text-align:center"><a class="linkbtn" data-act="pepGuideGo" data-v="mix">How to mix a vial, step by step</a></div>`;
  A.vialNew = d => { const c = comp(d.v); U.sheet = { kind: 'vialNew', title: 'Mix a vial: ' + c.name, cid: c.id, mg: c.vialMg, ml: c.bacMl, mixed: today, useDays: c.useDays }; render(); };
  SHEETS.vialNew = s => {
    const c = comp(s.cid), conc = L.pepConc(s.mg, s.ml), sch = P().scheds.find(x => x.cid === s.cid);
    const dose = sch ? L.pepDose(sch, today) : 0;
    return `<div class="grid2"><label class="fl">Powder in the vial (mg)<input class="f num" type="number" step="any" value="${s.mg}" data-in="vialF" data-k2="mg"></label><label class="fl">BAC water added (ml)<input class="f num" type="number" step="any" value="${s.ml}" data-in="vialF" data-k2="ml"></label>
      <label class="fl">Mixed on<input class="f" type="date" max="${today}" value="${s.mixed}" data-in="vialF" data-k2="mixed"></label><label class="fl">Good for (days)<input class="f num" type="number" value="${s.useDays}" data-in="vialF" data-k2="useDays"></label></div>
      <div class="small">= <b class="num">${fmtNum(r1(conc))} mg/ml</b>${dose ? ` \u00b7 your ${esc(doseTxt(dose, c))} dose = <b class="num">${unitsTxt(L.pepUnits(dose, conc))} units</b>` : ''}</div>
      ${dose ? `<div class="tiny muted">Other amounts of water for ${esc(doseTxt(dose, c))}: ${[0.5, 1, 1.5, 2, 3, 4, 5, 6].filter(ml => ml !== +s.ml).map(ml => `${ml} ml = ${unitsTxt(L.pepUnits(dose, L.pepConc(s.mg, ml)))} u`).join(' \u00b7 ')}. Less water = fewer units per dose (finer measuring is harder); more water = bigger, easier-to-read draws.</div>` : ''}
      <ol class="steps small"><li>Wash hands. Wipe both vial tops with alcohol and let them dry.</li><li>Draw ${fmtNum(s.ml)} ml of BAC water${s.ml > 1 ? ` (with a 1 ml syringe that's ${Math.ceil(s.ml)} fills)` : ''}.</li><li>Needle into the powder vial at an angle: let the water run slowly down the glass wall, not onto the powder.</li><li>Swirl or roll gently until clear. Never shake. Cloudy or bits floating: don't use it.</li><li>Write ${fmtNum(r1(conc))} mg/ml and today's date on it. Fridge (36-46 \u00b0F), never frozen.</li></ol>
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
      <div class="row"><span class="calbig num">${conc ? unitsTxt(units) : '\u2014'}</span><span class="small">units<br><span class="tiny muted">${fmtNum(r1(conc * 100) / 100)} mg/ml \u00b7 ${r1(units) / 100} ml \u00b7 1 unit = ${fmtNum(r1(conc / 100 * 1000 * 10) / 10)} mcg</span></span></div>
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
    const step = s.ladder?.length ? ` \u00b7 step ${L.pepStep(s, today) + 1} of ${s.ladder.length}` : '';
    return `${doseTxt(base, c)} ${what} at ${time12(s.time)}${split}${step}`;
  }
  SCREENS['more:plan'] = () => `${P().scheds.map(s => { const c = comp(s.cid); if (!c) return ''; let nx = ''; for (let i = 0; i < 60 && !nx; i++) { const d = dateAdd(today, i); if (L.pepIsDue(s, d)) nx = d; }
    return `<div class="card tight" data-k="sched-card"><div class="row"><b class="grow small">${esc(c.name)}</b>${sw(s.active !== false, 'schedActive', `data-v="${s.id}"`)}</div>
      <div class="small">${esc(schedSummary(s))}</div><div class="tiny muted">${s.active === false ? 'Off' : nx ? 'Next: ' + fmtDate(nx) : 'Nothing in the next 60 days'}${s.missWin ? ` \u00b7 late window ${s.missWin} days` : ''}${s.remind === false ? ' \u00b7 no reminder' : ''}</div>
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
      <div class="card" data-k="pep-day"><h2>${fmtDate(sel)}</h2>${list.map(({ x, c }) => `<div class="li tight" style="cursor:default"><div class="grow"><div class="small">${esc(c?.name || '?')} ${x.status === 'done' ? esc(doseTxt(x.dose, c)) : '<span class="muted">skipped</span>'}</div><div class="tiny muted">${x.status === 'done' ? `${x.units ?? ''} units${x.time ? ' \u00b7 ' + time12(x.time) : ''}${x.site ? ' \u00b7 ' + esc(siteName(x.site)) : ''}` : ''}</div></div><button class="iconbtn sm" data-act="pepUndo" data-v="${esc(x.key)}" aria-label="Delete">${ic('trash')}</button></div>`).join('') || '<div class="small muted">No shots logged.</div>'}
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
    inject: `<svg class="guide-art" viewBox="0 0 300 130" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 100 C60 100 70 60 100 60 C130 60 140 100 190 100 L290 100"/><path class="wt" d="M70 100 C80 75 90 64 100 64 C110 64 120 75 130 100z" stroke="none"/><path d="M60 70 C66 62 74 58 82 58M140 70 C134 62 126 58 118 58" stroke-width="3" opacity=".6"/><path class="ac" d="M100 80 L100 24" stroke-width="2"/><path d="M100 24v-18" stroke-width="6" opacity=".5"/><text x="100" y="120" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Pinch, 90\u00b0</text><path d="M200 100 C220 100 230 80 245 80 C260 80 270 100 290 100"/><path class="ac" d="M245 92 L210 40" stroke-width="2"/><path d="M210 40 L200 25" stroke-width="6" opacity=".5"/><text x="245" y="120" text-anchor="middle" fill="currentColor" stroke="none" style="font-size:10px">Lean: 45\u00b0</text></svg>`,
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
      <li><b>The math:</b> units = dose \u00f7 strength \u00d7 100. Example: 60 mg + 6 ml = 10 mg/ml, so 2 mg = 0.2 ml = 20 units. The app does this for you on every dose.</li>
      <li>Smaller syringes are easier to read: use the 0.5 ml one for anything up to 50 units.</li></ul>`],
    ['mix', 'Mixing a vial', () => `${ART_G.mix}<ol class="steps small">
      <li>Wash your hands. Clean a flat spot. Lay out alcohol swabs, BAC water, the vial, a syringe.</li>
      <li>Pop the caps. Wipe both rubber tops with alcohol and let them dry.</li>
      <li>Draw the BAC water. For more than 1 ml, fill the syringe more than once (or use a 3 ml mixing syringe).</li>
      <li>Push the needle into the powder vial at an angle and aim at the glass wall. Push slowly so the water runs down the side.</li>
      <li>Swirl or roll the vial between your palms. <b>Never shake.</b> Let it sit until it's fully clear (a few minutes).</li>
      <li>Clear = good. Cloudy, colored or bits floating = don't use it.</li>
      <li>Write the strength and the date on it. In the fridge (36 to 46 \u00b0F), never the freezer. Save it in Vials so the app tracks what's left and the use-by.</li></ol>`],
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
      <li>Needle in all the way, quick and straight (90\u00b0). If you're lean, go in at 45\u00b0.</li>
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
    ['missed', 'Missed doses', () => `<div class="small">Each schedule has a <b>late window</b> (Schedules \u2192 Edit). Inside it, Today shows the dose as late and you can still take it. After it, the dose is dropped and you wait for the next one. Never double up.</div>
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
  render();
  if (REAL) hcSync();
})();
