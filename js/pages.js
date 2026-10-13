/* Builds every page of both reports as HTML, including the written commentary. */
(function () {
  const { esc, pct, fmt } = window.CHART_UTILS;
  const CH = window.CHARTS, R = window.RULES;
  const naira = (v, d = 0) => '₦' + Number(v).toLocaleString('en-NG', { minimumFractionDigits: d, maximumFractionDigits: d });
  const hl = s => `<b class="hl">${s}</b>`;
  const bold = s => `<b>${s}</b>`;
  const ed = (id, html, tag = 'div', cls = '') => `<${tag} class="ed ${cls}" contenteditable="true" spellcheck="false" data-edit="${id}">${html}</${tag}>`;
  const hhmm = d => d ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '';
  const longDate = d => d ? d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const share = (a, b) => b ? a / b : 0;
  const plural = (n, w, p) => `${fmt(n)} ${n === 1 ? w : (p || w + 's')}`;

  function ctx(M, opts) {
    const P = M.profile, th = P.theme;
    const colors = {}; R.impressionClasses.forEach(c => colors[c.key] = c.color === 'THEME' ? th.volunteer : c.color);
    R.nonImpressionClasses.forEach(c => colors[c.key] = c.color);
    const lgaColor = {}; P.lgas.forEach(l => lgaColor[l.name] = l.color);
    const extra = ['#8D6E63', '#00838F', '#AD1457', '#6D4C41'];
    let ei = 0; M.lgaList.forEach(l => { if (!lgaColor[l.key]) lgaColor[l.key] = extra[ei++ % extra.length]; });
    const colorOf = l => lgaColor[l] || '#8A8F9C';
    const lgaNames = M.lgaList.map(l => l.key);
    const day = opts.day || 1;
    const impClasses = R.impressionClasses.map(c => ({ ...c, color: colors[c.key], def: c.def.replace('{name}', P.shortName) }));
    return { P, th, colors, colorOf, lgaNames, day, impClasses, generated: opts.generated || new Date() };
  }

  /* ---------- shared chrome ---------- */
  function bigHeader(M, X, submission) {
    const P = X.P;
    return `<header class="hdr-big">
      <div class="hb-logo"><img src="${P.partyLogo}" alt=""></div>
      <div class="hb-title">
        <div class="eyebrow">Daily Report · Day ${X.day} · ${esc(P.division)}</div>
        <h1>Voters Engagement</h1>
        <div class="badge">${esc(submission)}</div>
        <div class="const">${esc(P.constituency)}</div>
      </div>
      <div class="hb-dates">
        <div class="lbl">Call date</div><div class="val">${longDate(M.callDate)}</div>
        <div class="lbl">Report generated</div><div class="val">${longDate(X.generated)}</div>
        <div class="live">● LIVE · DAILY</div>
      </div>
      <div class="hb-photo ${P.candidateImageStyle}"><img src="${P.candidateImage}" alt=""></div>
    </header>
    <div class="hdr-strip">
      <div class="powered"><img src="assets/common/bravo.png" alt=""> Powered by <b>BRAVO</b> ADVANCED ELECTIONS MANAGEMENT SYSTEMS</div>
      <div class="cand"><div class="ttl">${esc(P.candidateTitle)}</div><div class="nm">${esc(P.candidateName)}</div></div>
    </div>`;
  }
  function smallHeader(M, X, eyebrow, title, submission) {
    const P = X.P;
    return `<header class="hdr-sm">
      <div class="hs-logo"><img src="${P.partyLogo}" alt=""></div>
      <div class="hs-title"><div class="eyebrow">${esc(eyebrow)} · ${esc(submission)}</div><h2>${esc(title)}</h2></div>
      <div class="hs-dates"><div><b>CALL DATE</b> ${longDate(M.callDate)}</div><div>Generated ${longDate(X.generated)}</div></div>
      <div class="hs-bravo"><img src="assets/common/bravo.png" alt=""><span>Powered by<br><b>BRAVO AEMS</b></span></div>
      <div class="hs-photo ${P.candidateImageStyle}"><img src="${P.candidateImage}" alt=""></div>
    </header>`;
  }
  function footer(M, X, submission) {
    const P = X.P;
    return `<footer class="ftr"><div><b>${esc(submission)}</b> · ${esc(P.division)} · ${esc(P.constituency)} · Day ${X.day} Daily Report</div>
      <div>Bravo AEMS · Confidential · Call date ${longDate(M.callDate)} · Generated ${longDate(X.generated)}</div></footer>`;
  }
  const page = (cls, inner) => `<section class="page ${cls}">${inner}</section>`;
  const card = (title, sub, body, cls = '') => `<div class="card ${cls}"><div class="ct">${esc(title)}${sub ? ` <span>${esc(sub)}</span>` : ''}</div>${body}</div>`;
  const kpi = (label, value, note, color) => `<div class="kpi" style="--k:${color}"><div class="kl">${esc(label)}</div><div class="kv${String(value).replace(/<[^>]+>/g, '').length > 9 ? ' long' : ''}">${value}</div><div class="kn">${note}</div></div>`;
  const panel = (title, id, html, cls = '') => `<div class="panel ${cls}"><div class="pt">${esc(title)}</div>${ed(id, html)}</div>`;
  const bullets = items => '<ul>' + items.filter(Boolean).map(i => `<li>${i}</li>`).join('') + '</ul>';

  /* ---------- engagement at a glance (AVOC 1 / audit 8) ---------- */
  function glanceBody(M, X, prefix) {
    const P = X.P, c = M.cls;
    const k = [
      kpi('Voters engaged', fmt(M.impressions), 'Conversations with a recorded impression', X.th.brand),
      kpi('Supportive voters', fmt(M.supportive), `${pct(M.supportRate, 1)} of voters engaged (Positive + Volunteer)`, '#2EA44F'),
      kpi('Volunteers', fmt(c.volunteer), `Ready to work or mobilise for ${esc(P.shortName)}`, X.colors.volunteer),
      kpi('Undecided', fmt(c.undecided), `${pct(M.undecidedRate, 1)}, the persuadable middle`, '#F2A81D'),
      kpi('Negative', fmt(c.negative), `Only ${pct(M.negativeRate, 1)} of voters engaged`, '#E23B4E'),
      kpi('Net support score', (M.netSupport >= 0 ? '+' : '') + M.netSupport, 'Supportive minus Negative, as % of decided voters', '#2EA44F')
    ].join('');
    const donut = CH.donut(X.impClasses.map(cl => ({ v: c[cl.key], color: cl.color })), 170, 26, fmt(M.impressions), 'voters engaged');
    const legend = X.impClasses.map(cl => `<div class="lg"><i style="background:${cl.color}"></i>${cl.label} ${fmt(c[cl.key])} (${pct(share(c[cl.key], M.impressions), 1)})</div>`).join('');
    const lgas = M.lgaList.filter(l => l.imp > 0);
    const two = lgas.length === 2;
    const ttl = two ? `${lgas[0].key} vs ${lgas[1].key}` : 'LGA comparison';
    const rows = [...lgas].sort((a, b) => b.supportRate - a.supportRate).map((l, i, arr) => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: X.impClasses.map(cl => ({ v: l.c[cl.key], color: cl.color, dark: cl.key === 'undecided' })) }));
    const many = rows.length > 3;
    const stack = CH.stack100(rows, many ? 560 : 470, { labelW: many ? 118 : 86, noteW: 54, barH: many ? 15 : 30, gap: many ? 5 : 20, legendSize: many ? 10 : 10.5, legend: X.impClasses.map(cl => ({ label: cl.label, color: cl.color })) });
    const elig = lgas.filter(l => l.imp >= R.minWardSample);
    const pool = elig.length >= 2 ? elig : lgas;
    const best = [...pool].sort((a, b) => b.supportRate - a.supportRate)[0];
    const worst = [...pool].sort((a, b) => a.supportRate - b.supportRate)[0];
    const cardsL = two ? [lgas[0], lgas[1]] : [best, worst].filter((v, i, a) => v && a.indexOf(v) === i);
    const lgaCards = cardsL.map((l, i) => `<div class="lgacard" style="--lc:${X.colorOf(l.key)}"><div class="lch"><b>${esc(l.key.toUpperCase())}</b> · ${fmt(l.imp)} engaged${!two ? (i === 0 ? ' · strongest' : ' · weakest') : ''}</div><div class="lcv"><span>${pct(l.supportRate)}</span> supportive · ${pct(l.negRate, 1)} negative</div></div>`).join('');

    // narrative
    const tenths = Math.round(M.supportRate * 10);
    const biggest = lgas[0];
    let t = `About ${hl(tenths + ' in 10')} voters engaged backed ${esc(P.shortName)} and only ${hl(pct(M.negativeRate, 1))} were openly opposed. Among voters who gave a clear position, support stands at ${hl(pct(M.supportAmongDecided))}.`;
    if (lgas.length >= 2) {
      const srt = [...pool].sort((a, b) => b.supportRate - a.supportRate);
      const gap = srt[0].supportRate - srt[srt.length - 1].supportRate;
      t += gap < 0.03 && srt.length === 2
        ? ` ${esc(srt[0].key)} (${hl(pct(srt[0].supportRate))}) and ${esc(srt[1].key)} (${hl(pct(srt[1].supportRate))}) are neck and neck,`
        : ` ${esc(srt[0].key)} leads at ${hl(pct(srt[0].supportRate))} and ${esc(srt[srt.length - 1].key)} trails at ${hl(pct(srt[srt.length - 1].supportRate))},`;
      t += ` but ${esc(biggest.key)} carries ${pct(share(biggest.imp, M.impressions))} of all conversations, so its ${fmt(biggest.persuadable)} undecided and call back voters are the biggest pool to convert.`;
    }
    const defs = X.impClasses.map(cl => `<div class="def"><i style="background:${cl.color}"></i><b>${cl.label}</b> · ${esc(cl.def)}</div>`).join('');
    return `<div class="kpis six">${k}</div>
      <div class="row g-glance">
        ${card('Voter impressions', 'All six impression classes', `<div class="donutwrap">${donut}<div class="lgs">${legend}</div></div>`)}
        ${card(ttl, many ? 'Impression mix by LGA · highest support first' : 'Impression mix by LGA', `<div class="stackwrap">${stack}</div>${many ? '' : `<div class="lgacards">${lgaCards}</div>`}`)}
      </div>
      ${panel(`What Day ${X.day} tells us`, prefix + 'tells', t, 'wide')}
      <div class="defs">${defs}</div>`;
  }

  /* ---------- where support is strongest (AVOC 2 / audit 9) ---------- */
  function supportBody(M, X, prefix) {
    const top = [...M.wardList].filter(w => w.imp > 0).sort((a, b) => b.imp - a.imp).slice(0, R.maxWardsShown);
    const bySup = [...top].sort((a, b) => b.supportRate - a.supportRate);
    const legend = M.lgaList.filter(l => l.imp > 0).map(l => ({ name: l.key, color: X.colorOf(l.key) }));
    const omitted = M.wardList.filter(w => w.imp > 0).length - top.length;
    const bars = CH.supportByWard(bySup, 450, 470, M.supportRate, X.colorOf, legend);
    const bub = CH.wardBubbles(top, 510, 400, M.supportRate, X.colorOf, legend);
    const elig = top.filter(w => w.imp >= R.minWardSample);
    const base = elig.length >= 2 ? elig : top;
    const warm = [...base].sort((a, b) => b.supportRate - a.supportRate)[0];
    const cool = [...base].sort((a, b) => a.supportRate - b.supportRate)[0];
    const pers = [...top].sort((a, b) => b.persuadable - a.persuadable)[0];
    const two = [...top].slice(0, 2);
    const twoShare = share(two.reduce((a, w) => a + w.imp, 0), M.impressions);
    const lgaShare = M.lgaList.filter(l => l.imp > 0).sort((a, b) => a.imp - b.imp)[0];
    let t = '';
    if (warm) t += `${hl(esc(warm.label))} is the warmest well covered ward (${pct(warm.supportRate)} supportive, n=${warm.imp}). `;
    if (cool && cool !== warm) t += `${hl(esc(cool.label))} is the coolest (${pct(cool.supportRate)}, n=${cool.imp}) and needs attention. `;
    if (pers) t += `${hl(esc(pers.label))} holds the largest persuadable pool (${fmt(pers.persuadable)} undecided and call back voters). `;
    if (two.length === 2) t += `${esc(two[0].label)} and ${esc(two[1].label)} alone make up ${pct(twoShare)} of all conversations`;
    if (lgaShare && M.lgaList.length > 1) t += `, so the Day ${X.day + 1} call list should widen coverage across ${esc(lgaShare.key)} wards.`; else t += '.';
    return `<div class="row g-support">
        ${card('Support rate by ward', `Positive + Volunteer as % of voters engaged · colour = LGA${omitted > 0 ? ` · ${R.maxWardsShown} largest wards` : ''}`, bars)}
        ${card('Reach × Support × Persuadables', 'Interrelationship of the three ward drivers', bub + `<p class="cap">Wards to the <b>right</b> are where we have talked to the most voters; wards <b>higher up</b> are warmer; <b>bigger bubbles</b> hold more undecided and call back voters still to be won.</p>`)}
      </div>
      ${panel('Ward signals', prefix + 'wardsig', t, 'wide')}`;
  }

  /* ---------- what voters are saying (AVOC 3 / audit 10) ---------- */
  function sayingBody(M, X, prefix) {
    const P = X.P;
    const lgaNames = X.lgaNames;
    const needs = CH.needs(M.needs, 440, lgaNames, X.colorOf);
    const lg = lgaNames.map(l => `<span class="mlg"><i style="background:${X.colorOf(l)}"></i>${esc(l)}</span>`).join('');
    const gs = M.grievances.filter(g => g.total > 0).slice(0, 5);
    const gmax = Math.max(...gs.map(g => g.total), 1);
    const grows = gs.map((g, i) => {
      const wards = Object.entries(g.wards).sort((a, b) => b[1] - a[1]);
      const shown = wards.slice(0, 3).map(([w, n]) => `<b style="color:${X.colorOf(g.wardLga[w])}">${esc(w)}</b> ${n}`).join(' · ') + (wards.length > 3 ? ` · +${wards.length - 3} more` : '');
      const comm = Object.entries(g.communities).sort((a, b) => b[1] - a[1]).slice(0, 6).map(c => esc(c[0])).join(', ');
      return `<tr><td class="gname">${esc(g.label)}</td><td class="gm">${CH.miniBar(g.total, gmax)} <b>${g.total}</b></td><td>${shown || '<span class="muted">None recorded</span>'}</td><td>${ed(prefix + 'comm' + i, comm || '<span class="muted">None named</span>', 'span')}</td></tr>`;
    }).join('');
    const gtable = gs.length ? `<table class="gtab"><tr><th>Grievance</th><th>Mentions</th><th>Wards (count)</th><th>Communities named</th></tr>${grows}</table><div class="mlgs">${lg}</div>` : `<p class="muted pad">No grievances were detected in today's feedback.</p>`;

    const topNeeds = M.needs.filter(n => n.total > 0).slice(0, 3);
    const topG = gs[0];
    const undWards = [...M.wardList].sort((a, b) => b.c.undecided - a.c.undecided).slice(0, 2).map(w => esc(w.label));
    const sc = `<div class="score">
        <div class="s1"><div class="sv" style="color:#2EA44F">${pct(M.supportAmongDecided)}</div><div class="sl">support among decided voters</div></div>
        <div class="s2"><div class="sv" style="color:${X.colors.volunteer}">${fmt(M.cls.volunteer)}</div><div class="sl">volunteers ready to work or mobilise</div></div>
        <div class="s3"><div class="sv" style="color:#C98A00">${fmt(M.cashAsks)}</div><div class="sl">voters asking for cash or funds</div></div></div>`;
    const sro = bullets([
      `${bold('Strength:')} ${pct(M.supportAmongDecided)} of decided voters back ${esc(P.shortName)}, and ${plural(M.cls.volunteer, 'voter')} volunteered to work or mobilise for the campaign.`,
      topG ? `${bold('Risk:')} the leading grievance is ${bold(esc(topG.label.toLowerCase()))} (${topG.total} mentions).` : `${bold('Risk:')} ${fmt(M.cls.undecided)} voters are still undecided and ${fmt(M.cls.followup)} need a call back.`,
      topNeeds.length ? `${bold('Opportunity:')} ${topNeeds.map(n => `${esc(n.label.toLowerCase())} (${n.total})`).join(', ')} lead the asks; visible action on these would convert undecided voters in ${undWards.join(' and ')}.` : ''
    ]);
    const quotes = M.quotes.map((q, i) => `<div class="quote">${ed(prefix + 'q' + i, '“' + esc(q.fb.charAt(0).toUpperCase() + q.fb.slice(1).replace(/\s+$/, '')) + '”', 'div', 'qt')}<div class="qm">${esc(q.ward)} · ${esc(q.lga)} · ${esc(X.impClasses.find(c => c.key === q.cls).label)}</div></div>`).join('') || '<p class="muted pad">No quotable feedback today.</p>';
    return `<div class="row g-saying">
      <div class="col">
        ${card('Needs & requests raised', `${fmt(M.needVoters)} voters raised at least one need · stacked by LGA`, needs + `<div class="mlgs">${lg}</div>`, 'needs')}
        ${card('Grievances heard & where', 'Ward of the caller · communities named in feedback', gtable, 'griev')}
      </div>
      <div class="col">
        ${card('Candidate scorecard', '', sc + ed(prefix + 'sro', sro), 'scorecard')}
        ${card('Voice of the voters', 'Taken from call feedback', quotes, 'voices')}
      </div></div>`;
  }

  /* ---------- AUDIT pages ---------- */
  function audit1(M, X) {
    const c = M.cls, sub = X.P.auditSubmissionLabel;
    const agents = M.agents.length;
    const k = [
      kpi('Total dials', fmt(M.dials), `About <b>${fmt(M.teamAvgDials)}</b> per call partner`, X.th.brand),
      kpi('Voters reached', fmt(M.impressions), `${pct(M.reachRate, 1)} of dials produced an impression`, '#2EA44F'),
      kpi('Supportive voters', fmt(M.supportive), `${pct(M.supportRate, 1)} of voters reached`, '#2EA44F'),
      kpi('Call agents', fmt(agents), `Covering ${M.lgaList.filter(l => l.dials > 0).length} LGAs and ${M.wardList.filter(w => w.dials > 0).length} wards`, X.th.brand),
      kpi('Avg call duration', Math.round(M.avgCall) + 's', `${fmt(M.talkMinutes)} talk minutes in total`, '#3B82F6'),
      kpi('Airtime used', naira(M.airtime), `${naira(M.costPerDial, 2)} per dial`, '#E0A800'),
      kpi('Cost per voter reached', naira(M.costPerReached, 2), 'Airtime ÷ voters with an impression', '#E0A800'),
      kpi('Cost per supportive voter', naira(M.costPerSupportive, 2), 'Airtime ÷ Positive + Volunteer', '#E0A800'),
      kpi('Cost per talk minute', naira(M.costPerMinute, 2), 'Airtime ÷ connected minutes', '#E0A800'),
      kpi('Non impressions', fmt(M.nonImpressions), `${pct(share(M.nonImpressions, M.dials), 1)} of dials, no conversation`, '#5E6272'),
      kpi('Calling window', `${hhmm(M.firstCall)} to ${hhmm(M.lastCall)}`, M.peak ? `Peak hour ${String(M.peak.hour).padStart(2, '0')}:00 · ${fmt(M.peak.dials)} dials` : '', '#3B82F6'),
      kpi('Net support score', (M.netSupport >= 0 ? '+' : '') + M.netSupport, `${pct(M.supportAmongDecided)} support among decided voters`, '#2EA44F')
    ].join('');
    const f = [[M.dials, 'Dials made', '100% of dials', X.th.brandStrong], [M.impressions, 'Voters reached (impression)', `${pct(share(M.impressions, M.dials))} of dials · ${pct(share(M.impressions, M.dials))} of prev.`, X.th.brand], [M.qualified, 'Qualified conversations', `${pct(share(M.qualified, M.dials))} of dials · ${pct(share(M.qualified, M.impressions))} of prev.`, X.th.badge], [M.supportive, 'Supportive (Positive + Volunteer)', `${pct(share(M.supportive, M.dials))} of dials · ${pct(share(M.supportive, M.qualified))} of prev.`, '#2EA44F']];
    const funnel = f.map(([v, l, n, col]) => `<div class="fr"><div class="fb"><div style="width:${Math.max(share(v, M.dials) * 100, 12)}%;background:${col}">${fmt(v)}</div></div><div class="fl"><b>${l}</b><br>${n}</div></div>`).join('');
    const sr = M.agents.filter(a => a.imp >= 30).map(a => a.supportRate);
    const spread = sr.length > 1 ? [Math.min(...sr), Math.max(...sr)] : null;
    const ex = bullets([
      `${agents} call partners made ${hl(fmt(M.dials))} dials (about ${fmt(M.teamAvgDials)} each), ${M.reachRate < 0.6 ? 'but only' : 'and'} ${hl(pct(M.reachRate))} of dials became a conversation. ${fmt(c.notreachable)} numbers were unreachable.`,
      `${hl(pct(M.supportRate))} of voters reached are supportive; negatives are just ${hl(pct(M.negativeRate, 1))}.`,
      `Each supportive voter cost ${hl(naira(M.costPerSupportive, 2))} in airtime.`,
      spread ? (spread[1] - spread[0] > 0.3 ? `Agent coding is inconsistent (support rates of ${pct(spread[0])} to ${pct(spread[1])}); a calibration session is needed.` : `Agent coding is consistent (support rates between ${pct(spread[0])} and ${pct(spread[1])}).`) : ''
    ]);
    return page('p-a1', bigHeader(M, X, sub) + `<div class="body">
      <div class="kpis twelve">${k}</div>
      <div class="row g-a1">${card('Engagement funnel', 'From dial to supportive voter', `<div class="funnel">${funnel}</div>`)}${panel('Executive summary', 'a1exec', ex)}</div>
      </div>` + footer(M, X, sub));
  }

  function audit2(M, X) {
    const sub = X.P.auditSubmissionLabel, c = M.cls;
    const all = [...X.impClasses, ...R.nonImpressionClasses.map(n => ({ ...n, color: X.colors[n.key] }))];
    const donut = CH.donut(all.map(cl => ({ v: c[cl.key], color: cl.color })), 230, 42, fmt(M.dials), 'total dials');
    const legend = all.map(cl => `<div class="lg"><i style="background:${cl.color}"></i>${cl.label} ${fmt(c[cl.key])} (${pct(share(c[cl.key], M.dials), 1)})</div>`).join('');
    const wards = [...M.wardList].filter(w => w.dials > 0).sort((a, b) => b.dials - a.dials).slice(0, R.maxWardsShown).sort((a, b) => b.reach - a.reach);
    const reach = CH.reachByWard(wards, 450, X.colorOf, { rowH: Math.min(19, 400 / Math.max(wards.length, 1)) });
    const ratio = c.followup ? (M.nonImpressions / c.followup) : 0;
    const t = `Non impressions outnumber follow ups ${ratio >= 1 ? Math.round(ratio) + ' to 1' : 'by a small margin'}. Unreachable numbers are a ${hl('data')} problem (dead or rotated SIMs), while unanswered calls are a ${hl('timing')} problem, so retry the ${fmt(c.noanswer)} unanswered numbers after 16:00 and early the next morning.`;
    return page('p-a2', smallHeader(M, X, 'Call outcomes', 'Impressions vs non impressions', sub) + `<div class="body">
      <div class="row g-a2">
        ${card('Every dial, classified', '6 impression classes + 5 non impression reasons', `<div class="donutwrap big">${donut}<div class="lgs">${legend}</div></div>`)}
        ${card('Reach rate by ward', '% of dials that became an impression', reach)}
      </div>
      <div class="row g-a2b">
        ${card('Impressions', '', `<div class="bigstat"><span class="bs" style="color:${X.th.brand}">${fmt(M.impressions)}</span> ${pct(M.reachRate, 1)} of dials</div><p>Of these, <b>${fmt(c.followup)}</b> need a call back and <b>${fmt(c.inapplicable)}</b> are not usable (wrong number, can't vote, relocated).</p>`)}
        ${card('Non impressions', '', `<div class="bigstat"><span class="bs" style="color:#4B5263">${fmt(M.nonImpressions)}</span> ${pct(share(M.nonImpressions, M.dials), 1)} of dials</div><p>Not reachable <b>${fmt(c.notreachable)}</b> · Unanswered <b>${fmt(c.noanswer)}</b> · Rejected <b>${fmt(c.rejected)}</b> · Switched off <b>${fmt(c.switchedoff)}</b> · Barred <b>${fmt(c.barred)}</b></p>`)}
        ${panel('Reading the gap', 'a2gap', t)}
      </div></div>` + footer(M, X, sub));
  }

  function audit3(M, X) {
    const sub = X.P.auditSubmissionLabel;
    const H = M.hourly.filter(h => h.dials > 0);
    const mid = H.filter(h => h.hour >= 9 && h.hour < 12).reduce((a, h) => a + h.dials, 0);
    const inner = H.slice(1, -1);
    const low = inner.length ? inner.reduce((a, b) => (b.dials < a.dials ? b : a)) : null;
    const weak = H.filter(h => h.dials >= 30).reduce((a, b) => (!a || b.reach < a.reach ? b : a), null);
    const hr = h => String(h).padStart(2, '0') + ':00';
    const d = M.durByClass;
    const t = bullets([
      M.peak ? `Peak output at ${hl(hr(M.peak.hour))} (${fmt(M.peak.dials)} dials). Mid morning (09:00 to 12:00) produced ${pct(share(mid, M.dials))} of the day.` : '',
      low && M.peak && low.dials < M.peak.dials * 0.5 ? `Volume fell to ${hl(fmt(low.dials))} at ${hr(low.hour)}. Plan staggered breaks so lines never go fully quiet.` : '',
      weak ? `Reach was weakest at ${hl(hr(weak.hour))} (${pct(weak.reach)}); voters are hardest to catch at that hour.` : '',
      `Supportive calls last about ${hl(Math.round(d.positive.med) + 's')}, volunteers ${hl(Math.round(d.volunteer.med) + 's')}. ${M.shortPositives ? `${fmt(M.shortPositives)} positives under ${R.shortPositiveSeconds} seconds should be spot checked.` : `No positives were shorter than ${R.shortPositiveSeconds} seconds.`}`
    ]);
    return page('p-a3', smallHeader(M, X, 'Time analysis', 'How the day unfolded', sub) + `<div class="body">
      ${card('Hourly volume, reach and support', 'Stacked bars = dial outcomes · lines = rates', CH.hourly(M, 1040, 300, X.colors), 'full')}
      <div class="row g-a3">${card('Call duration by impression', 'Connected calls only', CH.boxplot(M, 560, 230, X.impClasses))}${panel('Time signals', 'a3time', t)}</div>
      </div>` + footer(M, X, sub));
  }

  function audit4(M, X) {
    const sub = X.P.auditSubmissionLabel, A = M.agents;
    const top3 = A.slice(0, 3).map(a => `${esc(a.name)} (${a.imp})`).join(', ');
    const below = A.filter(a => a.dials < M.teamAvgDials * 0.8);
    const early = A.filter(a => a.earlyFinish);
    const fast = [...A].sort((a, b) => b.dialsPerHour - a.dialsPerHour)[0];
    const gaps = A.filter(a => a.feedbackRate < R.feedbackGapThreshold);
    const t = bullets([
      `${hl('Top 3 by impressions:')} ${top3}.`,
      (below.length ? `${hl('Well below team average:')} ${below.map(a => `${esc(a.name)} (${a.dials} dials)`).join(', ')} made under 80% of the ${fmt(M.teamAvgDials)} dial average. ` : `${hl('Output:')} every call partner was within 80% of the ${fmt(M.teamAvgDials)} dial team average. `) + (early.length ? `${hl('Early finish:')} ${early.map(a => `${esc(a.name)} stopped calling at ${hhmm(a.last)}`).join('. ')}.` : ''),
      fast ? `${hl('Speed vs depth:')} ${esc(fast.name)} logged ${fast.dials} dials at about ${Math.round(fast.dialsPerHour)} an hour, averaging ${Math.round(fast.avgCall)}s per call against a team average of ${Math.round(M.avgCall)}s.` : '',
      `${hl('Feedback gaps:')} ${gaps.length ? `${plural(gaps.length, 'agent')} recorded feedback on fewer than ${pct(R.feedbackGapThreshold)} of their conversations.` : 'every agent recorded feedback on most conversations.'}`
    ]);
    return page('p-a4', smallHeader(M, X, 'Staff performance', 'Call partner output', sub) + `<div class="body">
      ${card('Impressions and dials per agent', 'Ranked by impressions · green = at or above the team average · red = below', CH.agentBars(M, 1040, 290, X.th.brand), 'full')}
      <div class="row g-a3">${card('Productivity vs quality', 'Dials vs feedback capture', CH.agentScatter(M, 560, 240))}${panel('Staff signals', 'a4staff', t)}</div>
      </div>` + footer(M, X, sub));
  }

  function audit5(M, X) {
    const sub = X.P.auditSubmissionLabel, A = M.agents;
    const rows = A.map((a, i) => `<tr><td>${i + 1}</td><td class="an">${esc(a.name)}</td><td>${a.dials}</td><td>${pct(a.vsAvg)}</td><td class="imp">${a.imp}</td><td>${pct(a.reach)}</td><td>${a.c.positive}</td><td>${a.c.volunteer}</td><td>${a.c.undecided}</td><td>${a.c.negative}</td><td>${a.c.followup}</td><td>${pct(a.supportRate)}</td><td>${Math.round(a.avgCall)}s</td><td>${Math.round(a.talkMin)}</td><td>${pct(a.feedbackRate)}</td><td>${hhmm(a.first)} to ${hhmm(a.last)}</td><td>${Math.round(a.dialsPerHour)}</td></tr>`).join('');
    const dense = A.length > 22 ? ' dense' : '';
    return page('p-a5', smallHeader(M, X, 'Staff league table', 'Agent ranking by impressions', sub) + `<div class="body">
      <div class="card full"><table class="rank${dense}"><tr><th>#</th><th class="an">Agent</th><th>Dials</th><th>vs avg</th><th>Impressions</th><th>Reach %</th><th>Pos</th><th>Vol</th><th>Und</th><th>Neg</th><th>F up</th><th>Support %</th><th>Avg call</th><th>Talk min</th><th>Feedback %</th><th>Active</th><th>Dials/hr</th></tr>${rows}</table>
      <p class="cap">Ranked by <b>impressions</b> (voters reached), highest first; ties broken by support rate. Non impressions are not counted in the ranking. vs avg compares each call partner's dials with today's team average of ${fmt(M.teamAvgDials)}. Feedback % is measured on conversations only.</p></div>
      </div>` + footer(M, X, sub));
  }

  function audit6(M, X) {
    const sub = X.P.auditSubmissionLabel, A = M.agents;
    const mx = Math.max(1, ...M.agentSlots.flat());
    const shade = v => { if (!v) return 'transparent'; const t = Math.min(v / mx, 1); return `color-mix(in srgb, ${X.th.brandStrong} ${Math.round(12 + 88 * t)}%, white)`; };
    const head = M.slots.map((s, i) => i % 1 === 0 ? `<th>${hhmm(s)}</th>` : '').join('');
    const body = A.map((a, i) => `<tr><td class="an">${esc(a.name)}</td>${M.agentSlots[i].map(v => `<td style="background:${shade(v)};color:${v / mx > .45 ? '#fff' : '#1C1340'}">${v || ''}</td>`).join('')}</tr>`).join('');
    const sr = A.filter(a => a.imp >= 30);
    const lo = [...sr].sort((a, b) => a.supportRate - b.supportRate)[0], hi = [...sr].sort((a, b) => b.supportRate - a.supportRate)[0];
    const cal = lo && hi && lo !== hi ? `Support rate ranges from ${bold(pct(lo.supportRate))} (${esc(lo.name)}) to ${bold(pct(hi.supportRate))} (${esc(hi.name)}). Agents are calling similar lists, so a spread this wide points to inconsistent coding, not different voters. ${bold(fmt(M.positivesNoFeedback))} Positive calls have no feedback at all.` : `${bold(fmt(M.positivesNoFeedback))} Positive calls have no feedback at all.`;
    const rc = M.reclassCounts; const lab = k => (X.impClasses.find(c => c.key === k) || {}).label || k;
    const fu = Object.entries(rc).filter(([k]) => k.startsWith('followup>'));
    const ng = Object.entries(rc).filter(([k]) => k.startsWith('negative>'));
    const rec = M.opts.reclassify === false ? 'Feedback screening was switched off for this report; statuses are shown exactly as coded by agents.' :
      (fu.length || ng.length ? `${fu.length ? `FOLLOW UP calls were screened by feedback: ${fu.map(([k, v]) => `${bold(v)} → ${lab(k.split('>')[1])}`).join(', ')}.` : ''} ${ng.length ? `NEGATIVE calls screened: ${ng.map(([k, v]) => `${bold(v)} → ${lab(k.split('>')[1])}`).join(', ')}.` : ''}` : 'Feedback screening found no FOLLOW UP or NEGATIVE calls that needed moving.');
    const act = bullets([
      lo && hi && hi.supportRate - lo.supportRate > 0.3 ? '15 minute coding briefing with examples of each class.' : '',
      A.some(a => a.feedbackRate < R.feedbackGapThreshold) ? 'Make feedback mandatory on every connected call.' : '',
      'Staggered lunch and prayer breaks so lines never go fully quiet.',
      M.cls.followup ? `Re queue the ${fmt(M.cls.followup)} follow ups for the first hour of Day ${X.day + 1}.` : ''
    ]);
    return page('p-a6', smallHeader(M, X, 'Activity & quality', 'Who was calling, when', sub) + `<div class="body">
      <div class="card full">${'<div class="ct">Dials per agent per 30 minutes <span>Darker = busier · blank = no calls in that slot</span></div>'}<table class="heat${A.length > 22 ? ' dense' : ''}">${body}<tr class="hx"><td></td>${head}</tr></table></div>
      <div class="row g-a6">${card('Coding calibration', '', ed('a6cal', cal, 'p'))}${card('Reclassification applied', '', ed('a6rec', rec, 'p'))}${panel(`Actions for Day ${X.day + 1}`, 'a6act', act)}</div>
      </div>` + footer(M, X, sub));
  }

  function audit7(M, X) {
    const sub = X.P.auditSubmissionLabel;
    const seg = l => X.impClasses.map(cl => ({ v: l.c[cl.key], color: cl.color, dark: cl.key === 'undecided' }));
    const legend = X.impClasses.map(cl => ({ label: cl.label, color: cl.color }));
    const g = CH.stack100(M.genderList.map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: seg(l) })), 1000, { labelW: 70, noteW: 70, barH: 40, gap: 22, legend });
    const tg = CH.stack100(M.tierList.map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: seg(l) })), 600, { labelW: 60, noteW: 60, barH: 26, gap: 14, legend });
    const vb = CH.vbars(M.tierList.map(t => ({ label: t.key, v: t.reach })), 250, 200, [X.th.brandStrong, X.th.brand, X.th.badge, '#B99BEA', '#DCCDF5']);
    const tot = M.genderReached.reduce((a, b) => a + b.imp, 0);
    const men = M.genderReached.find(x => /^m/i.test(x.key)), women = M.genderReached.find(x => /^f/i.test(x.key));
    const tl = [...M.tierList].sort((a, b) => b.supportRate - a.supportRate);
    const t = [men && women ? `Men are ${hl(pct(share(men.imp, tot)))} of voters reached; women back ${esc(X.P.shortName)} at ${pct(women.supportRate)} against ${pct(men.supportRate)} for men.` : '',
      tl.length ? `Support peaks in ${esc(tl[0].key)} (${pct(tl[0].supportRate)}) and is lowest in ${esc(tl[tl.length - 1].key)} (${pct(tl[tl.length - 1].supportRate)}).` : ''].join(' ');
    return page('p-a7', smallHeader(M, X, 'Audience profile', 'Gender and socio economic tier', sub) + `<div class="body">
      ${card('Impressions by gender', 'From telco match · voters reached', g, 'full')}
      <div class="row g-a7">${card('Impressions by socio economic tier', 'Tier 1 = top 20% airtime spend on their network · Tier 5 = bottom 20%', tg)}
      <div class="col">${card('Reach by tier', '', vb)}${panel('Audience signals', 'a7sig', t)}</div></div>
      </div>` + footer(M, X, sub));
  }

  function audit11(M, X) {
    const sub = X.P.auditSubmissionLabel;
    const top = [...M.wardList].filter(w => w.imp > 0).sort((a, b) => b.imp - a.imp).slice(0, R.maxWardsShown);
    const cols = X.impClasses;
    const max = Math.max(...top.map(w => Math.max(...cols.map(c => share(w.c[c.key], w.imp)))), 0.01);
    const shade = v => `color-mix(in srgb, ${X.th.brandStrong} ${Math.round(6 + 90 * Math.min(v / max, 1))}%, white)`;
    const rows = top.map(w => `<tr><td class="an">${esc(w.label)} (${w.imp})</td>${cols.map(c => { const v = share(w.c[c.key], w.imp); return `<td style="background:${shade(v)};color:${v / max > .45 ? '#fff' : '#1C1340'}">${pct(v)}</td>`; }).join('')}</tr>`).join('');
    const two = top.slice(0, 2); const twoShare = share(two.reduce((a, w) => a + w.imp, 0), M.impressions);
    const und = [...M.wardList].sort((a, b) => b.c.undecided - a.c.undecided).slice(0, 2);
    const lowL = M.lgaList.filter(l => l.imp > 0).sort((a, b) => a.imp - b.imp)[0];
    const needs = M.needs.filter(n => n.total > 0).slice(0, 4).map(n => n.label.toLowerCase());
    const t = bullets([
      two.length === 2 ? `${hl('Rebalance the call list:')} ${esc(two[0].label)} and ${esc(two[1].label)} took ${pct(twoShare)} of conversations.${lowL ? ` Push ${esc(lowL.key)} and other under covered wards on Day ${X.day + 1}.` : ''}` : '',
      `${hl('Work the persuadables:')} ${fmt(M.cls.undecided)} undecided voters, mostly in ${und.map(w => esc(w.label)).join(' and ')}, are a priority call back list for senior agents.`,
      `${hl('Recycle the follow ups:')} ${fmt(M.cls.followup)} voters asked for a call back. Re queue them for the next morning.`,
      needs.length ? `${hl('Escalate the needs list')} to the campaign: ${needs.join(', ')} dominate.` : '',
      M.cls.volunteer ? `${hl(`Engage the ${fmt(M.cls.volunteer)} volunteers`)} within 48 hours; several can mobilise others in their communities.` : ''
    ]);
    return page('p-a11', smallHeader(M, X, 'Ward deep dive', 'Impression mix by ward', sub) + `<div class="body">
      <div class="row g-a11"><div class="card"><div class="ct">Ward × impression heatmap <span>Share of conversations in each ward · ward size in brackets</span></div>
      <table class="wheat"><tr><th></th>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>${rows}</table></div>
      ${panel('Recommendations', 'a11rec', t)}</div>
      </div>` + footer(M, X, sub));
  }

  function glancePage(M, X, big) {
    const sub = big ? X.P.submissionLabel : X.P.auditSubmissionLabel;
    const head = big ? bigHeader(M, X, sub) : smallHeader(M, X, 'Candidate view', 'Engagement at a glance', sub);
    return page('p-glance' + (big ? ' big' : ''), head + `<div class="body">${glanceBody(M, X, big ? 'v' : 'a8')}</div>` + footer(M, X, sub));
  }
  function supportPage(M, X, avoc) {
    const sub = avoc ? X.P.submissionLabel : X.P.auditSubmissionLabel;
    return page('p-support', smallHeader(M, X, 'LGA & ward comparative', 'Where support is strongest', sub) + `<div class="body">${supportBody(M, X, avoc ? 'v2' : 'a9')}</div>` + footer(M, X, sub));
  }
  function sayingPage(M, X, avoc) {
    const sub = avoc ? X.P.submissionLabel : X.P.auditSubmissionLabel;
    return page('p-saying', smallHeader(M, X, 'Candidate performance', 'What voters are saying', sub) + `<div class="body">${sayingBody(M, X, avoc ? 'v3' : 'a10')}</div>` + footer(M, X, sub));
  }

  window.buildReports = function (M, opts) {
    const X = ctx(M, opts);
    const avoc = [glancePage(M, X, true), supportPage(M, X, true), sayingPage(M, X, true)];
    const audit = [audit1(M, X), audit2(M, X), audit3(M, X), audit4(M, X), audit5(M, X), audit6(M, X)];
    if (M.hasTelco) audit.push(audit7(M, X));
    audit.push(glancePage(M, X, false), supportPage(M, X, false), sayingPage(M, X, false), audit11(M, X));
    return { avoc: avoc.join(''), audit: audit.join(''), theme: X.th };
  };
})();
