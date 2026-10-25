/*
  SENTIMENT REPORT
  A third report built from js/sentiment.js. It follows whichever style is
  selected: classic (landscape, like the Bravo reports) or dashboard (portrait).
  The numbers and the written commentary are the same in both styles.
*/
(function () {
  const C = window.CONTENT, CH = window.CHARTS, R = window.RULES;
  const { esc, pct, fmt, ed, hl, bold, share, signed, bullets, hr } = C.util;
  const POS = '#22A04B', NEG = '#E23B4E', NEU = '#B9BCC6', INK = '#1C1340', MUTE = '#5E5A72', GRID = '#ECEAF3';
  const lower = s => String(s).charAt(0).toLowerCase() + String(s).slice(1);

  /* ---------- charts ---------- */
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 10}" fill="${o.fill || INK}" font-weight="${o.weight || 400}" text-anchor="${o.anchor || 'start'}"${o.base ? ` dominant-baseline="${o.base}"` : ''}>${esc(s)}</text>`;
  const svg = (w, h, b) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" font-family="Poppins, Arial, sans-serif">${b}</svg>`;
  const tw = (s, size) => String(s).length * size * 0.56;

  /* Horizontal bars. rows: [{label, n, color, note}] */
  function hbar(rows, w, o = {}) {
    const size = o.size || 10, rowH = o.rowH || 22, top = 4;
    const labW = Math.min(w * 0.46, Math.max(60, ...rows.map(r => tw(r.label, size))) + 10);
    const noteW = o.noteW || 44;
    /* long labels wrap onto two lines instead of running off the edge */
    const lines = s => { if (tw(s, size) <= labW - 10) return [s]; const w2 = String(s).split(' '); let a = ''; const out = []; w2.forEach(x => { const t = a ? a + ' ' + x : x; if (tw(t, size) > labW - 10 && a) { out.push(a); a = x; } else a = t; }); out.push(a); return out.slice(0, 2); };
    const pw = w - labW - noteW;
    const max = Math.max(...rows.map(r => r.n), 1);
    const h = top + rows.length * rowH + 4;
    let b = '';
    rows.forEach((r, i) => {
      const y = top + i * rowH, bw = Math.max(2, pw * r.n / max);
      const ls = lines(r.label);
      ls.forEach((l, k) => { b += T(labW - 7, y + rowH / 2 + (k - (ls.length - 1) / 2) * (size + 1), l, { anchor: 'end', size, base: 'middle' }); });
      b += `<rect x="${labW}" y="${y + rowH * .18}" width="${pw}" height="${rowH * .64}" rx="${rowH * .32}" fill="#F1F2F7"/>`;
      b += `<rect x="${labW}" y="${y + rowH * .18}" width="${bw}" height="${rowH * .64}" rx="${rowH * .32}" fill="${r.color}"/>`;
      b += T(labW + pw + 6, y + rowH / 2, r.note != null ? r.note : fmt(r.n), { size: size - .5, weight: 600, base: 'middle' });
    });
    return svg(w, h, b);
  }
  /* Diverging bars: negative share to the left, positive to the right. */
  function diverge(rows, w, o = {}) {
    const size = o.size || 9.5, rowH = o.rowH || 17, top = 22;
    const labW = Math.min(w * 0.42, Math.max(60, ...rows.map(r => tw(r.label, size))) + 16), noteW = 40;
    const pw = w - labW - noteW, cx = labW + pw / 2, half = pw / 2 - 4;
    const h = top + rows.length * rowH + 6;
    let b = T(cx - 6, 12, '◀ Negative', { anchor: 'end', size: 9, fill: NEG, weight: 600 }) + T(cx + 6, 12, 'Positive ▶', { size: 9, fill: POS, weight: 600 });
    rows.forEach((r, i) => {
      const y = top + i * rowH, pp = r.n ? r.pos / r.n : 0, np = r.n ? r.neg / r.n : 0;
      if (o.colorOf) b += `<circle cx="${labW - 8}" cy="${y + rowH / 2}" r="3" fill="${o.colorOf(r.lga)}"/>`;
      b += T(labW - 15, y + rowH / 2, r.label, { anchor: 'end', size, base: 'middle' });
      b += `<rect x="${cx - half * np}" y="${y + 2}" width="${half * np}" height="${rowH - 4}" rx="2" fill="${NEG}"/>`;
      b += `<rect x="${cx}" y="${y + 2}" width="${half * pp}" height="${rowH - 4}" rx="2" fill="${POS}"/>`;
      if (half * np > 26) b += T(cx - half * np + 4, y + rowH / 2 + .5, pct(np), { size: size - 1.5, fill: '#fff', weight: 600, base: 'middle' });
      if (half * pp > 26) b += T(cx + half * pp - 4, y + rowH / 2 + .5, pct(pp), { size: size - 1.5, fill: '#fff', weight: 600, base: 'middle', anchor: 'end' });
      b += T(labW + pw + 5, y + rowH / 2, 'n=' + fmt(r.n), { size: size - 1, fill: MUTE, base: 'middle' });
    });
    b += `<line x1="${cx}" x2="${cx}" y1="${top - 4}" y2="${h - 2}" stroke="${INK}" stroke-width="1"/>`;
    return svg(w, h, b);
  }
  /* Five sentiment bands, red to green. */
  function bands(list, w, h) {
    const cols = ['#B3202F', '#EE7B86', NEU, '#7FCB97', '#1E8E43'];
    const top = 18, bot = 30, ph = h - top - bot, n = list.length, max = Math.max(...list.map(b => b.n), 1), tot = list.reduce((a, b) => a + b.n, 0) || 1;
    const bw = w / n * .62;
    let b = '';
    list.forEach((it, i) => {
      const cx = w / n * (i + .5), bh = Math.max(2, ph * it.n / max);
      b += `<rect x="${cx - bw / 2}" y="${top + ph - bh}" width="${bw}" height="${bh}" rx="3" fill="${cols[i]}"/>`;
      b += T(cx, top + ph - bh - 5, `${fmt(it.n)} · ${pct(it.n / tot)}`, { anchor: 'middle', size: 9, weight: 600 });
      const words = it.label.split(' ');
      b += T(cx, top + ph + 13, words[0], { anchor: 'middle', size: 9 }) + (words[1] ? T(cx, top + ph + 24, words.slice(1).join(' '), { anchor: 'middle', size: 9 }) : '');
    });
    return svg(w, h, b);
  }
  /* Hourly volume (stacked positive and negative) with % positive line. */
  function hourly(byHour, w, h) {
    const L = 34, Rr = 36, top = 22, bot = 22, pw = w - L - Rr, ph = h - top - bot;
    const H = byHour.filter(x => x.key != null);
    if (!H.length) return svg(w, h, T(w / 2, h / 2, 'No times recorded', { anchor: 'middle', fill: MUTE }));
    const raw = Math.max(...H.map(x => x.n), 1), mag = Math.pow(10, Math.floor(Math.log10(raw / 4))), step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s * 4 >= raw);
    const max = step * 4, n = H.length, bw = pw / n * .58;
    const x = i => L + pw / n * (i + .5), yv = v => top + ph - ph * v / max, yp = p => top + ph - ph * p;
    let b = '';
    for (let i = 0; i <= 4; i++) { const v = max * i / 4; b += `<line x1="${L}" x2="${L + pw}" y1="${yv(v)}" y2="${yv(v)}" stroke="${GRID}"/>` + T(L - 5, yv(v) + 3, fmt(v), { anchor: 'end', size: 8, fill: MUTE }) + T(L + pw + 5, yp(i / 4) + 3, pct(i / 4), { size: 8, fill: MUTE }); }
    H.forEach((d, i) => {
      const hp = ph * d.pos / max, hn = ph * d.neg / max;
      b += `<rect x="${x(i) - bw / 2}" y="${top + ph - hp}" width="${bw}" height="${hp}" fill="${POS}" opacity=".85"/>`;
      b += `<rect x="${x(i) - bw / 2}" y="${top + ph - hp - hn}" width="${bw}" height="${hn}" fill="${NEG}" opacity=".85"/>`;
      b += T(x(i), h - 7, hr(d.key), { anchor: 'middle', size: 8, fill: MUTE });
    });
    b += `<path d="${H.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${yp(d.posRate)}`).join(' ')}" fill="none" stroke="${INK}" stroke-width="1.8"/>`;
    H.forEach((d, i) => { b += `<circle cx="${x(i)}" cy="${yp(d.posRate)}" r="3" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`; });
    b += `<rect x="${L}" y="2" width="10" height="9" fill="${POS}"/>` + T(L + 14, 10, 'Positive', { size: 8.5 }) + `<rect x="${L + 70}" y="2" width="10" height="9" fill="${NEG}"/>` + T(L + 84, 10, 'Negative', { size: 8.5 }) + `<line x1="${L + 146}" x2="${L + 162}" y1="6.5" y2="6.5" stroke="${INK}" stroke-width="1.8"/>` + T(L + 166, 10, '% positive (right axis)', { size: 8.5 });
    return svg(w, h, b);
  }
  const pnSegs = g => [{ v: g.pos, color: POS }, { v: g.neg, color: NEG }];
  const pnLegend = [{ label: 'Positive', color: POS }, { label: 'Negative', color: NEG }];

  /* ---------- text ---------- */
  function facts(S) {
    const elig = S.byLga.filter(l => l.n >= R.minWardSample);
    const pool = elig.length >= 2 ? elig : S.byLga;
    const lgaSorted = [...pool].sort((a, b) => b.posRate - a.posRate);
    const wardPool = S.byWard.filter(w => w.n >= R.minWardSample);
    const wards = [...(wardPool.length >= 2 ? wardPool : S.byWard)].sort((a, b) => b.posRate - a.posRate);
    const hours = S.byHour.filter(h => h.n >= 10 && h.key != null).sort((a, b) => b.posRate - a.posRate);
    const hes = S.negThemes.find(t => t.key === 'hesitant');
    return { bestL: lgaSorted[0], worstL: lgaSorted[lgaSorted.length - 1], bestW: wards[0], worstW: wards[wards.length - 1], bestH: hours[0], worstH: hours[hours.length - 1], p1: S.posThemes[0], n1: S.negThemes[0], hes };
  }
  const TX = {};
  TX.tells = (S, X) => {
    const F = facts(S);
    let t = `We analysed ${hl(fmt(S.total))} pieces of voter feedback. ${hl(pct(S.posRate))} were positive about ${esc(X.P.shortName)} and ${hl(pct(S.negRate))} negative, a net sentiment of ${hl(signed(S.net))}.`;
    if (F.p1) t += ` The strongest positive driver is ${hl(esc(lower(F.p1.label)))} (${fmt(F.p1.n)} voters)`;
    if (F.n1) t += `${F.p1 ? ';' : ''} the leading concern is ${hl(esc(lower(F.n1.label)))} (${fmt(F.n1.n)}).`; else t += '.';
    if (F.bestL && F.worstL && F.bestL !== F.worstL) t += ` ${esc(F.bestL.key)} is the warmest LGA (${pct(F.bestL.posRate)} positive) and ${esc(F.worstL.key)} the coolest (${pct(F.worstL.posRate)}).`;
    if (S.mixed.length) t += ` ${fmt(S.mixed.length)} voters were positive but raised a concern in the same breath, the easiest wins to secure.`;
    return t;
  };
  TX.where = (S) => {
    const F = facts(S);
    return bullets([
      F.bestW && F.worstW && F.bestW !== F.worstW ? `${hl(esc(F.bestW.key))} is the warmest ward (${pct(F.bestW.posRate)} positive, n=${F.bestW.n}); ${hl(esc(F.worstW.key))} is the coolest (${pct(F.worstW.posRate)}, n=${F.worstW.n}).` : '',
      F.bestH && F.worstH && F.bestH !== F.worstH ? `Feedback was most positive at ${hl(hr(F.bestH.key))} (${pct(F.bestH.posRate)}) and least positive at ${hl(hr(F.worstH.key))} (${pct(F.worstH.posRate)}).` : '',
      `Feedback agrees with the call outcome agents chose ${hl(pct(S.agreement))} of the time. ${fmt(S.posCodedNeg.length)} calls coded Positive or Volunteer carry negative feedback, and ${fmt(S.negCodedPos.length)} coded Negative read positive.`
    ]);
  };
  TX.drivers = (themes, side) => bullets(themes.slice(0, 4).map(t => `${hl(esc(t.label))}: ${fmt(t.n)} voters (${pct(t.share)} of ${side} feedback)${t.topLgas[0] ? `, mostly in ${esc(t.topLgas[0][0])}` : ''}${t.topWards[0] ? ` and ${esc(t.topWards[0][0])}` : ''}.`));
  TX.recs = (S, X) => {
    const F = facts(S);
    const negW = F.n1 && F.n1.topWards.length ? F.n1.topWards.map(w => esc(w[0])).join(', ') : '';
    return bullets([
      F.n1 ? `${bold('Answer the main concern.')} ${esc(F.n1.label)} came up ${fmt(F.n1.n)} times${negW ? `, most in ${negW}` : ''}. A visit or a clear message from the Senator's office would speak to it directly.` : '',
      F.p1 ? `${bold('Say what voters already say.')} Build campaign messages around ${esc(lower(F.p1.label))}; it is the reason ${fmt(F.p1.n)} voters gave for their support.` : '',
      S.mixed.length ? `${bold('Close the mixed calls.')} Re call the ${fmt(S.mixed.length)} voters who were positive but raised a concern, and tell them how it is being handled.` : '',
      F.hes ? `${bold('Win the hesitant.')} Senior agents should call back the ${fmt(F.hes.n)} hesitant or undecided voters first.` : '',
      S.posCodedNeg.length ? `${bold('Check the coding.')} Review the ${fmt(S.posCodedNeg.length)} Positive coded calls with negative feedback with the agents who logged them.` : '',
      S.lowConf ? `${bold('Better notes.')} ${fmt(S.lowConf)} notes were too short to judge from their words. Agents should write one full sentence of what the voter actually said.` : ''
    ]);
  };
  const method = S => `<b>How this was measured.</b> Every feedback note was scored for positive and negative words and phrases, including Nigerian English and Pidgin expressions, with negation handled ("not happy" counts as negative, "not bad" as positive). A note with no opinion words takes its label from the call outcome and is marked low confidence (${fmt(S.lowConf)} notes). ${fmt(S.procedural)} notes only recorded call handling (call back, busy, wrong number) and are not counted.`;

  const kpis = (S, M, X) => [
    ['Feedback analysed', fmt(S.total), `${pct(S.feedbackOnConversations)} of conversations carried feedback`, X.th.brand],
    ['Positive', fmt(S.pos.length), `${pct(S.posRate, 1)} of feedback`, POS],
    ['Negative', fmt(S.neg.length), `${pct(S.negRate, 1)} of feedback`, NEG],
    ['Net sentiment', signed(S.net), 'Positive share minus negative share', S.net >= 0 ? POS : NEG],
    ['Sentiment index', `${S.index}<small style="font-size:.5em">/100</small>`, '50 is neutral · 100 fully positive', X.th.badge],
    ['Agrees with coding', pct(S.agreement), `${fmt(S.posCodedNeg.length)} positive coded calls read negative`, '#3B82F6']
  ];

  /* readable statements */
  const where = u => { const w = Object.entries(u.wards).sort((a, b) => b[1] - a[1])[0]; return w ? w[0] : ''; };
  const stmt = (u, cls) => `<div class="${cls}" data-drop><div class="st">${esc(u.text)}</div><div class="sm">${u.n > 1 ? `<b>Said by ${fmt(u.n)} voters</b>${u.similar ? ' (similar wording)' : ''} · ` : ''}${Object.keys(u.wards).length > 1 ? `${esc(where(u))} and ${Object.keys(u.wards).length - 1} more` : esc(where(u))}${u.conf === 'Low' ? ' · low confidence' : ''}</div></div>`;
  const themeCard = (t, side, cls, max = 3) => `<div class="${cls}" style="--tc:${side === 'positive' ? POS : NEG}"><div class="th"><b>${esc(t.label)}</b><span>${fmt(t.n)} voters · ${pct(t.share)}</span></div>
    <div class="ts">${t.unique} distinct comment${t.unique === 1 ? '' : 's'}${t.topLgas[0] ? ` · mostly ${esc(t.topLgas[0][0])}` : ''}${t.also ? ` · also raised in ${fmt(t.also)} other notes` : ''}</div>
    ${t.statements.slice(0, max).map(u => stmt(u, 'stm')).join('')}</div>`;

  /* register pagination: estimate each row's height and fill pages */
  function registerRows(S) {
    const rows = [];
    [['positive', S.posThemes], ['negative', S.negThemes]].forEach(([side, themes]) => themes.forEach(t => {
      rows.push({ head: true, side, label: t.label, n: t.n, unique: t.unique });
      t.exact.forEach(u => rows.push({ side, u }));
    }));
    return rows;
  }
  function paginate(rows, capacity, cpl, headH, lineH, pad) {
    const pages = []; let cur = [], used = 0;
    rows.forEach((r, i) => {
      const h = r.head ? headH : pad + lineH * Math.max(1, Math.ceil(r.u.text.length / cpl));
      const needHeadRoom = r.head ? h + pad + lineH : h;   // never leave a group title alone at the bottom
      if (cur.length && used + needHeadRoom > capacity) { pages.push(cur); cur = []; used = 0; }
      if (!r.head && !cur.length) { const prev = [...rows.slice(0, i)].reverse().find(x => x.head); cur.push({ ...prev, cont: true }); used += headH; }
      cur.push(r); used += h;
    });
    if (cur.length) pages.push(cur);
    return pages;
  }
  const regTable = (rows, cls) => `<table class="${cls}"><tr><th class="c1">Statement (cleaned for reading)</th><th>Voters</th><th>Where (most often)</th><th>Confidence</th></tr>${rows.map(r => r.head
    ? `<tr class="gh ${r.side}"><td colspan="4"><i></i>${r.side === 'positive' ? 'Positive' : 'Negative'} · ${esc(r.label)} <span>${fmt(r.n)} voters · ${fmt(r.unique)} distinct${r.cont ? ' · continued' : ''}</span></td></tr>`
    : `<tr><td class="c1">${esc(r.u.text)}</td><td>${fmt(r.u.n)}</td><td>${esc(where(r.u))}</td><td>${r.u.conf}</td></tr>`).join('')}</table>`;

  /* ---------- CLASSIC STYLE ---------- */
  function classic(M, S, X, opts) {
    const K = window.CLASSIC, sub = X.P.auditSubmissionLabel;
    const head = (e, t) => K.smallHeader(M, X, e, t, sub), foot = K.footer(M, X, sub);
    const pages = [];
    const lgaRows = S.byLga.map(l => ({ label: l.key, note: 'n=' + fmt(l.n), segs: pnSegs(l) }));
    // 1 overview
    pages.push(K.page('p-s1', K.bigHeader(M, X, sub, 'Sentiment Analysis') + `<div class="body">
      <div class="kpis six">${kpis(S, M, X).map(K.kpi).join('')}</div>
      <div class="row" style="grid-template-columns:1.05fr .95fr 1.2fr;flex:1">
        ${K.card('Overall sentiment', 'Every piece of feedback', `<div class="donutwrap">${CH.donut([{ v: S.pos.length, color: POS }, { v: S.neg.length, color: NEG }], 118, 22, signed(S.net), 'net sentiment')}<div class="lgs"><div class="lg"><i style="background:${POS}"></i>Positive ${fmt(S.pos.length)} (${pct(S.posRate, 1)})</div><div class="lg"><i style="background:${NEG}"></i>Negative ${fmt(S.neg.length)} (${pct(S.negRate, 1)})</div><div class="lg"><i style="background:${NEU}"></i>No opinion ${fmt(S.procedural)}</div><div class="lg"><i style="background:#F2A81D"></i>Mixed ${fmt(S.mixed.length)}</div></div></div>`)}
        ${K.card('How strongly they feel', 'Score of each note, five bands', bands(S.bands, 330, 170))}
        ${K.card('Sentiment by LGA', 'Share of feedback', CH.stack100(lgaRows, 420, { labelW: 134, noteW: 50, barH: lgaRows.length > 3 ? 14 : 28, gap: lgaRows.length > 3 ? 5 : 16, legend: pnLegend }))}
      </div>
      ${K.panel('What the feedback tells us', 's1tells', TX.tells(S, X), 'wide')}
      <div class="defs" style="grid-template-columns:1fr;font-size:9.4px">${method(S)}</div>
      </div>` + foot));
    // 2 where and when
    const wards = S.byWard.slice(0, R.maxWardsShown).sort((a, b) => b.posRate - a.posRate);
    const outRows = [...X.impClasses].filter(c => S.byOutcome.find(o => o.key === c.key)).map(c => { const o = S.byOutcome.find(x => x.key === c.key); return { label: c.label, note: 'n=' + fmt(o.n), segs: pnSegs(o) }; });
    pages.push(K.page('p-s2', head('Sentiment analysis', 'Where and when') + `<div class="body">
      <div class="row" style="grid-template-columns:1fr 1fr;flex:1">
        ${K.card('Sentiment by ward', `Share of each ward's feedback${S.byWard.length > R.maxWardsShown ? ` · ${R.maxWardsShown} wards with most feedback` : ''}`, diverge(wards.map(w => ({ ...w, label: w.key })), 470, { colorOf: X.colorOf, rowH: Math.min(19, 430 / Math.max(wards.length, 1)) }))}
        <div class="col">
          ${K.card('Through the day', 'Feedback per hour · line = % positive', hourly(S.byHour, 480, 200))}
          ${K.card('Feedback against call outcome', 'Does what voters said match how the call was coded?', CH.stack100(outRows, 480, { labelW: 90, noteW: 50, barH: 16, gap: 7, legend: pnLegend }))}
        </div>
      </div>
      ${K.panel('Where and when signals', 's2where', TX.where(S), 'wide')}
      </div>` + foot));
    // 3, 4 drivers
    [['positive', S.posThemes, 'What drives positive sentiment', 's3pos'], ['negative', S.negThemes, 'What drives negative sentiment', 's4neg']].forEach(([side, themes, title, id]) => {
      const bars = hbar(themes.map(t => ({ label: t.label, n: t.n, color: side === 'positive' ? POS : NEG, note: `${fmt(t.n)} · ${pct(t.share)}` })), 340, { rowH: 26, size: 9.5, noteW: 66 });
      pages.push(K.page('p-s3', head('Sentiment analysis', title) + `<div class="body">
        <div class="row" style="grid-template-columns:.85fr 2fr;flex:1">
          <div class="col">${K.card('Themes', `${fmt(side === 'positive' ? S.pos.length : S.neg.length)} ${side} notes, grouped`, bars)}${K.panel('In short', id, TX.drivers(themes, side))}</div>
          <div class="card thwrap"><div class="ct">What voters said <span>Grouped by theme · repeated comments counted once · cleaned for reading</span></div><div class="thgrid">${themes.slice(0, 4).map(t => themeCard(t, side, 'thcard', themes.length > 2 ? 4 : 8)).join('') || '<p class="muted pad">No feedback in this group today.</p>'}</div></div>
        </div></div>` + foot));
    });
    // 5 words, mixed, coding, recommendations
    const subj = S.subjects.map(s => ({ label: s.term, n: s.n, color: s.posRate >= .5 ? POS : NEG, note: `${fmt(s.n)} · ${pct(s.posRate)} +` }));
    const mixed = [...new Map(S.mixed.map(i => [i.key, i])).values()].slice(0, 6);
    const coded = [...new Map(S.posCodedNeg.map(i => [i.key, i])).values()].slice(0, 6);
    const itemStmt = i => `<div class="stm" data-drop><div class="st">${esc(i.text)}</div><div class="sm">${esc(i.wardLabel)} · ${esc(i.agent)}</div></div>`;
    pages.push(K.page('p-s5', head('Sentiment analysis', 'Words, topics and action') + `<div class="body">
      <div class="row" style="grid-template-columns:1fr 1fr 1fr">
        ${K.card('Words behind positive notes', 'Notes using each', hbar(S.posWords.slice(0, 8).map(w => ({ label: w.term, n: w.n, color: POS })), 300, { rowH: 19, size: 9 }))}
        ${K.card('Words behind negative notes', 'Notes using each', hbar(S.negWords.slice(0, 8).map(w => ({ label: w.term, n: w.n, color: NEG })), 300, { rowH: 19, size: 9 }))}
        ${K.card('Topics voters raise', 'Notes · share positive', hbar(subj.slice(0, 8), 300, { rowH: 19, size: 8.6, noteW: 62 }))}
      </div>
      <div class="row" style="grid-template-columns:1fr 1fr 1.1fr;flex:1">
        ${K.card('Positive with a concern', `${fmt(S.mixed.length)} mixed notes`, `<div class="stlist">${mixed.map(itemStmt).join('') || '<p class="muted pad">None today.</p>'}</div>`)}
        ${K.card('Coded Positive, reads negative', `${fmt(S.posCodedNeg.length)} calls to review`, `<div class="stlist">${coded.map(itemStmt).join('') || `<p class="muted pad">Feedback matched the coding on every Positive and Volunteer call today. Nothing to review.</p>`}</div>`)}
        ${K.panel('Recommendations', 's5recs', TX.recs(S, X))}
      </div></div>` + foot));
    // 6+ register
    if (opts.register !== false) {
      const regPages = paginate(registerRows(S), 548, 118, 22, 12.4, 7);
      regPages.forEach((rows, k) => pages.push(K.page('p-sreg', head('Sentiment analysis', `Feedback register${regPages.length > 1 ? ` (${k + 1} of ${regPages.length})` : ''}`) + `<div class="body"><div class="card full reg">${regTable(rows, 'regt')}</div></div>` + foot)));
    }
    return pages.join('');
  }

  /* ---------- DASHBOARD STYLE ---------- */
  function dash(M, S, X, opts) {
    const D = window.DASH; D.setTheme(X);
    const sub = X.P.auditSubmissionLabel;
    const regPages = opts.register !== false ? paginate(registerRows(S), 950, 82, 24, 11.6, 7) : [];
    const nav = [{ icon: 'grid', label: 'Overview' }, { icon: 'pin', label: 'Where and when' }, { icon: 'trend', label: 'Positive drivers' }, { icon: 'bell', label: 'Negative drivers', badge: S.neg.length || '' }, { icon: 'chat', label: 'Words and action' }];
    if (regPages.length) nav.push({ icon: 'list', label: 'Feedback register', badge: regPages.length > 1 ? regPages.length : '' });
    const SS = { nav, submission: sub };
    const total = 5 + regPages.length;
    const shell = (i, eyebrow, title, body, extra = {}) => D.shell(M, X, SS, i, { eyebrow, title, bigTitle: 'Sentiment Analysis', pages: total, ...extra }, body);
    const pages = [];
    const lgaRows = S.byLga.map(l => ({ label: l.key, note: 'n=' + fmt(l.n), segs: pnSegs(l) }));
    const [pv, pu] = D.splitPct(S.posRate);
    const F = facts(S);
    const kp = kpis(S, M, X).slice(3).map(([l, v, n, c]) => `<div class="dkpi"><span>${esc(l)}</span><b style="color:${c}">${v}</b><em>${n}</em></div>`).join('');
    // 1 overview
    pages.push(shell(0, 'Sentiment analysis', 'Sentiment at a glance', `
      ${D.hero({ chips: [`Positive ${fmt(S.pos.length)}`, `Negative ${fmt(S.neg.length)}`, `No opinion ${fmt(S.procedural)}`], label: 'Positive feedback', big: D.big(pv, pu, `${fmt(S.pos.length)} of ${fmt(S.total)} notes`), prog: S.posRate,
        minis: [D.mini('chat', 'Feedback<br>analysed', fmt(S.total)), D.mini('trend', 'Net<br>sentiment', signed(S.net))],
        route: S.byHour.filter(h => h.key != null).map(h => h.posRate * 100), alertTitle: 'What the feedback tells us', alertLink: `Day ${X.day}`, alertIcon: 'bell', alertBody: ed('s1tells', TX.tells(S, X)), alertTop: 28 })}
      <div class="dkpis" style="grid-template-columns:repeat(3,1fr)">${kp}</div>
      <div class="drow" style="grid-template-columns:1fr 1.15fr">
        ${D.card('Overall sentiment', 'All feedback', `<div class="ddonut">${D.dDonut([{ v: S.pos.length, color: POS }, { v: S.neg.length, color: NEG }], 92, 20, signed(S.net), 'net')}<div class="dlegend"><div><i style="background:${POS}"></i>Positive<b>${pct(S.posRate, 1)}</b></div><div><i style="background:${NEG}"></i>Negative<b>${pct(S.negRate, 1)}</b></div><div><i style="background:#F2A81D"></i>Mixed<b>${fmt(S.mixed.length)}</b></div><div><i style="background:${NEU}"></i>No opinion<b>${fmt(S.procedural)}</b></div></div></div>`)}
        ${D.card('How strongly they feel', 'Five bands', bands(S.bands, 330, 128))}
      </div>
      ${D.card('Sentiment by LGA', 'Share of feedback', CH.stack100(lgaRows, 594, { labelW: 134, noteW: 50, barH: lgaRows.length > 3 ? 10 : 24, gap: lgaRows.length > 3 ? 4 : 12, legend: pnLegend }))}
      ${F.p1 && F.n1 ? D.banner(`Top driver: ${esc(lower(F.p1.label))}`, `Leading concern: ${esc(lower(F.n1.label))} (${fmt(F.n1.n)} voters)`, 'Negative drivers') : ''}
      <div class="dcap">${method(S)}</div>`));
    // 2 where and when
    const wards = S.byWard.slice(0, R.maxWardsShown).sort((a, b) => b.posRate - a.posRate);
    const outRows = [...X.impClasses].filter(c => S.byOutcome.find(o => o.key === c.key)).map(c => { const o = S.byOutcome.find(x => x.key === c.key); return { label: c.label, note: 'n=' + fmt(o.n), segs: pnSegs(o) }; });
    pages.push(shell(1, 'Sentiment analysis', 'Where and when', `
      ${D.card('Sentiment by ward', S.byWard.length > R.maxWardsShown ? `${R.maxWardsShown} wards with most feedback` : `${S.byWard.length} wards`, diverge(wards.map(w => ({ ...w, label: w.key })), 594, { colorOf: X.colorOf, rowH: Math.min(18, 350 / Math.max(wards.length, 1)) }))}
      ${D.card('Through the day', 'Feedback per hour · line = % positive', hourly(S.byHour, 594, 158))}
      ${D.card('Feedback against call outcome', 'Does what voters said match the coding?', CH.stack100(outRows, 594, { labelW: 90, noteW: 50, barH: 13, gap: 6, legend: pnLegend }))}
      ${D.redText('Where and when signals', `Agreement ${pct(S.agreement)}`, 's2where', TX.where(S))}`));
    // 3, 4 drivers
    [['positive', S.posThemes, 'What drives positive sentiment', 's3pos', 2], ['negative', S.negThemes, 'What drives negative sentiment', 's4neg', 3]].forEach(([side, themes, title, id, i]) => {
      const bars = hbar(themes.map(t => ({ label: t.label, n: t.n, color: side === 'positive' ? POS : NEG, note: `${fmt(t.n)} · ${pct(t.share)}` })), 594, { rowH: 24, size: 10, noteW: 72 });
      pages.push(shell(i, 'Sentiment analysis', title, `
        ${D.card('Themes', `${fmt(side === 'positive' ? S.pos.length : S.neg.length)} ${side} notes, grouped`, bars)}
        <div class="dthgrid">${themes.slice(0, 4).map(t => themeCard(t, side, 'dthcard', themes.length > 2 ? 5 : 9)).join('') || '<p class="dcap">No feedback in this group today.</p>'}</div>
        ${D.redText('In short', 'Top themes', id, TX.drivers(themes, side))}`));
    });
    // 5 words and action
    const subj = S.subjects.map(s => ({ label: s.term, n: s.n, color: s.posRate >= .5 ? POS : NEG, note: `${fmt(s.n)} · ${pct(s.posRate)} +` }));
    const mixed = [...new Map(S.mixed.map(i => [i.key, i])).values()].slice(0, 5);
    const coded = [...new Map(S.posCodedNeg.map(i => [i.key, i])).values()].slice(0, 5);
    const itemStmt = i => `<div class="stm" data-drop><div class="st">${esc(i.text)}</div><div class="sm">${esc(i.wardLabel)} · ${esc(i.agent)}</div></div>`;
    pages.push(shell(4, 'Sentiment analysis', 'Words, topics and action', `
      <div class="drow" style="grid-template-columns:1fr 1fr">
        ${D.card('Words behind positive notes', 'Notes using each', hbar(S.posWords.slice(0, 7).map(w => ({ label: w.term, n: w.n, color: POS })), 290, { rowH: 19, size: 9 }))}
        ${D.card('Words behind negative notes', 'Notes using each', hbar(S.negWords.slice(0, 7).map(w => ({ label: w.term, n: w.n, color: NEG })), 290, { rowH: 19, size: 9 }))}
      </div>
      ${D.card('Topics voters raise', 'Mentions · share positive', hbar(subj.slice(0, 8), 594, { rowH: 19, size: 9.5, noteW: 70 }))}
      <div class="drow" style="grid-template-columns:1fr 1fr">
        ${D.card('Positive with a concern', `${fmt(S.mixed.length)} mixed`, `<div class="stlist">${mixed.map(itemStmt).join('') || '<p class="dcap">None today.</p>'}</div>`)}
        ${D.card('Coded Positive, reads negative', `${fmt(S.posCodedNeg.length)} to review`, `<div class="stlist">${coded.map(itemStmt).join('') || `<p class="dcap">Feedback matched the coding on every Positive and Volunteer call today. Nothing to review.</p>`}</div>`)}
      </div>
      ${D.redText('Recommendations', `Day ${X.day + 1}`, 's5recs', TX.recs(S, X))}`));
    // 6+ register
    regPages.forEach((rows, k) => pages.push(shell(5, 'Sentiment analysis', `Feedback register${regPages.length > 1 ? ` (${k + 1} of ${regPages.length})` : ''}`, D.card('All feedback, grouped', 'Cleaned for reading · repeats counted once', regTable(rows, 'regt dregt')), { pageNo: 6 + k })));
    return pages.join('');
  }

  window.buildSentimentReport = function (M, opts) {
    const X = C.ctx(M, opts);
    const S = window.analyseSentiment(M);
    const html = S.total
      ? (opts.style === 'dash' ? dash(M, S, X, opts) : classic(M, S, X, opts))
      : '';
    return { html, S };
  };
  window.SENTIMENT_TEXT = TX;
})();
