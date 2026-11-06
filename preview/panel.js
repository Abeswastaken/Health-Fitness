// Design panel: edits the app's look live and saves every change where Claude can read it
// (artifact database: design/current and the notes collection).
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const phone = $('#phone'), panel = $('#panel');

  const PALETTES = {
    light: { accent: '#2f6b3f', onAccent: '#ffffff', bg: '#f4f6f1', card: '#ffffff', fg: '#1b1f1a', muted: '#626b60', line: '#dfe4db', p: '#3f7fd6', c: '#d79a2b', f: '#c4566b', good: '#2e8b57', warn: '#c98a12', alert: '#c0392b' },
    dark: { accent: '#7fcf93', onAccent: '#0f2416', bg: '#111411', card: '#1b1f1b', fg: '#e4e9e2', muted: '#99a395', line: '#2c332c', p: '#78a9f0', c: '#e8b45a', f: '#e2808f', good: '#6fcf8f', warn: '#e8b45a', alert: '#ef7d6d' },
  };
  const SWATCHES = ['#2f6b3f', '#1f5fae', '#6b3fa0', '#b5482f', '#0f7c80', '#a1611c', '#c2185b', '#37474f'];
  const FONTS = ['Roboto Flex', 'Inter Tight', 'Manrope', 'Lexend', 'Atkinson Hyperlegible', 'IBM Plex Sans', 'Nunito Sans', 'Work Sans'];
  const HEADS = ['Barlow Semi Condensed', 'Oswald', 'Archivo Narrow', 'Saira Condensed', 'Roboto Flex', 'Bebas Neue', 'Sora', 'Space Grotesk'];
  // Defaults = jake's look from review 1 (light, square corners, flat, compact, Bebas Neue headings, rings).
  const DEFAULT = () => ({
    mode: 'light', light: { ...PALETTES.light }, dark: { ...PALETTES.dark },
    font: 'Roboto Flex', head: 'Bebas Neue', headw: 400, fs: 14, radius: 0, density: 'compact', shadow: 0, border: false,
    navLabels: true, macroStyle: 'rings', homeOrder: Object.keys(window.App.homeCards), homeHidden: [],
    btnStyle: 'filled', btnRadius: 'match', chipShape: 'pill', navStyle: 'pill', cardStyle: 'plain', headCase: 'normal', headLs: 0.5, iconw: 1.8,
  });
  // Keep a saved card order valid when cards are added or removed.
  const fixOrder = d => { const keys = Object.keys(window.App.homeCards); d.homeOrder = [...(d.homeOrder || []).filter(k => keys.includes(k)), ...keys.filter(k => !(d.homeOrder || []).includes(k))]; return d; };
  const merge = d => { const x = { ...DEFAULT(), ...d }; x.light = { ...PALETTES.light, ...(d.light || {}) }; x.dark = { ...PALETTES.dark, ...(d.dark || {}) }; return fixOrder(x); };
  let ds = DEFAULT();
  let notes = [];
  let db = null, saveState = 'local', pending = null, pin = null, compare = false, gotRemote = false;
  const loaded = new Set(['Roboto Flex', 'Barlow Semi Condensed']);

  const isDark = () => ds.mode === 'dark' || (ds.mode === 'auto' && (document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches)));
  function loadFont(f) {
    if (loaded.has(f)) return; loaded.add(f);
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(l);
  }
  function apply() {
    const d0 = compare ? DEFAULT() : ds;
    const pal = isDark() ? d0.dark : d0.light, st = phone.style;
    const map = { accent: '--a-accent', onAccent: '--a-on-accent', bg: '--a-bg', card: '--a-card', fg: '--a-fg', muted: '--a-muted', line: '--a-line', p: '--a-p', c: '--a-c', f: '--a-f', good: '--a-good', warn: '--a-warn', alert: '--a-alert' };
    for (const [k, v] of Object.entries(map)) st.setProperty(v, pal[k]);
    loadFont(d0.font); loadFont(d0.head);
    st.setProperty('--a-font', `"${d0.font}",Roboto,system-ui,sans-serif`);
    st.setProperty('--a-head', `"${d0.head}","${d0.font}",system-ui,sans-serif`);
    st.setProperty('--a-headw', d0.headw);
    st.setProperty('--a-fs', d0.fs + 'px');
    st.setProperty('--a-radius', d0.radius + 'px');
    const dens = { compact: [6, 9], normal: [10, 12], roomy: [16, 18] }[d0.density];
    st.setProperty('--a-gap', dens[0] + 'px'); st.setProperty('--a-pad', dens[1] + 'px');
    st.setProperty('--a-shadow', ['none', '0 1px 2px rgba(0,0,0,.06),0 2px 8px rgba(0,0,0,.05)', '0 2px 4px rgba(0,0,0,.08),0 6px 18px rgba(0,0,0,.10)', '0 4px 10px rgba(0,0,0,.12),0 12px 30px rgba(0,0,0,.14)'][d0.shadow]);
    st.setProperty('--a-border', d0.border ? '1px' : '0px');
    Object.assign(window.DESIGN, { homeOrder: d0.homeOrder, homeHidden: d0.homeHidden, navLabels: d0.navLabels, macroStyle: d0.macroStyle });
    st.setProperty('--a-btn-radius', d0.btnRadius === 'pill' ? '999px' : d0.btnRadius === 'square' ? '0px' : 'calc(var(--a-radius)*.75)');
    st.setProperty('--a-chip-radius', d0.chipShape === 'pill' ? '999px' : 'calc(var(--a-radius)*.6)');
    st.setProperty('--a-head-tt', d0.headCase === 'upper' ? 'uppercase' : 'none');
    st.setProperty('--a-head-ls', d0.headLs + 'px');
    st.setProperty('--a-iconw', d0.iconw);
    phone.classList.remove('btn-outline', 'btn-tonal', 'nav-underline', 'nav-plain', 'card-filled', 'card-divided');
    if (d0.btnStyle !== 'filled') phone.classList.add('btn-' + d0.btnStyle);
    if (d0.navStyle !== 'pill') phone.classList.add('nav-' + d0.navStyle);
    if (d0.cardStyle !== 'plain') phone.classList.add('card-' + d0.cardStyle);
    window.App.render();
  }

  // ---------- Saving ----------
  function markDirty() {
    try { localStorage.setItem('hf-design-v2', JSON.stringify(ds)); } catch (e) {}
    if (!db) { setSave('local'); return; }
    setSave('busy');
    clearTimeout(pending); pending = setTimeout(async () => {
      try { await db.doc('design/current').set({ ...ds, savedAt: new Date().toISOString() }); setSave('ok'); }
      catch (e) { setSave('err'); }
    }, 900);
  }
  function setSave(s) {
    saveState = s;
    const el = $('#saveState'); if (!el) return;
    el.className = 'save ' + (s === 'ok' ? 'ok' : s === 'busy' ? 'busy' : '');
    el.querySelector('span').textContent = { ok: 'Saved. Claude can see these changes.', busy: 'Saving\u2026', local: 'Saved in this browser only (sign in to share with Claude)', err: 'Couldn\'t save. Use Copy below.', wait: 'Connecting\u2026' }[s];
  }

  // ---------- Panel UI ----------
  const pal = () => isDark() ? ds.dark : ds.light;
  const colorRow = (k, label) => `<div class="prow"><label for="c-${k}">${label}</label><input type="color" id="c-${k}" data-col="${k}" value="${pal()[k]}"><span></span></div>`;
  const rng = (id, label, min, max, step, val, unit = '') => `<div class="prow"><label for="${id}">${label}</label><input type="range" id="${id}" data-rng="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output>${val}${unit}</output></div>`;
  const sel = (id, label, opts, val) => `<div class="prow"><label for="${id}">${label}</label><select id="${id}" data-sel="${id}">${opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select><span></span></div>`;
  function draw() {
    const cards = window.App.homeCards;
    const scr = window.App.currentScreen();
    const sNotes = notes.slice().sort((a, b) => ((a.status === 'done') - (b.status === 'done')) || (b.at || '').localeCompare(a.at || ''));
    panel.innerHTML = `
      <header><h2>Design panel</h2>
        <div class="save" id="saveState"><i class="led"></i><span></span></div>
        <div class="tiny" style="font-size:11px;color:var(--page-muted)">Change anything here and it updates the app live. Pin a note on any part of the screen for bigger asks.</div></header>
      <section><h3>Notes for Claude</h3>
        <button class="pbtn ${pin ? 'on' : ''}" id="pinBtn">${pin ? 'Tap something in the app\u2026 (Esc to cancel)' : 'Pin a note on the screen'}</button>
        ${pin && pin.target ? `<div class="note"><div class="meta"><span>${esc(pin.screen)} \u203a ${esc(pin.target)}</span></div><textarea id="pinText" rows="3" placeholder="e.g. Move this above the macros, make it smaller"></textarea><div style="display:flex;gap:6px"><button class="pbtn primary" id="pinSave">Save note</button><button class="pbtn" id="pinCancel">Cancel</button></div></div>` : ''}
        <div class="note"><div class="meta"><span>General note on: ${esc(scr)}</span></div><textarea id="genText" rows="2" placeholder="Anything about this screen or the idea"></textarea><button class="pbtn" id="genSave">Add note</button></div>
        ${sNotes.map(n => `<div class="note"><div class="meta"><span>${esc(n.screen)}${n.target ? ' \u203a ' + esc(n.target) : ''}</span><button class="pbtn" style="padding:0 6px" data-delnote="${esc(n.id)}" aria-label="Delete note">\u2715</button></div><div>${esc(n.text)}</div>${n.status === 'done' ? `<div style="font-size:12px;color:#2e9b55"><b>\u2713 Done${n.round ? ' in ' + esc(n.round) : ''}</b>${n.reply ? ': ' + esc(n.reply) : ''}</div>` : ''}</div>`).join('')}
      </section>
      <section><h3>Theme</h3>
        <div style="display:flex;gap:6px">${['auto', 'light', 'dark'].map(m => `<button class="pbtn ${ds.mode === m ? 'on' : ''}" data-mode="${m}">${m === 'auto' ? 'Follow phone' : m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>
        <div class="prow"><span>Accent</span><div style="display:flex;gap:4px;flex-wrap:wrap">${SWATCHES.map(c => `<button aria-label="Accent ${c}" data-sw="${c}" style="width:22px;height:22px;border-radius:50%;border:2px solid ${pal().accent === c ? 'var(--page-fg)' : 'transparent'};background:${c};cursor:pointer"></button>`).join('')}</div><span></span></div>
        <div style="font-size:11px;color:var(--page-muted)">Editing the ${isDark() ? 'dark' : 'light'} palette (switch theme to edit the other).</div>
        ${colorRow('accent', 'Accent')}${colorRow('onAccent', 'Text on accent')}${colorRow('bg', 'Background')}${colorRow('card', 'Cards')}${colorRow('fg', 'Text')}${colorRow('muted', 'Muted text')}${colorRow('line', 'Lines')}
        ${colorRow('p', 'Protein')}${colorRow('c', 'Carbs')}${colorRow('f', 'Fat')}
        ${colorRow('good', 'Good / done')}${colorRow('warn', 'Heads up')}${colorRow('alert', 'Warning')}
      </section>
      <section><h3>Type</h3>
        ${sel('font', 'Body font', FONTS, ds.font)}${sel('head', 'Heading font', HEADS, ds.head)}
        ${rng('fs', 'Text size', 12, 20, 1, ds.fs, 'px')}${rng('headw', 'Heading weight', 400, 700, 100, ds.headw)}
        ${sel('headCase', 'Heading case', ['normal', 'upper'], ds.headCase)}${rng('headLs', 'Heading spacing', 0, 3, 0.25, ds.headLs, 'px')}
      </section>
      <section><h3>Shape and spacing</h3>
        ${rng('radius', 'Corner radius', 0, 28, 1, ds.radius, 'px')}${rng('shadow', 'Card shadow', 0, 3, 1, ds.shadow)}
        ${sel('density', 'Spacing', ['compact', 'normal', 'roomy'], ds.density)}
        <div class="prow"><label for="border">Card outlines</label><input type="checkbox" id="border" ${ds.border ? 'checked' : ''}><span></span></div>
        ${sel('cardStyle', 'Card style', ['plain', 'filled', 'divided'], ds.cardStyle)}
      </section>
      <section><h3>Buttons and icons</h3>
        ${sel('btnStyle', 'Main buttons', ['filled', 'outline', 'tonal'], ds.btnStyle)}${sel('btnRadius', 'Button corners', ['match', 'square', 'pill'], ds.btnRadius)}
        ${sel('chipShape', 'Chips and tabs', ['pill', 'rounded'], ds.chipShape)}${sel('navStyle', 'Bottom bar', ['pill', 'underline', 'plain'], ds.navStyle)}
        ${rng('iconw', 'Icon line weight', 1.2, 2.6, 0.1, ds.iconw)}
      </section>
      <section><h3>Layout</h3>
        ${sel('macroStyle', 'Macros as', ['bars', 'rings'], ds.macroStyle)}
        <div class="prow"><label for="navLabels">Tab labels</label><input type="checkbox" id="navLabels" ${ds.navLabels ? 'checked' : ''}><span></span></div>
        <div style="font-size:12px">Home cards (top to bottom)</div>
        <div class="order">${ds.homeOrder.map((k, i) => `<div><input type="checkbox" data-show="${k}" ${ds.homeHidden.includes(k) ? '' : 'checked'} aria-label="Show ${esc(cards[k])}"><span>${esc(cards[k])}</span><button data-mv="${i}" data-d="-1" aria-label="Move up">\u25b2</button><button data-mv="${i}" data-d="1" aria-label="Move down">\u25bc</button></div>`).join('')}</div>
      </section>
      <section><h3>Compare</h3>
        <button class="pbtn ${compare ? 'on' : ''}" id="compareBtn">${compare ? 'Showing the default look (tap to go back)' : 'Show the default look'}</button>
        <div style="font-size:11px;color:var(--page-muted)">Flip between your changes and the starting look.</div>
      </section>
      <section><h3>Saved settings</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="pbtn on" id="exportFile">Export file for Claude</button><button class="pbtn" id="copyJson">Copy as text</button><button class="pbtn" id="importBtn">Paste a look</button><button class="pbtn" id="resetDesign">Reset look</button><button class="pbtn" id="resetData">Reset example data</button></div>
        <div style="font-size:11px;color:var(--page-muted)">Example data (weights, meals, workouts) lives in this browser. The look and notes save to the page for Claude.</div>
      </section>`;
    setSave(saveState);
  }

  panel.addEventListener('input', ev => {
    const t = ev.target;
    if (t.dataset.col) { pal()[t.dataset.col] = t.value; apply(); markDirty(); }
    if (t.dataset.rng) { ds[t.dataset.rng] = +t.value; t.nextElementSibling.textContent = t.value + (['fs', 'radius', 'headLs'].includes(t.dataset.rng) ? 'px' : ''); apply(); markDirty(); }
  });
  panel.addEventListener('change', ev => {
    const t = ev.target;
    if (t.dataset.sel) { ds[t.dataset.sel] = t.value; apply(); markDirty(); }
    if (t.id === 'border' || t.id === 'navLabels') { ds[t.id] = t.checked; apply(); markDirty(); }
    if (t.dataset.show) { const k = t.dataset.show; ds.homeHidden = t.checked ? ds.homeHidden.filter(x => x !== k) : [...ds.homeHidden, k]; apply(); markDirty(); }
  });
  panel.addEventListener('click', async ev => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.mode) { ds.mode = t.dataset.mode; apply(); markDirty(); draw(); }
    else if (t.dataset.sw) { pal().accent = t.dataset.sw; apply(); markDirty(); draw(); }
    else if (t.dataset.mv !== undefined) { const i = +t.dataset.mv, j = i + +t.dataset.d; if (j < 0 || j >= ds.homeOrder.length) return; const o = ds.homeOrder;[o[i], o[j]] = [o[j], o[i]]; apply(); markDirty(); draw(); }
    else if (t.id === 'pinBtn') { pin = pin ? null : { screen: window.App.currentScreen() }; setPinMode(!!pin); draw(); }
    else if (t.id === 'pinCancel') { pin = null; setPinMode(false); draw(); }
    else if (t.id === 'pinSave') { const text = $('#pinText').value.trim(); if (text) await addNote({ screen: pin.screen, target: pin.target, text }); pin = null; setPinMode(false); draw(); }
    else if (t.id === 'genSave') { const text = $('#genText').value.trim(); if (text) await addNote({ screen: window.App.currentScreen(), target: '', text }); draw(); }
    else if (t.dataset.delnote) { const id = t.dataset.delnote; notes = notes.filter(n => n.id !== id); persistNotesLocal(); if (db) { try { await db.doc('notes/' + id).delete(); } catch (e) {} } draw(); }
    else if (t.id === 'exportFile') {
      const dev = window.HFDev;
      const out = { kind: 'health-fitness-design-export', v: 1, exportedAt: new Date().toISOString(), build: dev ? dev.version() : 'web preview', screen: window.App.currentScreen(), design: ds, notes };
      const name = 'hf-notes-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json', txt = JSON.stringify(out, null, 2);
      if (dev) dev.shareJson(name, txt);
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
      t.textContent = 'Exported';
    }
    else if (t.id === 'copyJson') { const txt = JSON.stringify({ design: ds, notes }, null, 2); try { await navigator.clipboard.writeText(txt); t.textContent = 'Copied'; } catch (e) { t.textContent = 'Copy failed'; } }
    else if (t.id === 'resetDesign') { ds = DEFAULT(); apply(); markDirty(); draw(); }
    else if (t.id === 'compareBtn') { compare = !compare; apply(); draw(); }
    else if (t.id === 'importBtn') { const txt = prompt('Paste a look (JSON from "Copy as text")'); if (txt) { try { const j = JSON.parse(txt); ds = merge(j.design || j); apply(); markDirty(); draw(); } catch (e) { alert('That text is not a saved look.'); } } }
    else if (t.id === 'resetData') { window.App.reset(); }
  });

  // ---------- Notes ----------
  function persistNotesLocal() { try { localStorage.setItem('hf-notes', JSON.stringify(notes)); } catch (e) {} }
  async function addNote(n) {
    const note = { ...n, id: 'n' + Date.now().toString(36), at: new Date().toISOString(), status: 'open' };
    notes.push(note); persistNotesLocal();
    if (db) { try { setSave('busy'); await db.doc('notes/' + note.id).set(note); setSave('ok'); } catch (e) { setSave('err'); } }
  }

  // ---------- Pin mode ----------
  function setPinMode(on) { window.__pinMode = on; phone.classList.toggle('pinmode', on); if (on && window.innerWidth <= 900) panel.classList.remove('open'); }
  phone.addEventListener('click', ev => {
    if (!window.__pinMode || !pin) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const el = ev.target.closest('[data-k]') || ev.target;
    const label = el.dataset?.k || '';
    const text = (ev.target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    pin.target = label ? `${label}${text ? ' ("' + text + '")' : ''}` : `"${text}"`;
    pin.screen = window.App.currentScreen();
    setPinMode(false);
    if (window.innerWidth <= 900) panel.classList.add('open');
    draw(); setTimeout(() => $('#pinText')?.focus(), 30);
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && pin) { pin = null; setPinMode(false); draw(); } });

  $('#panelToggle').addEventListener('click', () => panel.classList.toggle('open'));
  window.addEventListener('app-rendered', () => { const s = panel.querySelector('#genText'); if (s && document.activeElement !== s && !s.value) { const meta = s.previousElementSibling?.querySelector('span'); if (meta) meta.textContent = 'General note on: ' + window.App.currentScreen(); } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (ds.mode === 'auto') { apply(); draw(); } });
  new MutationObserver(() => { if (ds.mode === 'auto') { apply(); draw(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------- Boot ----------
  try { const s = JSON.parse(localStorage.getItem('hf-design-v2')); if (s) ds = merge(s); } catch (e) {}
  try { notes = JSON.parse(localStorage.getItem('hf-notes')) || []; } catch (e) {}
  // Clear handled dev notes once per round (bump NOTES_ROUND). App data is untouched.
  // Round 2 (2026-11-06): the 13 notes from the 11-06 export are built.
  const NOTES_ROUND = '2';
  try { if (localStorage.getItem('hf-notes-reset') !== NOTES_ROUND) { notes = []; localStorage.setItem('hf-notes', '[]'); localStorage.setItem('hf-notes-reset', NOTES_ROUND); } } catch (e) {}
  saveState = 'wait';
  apply(); draw();
  const timer = setTimeout(() => { if (!db) setSave('local'); }, 10000);
  (async () => {
    const c = window.claude;
    db = c && c.use ? await c.use('db').catch(() => null) : null;
    clearTimeout(timer);
    if (!db) { setSave('local'); return; }
    // Load the saved look once. Later snapshots are our own saves echoing back; applying them
    // could undo a change made a moment ago (that was the card-order bug in review 1).
    db.doc('design/current').onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites || gotRemote) { if (saveState !== 'busy') setSave('ok'); return; }
      gotRemote = true;
      if (snap.exists && saveState !== 'busy') { const d = { ...snap.data() }; delete d.savedAt; ds = merge(d); try { localStorage.setItem('hf-design-v2', JSON.stringify(ds)); } catch (e) {} apply(); draw(); }
      setSave('ok');
    }, () => setSave('err'));
    db.collection('notes').onSnapshot(snap => {
      if (snap.metadata.fromCache && !snap.size) return;
      const remote = snap.docs.map(d => ({ ...d.data() }));
      const ids = new Set(remote.map(n => n.id));
      notes = [...remote, ...notes.filter(n => !ids.has(n.id) && !n.synced)];
      persistNotesLocal(); if (!pin) draw();
    }, () => {});
  })();
})();
