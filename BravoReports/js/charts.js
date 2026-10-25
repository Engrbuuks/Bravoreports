/* Hand drawn SVG charts. Every function returns an SVG string. */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
  const fmt = n => Math.round(n).toLocaleString('en-NG');
  const INK = '#1C1340', MUTE = '#5E5A72', GRID = '#ECEAF3', AXIS = '#B9B5C8';
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 11}" fill="${o.fill || INK}" font-weight="${o.weight || 400}" text-anchor="${o.anchor || 'start'}"${o.family ? ` font-family="${o.family}"` : ''}${o.baseline ? ` dominant-baseline="${o.baseline}"` : ''}>${esc(s)}</text>`;
  const svg = (w, h, body, extra = '') => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" font-family="Poppins, Arial, sans-serif"${extra}>${body}</svg>`;

  function niceMax(v, steps = 4) {
    if (v <= 0) return 1;
    const raw = v / steps; const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag; const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return s * mag * steps;
  }

  const C = {};
  /* Rough width of a Poppins string, used to size label columns and legends. */
  const tw = (str, size) => String(str).length * size * 0.58;
  C._tw = tw;
  /* Legend that flows left to right and wraps. Returns {body, height}. */
  C._legendFlow = function (items, x0, y0, width, size = 11, sw = 9) {
    let x = x0, y = y0, body = '';
    const lineH = size + 7;
    items.forEach(it => {
      const iw = sw + 5 + tw(it.label, size) + 14;
      if (x > x0 && x + iw > x0 + width) { x = x0; y += lineH; }
      body += `<rect x="${x}" y="${y - sw + 1}" width="${sw}" height="${sw}" rx="1.5" fill="${it.color}"/>` + T(x + sw + 5, y, it.label, { size, fill: INK });
      x += iw;
    });
    return { body, height: y - y0 + lineH };
  };

  C.donut = function (segs, size, thick, big, small) {
    const r = size / 2, ro = r - 2, ri = ro - thick, cx = r, cy = r;
    const total = segs.reduce((a, s) => a + s.v, 0) || 1;
    let a0 = -Math.PI / 2; let body = '';
    segs.forEach(s => {
      if (!s.v) return;
      const a1 = a0 + s.v / total * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const gap = segs.length > 1 ? 0.004 : 0;
      const p = (rad, ang) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
      const [x1, y1] = p(ro, a0 + gap), [x2, y2] = p(ro, a1 - gap), [x3, y3] = p(ri, a1 - gap), [x4, y4] = p(ri, a0 + gap);
      body += `<path d="M${x1},${y1} A${ro},${ro} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${ri},${ri} 0 ${large} 0 ${x4},${y4} Z" fill="${s.color}"/>`;
      a0 = a1;
    });
    body += T(cx, cy - 2, big, { size: size * 0.11, weight: 700, anchor: 'middle', family: 'Barlow Condensed' });
    body += T(cx, cy + size * 0.1, small, { size: size * 0.05, anchor: 'middle', fill: MUTE });
    return svg(size, size, body);
  };

  /* Horizontal 100% stacked bars. rows: [{label, segs:[{v,color}], note}] */
  C.stack100 = function (rows, w, opts = {}) {
    const labW = opts.labelW || 80, noteW = opts.noteW || 60, barH = opts.barH || 30, gap = opts.gap || 22, top = 4;
    const legend = opts.legend || [];
    const bw = w - labW - noteW - 10;
    const lsz = opts.legendSize || 10.5;
    const lgd = legend.length ? C._legendFlow(legend, labW, 0, w - labW - 2, lsz) : null;
    const barsBottom = top + rows.length * (barH + gap) - gap;
    const h = barsBottom + (lgd ? lgd.height + 10 : 6);
    let body = '';
    rows.forEach((r, i) => {
      const y = top + i * (barH + gap);
      const tot = r.segs.reduce((a, s) => a + s.v, 0) || 1;
      let x = labW;
      body += T(labW - 10, y + barH / 2, r.label, { anchor: 'end', size: 12, baseline: 'middle', fill: INK });
      r.segs.forEach(s => {
        const sw = s.v / tot * bw; if (sw <= 0) return;
        body += `<rect x="${x}" y="${y}" width="${sw}" height="${barH}" fill="${s.color}"/>`;
        if (sw > 34) body += T(x + sw / 2, y + barH / 2 + 1, pct(s.v / tot), { size: 11, weight: 700, anchor: 'middle', baseline: 'middle', fill: s.dark ? INK : '#fff' });
        x += sw;
      });
      body += T(labW + bw + 8, y + barH / 2, r.note || '', { size: 11, baseline: 'middle', fill: MUTE });
    });
    if (lgd) body += C._legendFlow(legend, labW, barsBottom + 20, w - labW - 2, lsz).body;
    return svg(w, h, body);
  };

  C._legendRow = function (items, x0, y, width) {
    let body = ''; const per = width / items.length;
    items.forEach((it, i) => {
      const x = x0 + i * per;
      body += `<rect x="${x}" y="${y - 5}" width="9" height="9" fill="${it.color}"/>` + T(x + 14, y + 4, it.label, { size: 11, fill: INK });
    });
    return body;
  };

  /* Ward bars with label inside left, value at right. */
  C.reachByWard = function (wards, w, colorOf, opts = {}) {
    const labW = Math.min(w * 0.45, Math.max(80, ...wards.map(d => tw(d.label, 10))) + 8), rowH = opts.rowH || 13.4, barMax = w - labW - 6, top = 2;
    const h = top + wards.length * rowH + 4;
    let body = '';
    wards.forEach((d, i) => {
      const y = top + i * rowH;
      body += T(labW - 6, y + rowH / 2, d.label, { anchor: 'end', size: 10, baseline: 'middle' });
      body += `<rect x="${labW}" y="${y + 1.5}" width="${barMax}" height="${rowH - 3}" fill="#E9E5F3"/>`;
      body += `<rect x="${labW}" y="${y + 1.5}" width="${barMax * d.reach}" height="${rowH - 3}" fill="${colorOf(d.lga)}"/>`;
      body += T(labW + 4, y + rowH / 2 + 0.5, pct(d.reach) + ' reached', { size: opts.rowH > 15 ? 9.5 : 8.5, weight: 700, fill: '#fff', baseline: 'middle' });
      body += T(labW + barMax - 4, y + rowH / 2 + 0.5, fmt(d.dials) + ' dials', { size: opts.rowH > 15 ? 9.5 : 8.5, fill: MUTE, anchor: 'end', baseline: 'middle' });
    });
    return svg(w, h, body);
  };

  /* Hourly stacked bars with reach and support lines. */
  C.hourly = function (M, w, h, colors) {
    const L = 64, Rm = 56, top = 18, bot = 66;
    const pw = w - L - Rm, ph = h - top - bot;
    const n = M.hourly.length || 1;
    const maxD = niceMax(Math.max(...M.hourly.map(x => x.dials), 1));
    const bw = pw / n * 0.62;
    let body = '';
    for (let i = 0; i <= 4; i++) {
      const v = maxD / 4 * i, y = top + ph - ph * v / maxD;
      body += `<line x1="${L}" x2="${L + pw}" y1="${y}" y2="${y}" stroke="${GRID}"/>`;
      body += T(L - 8, y + 4, fmt(v), { anchor: 'end', size: 12, fill: INK });
      body += T(L + pw + 8, y + 4, (25 * i) + '%', { size: 12, fill: INK });
    }
    body += `<line x1="${L + pw}" x2="${L + pw}" y1="${top}" y2="${top + ph}" stroke="${AXIS}"/>`;
    body += `<text transform="translate(16 ${top + ph / 2}) rotate(-90)" font-size="13" text-anchor="middle" fill="${INK}">Dials per hour</text>`;
    const order = ['positive', 'volunteer', 'undecided', 'followup', 'negative', 'inapplicable'];
    const reachPts = [], supPts = [];
    M.hourly.forEach((hr, i) => {
      const cx = L + pw / n * (i + .5), x = cx - bw / 2;
      let y = top + ph;
      order.forEach(k => { const v = hr.c[k]; if (!v) return; const hh = ph * v / maxD; y -= hh; body += `<rect x="${x}" y="${y}" width="${bw}" height="${hh}" fill="${colors[k]}"/>`; });
      if (hr.nonImp) { const hh = ph * hr.nonImp / maxD; y -= hh; body += `<rect x="${x}" y="${y}" width="${bw}" height="${hh}" fill="#D7D3E3"/>`; }
      if (hr.dials) body += T(cx, y - 5, fmt(hr.dials), { anchor: 'middle', size: 11.5, weight: 700, fill: INK });
      body += T(cx, top + ph + 18, String(hr.hour).padStart(2, '0') + ':00', { anchor: 'middle', size: 12, fill: INK });
      if (hr.reach != null) reachPts.push([cx, top + ph - ph * hr.reach]);
      if (hr.support != null) supPts.push([cx, top + ph - ph * hr.support]);
    });
    const line = (pts, col, sq) => pts.length ? `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="2.4"/>` + pts.map(p => sq ? `<rect x="${p[0] - 5}" y="${p[1] - 5}" width="10" height="10" fill="${col}"/>` : `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${col}"/>`).join('') : '';
    body += line(reachPts, '#F2A81D', false) + line(supPts, '#E23B4E', true);
    body += `<line x1="${L}" x2="${L + pw}" y1="${top + ph}" y2="${top + ph}" stroke="${AXIS}"/>`;
    const lg = [['Positive', colors.positive], ['Undecided', colors.undecided], ['Negative', colors.negative], ['Non impression', '#D7D3E3']];
    const lg2 = [['Volunteer', colors.volunteer], ['Follow up', colors.followup], ['Inapplicable', colors.inapplicable]];
    const lx = L + pw * 0.12, ly = top + ph + 38;
    lg.forEach((it, i) => { body += `<rect x="${lx + i * 120}" y="${ly - 7}" width="10" height="10" fill="${it[1]}"/>` + T(lx + i * 120 + 16, ly + 2, it[0], { size: 11.5 }); });
    body += `<rect x="${lx + 4 * 120 + 4}" y="${ly - 7}" width="10" height="10" fill="#E23B4E"/>` + T(lx + 4 * 120 + 20, ly + 2, 'Support rate (of reached)', { size: 11.5 });
    lg2.forEach((it, i) => { body += `<rect x="${lx + i * 120}" y="${ly + 9}" width="10" height="10" fill="${it[1]}"/>` + T(lx + i * 120 + 16, ly + 18, it[0], { size: 11.5 }); });
    body += `<circle cx="${lx + 3 * 120 + 5}" cy="${ly + 14}" r="5" fill="#F2A81D"/>` + T(lx + 3 * 120 + 16, ly + 18, 'Reach rate', { size: 11.5 });
    return svg(w, h, body);
  };

  /* Box plot of call duration by impression class. */
  C.boxplot = function (M, w, h, classes) {
    const L = 92, Rm = 20, top = 8, bot = 40;
    const pw = w - L - Rm, ph = h - top - bot;
    const maxV = niceMax(Math.max(...classes.map(c => M.durByClass[c.key].max), 60), 5);
    const xs = v => L + pw * Math.min(v, maxV) / maxV;
    let body = '';
    const step = maxV / 5;
    for (let i = 0; i <= 5; i++) { const x = xs(step * i); body += T(x, top + ph + 16, fmt(step * i), { anchor: 'middle', size: 12 }); }
    body += `<line x1="${L}" x2="${L + pw}" y1="${top + ph}" y2="${top + ph}" stroke="${AXIS}"/><line x1="${L}" x2="${L}" y1="${top}" y2="${top + ph}" stroke="${AXIS}"/>`;
    body += T(L + pw / 2, top + ph + 34, 'Call duration (seconds)', { anchor: 'middle', size: 13 });
    const rowH = ph / classes.length;
    classes.forEach((c, i) => {
      const d = M.durByClass[c.key]; const cy = top + rowH * (i + .5);
      body += T(L - 8, cy + 4, c.label, { anchor: 'end', size: 12 });
      if (!d.n) return;
      const bh = rowH * 0.62;
      body += `<line x1="${xs(d.min)}" x2="${xs(d.max)}" y1="${cy}" y2="${cy}" stroke="${INK}" stroke-width="1"/>`;
      body += `<line x1="${xs(d.min)}" x2="${xs(d.min)}" y1="${cy - bh / 4}" y2="${cy + bh / 4}" stroke="${INK}"/><line x1="${xs(d.max)}" x2="${xs(d.max)}" y1="${cy - bh / 4}" y2="${cy + bh / 4}" stroke="${INK}"/>`;
      body += `<rect x="${xs(d.q1)}" y="${cy - bh / 2}" width="${Math.max(xs(d.q3) - xs(d.q1), 2)}" height="${bh}" fill="${c.color}"/>`;
      body += `<line x1="${xs(d.med)}" x2="${xs(d.med)}" y1="${cy - bh / 2}" y2="${cy + bh / 2}" stroke="#fff" stroke-width="2"/>`;
      const lx = xs(d.max) + 6, label = `median ${Math.round(d.med)}s`;
      body += lx + C._tw(label, 10.5) < w ? T(lx, cy + 4, label, { size: 10.5, fill: INK }) : T(xs(d.min) - 6, cy + 4, label, { size: 10.5, fill: INK, anchor: 'end' });
    });
    return svg(w, h, body);
  };

  /* Agent dials with voters reached overlay. */
  C.agentBars = function (M, w, h, brand) {
    const L = 52, Rm = 14, top = 30, bot = 62;
    const pw = w - L - Rm, ph = h - top - bot, n = M.agents.length || 1;
    const maxV = niceMax(Math.max(...M.agents.map(a => a.dials), 1), 6);
    const ys = v => top + ph - ph * v / maxV;
    let body = '';
    for (let i = 0; i <= 6; i++) { const v = maxV / 6 * i; body += `<line x1="${L}" x2="${L + pw}" y1="${ys(v)}" y2="${ys(v)}" stroke="${GRID}"/>` + T(L - 8, ys(v) + 4, fmt(v), { anchor: 'end', size: 12 }); }
    const bw = pw / n * 0.74;
    M.agents.forEach((a, i) => {
      const cx = L + pw / n * (i + .5), x = cx - bw / 2;
      const ok = a.dials >= M.teamAvgDials;
      body += `<rect x="${x}" y="${ys(a.dials)}" width="${bw}" height="${top + ph - ys(a.dials)}" fill="${ok ? '#2EA44F' : '#E23B4E'}"/>`;
      body += `<rect x="${x + bw * 0.18}" y="${ys(a.imp)}" width="${bw * 0.64}" height="${top + ph - ys(a.imp)}" fill="${brand}"/>`;
      body += T(cx, ys(a.dials) - 5, fmt(a.dials), { anchor: 'middle', size: 10.5, weight: 700 });
      body += `<text transform="translate(${cx + 4} ${top + ph + 10}) rotate(-38)" font-size="11" text-anchor="end" fill="${INK}">${esc(a.short)}</text>`;
    });
    body += `<line x1="${L}" x2="${L + pw}" y1="${ys(M.teamAvgDials)}" y2="${ys(M.teamAvgDials)}" stroke="#B88A00" stroke-dasharray="6 4" stroke-width="1.2"/>`;
    body += T(L + pw - 4, ys(M.teamAvgDials) - 5, `Team average ${Math.round(M.teamAvgDials)} dials`, { anchor: 'end', size: 11, fill: '#B88A00' });
    body += `<line x1="${L}" x2="${L + pw}" y1="${top + ph}" y2="${top + ph}" stroke="${AXIS}"/>`;
    const lx = L + pw * 0.38;
    [['Dials (at or above team average)', '#2EA44F'], ['Dials (below team average)', '#E23B4E'], ['Voters reached', brand]].forEach((it, i) => { const x = lx - 90 + i * 230; body += `<rect x="${x}" y="2" width="22" height="11" fill="${it[1]}"/>` + T(x + 28, 11, it[0], { size: 11.5 }); });
    return svg(w, h, body);
  };

  /* Productivity vs quality scatter. */
  C.agentScatter = function (M, w, h) {
    const L = 66, Rm = 76, top = 10, bot = 42;
    const pw = w - L - Rm, ph = h - top - bot;
    const A = M.agents; if (!A.length) return svg(w, h, '');
    const minX = Math.max(0, Math.floor(Math.min(...A.map(a => a.dials)) / 50) * 50 - 25), maxX = Math.ceil(Math.max(...A.map(a => a.dials)) / 50) * 50 + 25;
    const minY = Math.max(0, Math.floor(Math.min(...A.map(a => a.feedbackRate)) * 10) / 10 - 0.05), maxY = 1.02;
    const xs = v => L + pw * (v - minX) / (maxX - minX), ys = v => top + ph - ph * (v - minY) / (maxY - minY);
    const rMin = Math.min(...A.map(a => a.reach)), rMax = Math.max(...A.map(a => a.reach));
    const col = v => { const t = rMax > rMin ? (v - rMin) / (rMax - rMin) : .5; const a = [208, 226, 242], b = [8, 76, 97]; const c = a.map((x, i) => Math.round(x + (b[i] - x) * t)); return `rgb(${c.join(',')})`; };
    const tMax = Math.max(...A.map(a => a.talkMin), 1);
    let body = '';
    for (let v = Math.ceil(minY * 10) / 10; v <= 1.001; v += 0.1) body += `<line x1="${L}" x2="${L + pw}" y1="${ys(v)}" y2="${ys(v)}" stroke="${GRID}"/>` + T(L - 6, ys(v) + 4, pct(v), { anchor: 'end', size: 12 });
    for (let v = Math.ceil(minX / 50) * 50; v <= maxX; v += 50) body += T(xs(v), top + ph + 16, fmt(v), { anchor: 'middle', size: 12 });
    body += `<line x1="${xs(M.teamAvgDials)}" x2="${xs(M.teamAvgDials)}" y1="${top}" y2="${top + ph}" stroke="#E0A800" stroke-dasharray="4 3"/>`;
    body += `<line x1="${L}" x2="${L + pw}" y1="${ys(0.5)}" y2="${ys(0.5)}" stroke="#B9B5C8" stroke-dasharray="2 3"/>`;
    body += `<rect x="${L}" y="${top}" width="${pw}" height="${ph}" fill="none" stroke="${AXIS}"/>`;
    body += T(L + 6, top + 14, 'Bubble = talk minutes', { size: 10.5, fill: MUTE });
    [...A].sort((a, b) => b.talkMin - a.talkMin).forEach(a => {
      const r = 5 + 9 * Math.sqrt(a.talkMin / tMax);
      body += `<circle cx="${xs(a.dials)}" cy="${ys(a.feedbackRate)}" r="${r}" fill="${col(a.reach)}" stroke="#3B4A6B" stroke-width="0.6" opacity="0.92"/>`;
      body += T(xs(a.dials) + r + 2, ys(a.feedbackRate) - 2, a.short.split(' ')[0], { size: 10 });
    });
    body += T(L + pw / 2, top + ph + 34, 'Dials made', { anchor: 'middle', size: 13 });
    body += `<text transform="translate(14 ${top + ph / 2}) rotate(-90)" font-size="13" text-anchor="middle" fill="${INK}">Feedback capture</text>`;
    const cbx = L + pw + 14;
    body += `<defs><linearGradient id="rg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgb(208,226,242)"/><stop offset="1" stop-color="rgb(8,76,97)"/></linearGradient></defs>`;
    body += `<rect x="${cbx}" y="${top}" width="10" height="${ph}" fill="url(#rg)"/>`;
    for (let i = 0; i <= 4; i++) { const v = rMin + (rMax - rMin) * i / 4; body += T(cbx + 14, top + ph - ph * i / 4 + 4, v.toFixed(2), { size: 10 }); }
    body += `<text transform="translate(${cbx + 52} ${top + ph / 2}) rotate(90)" font-size="11" text-anchor="middle" fill="${INK}">Reach rate</text>`;
    return svg(w, h, body);
  };

  /* Support rate by ward, coloured by LGA, with constituency average line. */
  C.supportByWard = function (wards, w, h, avg, colorOf, legend) {
    const labW = Math.min(w * 0.46, Math.max(90, ...wards.map(d => tw(d.label, 10.5))) + 10), top = 14, Rm = 72;
    const pw = w - labW - Rm;
    const lgd = legend.length ? C._legendFlow(legend.map(l => ({ label: l.name, color: l.color })), 8, 0, w - 16, 10.5) : null;
    const bot = lgd ? lgd.height + 10 : 6, ph = h - top - bot;
    const rowH = ph / Math.max(wards.length, 1);
    let body = '';
    const ax = labW + pw * avg;
    wards.forEach((d, i) => {
      const y = top + i * rowH;
      body += T(labW - 6, y + rowH / 2 + 1, d.label, { anchor: 'end', size: 10.5, baseline: 'middle' });
      body += `<rect x="${labW}" y="${y + rowH * 0.16}" width="${pw * d.supportRate}" height="${rowH * 0.68}" fill="${colorOf(d.lga)}"/>`;
      body += T(labW + pw * d.supportRate + 5, y + rowH / 2 + 1, `${pct(d.supportRate)} · n=${d.imp}`, { size: 10.5, baseline: 'middle' });
    });
    body += `<line x1="${ax}" x2="${ax}" y1="${top - 6}" y2="${top + ph}" stroke="#E0A800" stroke-width="1.6" stroke-dasharray="5 3"/>`;
    body += T(ax + 3, top - 3, 'constituency avg', { size: 10, fill: '#B88A00' });
    body += `<line x1="${labW}" x2="${labW}" y1="${top}" y2="${top + ph}" stroke="${AXIS}"/>`;
    if (lgd) body += C._legendFlow(legend.map(l => ({ label: l.name, color: l.color })), 8, top + ph + 22, w - 16, 10.5).body;
    return svg(w, h, body);
  };

  /* Reach x support x persuadables bubble chart (log x). */
  C.wardBubbles = function (wards, w, h, avg, colorOf, legend) {
    const side = legend.length > 3, L = 58, Rm = side ? 128 : 18, top = 12, bot = 44;
    const pw = w - L - Rm, ph = h - top - bot;
    if (!wards.length) return svg(w, h, '');
    const maxE = Math.max(...wards.map(d => d.imp), 10);
    const lo = Math.log10(Math.max(1, Math.min(...wards.map(d => d.imp)) * 0.8)), hi = Math.log10(maxE * 1.25);
    const sMin = Math.max(0, Math.floor(Math.min(...wards.map(d => d.supportRate)) * 10) / 10 - 0.05), sMax = Math.min(1, Math.ceil(Math.max(...wards.map(d => d.supportRate)) * 10) / 10 + 0.02);
    const xs = v => L + pw * (Math.log10(Math.max(v, 1)) - lo) / (hi - lo), ys = v => top + ph - ph * (v - sMin) / (sMax - sMin);
    const pMax = Math.max(...wards.map(d => d.persuadable), 1);
    let body = '';
    for (let v = Math.ceil(sMin * 10) / 10; v <= sMax + 0.001; v += 0.1) body += `<line x1="${L}" x2="${L + pw}" y1="${ys(v)}" y2="${ys(v)}" stroke="${GRID}"/>` + T(L - 6, ys(v) + 4, pct(v), { anchor: 'end', size: 12 });
    [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].forEach(v => { const lv = Math.log10(v); if (lv >= lo && lv <= hi) body += `<line x1="${xs(v)}" x2="${xs(v)}" y1="${top}" y2="${top + ph}" stroke="${GRID}"/>` + T(xs(v), top + ph + 16, fmt(v), { anchor: 'middle', size: 12 }); });
    body += `<line x1="${L}" x2="${L + pw}" y1="${ys(avg)}" y2="${ys(avg)}" stroke="#E0A800" stroke-dasharray="5 3" stroke-width="1.4"/>`;
    body += `<line x1="${L}" x2="${L}" y1="${top}" y2="${top + ph}" stroke="${AXIS}"/><line x1="${L}" x2="${L + pw}" y1="${top + ph}" y2="${top + ph}" stroke="${AXIS}"/>`;
    const sorted = [...wards].sort((a, b) => b.persuadable - a.persuadable);
    const labelSet = new Set([...wards].sort((a, b) => b.imp - a.imp).slice(0, 8).concat([...wards].sort((a, b) => b.supportRate - a.supportRate).slice(0, 2), [...wards].sort((a, b) => a.supportRate - b.supportRate).slice(0, 2)));
    sorted.forEach(d => { const r = 3 + 15 * Math.sqrt(d.persuadable / pMax); body += `<circle cx="${xs(d.imp)}" cy="${ys(d.supportRate)}" r="${r}" fill="${colorOf(d.lga)}" opacity="0.55"/>`; });
    labelSet.forEach(d => { const r = 3 + 15 * Math.sqrt(d.persuadable / pMax); body += T(xs(d.imp) + r * 0.7 + 2, ys(d.supportRate) - r * 0.7, d.ward.split(/[\/(]/)[0].trim(), { size: 11 }); });
    body += T(L + pw / 2, top + ph + 34, 'Voters engaged (log scale)', { anchor: 'middle', size: 13 });
    body += `<text transform="translate(14 ${top + ph / 2}) rotate(-90)" font-size="12.5" text-anchor="middle" fill="${INK}">Support rate (Positive + Volunteer)</text>`;
    if (side) legend.slice(0, 10).forEach((l, i) => { body += `<circle cx="${L + pw + 18}" cy="${top + 8 + i * 17}" r="5" fill="${l.color}"/>` + T(L + pw + 28, top + 12 + i * 17, l.name, { size: 10.5 }); });
    else legend.forEach((l, i) => { body += `<circle cx="${L + 14}" cy="${top + ph - 14 - (legend.length - 1 - i) * 16}" r="5" fill="${l.color}"/>` + T(L + 24, top + ph - 10 - (legend.length - 1 - i) * 16, l.name, { size: 11 }); });
    body += T(L + pw - 6, top + ph - 22, 'Bubble size = persuadable pool', { anchor: 'end', size: 10.5, fill: MUTE }) + T(L + pw - 6, top + ph - 8, '(Undecided + Follow up)', { anchor: 'end', size: 10.5, fill: MUTE });
    return svg(w, h, body);
  };

  /* Needs stacked by LGA. */
  C.needs = function (needs, w, lgas, colorOf) {
    const rows = needs.filter(n => n.total > 0);
    const labW = Math.max(120, ...rows.map(n => tw(n.label, 10.5))) + 8, rowH = 13.2, Rm = 30, top = 2;
    const h = top + Math.max(rows.length, 1) * rowH + 4;
    const maxV = Math.max(...rows.map(n => n.total), 1);
    const pw = w - labW - Rm;
    let body = '';
    rows.forEach((n, i) => {
      const y = top + i * rowH; let x = labW;
      body += T(labW - 6, y + rowH / 2 + 0.5, n.label, { anchor: 'end', size: 10.5, baseline: 'middle' });
      lgas.forEach(l => { const v = n.byLga[l] || 0; if (!v) return; const bw = pw * v / maxV; body += `<rect x="${x}" y="${y + 1.5}" width="${bw}" height="${rowH - 3}" fill="${colorOf(l)}"/>`; x += bw; });
      body += T(x + 4, y + rowH / 2 + 0.5, String(n.total), { size: 10.5, weight: 700, baseline: 'middle' });
    });
    return svg(w, h, body);
  };

  /* Simple vertical bars (reach by tier). */
  C.vbars = function (items, w, h, colors) {
    const top = 22, bot = 26, pw = w, ph = h - top - bot, n = items.length || 1;
    const bw = pw / n * 0.62; let body = '';
    items.forEach((it, i) => {
      const cx = pw / n * (i + .5), bh = ph * it.v;
      body += `<rect x="${cx - bw / 2}" y="${top + ph - bh}" width="${bw}" height="${bh}" fill="${colors[i % colors.length]}"/>`;
      body += T(cx, top + ph - bh - 6, pct(it.v), { anchor: 'middle', size: 12, weight: 700, family: 'Barlow Condensed' });
      body += T(cx, top + ph + 18, it.label, { anchor: 'middle', size: 12 });
    });
    return svg(w, h, body);
  };

  /* Small inline bar used in the grievance table. */
  C.miniBar = function (v, max, w = 46) { return svg(w, 10, `<rect x="0" y="1" width="${Math.max(4, w * v / Math.max(max, 1))}" height="8" rx="4" fill="#E23B4E"/>`); };

  window.CHARTS = C;
  window.CHART_UTILS = { esc, pct, fmt };
})();
