/* DASHBOARD STYLE: portrait pages laid out like a web dashboard. Same numbers and text as the classic style (js/content.js). */
(function () {
  const C = window.CONTENT, CH = window.CHARTS, R = window.RULES;
  const { esc, pct, fmt, ed, shortDate, longDate, share, signed } = C.util;
  /* Colours are set from the centre's campaign theme each time the report is built. */
  let ACC = '#C10059', ACC2 = '#052D73', SOFT = '#FBEAF1', PRI = '#052D73';
  const INK = '#141A2E', MUTE = '#7D8399';
  const mix = (hex, t) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * t + 255 * (1 - t))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };

  /* ---------- icons (simple outline glyphs) ---------- */
  const ic = (d, s = 14, col = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    phone: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    pulse: '<path d="M3 12h4l3 7 4-14 3 7h4"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    layers: '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="m2 13 10 5 10-5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const icon = (k, s, col) => ic(I[k], s, col);
  const iconCircle = (k, col = ACC) => `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${SOFT}"/><g transform="translate(5.5 5.5) scale(.54)" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${I[k]}</g></svg>`;

  /* ---------- small dashboard charts ---------- */
  let uid = 0;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 8}" fill="${o.fill || MUTE}" font-weight="${o.weight || 400}" text-anchor="${o.anchor || 'start'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${esc(s)}</text>`;
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" font-family="Poppins, Arial, sans-serif">${body}</svg>`;
  function niceMax(v, steps = 4) {
    if (v <= 0) return 1;
    const raw = v / steps; const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag; const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return s * mag * steps;
  }
  /* Line with soft area. pts: [{label, v}] */
  function dLine(pts, w, h, o = {}) {
    const white = !!o.white, axes = o.axes !== false;
    const L = axes ? 30 : 8, Rr = 10, Tp = 10, B = axes ? 20 : 8;
    const pw = w - L - Rr, ph = h - Tp - B;
    const vals = pts.map(p => p.v || 0);
    const max = o.max || niceMax(Math.max(...vals, 1));
    const min = o.min || 0;
    const x = i => L + (pts.length > 1 ? pw * i / (pts.length - 1) : pw / 2);
    const y = v => Tp + ph - ph * ((v || 0) - min) / (max - min || 1);
    const id = 'dg' + (++uid);
    let b = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${white ? '#fff' : ACC}" stop-opacity="${white ? .28 : .18}"/><stop offset="1" stop-color="${white ? '#fff' : ACC}" stop-opacity="0"/></linearGradient></defs>`;
    if (axes) for (let i = 0; i <= 4; i++) { const v = min + (max - min) * i / 4; b += `<line x1="${L}" x2="${L + pw}" y1="${y(v)}" y2="${y(v)}" stroke="${white ? 'rgba(255,255,255,.25)' : '#EFEAEA'}" stroke-dasharray="3 3"/>` + T(L - 6, y(v) + 3, o.fmtY ? o.fmtY(v) : fmt(v), { anchor: 'end', size: 7.5, fill: white ? 'rgba(255,255,255,.85)' : MUTE }); }
    if (pts.length) {
      const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.v)}`).join(' ');
      b += `<path d="${line} L${x(pts.length - 1)},${Tp + ph} L${x(0)},${Tp + ph} Z" fill="url(#${id})"/>`;
      b += `<path d="${line}" fill="none" stroke="${white ? '#fff' : ACC}" stroke-width="1.8" stroke-linejoin="round"/>`;
      pts.forEach((p, i) => { b += `<circle cx="${x(i)}" cy="${y(p.v)}" r="3.2" fill="${white ? ACC2 : '#fff'}" stroke="${white ? '#fff' : ACC}" stroke-width="1.6"/>`; });
      if (axes) pts.forEach((p, i) => { b += T(x(i), h - 5, p.label, { anchor: 'middle', size: 7.3 }); });
    }
    return svg(w, h, b);
  }
  /* Vertical bars. items: [{label, v}] */
  function dBars(items, w, h, o = {}) {
    const L = 28, Rr = 6, Tp = 12, B = o.rot ? 40 : 18;
    const pw = w - L - Rr, ph = h - Tp - B, n = items.length || 1;
    const max = niceMax(Math.max(...items.map(i => i.v), 1));
    const y = v => Tp + ph - ph * v / max;
    let b = '';
    for (let i = 0; i <= 4; i++) { const v = max * i / 4; b += `<line x1="${L}" x2="${L + pw}" y1="${y(v)}" y2="${y(v)}" stroke="#EFEAEA" stroke-dasharray="3 3"/>` + T(L - 5, y(v) + 3, fmt(v), { anchor: 'end', size: 7.3 }); }
    const bw = Math.min(16, pw / n * 0.46);
    items.forEach((it, i) => {
      const cx = L + pw / n * (i + .5), bh = Math.max(ph * it.v / max, 1);
      b += `<rect x="${cx - bw / 2}" y="${y(it.v)}" width="${bw}" height="${bh}" rx="2" fill="${it.color || ACC}" opacity="${it.dim ? .55 : 1}"/>`;
      b += T(cx, y(it.v) - 3, o.fmtV ? o.fmtV(it.v) : fmt(it.v), { anchor: 'middle', size: 7, fill: INK, weight: 500 });
      b += o.rot ? T(cx + 3, Tp + ph + 9, it.label, { anchor: 'end', size: 7, rot: -38 }) : T(cx, h - 5, it.label, { anchor: 'middle', size: 7.3 });
    });
    return svg(w, h, b);
  }
  function dDonut(segs, size, thick, big, small) {
    const r = size / 2, ro = r - 1, ri = ro - thick;
    const total = segs.reduce((a, s) => a + s.v, 0) || 1;
    let a0 = -Math.PI / 2, b = '';
    segs.forEach(s => {
      if (!s.v) return;
      const a1 = a0 + s.v / total * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0, g = 0.012;
      const p = (rad, ang) => [r + rad * Math.cos(ang), r + rad * Math.sin(ang)];
      const [x1, y1] = p(ro, a0 + g), [x2, y2] = p(ro, a1 - g), [x3, y3] = p(ri, a1 - g), [x4, y4] = p(ri, a0 + g);
      b += `<path d="M${x1},${y1} A${ro},${ro} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${ri},${ri} 0 ${large} 0 ${x4},${y4} Z" fill="${s.color}"/>`;
      a0 = a1;
    });
    if (big) b += T(r, r + 2, big, { anchor: 'middle', size: size * 0.15, fill: INK, weight: 500 });
    if (small) b += T(r, r + size * 0.13, small, { anchor: 'middle', size: size * 0.07 });
    return svg(size, size, b);
  }
  function dRing(v, size, thick, label) {
    const r = size / 2 - thick / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, v));
    return svg(size, size, `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${SOFT}" stroke-width="${thick}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${ACC}" stroke-width="${thick}" stroke-linecap="round" stroke-dasharray="${c * f} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      ${T(size / 2, size / 2 + 4, label, { anchor: 'middle', size: size * 0.17, fill: INK, weight: 500 })}`);
  }
  /* Faint street map with a dashed route whose bends follow the day's figures. */
  function dMap(vals, w, h) {
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    let b = `<rect width="${w}" height="${h}" fill="#F8F6F6"/>`;
    for (let yy = -6; yy < h; yy += 34) for (let xx = -10; xx < w; xx += 46) {
      if (rnd() < .18) continue;
      const bw = 26 + rnd() * 12, bh = 18 + rnd() * 9;
      b += `<rect x="${xx + rnd() * 6}" y="${yy + rnd() * 5}" width="${bw}" height="${bh}" rx="3" fill="${rnd() < .5 ? '#EEEBEB' : '#F2F0F0'}" transform="rotate(${(rnd() - .5) * 10} ${xx} ${yy})"/>`;
    }
    const v = vals.length ? vals : [1, 2, 3];
    const mx = Math.max(...v, 1), n = v.length;
    const pts = v.map((val, i) => {
      const t = n > 1 ? i / (n - 1) : .5;
      const base = h * .86 - t * h * .74;
      return [w * .1 + t * w * .88, Math.max(h * .08, Math.min(h * .92, base - (val / mx - .5) * h * .22))];
    });
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 2)], p1 = pts[i - 1], p2 = pts[i], p3 = pts[Math.min(pts.length - 1, i + 1)];
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    b += `<path d="${d}" fill="none" stroke="${ACC}" stroke-width="2.6" stroke-dasharray="7 5" stroke-linecap="round"/>`;
    const nodes = [Math.round((n - 1) * .18), Math.round((n - 1) * .42), Math.round((n - 1) * .62)].filter((x, i, a) => a.indexOf(x) === i);
    nodes.forEach(i => { const [x, y] = pts[i]; b += `<circle cx="${x}" cy="${y}" r="8" fill="#fff" stroke="${ACC}" stroke-width="2.4"/><circle cx="${x}" cy="${y}" r="3.4" fill="${ACC}"/>`; });
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
  }

  /* ---------- building blocks ---------- */
  const card = (title, link, body, cls = '', style = '') => `<div class="dc ${cls}"${style ? ` style="${style}"` : ''}>${title ? `<div class="dct"><h3>${esc(title)}</h3>${link ? `<span class="${link.startsWith('▾') ? 'sel' : ''}">${link.replace('▾', '')}${link.startsWith('▾') ? ' ▾' : ''}</span>` : ''}</div>` : ''}${body}</div>`;
  const big = (value, unit, note) => `<div class="dbig">${value}${unit ? `<small>${unit}</small>` : ''}${note ? `<em>${note}</em>` : ''}</div>`;
  const splitPct = (v, d = 0) => { const s = pct(v, d); return [s.slice(0, -1), '%']; };
  const prog = v => `<div class="dprog"><i style="width:${Math.max(0, Math.min(1, v)) * 100}%"></i></div>`;
  const mini = (k, label, value) => `<div class="dmini">${iconCircle(k)}<span>${label}</span><b>${value}</b></div>`;
  const initials = s => /^ward\s*\d+/i.test(s) ? 'W' + String(s).match(/\d+/)[0] : String(s).replace(/\(.*?\)/g, '').trim().split(/[\s\/]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const abbr = s => { const w = String(s).split(' '); return w.length > 1 ? `${w[0].slice(0, 3)}. ${w.slice(1).join(' ')}` : s; };
  function hero(o) {
    return `<div class="dc dhero"${o.h ? ` style="height:${o.h}px"` : ''}>
      <div class="left">
        <div class="dchips">${o.chips.map((c, i) => `<span class="dchip${i === 0 ? ' on' : ''}">${c}</span>`).join('')}</div>
        <div class="lab">${o.label}</div>
        ${o.big}
        ${prog(o.prog)}
        <div class="dminis">${o.minis.join('')}</div>
      </div>
      <div class="dmap">${dMap(o.route, 420, o.h || 174)}</div>
      <div class="dalert" style="${o.alertTop != null ? `top:${o.alertTop}px;` : ''}${o.alertW ? `width:${o.alertW};` : ''}">
        <div class="dct"><h3>${esc(o.alertTitle)}</h3><span>${o.alertLink || ''}</span></div>
        <div class="ah">${iconCircle(o.alertIcon || 'bell')}<div class="dtext">${o.alertBody}</div></div>
      </div>
    </div>`;
  }
  const redText = (title, link, id, html, cls = '') => card(title, link, ed(id, html, 'div', 'dtext'), 'dred ' + cls);
  const banner = (title, sub, btn) => `<div class="dbanner">${icon('trend', 30, '#fff')}<div class="tx"><b>${title}</b><span>${sub}</span></div><div class="bt">${btn} →</div></div>`;

  /* ---------- page shell ---------- */
  function shell(M, X, S, i, head, body) {
    const P = X.P, nav = S.nav;
    const navHtml = nav.map((n, k) => `<div class="${k === i ? 'on' : ''}">${icon(n.icon, 13)}<span>${esc(n.label)}</span>${n.badge ? `<i>${n.badge}</i>` : ''}</div>`).join('');
    const face = P.candidateFace || P.candidateImage;
    const top = i === 0
      ? `<header class="dhb">
          <div class="logo"><img src="${P.partyLogo}" alt=""></div>
          <div class="tt">
            <div class="ey">Daily Report · Day ${X.day} · ${esc(P.division)}</div>
            <h1>Voters Engagement</h1>
            <div class="sub"><span class="badge">${esc(S.submission)}</span><span class="const">${esc(P.constituency)}</span></div>
          </div>
          <div class="dates"><div><span>Call date</span><b>${longDate(M.callDate)}</b></div><div><span>Report generated</span><b>${longDate(X.generated)}</b></div><i>● LIVE · DAILY</i></div>
          <div class="cand"><div class="ph"><img src="${face}" alt=""></div><div><small>${esc(P.candidateTitle)}</small><b>${esc(P.candidateName)}</b><span><img src="assets/common/bravo.png" alt="">Powered by Bravo AEMS</span></div></div>
        </header>`
      : `<header class="dhs">
          <div class="logo"><img src="${P.partyLogo}" alt=""></div>
          <div class="tt"><div class="ey">${esc(head.eyebrow)} · ${esc(S.submission)}</div><h2>${esc(head.title)}</h2></div>
          <div class="dates"><div><b>Call date</b> ${longDate(M.callDate)}</div><div>Generated ${longDate(X.generated)}</div></div>
          <div class="bravo"><img src="assets/common/bravo.png" alt=""><span>Powered by<br><b>BRAVO AEMS</b></span></div>
          <div class="ph"><img src="${face}" alt=""></div>
        </header>`;
    return `<section class="dpage">
      ${top}
      <aside class="dside">
        <div class="dav"><img src="${P.candidateFace || P.candidateImage}" alt=""></div>
        <div class="dhello">Daily report,<b>${esc(P.shortName)}</b></div>
        <div class="dnav">${navHtml}</div>
        <div class="dtoday">
          <div class="tt">Today's calls <small>Day ${X.day}</small></div>
          <div class="it">Dials made<b>${fmt(M.dials)} <small>dials</small></b></div>
          <div class="it">Voters engaged<b>${fmt(M.impressions)} <small>voters</small></b></div>
          <div class="it">Average call<b>${Math.round(M.avgCall)}<small>s</small></b></div>
          <div class="bt">${esc(S.submission)} ${icon('plus', 10, ACC)}</div>
        </div>
        <div class="dart">${icon('pin', 34, ACC)}<img src="assets/common/bravo.png" alt=""><span>Powered by <b>Bravo AEMS</b><br>${esc(P.constituency)}</span></div>
      </aside>
      <div class="dmain">
        ${body}
        <div class="dfoot"><div><b>${esc(S.submission)}</b> · ${esc(P.division)} · ${esc(P.constituency)} · Day ${X.day} Daily Report</div><div>Bravo AEMS · Confidential · Page ${i + 1} of ${nav.length}</div></div>
      </div>
    </section>`;
  }

  /* ---------- candidate pages ---------- */
  function glance(M, X, S, i, prefix) {
    const c = M.cls, F = C.lgaFacts(M);
    const [sv, su] = splitPct(M.supportRate, 1);
    const hourly = M.hourly.filter(h => h.dials > 0);
    const rows = [...F.lgas].sort((a, b) => b.supportRate - a.supportRate).map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: X.impClasses.map(cl => ({ v: l.c[cl.key], color: cl.color, dark: cl.key === 'undecided' })) }));
    const stack = CH.stack100(rows, 340, { labelW: 128, noteW: 42, barH: rows.length > 3 ? 10 : 22, gap: rows.length > 3 ? 4 : 10, legendSize: 8.6, legend: X.impClasses.map(cl => ({ label: cl.label, color: cl.color })) });
    const best = F.best, worst = F.worst;
    const [uv, uu] = splitPct(M.undecidedRate, 1);
    const face = X.P.candidateFace || X.P.candidateImage;
    const donut = dDonut(X.impClasses.map(cl => ({ v: c[cl.key], color: cl.color })), 82, 18, fmt(M.impressions), 'engaged');
    const leg = X.impClasses.map(cl => `<div><i style="background:${cl.color}"></i>${cl.label}<b>${pct(share(c[cl.key], M.impressions), 1)}</b></div>`).join('');
    const lgaBars = dBars(F.lgas.map(l => ({ label: abbr(l.key), v: l.imp })), 178, 112, { rot: F.lgas.length > 4 });
    const quotes = C.H.quotes(M, X).slice(0, 2).map((q, k) => `<div class="dmsg" data-drop><div class="ini">${initials(q.ward)}</div><div><b>${esc(q.ward)}<small>${esc(X.impClasses.find(x => x.key === q.cls).label)}</small></b>${ed(prefix + 'q' + k, q.text, 'div', 'qt')}</div></div>`).join('') || '<p class="dcap">No quotable feedback today.</p>';
    const body = `
      ${hero({ chips: [`Supportive ${fmt(M.supportive)}`, `Undecided ${fmt(c.undecided)}`, `Negative ${fmt(c.negative)}`], label: 'Supportive voters', big: big(sv, su, `${fmt(M.supportive)} voters`), prog: M.supportRate,
        minis: [mini('users', 'Voters<br>engaged', fmt(M.impressions)), mini('trend', 'Net support<br>score', signed(M.netSupport))],
        route: hourly.map(h => h.imp), alertTitle: `What Day ${X.day} tells us`, alertLink: `Day ${X.day}`, alertIcon: 'bell', alertBody: ed(prefix + 'tells', C.T.tells(M, X)), alertTop: 38 })}
      <div class="drow" style="grid-template-columns:1.45fr 1fr">
        ${card(F.two ? `${F.lgas[0].key} vs ${F.lgas[1].key}` : 'LGA comparison', 'Impression mix by LGA', `
          ${stack}
          ${best && worst && worst !== best ? `<div class="dfoot2"><div>Strongest LGA<b>${esc(best.key)}</b></div><span class="dok">${pct(best.supportRate)} supportive</span><div>Weakest LGA<b>${esc(worst.key)}</b></div><span class="dbad">${pct(worst.supportRate)} supportive</span></div>` : ''}`)}
        ${card('The persuadable middle', 'Undecided', `<div class="dface"><div class="ph"><img src="${face}" alt=""></div><div>${big(uv, uu)}${prog(M.undecidedRate)}<div class="dcap" style="margin-top:5px">Undecided share of voters engaged</div></div></div>
          <div class="dkv"><div>Undecided<b>${fmt(c.undecided)}</b></div><div>Negative<b>${fmt(c.negative)} <small style="font-size:8px;color:${MUTE}">(${pct(M.negativeRate, 1)})</small></b></div></div>`)}
      </div>
      <div class="drow" style="grid-template-columns:1fr 1.05fr">
        ${card('Conversations by hour', '▾Today', dLine(hourly.map(h => ({ label: String(h.hour).padStart(2, '0') + ':00', v: h.imp })), 282, 96))}
        ${card('Support among decided voters', '▾Day ' + X.day, `<div style="display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center">
            <div>${big(...splitPct(M.supportAmongDecided))}<div style="font-size:9.5px;line-height:1.35">of voters with<br>a clear position</div></div>
            ${dLine(hourly.map(h => ({ label: '', v: h.support == null ? 0 : h.support * 100 })), 170, 80, { white: true, axes: false, max: 100 })}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:9px"><span>Volunteers ready to mobilise: <b>${fmt(c.volunteer)}</b></span><span style="background:#fff;color:${ACC};border-radius:9px;padding:6px 12px;font-weight:500">Net support ${signed(M.netSupport)}</span></div>`, 'dred')}
      </div>
      <div class="drow" style="grid-template-columns:1fr 1fr 1fr">
        ${card('Impression mix', '', `<div class="ddonut">${donut}<div class="dlegend">${leg}</div></div>`)}
        ${card('Voters engaged by LGA', '▾Day ' + X.day, lgaBars)}
        ${card('Voice of the voters', 'From feedback', `<div class="dmsgs">${quotes}</div>`)}
      </div>
      ${F.biggest ? banner(`Keep the momentum in ${esc(F.biggest.key)}`, `${fmt(F.biggest.persuadable)} undecided and call back voters there are the biggest pool to convert.`, `Day ${X.day + 1} call list`) : ''}
`;
    return shell(M, X, S, i, { eyebrow: `Daily report · Day ${X.day}`, title: 'Engagement at a glance' }, body);
  }

  function support(M, X, S, i, prefix) {
    const W = C.wardFacts(M);
    const bySup = [...W.top].sort((a, b) => b.supportRate - a.supportRate);
    const legend = M.lgaList.filter(l => l.imp > 0).map(l => ({ name: l.key, color: X.colorOf(l.key) }));
    const warm = W.warm, cool = W.cool, pers = W.pers;
    const [wv, wu] = warm ? splitPct(warm.supportRate) : ['0', '%'];
    const body = `
      ${hero({ chips: ['Warmest', 'Coolest', 'Largest pool'], label: 'Warmest well covered ward', big: big(wv, wu, warm ? esc(warm.label) : ''), prog: warm ? warm.supportRate : 0,
        minis: [mini('target', `Coolest ward<br>${cool ? esc(cool.ward) : ''}`, cool ? pct(cool.supportRate) : '0%'), mini('users', `Largest pool<br>${pers ? esc(pers.ward) : ''}`, pers ? fmt(pers.persuadable) : '0')],
        route: bySup.map(w => w.imp), alertTitle: 'Ward signals', alertLink: `${fmt(W.top.length)} wards`, alertIcon: 'pin', alertBody: ed(prefix + 'wardsig', C.T.wardsig(M, X)), alertTop: 28 })}
      ${card('Support rate by ward', W.omitted > 0 ? `${R.maxWardsShown} largest wards` : `${fmt(W.top.length)} wards`, `<div class="dsub">Positive + Volunteer as % of voters engaged · colour = LGA</div>` + CH.supportByWard(bySup, 594, 368, M.supportRate, X.colorOf, legend))}
      ${card('Reach × Support × Persuadables', 'Ward drivers', CH.wardBubbles(W.top, 594, 258, M.supportRate, X.colorOf, legend) + `<p class="dcap">Wards to the <b>right</b> are where we have talked to the most voters; wards <b>higher up</b> are warmer; <b>bigger bubbles</b> hold more undecided and call back voters still to be won.</p>`)}`;
    return shell(M, X, S, i, { eyebrow: 'LGA & ward comparative', title: 'Where support is strongest' }, body);
  }

  function saying(M, X, S, i, prefix) {
    const quotes = C.H.quotes(M, X).map((q, k) => `<div class="dmsg" data-drop><div class="ini">${initials(q.ward)}</div><div><b>${esc(q.ward)} · ${esc(q.lga)}<small>${esc(X.impClasses.find(x => x.key === q.cls).label)}</small></b>${ed(prefix + 'q' + k, q.text, 'div', 'qt')}</div></div>`).join('') || '<p class="dcap">No quotable feedback today.</p>';
    const lg = X.lgaNames.map(l => `<span class="mlg"><i style="background:${X.colorOf(l)}"></i>${esc(l)}</span>`).join('');
    const body = `
      <div class="drow" style="grid-template-columns:1.1fr 1fr 1fr">
        ${card('Support among decided voters', 'Scorecard', `${big(...splitPct(M.supportAmongDecided))}<div style="font-size:9.5px">of voters with a clear position</div>${prog(M.supportAmongDecided)}`, 'dred')}
        ${card('Volunteers', '', `${big(fmt(M.cls.volunteer))}<div class="dcap">ready to work or mobilise · ${pct(share(M.cls.volunteer, M.supportive), 1)} of supportive voters</div>${prog(share(M.cls.volunteer, M.supportive))}`)}
        ${card('Asking for cash or funds', '', `${big(fmt(M.cashAsks))}<div class="dcap">voters asking for cash or funds · ${pct(share(M.cashAsks, M.needVoters))} of voters who raised a need</div>${prog(share(M.cashAsks, M.needVoters))}`)}
      </div>
      <div class="drow" style="grid-template-columns:1.25fr 1fr">
        ${card('Needs & requests raised', `${fmt(M.needVoters)} voters`, `<div class="dsub">At least one need raised · stacked by LGA</div>${CH.needs(M.needs, 400, X.lgaNames, X.colorOf)}<div class="mlgs">${lg}</div>`)}
        ${card('Candidate scorecard', 'Strength · Risk · Opportunity', ed(prefix + 'sro', C.T.sro(M, X), 'div', 'dtext'))}
      </div>
      ${card('Grievances heard & where', 'Ward of the caller', C.H.grievances(M, X, prefix))}
      ${card('Voice of the voters', 'Taken from call feedback', `<div class="dmsgs two">${quotes}</div>`)}
      <div class="ddefs">${C.H.defs(X)}</div>`;
    return shell(M, X, S, i, { eyebrow: 'Candidate performance', title: 'What voters are saying' }, body);
  }

  /* ---------- audit pages ---------- */
  const kpiTile = ([label, value, note, color]) => `<div class="dkpi"><span>${esc(label)}</span><b class="${String(value).replace(/<[^>]+>/g, '').length > 9 ? 'long' : ''}" style="color:${color}">${value}</b><em>${note}</em></div>`;
  function a1(M, X, S, i) {
    const [rv, ru] = splitPct(M.reachRate, 1);
    const fun = C.funnel(M, X).map(([v, l, n, col]) => `<div class="fr"><div class="tr"><i style="width:${Math.max(share(v, M.dials) * 100, 14)}%;background:${col}">${fmt(v)}</i></div><div class="fl"><b>${l}</b><br>${n}</div></div>`).join('');
    const body = `
      ${hero({ h: 234, chips: [`Reached ${fmt(M.impressions)}`, `Not reached ${fmt(M.nonImpressions)}`, `Supportive ${fmt(M.supportive)}`], label: 'Reach rate', big: big(rv, ru, `${fmt(M.impressions)} of ${fmt(M.dials)} dials`), prog: M.reachRate,
        minis: [mini('phone', 'Total<br>dials', fmt(M.dials)), mini('users', 'Supportive<br>voters', fmt(M.supportive))],
        route: M.hourly.filter(h => h.dials > 0).map(h => h.dials), alertTitle: 'Executive summary', alertLink: `Day ${X.day}`, alertIcon: 'doc', alertBody: ed('a1exec', C.T.exec(M, X)), alertTop: 30, alertW: '53%' })}
      <div class="dkpis">${C.auditKpis(M, X).map(kpiTile).join('')}</div>
      ${card('Engagement funnel', 'From dial to supportive voter', `<div class="dfun">${fun}</div>`)}
      ${banner(`Net support ${signed(M.netSupport)}`, `${pct(M.supportAmongDecided)} support among decided voters · ${fmt(M.cls.volunteer)} volunteers ready to mobilise`, 'Candidate view')}`;
    return shell(M, X, S, i, { eyebrow: `Internal audit · Day ${X.day}`, title: 'Centre performance' }, body);
  }
  function a2(M, X, S, i) {
    const c = M.cls, all = X.allClasses;
    const donut = dDonut(all.map(cl => ({ v: c[cl.key], color: cl.color })), 128, 26, fmt(M.dials), 'total dials');
    const leg = all.map(cl => `<div><i style="background:${cl.color}"></i>${cl.label} ${fmt(c[cl.key])}<b>${pct(share(c[cl.key], M.dials), 1)}</b></div>`).join('');
    const wards = [...M.wardList].filter(w => w.dials > 0).sort((a, b) => b.dials - a.dials).slice(0, R.maxWardsShown).sort((a, b) => b.reach - a.reach);
    const body = `
      <div class="drow" style="grid-template-columns:1.35fr 1fr">
        ${card('Every dial, classified', '6 impression + 5 non impression', `<div class="ddonut">${donut}<div class="dlegend" style="gap:4px">${leg}</div></div>`)}
        <div class="drow">
          ${card('Impressions', `${pct(M.reachRate, 1)} of dials`, `${big(fmt(M.impressions))}<div class="dcap">Of these, <b>${fmt(c.followup)}</b> need a call back and <b>${fmt(c.inapplicable)}</b> are not usable (wrong number, can't vote, relocated).</div>`)}
          ${card('Non impressions', `${pct(share(M.nonImpressions, M.dials), 1)} of dials`, `${big(fmt(M.nonImpressions))}<div class="dcap">Not reachable <b>${fmt(c.notreachable)}</b> · Unanswered <b>${fmt(c.noanswer)}</b> · Rejected <b>${fmt(c.rejected)}</b> · Switched off <b>${fmt(c.switchedoff)}</b> · Barred <b>${fmt(c.barred)}</b></div>`)}
        </div>
      </div>
      ${card('Reach rate by ward', '% of dials that became an impression', CH.reachByWard(wards, 594, X.colorOf, { rowH: Math.min(24, 520 / Math.max(wards.length, 1)) }))}
      ${redText('Reading the gap', 'Next morning', 'a2gap', C.T.gap(M, X))}`;
    return shell(M, X, S, i, { eyebrow: 'Call outcomes', title: 'Impressions vs non impressions' }, body);
  }
  function a3(M, X, S, i) {
    const body = `
      ${card('Hourly volume, reach and support', 'Bars = outcomes · lines = rates', CH.hourly(M, 594, 380, X.colors))}
      ${card('Call duration by impression', 'Connected calls only', CH.boxplot(M, 594, 300, X.impClasses))}
      ${redText('Time signals', `Peak ${M.peak ? C.util.hr(M.peak.hour) : ''}`, 'a3time', C.T.time(M, X))}`;
    return shell(M, X, S, i, { eyebrow: 'Time analysis', title: 'How the day unfolded' }, body);
  }
  function a4(M, X, S, i) {
    const body = `
      ${card('Impressions and dials per agent', 'Green = at or above team average · red = below', CH.agentBars(M, 594, 350, X.th.brand))}
      ${card('Productivity vs quality', 'Dials vs feedback capture', CH.agentScatter(M, 594, 320))}
      ${redText('Staff signals', `${fmt(M.agents.length)} call partners`, 'a4staff', C.T.staff(M, X))}`;
    return shell(M, X, S, i, { eyebrow: 'Staff performance', title: 'Call partner output' }, body);
  }
  function a5(M, X, S, i) {
    const body = card('Agent ranking by impressions', `Team average ${fmt(M.teamAvgDials)} dials`, C.H.league(M) + `<p class="dcap">${C.H.leagueNote(M)}</p>`);
    return shell(M, X, S, i, { eyebrow: 'Staff league table', title: 'Agent ranking' }, body);
  }
  function a6(M, X, S, i) {
    const body = `
      ${card('Dials per agent per 30 minutes', 'Darker = busier', C.H.activity(M, X.th.brandStrong))}
      <div class="drow" style="grid-template-columns:1fr 1fr">
        ${card('Coding calibration', '', ed('a6cal', C.T.cal(M, X), 'div', 'dtext'))}
        ${card('Reclassification applied', '', ed('a6rec', C.T.rec(M, X), 'div', 'dtext'))}
      </div>
      ${redText(`Actions for Day ${X.day + 1}`, 'Team lead', 'a6act', C.T.act(M, X))}`;
    return shell(M, X, S, i, { eyebrow: 'Activity & quality', title: 'Who was calling, when' }, body);
  }
  function a7(M, X, S, i) {
    const seg = l => X.impClasses.map(cl => ({ v: l.c[cl.key], color: cl.color, dark: cl.key === 'undecided' }));
    const legend = X.impClasses.map(cl => ({ label: cl.label, color: cl.color }));
    const g = CH.stack100(M.genderList.map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: seg(l) })), 594, { labelW: 66, noteW: 56, barH: 44, gap: 22, legend, legendSize: 9 });
    const tg = CH.stack100(M.tierList.map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: seg(l) })), 594, { labelW: 66, noteW: 56, barH: 44, gap: 20, legend, legendSize: 9 });
    const vb = dBars(M.tierList.map(t => ({ label: t.key, v: Math.round(t.reach * 100) })), 270, 270, { fmtV: v => v + '%' });
    const body = `
      ${card('Impressions by gender', 'From telco match', g)}
      ${card('Impressions by socio economic tier', 'Tier 1 = top 20% airtime spend · Tier 5 = bottom 20%', tg)}
      <div class="drow" style="grid-template-columns:1fr 1fr">
        ${card('Reach by tier', '% of dials reached', vb)}
        ${redText('Audience signals', '', 'a7sig', C.T.aud(M, X))}
      </div>`;
    return shell(M, X, S, i, { eyebrow: 'Audience profile', title: 'Gender and socio economic tier' }, body);
  }
  function a11(M, X, S, i) {
    const body = `
      ${card('Ward × impression heatmap', 'Share of conversations · ward size in brackets', C.H.wardHeat(M, X, X.th.brandStrong))}
      ${redText('Recommendations', `Day ${X.day + 1}`, 'a11rec', C.T.recs(M, X))}`;
    return shell(M, X, S, i, { eyebrow: 'Ward deep dive', title: 'Impression mix by ward' }, body);
  }

  window.buildDashReports = function (M, opts) {
    const X = C.ctx(M, opts);
    ACC = X.th.rule; ACC2 = X.th.headerMid; PRI = X.th.brand; SOFT = mix(X.th.rule, .1);
    const gs = M.grievances.reduce((a, g) => a + g.total, 0);
    const below = M.agents.filter(a => a.dials < M.teamAvgDials * 0.8).length;
    const vNav = [{ icon: 'grid', label: 'Overview' }, { icon: 'pin', label: 'Ward support' }, { icon: 'chat', label: 'Voter voices', badge: gs || '' }];
    const VS = { nav: vNav, submission: X.P.submissionLabel };
    const avoc = [glance(M, X, VS, 0, 'v'), support(M, X, VS, 1, 'v2'), saying(M, X, VS, 2, 'v3')];
    const aNav = [{ icon: 'grid', label: 'Overview' }, { icon: 'phone', label: 'Call outcomes' }, { icon: 'clock', label: 'Time of day' }, { icon: 'users', label: 'Staff output', badge: below || '' }, { icon: 'list', label: 'League table' }, { icon: 'pulse', label: 'Activity' }];
    if (M.hasTelco) aNav.push({ icon: 'person', label: 'Audience' });
    aNav.push({ icon: 'eye', label: 'Candidate view' }, { icon: 'pin', label: 'Ward support' }, { icon: 'chat', label: 'Voter voices', badge: gs || '' }, { icon: 'layers', label: 'Ward deep dive' });
    const AS = { nav: aNav, submission: X.P.auditSubmissionLabel };
    const pages = [a1, a2, a3, a4, a5, a6];
    if (M.hasTelco) pages.push(a7);
    const audit = pages.map((f, k) => f(M, X, AS, k));
    let k = audit.length;
    audit.push(glance(M, X, AS, k++, 'a8'), support(M, X, AS, k++, 'a9'), saying(M, X, AS, k++, 'a10'), a11(M, X, AS, k++));
    return { avoc: avoc.join(''), audit: audit.join(''), theme: X.th };
  };
})();
