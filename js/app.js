/* Wires the control panel to the metrics and page builders. */
(function () {
  const $ = id => document.getElementById(id);
  const R = window.RULES, U = window.METRIC_UTILS;
  const state = { rows: null, fileName: '', telco: null, overrides: {}, edits: {}, tab: 'avoc', M: null };

  /* ---------- profiles & settings ---------- */
  PROFILES.forEach(p => $('profile').insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.label}</option>`));
  const saved = (() => { try { return JSON.parse(localStorage.getItem('bravoReportSettings') || '{}'); } catch (e) { return {}; } })();
  if (saved.profile && PROFILES.some(p => p.id === saved.profile)) $('profile').value = saved.profile;
  const profile = () => PROFILES.find(p => p.id === $('profile').value) || PROFILES[0];
  function fillDefaults() {
    const p = profile(), s = (saved.byProfile || {})[p.id] || {};
    $('rate').value = s.rate ?? p.airtimeRatePerMinute;
  }
  function persist() {
    try {
      saved.profile = profile().id;
      saved.byProfile = saved.byProfile || {};
      saved.byProfile[profile().id] = { rate: +$('rate').value };
      saved.overrides = state.overrides;
      localStorage.setItem('bravoReportSettings', JSON.stringify(saved));
    } catch (e) { /* storage unavailable: settings simply are not remembered */ }
  }
  state.overrides = saved.overrides || {};
  fillDefaults();
  $('profile').addEventListener('change', () => { fillDefaults(); if (state.M) build(); });
  const today = new Date();
  $('generated').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  /* ---------- file loading ---------- */
  function wireDrop(labelId, inputId, handler) {
    const lab = $(labelId) || $(inputId).closest('label');
    ['dragenter', 'dragover'].forEach(e => lab.addEventListener(e, ev => { ev.preventDefault(); lab.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(e => lab.addEventListener(e, () => lab.classList.remove('over')));
    lab.addEventListener('drop', ev => { ev.preventDefault(); if (ev.dataTransfer.files[0]) handler(ev.dataTransfer.files[0]); });
    $(inputId).addEventListener('change', ev => { if (ev.target.files[0]) handler(ev.target.files[0]); });
  }
  const parseCsv = file => new Promise((res, rej) => Papa.parse(file, {
    header: true, skipEmptyLines: 'greedy', transformHeader: h => h.replace(/^﻿/, '').trim(),
    complete: r => res(r), error: rej
  }));

  wireDrop('dropCalls', 'calls', async file => {
    const r = await parseCsv(file);
    const need = ['Status', 'Agent', 'Date', 'Duration'];
    const missing = need.filter(c => !r.meta.fields.includes(c));
    if (missing.length) { alert(`This does not look like the call export. Missing column(s): ${missing.join(', ')}.`); return; }
    state.rows = r.data; state.fileName = file.name; state.edits = {};
    $('callsName').textContent = file.name; $('dropCalls').classList.add('done');
    const dates = new Set(r.data.map(x => String(x.Date || '').slice(0, 11)));
    $('fileInfo').innerHTML = `<b>${r.data.length.toLocaleString()}</b> calls · <b>${new Set(r.data.map(x => x.Agent)).size}</b> agents · <b>${new Set(r.data.map(x => x.Location)).size}</b> LGAs · ${dates.size === 1 ? 'one call date' : `<b>${dates.size}</b> call dates`}`;
    const dm = file.name.match(/day\s*_?(\d+)/i); if (dm) $('day').value = dm[1];
    renderUnknown();
    $('build').disabled = false;
    build();
  });

  wireDrop(null, 'telco', async file => {
    const r = await parseCsv(file);
    const f = r.meta.fields;
    const pick = re => f.find(h => re.test(h));
    const ph = pick(/phone|msisdn|number|mobile/i), g = pick(/gender|sex/i), t = pick(/tier|segment|class/i);
    if (!ph) { alert('The telco file needs a Phone column.'); return; }
    const map = new Map();
    r.data.forEach(x => {
      const p = String(x[ph] || '').replace(/\D/g, '').slice(-10); if (!p) return;
      let gender = g ? String(x[g] || '').trim() : '';
      if (/^m/i.test(gender)) gender = 'Male'; else if (/^f/i.test(gender)) gender = 'Female'; else gender = '';
      map.set(p, { gender, tier: t ? String(x[t] || '').trim() : '' });
    });
    state.telco = map;
    $('telcoName').textContent = `${file.name} · ${map.size.toLocaleString()} numbers`;
    $('telco').closest('label').classList.add('done');
    if (state.rows) build();
  });

  /* ---------- statuses the rules do not know ---------- */
  function renderUnknown() {
    const counts = {};
    state.rows.forEach(r => {
      const raw = U.clean(r.Status); const k = U.norm(raw);
      if (!R.statusMap[k]) counts[raw || '(blank)'] = (counts[raw || '(blank)'] || 0) + 1;
    });
    const keys = Object.keys(counts);
    $('unknownBox').hidden = !keys.length;
    const opts = [...R.impressionClasses, ...R.nonImpressionClasses].map(c => `<option value="${c.key}">${c.label}</option>`).join('');
    $('unknownList').innerHTML = keys.map(s => {
      const k = U.norm(s);
      return `<div class="uk"><span>${s} <small>(${counts[s]})</small></span><select data-k="${k}"><option value="">Leave out</option>${opts}</select></div>`;
    }).join('');
    $('unknownList').querySelectorAll('select').forEach(sel => {
      sel.value = state.overrides[sel.dataset.k] || '';
      sel.addEventListener('change', () => { if (sel.value) state.overrides[sel.dataset.k] = sel.value; else delete state.overrides[sel.dataset.k]; persist(); build(); });
    });
  }

  /* ---------- build ---------- */
  function captureEdits() {
    document.querySelectorAll('.report .ed[data-edit]').forEach(el => {
      if (el.dataset.orig !== undefined && el.innerHTML !== el.dataset.orig) state.edits[el.closest('.report').dataset.report + ':' + el.dataset.edit] = el.innerHTML;
    });
  }
  function applyEdits() {
    document.querySelectorAll('.report .ed[data-edit]').forEach(el => {
      el.dataset.orig = el.innerHTML;
      const k = el.closest('.report').dataset.report + ':' + el.dataset.edit;
      if (state.edits[k] !== undefined) el.innerHTML = state.edits[k];
    });
  }

  function build() {
    if (!state.rows) return;
    captureEdits();
    persist();
    const P = profile();
    const M = buildMetrics(state.rows, P, {
      statusOverrides: state.overrides, reclassify: $('reclass').checked,
      airtimeRate: +$('rate').value,
      telco: state.telco
    });
    state.M = M;
    const warn = [];
    if (!M.dials) { $('warnings').innerHTML = '<div class="warn">No calls could be counted. Check the status mapping on the left.</div>'; return; }
    const unk = Object.entries(M.unknownStatuses);
    if (unk.length) warn.push(`${unk.reduce((a, b) => a + b[1], 0)} calls with unrecognised statuses (${unk.map(u => u[0]).join(', ')}) are left out. Assign them on the left to include them.`);
    if (M.otherDays.length) warn.push(`The file contains calls from more than one day. The report is dated ${M.callDate.toDateString()} (the busiest day) but counts all ${M.dials.toLocaleString()} calls: ${M.otherDays.map(d => `${d.n} on ${d.date.toDateString()}`).join(', ')}.`);
    const known = new Set(P.lgas.map(l => l.name));
    const strange = M.lgaList.filter(l => !known.has(l.key));
    if (strange.length) warn.push(`These locations are not LGAs of ${P.constituency}: ${strange.map(l => l.key).join(', ')}. Check that the right centre is selected.`);
    $('warnings').innerHTML = warn.map(w => `<div class="warn">${w}</div>`).join('');

    const gd = $('generated').value ? new Date($('generated').value + 'T12:00:00') : new Date();
    const out = buildReports(M, { day: +$('day').value || 1, generated: gd });
    const th = out.theme;
    document.querySelectorAll('.report').forEach(el => {
      el.style.cssText = `--hFrom:${th.headerFrom};--hMid:${th.headerMid};--hTo:${th.headerTo};--brand:${th.brand};--brandStrong:${th.brandStrong};--brandSoft:${th.brandSoft};--rule:${th.rule};--badge:${th.badge};--hl:${th.highlight};--vol:${th.volunteer};--zoom:${$('zoom').value / 100}`;
    });
    $('rep-avoc').innerHTML = out.avoc;
    $('rep-audit').innerHTML = out.audit;
    applyEdits();
    $('empty').hidden = true;
    $('nAvoc').textContent = `· ${$('rep-avoc').children.length} pages`;
    $('nAudit').textContent = `· ${$('rep-audit').children.length} pages`;
    $('pdfAvoc').disabled = $('pdfAudit').disabled = false;
    showTab(state.tab);
  }
  window.__bravoBuild = build;

  ['day', 'generated', 'rate', 'reclass'].forEach(id => $(id).addEventListener('change', build));
  $('build').addEventListener('click', build);

  /* ---------- preview controls ---------- */
  function showTab(t) {
    state.tab = t;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    $('rep-avoc').hidden = t !== 'avoc' || !state.M;
    $('rep-audit').hidden = t !== 'audit' || !state.M;
  }
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $('zoom').addEventListener('input', () => document.querySelectorAll('.report').forEach(el => el.style.setProperty('--zoom', $('zoom').value / 100)));
  $('editMode').addEventListener('change', () => document.querySelectorAll('.report').forEach(el => el.classList.toggle('editing', $('editMode').checked)));

  /* ---------- PDF via the browser's print ---------- */
  function fileName(kind) {
    const P = profile(), d = state.M.callDate || new Date(), day = +$('day').value || 1;
    const mon = d.toLocaleDateString('en-GB', { month: 'short' });
    const surname = P.candidateName.split(' ').slice(-1)[0].toUpperCase();
    const title = P.shortName.split(' ')[0].replace('.', '').toUpperCase();
    return kind === 'avoc'
      ? `DAY_${day}_${String(d.getDate()).padStart(2, '0')}-${mon.toUpperCase()}-${String(d.getFullYear()).slice(2)}_${title}_${surname}_AVOC_REPORT`
      : `Internal_AUDIT_Report_Daily_Day${day}_${String(d.getDate()).padStart(2, '0')}-${mon}-${d.getFullYear()}`;
  }
  function printReport(kind) {
    if (!state.M) return;
    const old = document.title;
    document.title = fileName(kind);
    document.body.classList.add('print-' + kind);
    const done = () => { document.body.classList.remove('print-' + kind); document.title = old; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    document.fonts.ready.then(() => setTimeout(() => window.print(), 50));
  }
  $('pdfAvoc').addEventListener('click', () => printReport('avoc'));
  $('pdfAudit').addEventListener('click', () => printReport('audit'));
})();
