/* CLASSIC STYLE: landscape pages laid out like the original Bravo reports. All numbers and text come from js/content.js. */
(function () {
  const C = window.CONTENT, CH = window.CHARTS, R = window.RULES;
  const { esc, pct, fmt, ed, longDate, share } = C.util;

  /* ---------- shared chrome ---------- */
  function bigHeader(M, X, submission, title = 'Voters Engagement') {
    const P = X.P;
    return `<header class="hdr-big">
      <div class="hb-logo"><img src="${P.partyLogo}" alt=""></div>
      <div class="hb-title">
        <div class="eyebrow">Daily Report · Day ${X.day} · ${esc(P.division)}</div>
        <h1>${esc(title)}</h1>
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
      <div class="hs-photo ${P.candidateImageStyle}"><img src="${P.candidateImageStyle === 'framed' && P.candidateFace ? P.candidateFace : P.candidateImage}" alt=""></div>
    </header>`;
  }
  function footer(M, X, submission) {
    const P = X.P;
    return `<footer class="ftr"><div><b>${esc(submission)}</b> · ${esc(P.division)} · ${esc(P.constituency)} · Day ${X.day} Daily Report</div>
      <div>Bravo AEMS · Confidential · Call date ${longDate(M.callDate)} · Generated ${longDate(X.generated)}</div></footer>`;
  }
  const page = (cls, inner) => `<section class="page ${cls}">${inner}</section>`;
  const card = (title, sub, body, cls = '') => `<div class="card ${cls}"><div class="ct">${esc(title)}${sub ? ` <span>${esc(sub)}</span>` : ''}</div>${body}</div>`;
  const kpi = ([label, value, note, color]) => `<div class="kpi" style="--k:${color}"><div class="kl">${esc(label)}</div><div class="kv${String(value).replace(/<[^>]+>/g, '').length > 9 ? ' long' : ''}">${value}</div><div class="kn">${note}</div></div>`;
  const panel = (title, id, html, cls = '') => `<div class="panel ${cls}"><div class="pt">${esc(title)}</div>${ed(id, html)}</div>`;

  /* ---------- engagement at a glance (AVOC 1 / audit 8) ---------- */
  function glanceBody(M, X, prefix) {
    const c = M.cls, F = C.lgaFacts(M);
    const donut = CH.donut(X.impClasses.map(cl => ({ v: c[cl.key], color: cl.color })), 170, 26, fmt(M.impressions), 'voters engaged');
    const legend = X.impClasses.map(cl => `<div class="lg"><i style="background:${cl.color}"></i>${cl.label} ${fmt(c[cl.key])} (${pct(share(c[cl.key], M.impressions), 1)})</div>`).join('');
    const lgas = F.lgas, two = F.two;
    const ttl = two ? `${lgas[0].key} vs ${lgas[1].key}` : 'LGA comparison';
    const rows = [...lgas].sort((a, b) => b.supportRate - a.supportRate).map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: X.impClasses.map(cl => ({ v: l.c[cl.key], color: cl.color, dark: cl.key === 'undecided' })) }));
    const many = rows.length > 3;
    const stack = CH.stack100(rows, many ? 560 : 470, { labelW: many ? 118 : 86, noteW: 54, barH: many ? 15 : 30, gap: many ? 5 : 20, legendSize: many ? 10 : 10.5, legend: X.impClasses.map(cl => ({ label: cl.label, color: cl.color })) });
    const cardsL = two ? [lgas[0], lgas[1]] : [F.best, F.worst].filter((v, i, a) => v && a.indexOf(v) === i);
    const lgaCards = cardsL.map((l, i) => `<div class="lgacard" style="--lc:${X.colorOf(l.key)}"><div class="lch"><b>${esc(l.key.toUpperCase())}</b> · ${fmt(l.imp)} engaged${!two ? (i === 0 ? ' · strongest' : ' · weakest') : ''}</div><div class="lcv"><span>${pct(l.supportRate)}</span> supportive · ${pct(l.negRate, 1)} negative</div></div>`).join('');
    return `<div class="kpis six">${C.glanceKpis(M, X).map(kpi).join('')}</div>
      <div class="row g-glance">
        ${card('Voter impressions', 'All six impression classes', `<div class="donutwrap">${donut}<div class="lgs">${legend}</div></div>`)}
        ${card(ttl, many ? 'Impression mix by LGA · highest support first' : 'Impression mix by LGA', `<div class="stackwrap">${stack}</div>${many ? '' : `<div class="lgacards">${lgaCards}</div>`}`)}
      </div>
      ${panel(`What Day ${X.day} tells us`, prefix + 'tells', C.T.tells(M, X), 'wide')}
      <div class="defs">${C.H.defs(X)}</div>`;
  }

  /* ---------- where support is strongest (AVOC 2 / audit 9) ---------- */
  function supportBody(M, X, prefix) {
    const W = C.wardFacts(M);
    const bySup = [...W.top].sort((a, b) => b.supportRate - a.supportRate);
    const legend = M.lgaList.filter(l => l.imp > 0).map(l => ({ name: l.key, color: X.colorOf(l.key) }));
    const bars = CH.supportByWard(bySup, 450, 470, M.supportRate, X.colorOf, legend);
    const bub = CH.wardBubbles(W.top, 510, 400, M.supportRate, X.colorOf, legend);
    return `<div class="row g-support">
        ${card('Support rate by ward', `Positive + Volunteer as % of voters engaged · colour = LGA${W.omitted > 0 ? ` · ${R.maxWardsShown} largest wards` : ''}`, bars)}
        ${card('Reach × Support × Persuadables', 'Interrelationship of the three ward drivers', bub + `<p class="cap">Wards to the <b>right</b> are where we have talked to the most voters; wards <b>higher up</b> are warmer; <b>bigger bubbles</b> hold more undecided and call back voters still to be won.</p>`)}
      </div>
      ${panel('Ward signals', prefix + 'wardsig', C.T.wardsig(M, X), 'wide')}`;
  }

  /* ---------- what voters are saying (AVOC 3 / audit 10) ---------- */
  function sayingBody(M, X, prefix) {
    const lg = X.lgaNames.map(l => `<span class="mlg"><i style="background:${X.colorOf(l)}"></i>${esc(l)}</span>`).join('');
    const needs = CH.needs(M.needs, 440, X.lgaNames, X.colorOf);
    const sc = `<div class="score">
        <div class="s1"><div class="sv" style="color:#2EA44F">${pct(M.supportAmongDecided)}</div><div class="sl">support among decided voters</div></div>
        <div class="s2"><div class="sv" style="color:${X.colors.volunteer}">${fmt(M.cls.volunteer)}</div><div class="sl">volunteers ready to work or mobilise</div></div>
        <div class="s3"><div class="sv" style="color:#C98A00">${fmt(M.cashAsks)}</div><div class="sl">voters asking for cash or funds</div></div></div>`;
    const quotes = C.H.quotes(M, X).map((q, i) => `<div class="quote" data-drop>${ed(prefix + 'q' + i, q.text, 'div', 'qt')}<div class="qm">${q.meta}</div></div>`).join('') || '<p class="muted pad">No quotable feedback today.</p>';
    return `<div class="row g-saying">
      <div class="col">
        ${card('Needs & requests raised', `${fmt(M.needVoters)} voters raised at least one need · stacked by LGA`, needs + `<div class="mlgs">${lg}</div>`, 'needs')}
        ${card('Grievances heard & where', 'Ward of the caller · communities named in feedback', C.H.grievances(M, X, prefix), 'griev')}
      </div>
      <div class="col">
        ${card('Candidate scorecard', '', sc + ed(prefix + 'sro', C.T.sro(M, X)), 'scorecard')}
        ${card('Voice of the voters', 'Taken from call feedback', quotes, 'voices')}
      </div></div>`;
  }

  /* ---------- AUDIT pages ---------- */
  function audit1(M, X) {
    const sub = X.P.auditSubmissionLabel;
    const funnel = C.funnel(M, X).map(([v, l, n, col]) => `<div class="fr"><div class="fb"><div style="width:${Math.max(share(v, M.dials) * 100, 12)}%;background:${col}">${fmt(v)}</div></div><div class="fl"><b>${l}</b><br>${n}</div></div>`).join('');
    return page('p-a1', bigHeader(M, X, sub) + `<div class="body">
      <div class="kpis twelve">${C.auditKpis(M, X).map(kpi).join('')}</div>
      <div class="row g-a1">${card('Engagement funnel', 'From dial to supportive voter', `<div class="funnel">${funnel}</div>`)}${panel('Executive summary', 'a1exec', C.T.exec(M, X))}</div>
      </div>` + footer(M, X, sub));
  }

  function audit2(M, X) {
    const sub = X.P.auditSubmissionLabel, c = M.cls, all = X.allClasses;
    const donut = CH.donut(all.map(cl => ({ v: c[cl.key], color: cl.color })), 230, 42, fmt(M.dials), 'total dials');
    const legend = all.map(cl => `<div class="lg"><i style="background:${cl.color}"></i>${cl.label} ${fmt(c[cl.key])} (${pct(share(c[cl.key], M.dials), 1)})</div>`).join('');
    const wards = [...M.wardList].filter(w => w.dials > 0).sort((a, b) => b.dials - a.dials).slice(0, R.maxWardsShown).sort((a, b) => b.reach - a.reach);
    const reach = CH.reachByWard(wards, 450, X.colorOf, { rowH: Math.min(19, 400 / Math.max(wards.length, 1)) });
    return page('p-a2', smallHeader(M, X, 'Call outcomes', 'Impressions vs non impressions', sub) + `<div class="body">
      <div class="row g-a2">
        ${card('Every dial, classified', '6 impression classes + 5 non impression reasons', `<div class="donutwrap big">${donut}<div class="lgs">${legend}</div></div>`)}
        ${card('Reach rate by ward', '% of dials that became an impression', reach)}
      </div>
      <div class="row g-a2b">
        ${card('Impressions', '', `<div class="bigstat"><span class="bs" style="color:${X.th.brand}">${fmt(M.impressions)}</span> ${pct(M.reachRate, 1)} of dials</div><p>Of these, <b>${fmt(c.followup)}</b> need a call back and <b>${fmt(c.inapplicable)}</b> are not usable (wrong number, can't vote, relocated).</p>`)}
        ${card('Non impressions', '', `<div class="bigstat"><span class="bs" style="color:#4B5263">${fmt(M.nonImpressions)}</span> ${pct(share(M.nonImpressions, M.dials), 1)} of dials</div><p>Not reachable <b>${fmt(c.notreachable)}</b> · Unanswered <b>${fmt(c.noanswer)}</b> · Rejected <b>${fmt(c.rejected)}</b> · Switched off <b>${fmt(c.switchedoff)}</b> · Barred <b>${fmt(c.barred)}</b></p>`)}
        ${panel('Reading the gap', 'a2gap', C.T.gap(M, X))}
      </div></div>` + footer(M, X, sub));
  }

  function audit3(M, X) {
    const sub = X.P.auditSubmissionLabel;
    return page('p-a3', smallHeader(M, X, 'Time analysis', 'How the day unfolded', sub) + `<div class="body">
      ${card('Hourly volume, reach and support', 'Stacked bars = dial outcomes · lines = rates', CH.hourly(M, 1040, 300, X.colors), 'full')}
      <div class="row g-a3">${card('Call duration by impression', 'Connected calls only', CH.boxplot(M, 560, 230, X.impClasses))}${panel('Time signals', 'a3time', C.T.time(M, X))}</div>
      </div>` + footer(M, X, sub));
  }

  function audit4(M, X) {
    const sub = X.P.auditSubmissionLabel;
    return page('p-a4', smallHeader(M, X, 'Staff performance', 'Call partner output', sub) + `<div class="body">
      ${card('Impressions and dials per agent', 'Ranked by impressions · green = at or above the team average · red = below', CH.agentBars(M, 1040, 290, X.th.brand), 'full')}
      <div class="row g-a3">${card('Productivity vs quality', 'Dials vs feedback capture', CH.agentScatter(M, 560, 240))}${panel('Staff signals', 'a4staff', C.T.staff(M, X))}</div>
      </div>` + footer(M, X, sub));
  }

  function audit5(M, X) {
    const sub = X.P.auditSubmissionLabel;
    return page('p-a5', smallHeader(M, X, 'Staff league table', 'Agent ranking by impressions', sub) + `<div class="body">
      <div class="card full">${C.H.league(M)}
      <p class="cap">${C.H.leagueNote(M)}</p></div>
      </div>` + footer(M, X, sub));
  }

  function audit6(M, X) {
    const sub = X.P.auditSubmissionLabel;
    return page('p-a6', smallHeader(M, X, 'Activity & quality', 'Who was calling, when', sub) + `<div class="body">
      <div class="card full"><div class="ct">Dials per agent per 30 minutes <span>Darker = busier · blank = no calls in that slot</span></div>${C.H.activity(M, X.th.brandStrong)}</div>
      <div class="row g-a6">${card('Coding calibration', '', ed('a6cal', C.T.cal(M, X), 'p'))}${card('Reclassification applied', '', ed('a6rec', C.T.rec(M, X), 'p'))}${panel(`Actions for Day ${X.day + 1}`, 'a6act', C.T.act(M, X))}</div>
      </div>` + footer(M, X, sub));
  }

  function audit7(M, X) {
    const sub = X.P.auditSubmissionLabel;
    const seg = l => X.impClasses.map(cl => ({ v: l.c[cl.key], color: cl.color, dark: cl.key === 'undecided' }));
    const legend = X.impClasses.map(cl => ({ label: cl.label, color: cl.color }));
    const g = CH.stack100(M.genderList.map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: seg(l) })), 1000, { labelW: 70, noteW: 70, barH: 40, gap: 22, legend });
    const tg = CH.stack100(M.tierList.map(l => ({ label: l.key, note: 'n=' + fmt(l.imp), segs: seg(l) })), 600, { labelW: 60, noteW: 60, barH: 26, gap: 14, legend });
    const vb = CH.vbars(M.tierList.map(t => ({ label: t.key, v: t.reach })), 250, 200, [X.th.brandStrong, X.th.brand, X.th.badge, '#B99BEA', '#DCCDF5']);
    return page('p-a7', smallHeader(M, X, 'Audience profile', 'Gender and socio economic tier', sub) + `<div class="body">
      ${card('Impressions by gender', 'From telco match · voters reached', g, 'full')}
      <div class="row g-a7">${card('Impressions by socio economic tier', 'Tier 1 = top 20% airtime spend on their network · Tier 5 = bottom 20%', tg)}
      <div class="col">${card('Reach by tier', '', vb)}${panel('Audience signals', 'a7sig', C.T.aud(M, X))}</div></div>
      </div>` + footer(M, X, sub));
  }

  function audit11(M, X) {
    const sub = X.P.auditSubmissionLabel;
    return page('p-a11', smallHeader(M, X, 'Ward deep dive', 'Impression mix by ward', sub) + `<div class="body">
      <div class="row g-a11"><div class="card"><div class="ct">Ward × impression heatmap <span>Share of conversations in each ward · ward size in brackets</span></div>
      ${C.H.wardHeat(M, X, X.th.brandStrong)}</div>
      ${panel('Recommendations', 'a11rec', C.T.recs(M, X))}</div>
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
    const X = C.ctx(M, opts);
    const avoc = [glancePage(M, X, true), supportPage(M, X, true), sayingPage(M, X, true)];
    const audit = [audit1(M, X), audit2(M, X), audit3(M, X), audit4(M, X), audit5(M, X), audit6(M, X)];
    if (M.hasTelco) audit.push(audit7(M, X));
    audit.push(glancePage(M, X, false), supportPage(M, X, false), sayingPage(M, X, false), audit11(M, X));
    return { avoc: avoc.join(''), audit: audit.join(''), theme: X.th };
  };
  /* Shared with the sentiment report (js/pages_sent.js). */
  window.CLASSIC = { bigHeader, smallHeader, footer, page, card, kpi, panel };
})();
