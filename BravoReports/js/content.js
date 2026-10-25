/*
  CONTENT
  Everything both report styles say and show: the KPI lists, the funnel, the
  tables and every piece of written commentary. The classic and dashboard
  styles only decide how this is laid out, so the numbers and the wording
  are always identical between them.
*/
(function () {
  const { esc, pct, fmt } = window.CHART_UTILS;
  const CH = window.CHARTS, R = window.RULES;
  const naira = (v, d = 0) => '₦' + Number(v).toLocaleString('en-NG', { minimumFractionDigits: d, maximumFractionDigits: d });
  const hl = s => `<b class="hl">${s}</b>`;
  const bold = s => `<b>${s}</b>`;
  const ed = (id, html, tag = 'div', cls = '') => `<${tag} class="ed ${cls}" contenteditable="true" spellcheck="false" data-edit="${id}">${html}</${tag}>`;
  const hhmm = d => d ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '';
  const longDate = d => d ? d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const shortDate = d => d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const share = (a, b) => b ? a / b : 0;
  const plural = (n, w, p) => `${fmt(n)} ${n === 1 ? w : (p || w + 's')}`;
  const bullets = items => '<ul>' + items.filter(Boolean).map(i => `<li>${i}</li>`).join('') + '</ul>';
  const signed = n => (n >= 0 ? '+' : '') + n;
  const hr = h => String(h).padStart(2, '0') + ':00';

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
    const allClasses = [...impClasses, ...R.nonImpressionClasses.map(n => ({ ...n, color: colors[n.key] }))];
    return { P, th, colors, colorOf, lgaNames, day, impClasses, allClasses, generated: opts.generated || new Date() };
  }

  /* ---------- facts shared by several pages ---------- */
  function lgaFacts(M) {
    const lgas = M.lgaList.filter(l => l.imp > 0);
    const elig = lgas.filter(l => l.imp >= R.minWardSample);
    const pool = elig.length >= 2 ? elig : lgas;
    const bySupport = [...pool].sort((a, b) => b.supportRate - a.supportRate);
    return { lgas, pool, best: bySupport[0], worst: bySupport[bySupport.length - 1], biggest: lgas[0], two: lgas.length === 2 };
  }
  function wardFacts(M) {
    const top = [...M.wardList].filter(w => w.imp > 0).sort((a, b) => b.imp - a.imp).slice(0, R.maxWardsShown);
    const elig = top.filter(w => w.imp >= R.minWardSample);
    const base = elig.length >= 2 ? elig : top;
    const warm = [...base].sort((a, b) => b.supportRate - a.supportRate)[0];
    const cool = [...base].sort((a, b) => a.supportRate - b.supportRate)[0];
    const pers = [...top].sort((a, b) => b.persuadable - a.persuadable)[0];
    const omitted = M.wardList.filter(w => w.imp > 0).length - top.length;
    return { top, warm, cool, pers, omitted };
  }
  function hourFacts(M) {
    const H = M.hourly.filter(h => h.dials > 0);
    const mid = H.filter(h => h.hour >= 9 && h.hour < 12).reduce((a, h) => a + h.dials, 0);
    const inner = H.slice(1, -1);
    const low = inner.length ? inner.reduce((a, b) => (b.dials < a.dials ? b : a)) : null;
    const weak = H.filter(h => h.dials >= 30).reduce((a, b) => (!a || b.reach < a.reach ? b : a), null);
    return { H, mid, low, weak };
  }
  function agentFacts(M) {
    const sr = M.agents.filter(a => a.imp >= 30);
    const lo = [...sr].sort((a, b) => a.supportRate - b.supportRate)[0];
    const hi = [...sr].sort((a, b) => b.supportRate - a.supportRate)[0];
    return { lo, hi, wide: lo && hi && hi.supportRate - lo.supportRate > 0.3 };
  }

  /* ---------- KPI lists: [label, value, note, colour] ---------- */
  function glanceKpis(M, X) {
    const c = M.cls, P = X.P;
    return [
      ['Voters engaged', fmt(M.impressions), 'Conversations with a recorded impression', X.th.brand],
      ['Supportive voters', fmt(M.supportive), `${pct(M.supportRate, 1)} of voters engaged (Positive + Volunteer)`, '#2EA44F'],
      ['Volunteers', fmt(c.volunteer), `Ready to work or mobilise for ${esc(P.shortName)}`, X.colors.volunteer],
      ['Undecided', fmt(c.undecided), `${pct(M.undecidedRate, 1)}, the persuadable middle`, '#F2A81D'],
      ['Negative', fmt(c.negative), `Only ${pct(M.negativeRate, 1)} of voters engaged`, '#E23B4E'],
      ['Net support score', signed(M.netSupport), 'Supportive minus Negative, as % of decided voters', '#2EA44F']
    ];
  }
  function auditKpis(M, X) {
    const agents = M.agents.length;
    return [
      ['Total dials', fmt(M.dials), `About <b>${fmt(M.teamAvgDials)}</b> per call partner`, X.th.brand],
      ['Voters reached', fmt(M.impressions), `${pct(M.reachRate, 1)} of dials produced an impression`, '#2EA44F'],
      ['Supportive voters', fmt(M.supportive), `${pct(M.supportRate, 1)} of voters reached`, '#2EA44F'],
      ['Call agents', fmt(agents), `Covering ${M.lgaList.filter(l => l.dials > 0).length} LGAs and ${M.wardList.filter(w => w.dials > 0).length} wards`, X.th.brand],
      ['Avg call duration', Math.round(M.avgCall) + 's', `${fmt(M.talkMinutes)} talk minutes in total`, '#3B82F6'],
      ['Airtime used', naira(M.airtime), `${naira(M.costPerDial, 2)} per dial (impressions only)`, '#E0A800'],
      ['Cost per voter reached', naira(M.costPerReached, 2), 'Airtime ÷ voters with an impression', '#E0A800'],
      ['Cost per supportive voter', naira(M.costPerSupportive, 2), 'Airtime ÷ Positive + Volunteer', '#E0A800'],
      ['Cost per talk minute', naira(M.costPerMinute, 2), 'Airtime ÷ connected minutes', '#E0A800'],
      ['Non impressions', fmt(M.nonImpressions), `${pct(share(M.nonImpressions, M.dials), 1)} of dials, no conversation`, '#5E6272'],
      ['Calling window', `${hhmm(M.firstCall)} to ${hhmm(M.lastCall)}`, M.peak ? `Peak hour ${hr(M.peak.hour)} · ${fmt(M.peak.dials)} dials` : '', '#3B82F6'],
      ['Net support score', signed(M.netSupport), `${pct(M.supportAmongDecided)} support among decided voters`, '#2EA44F']
    ];
  }
  /* Funnel rows: [value, label, note, colour] */
  function funnel(M, X) {
    return [
      [M.dials, 'Dials made', '100% of dials', X.th.brandStrong],
      [M.impressions, 'Voters reached (impression)', `${pct(share(M.impressions, M.dials))} of dials · ${pct(share(M.impressions, M.dials))} of prev.`, X.th.brand],
      [M.qualified, 'Qualified conversations', `${pct(share(M.qualified, M.dials))} of dials · ${pct(share(M.qualified, M.impressions))} of prev.`, X.th.badge],
      [M.supportive, 'Supportive (Positive + Volunteer)', `${pct(share(M.supportive, M.dials))} of dials · ${pct(share(M.supportive, M.qualified))} of prev.`, '#2EA44F']
    ];
  }

  /* ---------- written commentary ---------- */
  const T = {};
  T.tells = (M, X) => {
    const F = lgaFacts(M);
    const tenths = Math.round(M.supportRate * 10);
    let t = `About ${hl(tenths + ' in 10')} voters engaged backed ${esc(X.P.shortName)} and only ${hl(pct(M.negativeRate, 1))} were openly opposed. Among voters who gave a clear position, support stands at ${hl(pct(M.supportAmongDecided))}.`;
    if (F.lgas.length >= 2) {
      const srt = [...F.pool].sort((a, b) => b.supportRate - a.supportRate);
      const gap = srt[0].supportRate - srt[srt.length - 1].supportRate;
      t += gap < 0.03 && srt.length === 2
        ? ` ${esc(srt[0].key)} (${hl(pct(srt[0].supportRate))}) and ${esc(srt[1].key)} (${hl(pct(srt[1].supportRate))}) are neck and neck,`
        : ` ${esc(srt[0].key)} leads at ${hl(pct(srt[0].supportRate))} and ${esc(srt[srt.length - 1].key)} trails at ${hl(pct(srt[srt.length - 1].supportRate))},`;
      t += ` but ${esc(F.biggest.key)} carries ${pct(share(F.biggest.imp, M.impressions))} of all conversations, so its ${fmt(F.biggest.persuadable)} undecided and call back voters are the biggest pool to convert.`;
    }
    return t;
  };
  T.wardsig = (M, X) => {
    const { top, warm, cool, pers } = wardFacts(M);
    const two = top.slice(0, 2);
    const twoShare = share(two.reduce((a, w) => a + w.imp, 0), M.impressions);
    const lgaShare = M.lgaList.filter(l => l.imp > 0).sort((a, b) => a.imp - b.imp)[0];
    let t = '';
    if (warm) t += `${hl(esc(warm.label))} is the warmest well covered ward (${pct(warm.supportRate)} supportive, n=${warm.imp}). `;
    if (cool && cool !== warm) t += `${hl(esc(cool.label))} is the coolest (${pct(cool.supportRate)}, n=${cool.imp}) and needs attention. `;
    if (pers) t += `${hl(esc(pers.label))} holds the largest persuadable pool (${fmt(pers.persuadable)} undecided and call back voters). `;
    if (two.length === 2) t += `${esc(two[0].label)} and ${esc(two[1].label)} alone make up ${pct(twoShare)} of all conversations`;
    if (lgaShare && M.lgaList.length > 1) t += `, so the Day ${X.day + 1} call list should widen coverage across ${esc(lgaShare.key)} wards.`; else t += '.';
    return t;
  };
  T.sro = (M, X) => {
    const gs = M.grievances.filter(g => g.total > 0);
    const topNeeds = M.needs.filter(n => n.total > 0).slice(0, 3);
    const topG = gs[0];
    const undWards = [...M.wardList].sort((a, b) => b.c.undecided - a.c.undecided).slice(0, 2).map(w => esc(w.label));
    return bullets([
      `${bold('Strength:')} ${pct(M.supportAmongDecided)} of decided voters back ${esc(X.P.shortName)}, and ${plural(M.cls.volunteer, 'voter')} volunteered to work or mobilise for the campaign.`,
      topG ? `${bold('Risk:')} the leading grievance is ${bold(esc(topG.label.toLowerCase()))} (${topG.total} mentions).` : `${bold('Risk:')} ${fmt(M.cls.undecided)} voters are still undecided and ${fmt(M.cls.followup)} need a call back.`,
      topNeeds.length ? `${bold('Opportunity:')} ${topNeeds.map(n => `${esc(n.label.toLowerCase())} (${n.total})`).join(', ')} lead the asks; visible action on these would convert undecided voters in ${undWards.join(' and ')}.` : ''
    ]);
  };
  T.exec = (M, X) => {
    const sr = M.agents.filter(a => a.imp >= 30).map(a => a.supportRate);
    const spread = sr.length > 1 ? [Math.min(...sr), Math.max(...sr)] : null;
    return bullets([
      `${M.agents.length} call partners made ${hl(fmt(M.dials))} dials (about ${fmt(M.teamAvgDials)} each), ${M.reachRate < 0.6 ? 'but only' : 'and'} ${hl(pct(M.reachRate))} of dials became a conversation. ${fmt(M.cls.notreachable)} numbers were unreachable.`,
      `${hl(pct(M.supportRate))} of voters reached are supportive; negatives are just ${hl(pct(M.negativeRate, 1))}.`,
      `Each supportive voter cost ${hl(naira(M.costPerSupportive, 2))} in airtime.`,
      spread ? (spread[1] - spread[0] > 0.3 ? `Agent coding is inconsistent (support rates of ${pct(spread[0])} to ${pct(spread[1])}); a calibration session is needed.` : `Agent coding is consistent (support rates between ${pct(spread[0])} and ${pct(spread[1])}).`) : ''
    ]);
  };
  T.gap = (M) => {
    const c = M.cls;
    const ratio = c.followup ? (M.nonImpressions / c.followup) : 0;
    return `Non impressions outnumber follow ups ${ratio >= 1 ? Math.round(ratio) + ' to 1' : 'by a small margin'}. Unreachable numbers are a ${hl('data')} problem (dead or rotated SIMs), while unanswered calls are a ${hl('timing')} problem, so retry the ${fmt(c.noanswer)} unanswered numbers after 16:00 and early the next morning.`;
  };
  T.time = (M) => {
    const { mid, low, weak } = hourFacts(M);
    const d = M.durByClass;
    return bullets([
      M.peak ? `Peak output at ${hl(hr(M.peak.hour))} (${fmt(M.peak.dials)} dials). Mid morning (09:00 to 12:00) produced ${pct(share(mid, M.dials))} of the day.` : '',
      low && M.peak && low.dials < M.peak.dials * 0.5 ? `Volume fell to ${hl(fmt(low.dials))} at ${hr(low.hour)}. Plan staggered breaks so lines never go fully quiet.` : '',
      weak ? `Reach was weakest at ${hl(hr(weak.hour))} (${pct(weak.reach)}); voters are hardest to catch at that hour.` : '',
      `Supportive calls last about ${hl(Math.round(d.positive.med) + 's')}, volunteers ${hl(Math.round(d.volunteer.med) + 's')}. ${M.shortPositives ? `${fmt(M.shortPositives)} positives under ${R.shortPositiveSeconds} seconds should be spot checked.` : `No positives were shorter than ${R.shortPositiveSeconds} seconds.`}`
    ]);
  };
  T.staff = (M) => {
    const A = M.agents;
    const top3 = A.slice(0, 3).map(a => `${esc(a.name)} (${a.imp})`).join(', ');
    const below = A.filter(a => a.dials < M.teamAvgDials * 0.8);
    const early = A.filter(a => a.earlyFinish);
    const fast = [...A].sort((a, b) => b.dialsPerHour - a.dialsPerHour)[0];
    const gaps = A.filter(a => a.feedbackRate < R.feedbackGapThreshold);
    return bullets([
      `${hl('Top 3 by impressions:')} ${top3}.`,
      (below.length ? `${hl('Well below team average:')} ${below.map(a => `${esc(a.name)} (${a.dials} dials)`).join(', ')} made under 80% of the ${fmt(M.teamAvgDials)} dial average. ` : `${hl('Output:')} every call partner was within 80% of the ${fmt(M.teamAvgDials)} dial team average. `) + (early.length ? `${hl('Early finish:')} ${early.map(a => `${esc(a.name)} stopped calling at ${hhmm(a.last)}`).join('. ')}.` : ''),
      fast ? `${hl('Speed vs depth:')} ${esc(fast.name)} logged ${fast.dials} dials at about ${Math.round(fast.dialsPerHour)} an hour, averaging ${Math.round(fast.avgCall)}s per call against a team average of ${Math.round(M.avgCall)}s.` : '',
      `${hl('Feedback gaps:')} ${gaps.length ? `${plural(gaps.length, 'agent')} recorded feedback on fewer than ${pct(R.feedbackGapThreshold)} of their conversations.` : 'every agent recorded feedback on most conversations.'}`
    ]);
  };
  T.cal = (M) => {
    const { lo, hi } = agentFacts(M);
    return lo && hi && lo !== hi ? `Support rate ranges from ${bold(pct(lo.supportRate))} (${esc(lo.name)}) to ${bold(pct(hi.supportRate))} (${esc(hi.name)}). Agents are calling similar lists, so a spread this wide points to inconsistent coding, not different voters. ${bold(fmt(M.positivesNoFeedback))} Positive calls have no feedback at all.` : `${bold(fmt(M.positivesNoFeedback))} Positive calls have no feedback at all.`;
  };
  T.rec = (M, X) => {
    const rc = M.reclassCounts; const lab = k => (X.impClasses.find(c => c.key === k) || {}).label || k;
    const fu = Object.entries(rc).filter(([k]) => k.startsWith('followup>'));
    const ng = Object.entries(rc).filter(([k]) => k.startsWith('negative>'));
    return M.opts.reclassify === false ? 'Feedback screening was switched off for this report; statuses are shown exactly as coded by agents.' :
      (fu.length || ng.length ? `${fu.length ? `FOLLOW UP calls were screened by feedback: ${fu.map(([k, v]) => `${bold(v)} → ${lab(k.split('>')[1])}`).join(', ')}.` : ''} ${ng.length ? `NEGATIVE calls screened: ${ng.map(([k, v]) => `${bold(v)} → ${lab(k.split('>')[1])}`).join(', ')}.` : ''}` : 'Feedback screening found no FOLLOW UP or NEGATIVE calls that needed moving.');
  };
  T.act = (M, X) => bullets([
    agentFacts(M).wide ? '15 minute coding briefing with examples of each class.' : '',
    M.agents.some(a => a.feedbackRate < R.feedbackGapThreshold) ? 'Make feedback mandatory on every connected call.' : '',
    'Staggered lunch and prayer breaks so lines never go fully quiet.',
    M.cls.followup ? `Re queue the ${fmt(M.cls.followup)} follow ups for the first hour of Day ${X.day + 1}.` : ''
  ]);
  T.aud = (M, X) => {
    const tot = M.genderReached.reduce((a, b) => a + b.imp, 0);
    const men = M.genderReached.find(x => /^m/i.test(x.key)), women = M.genderReached.find(x => /^f/i.test(x.key));
    const tl = [...M.tierList].sort((a, b) => b.supportRate - a.supportRate);
    return [men && women ? `Men are ${hl(pct(share(men.imp, tot)))} of voters reached; women back ${esc(X.P.shortName)} at ${pct(women.supportRate)} against ${pct(men.supportRate)} for men.` : '',
      tl.length ? `Support peaks in ${esc(tl[0].key)} (${pct(tl[0].supportRate)}) and is lowest in ${esc(tl[tl.length - 1].key)} (${pct(tl[tl.length - 1].supportRate)}).` : ''].join(' ');
  };
  T.recs = (M, X) => {
    const top = wardFacts(M).top;
    const two = top.slice(0, 2); const twoShare = share(two.reduce((a, w) => a + w.imp, 0), M.impressions);
    const und = [...M.wardList].sort((a, b) => b.c.undecided - a.c.undecided).slice(0, 2);
    const lowL = M.lgaList.filter(l => l.imp > 0).sort((a, b) => a.imp - b.imp)[0];
    const needs = M.needs.filter(n => n.total > 0).slice(0, 4).map(n => n.label.toLowerCase());
    return bullets([
      two.length === 2 ? `${hl('Rebalance the call list:')} ${esc(two[0].label)} and ${esc(two[1].label)} took ${pct(twoShare)} of conversations.${lowL ? ` Push ${esc(lowL.key)} and other under covered wards on Day ${X.day + 1}.` : ''}` : '',
      `${hl('Work the persuadables:')} ${fmt(M.cls.undecided)} undecided voters, mostly in ${und.map(w => esc(w.label)).join(' and ')}, are a priority call back list for senior agents.`,
      `${hl('Recycle the follow ups:')} ${fmt(M.cls.followup)} voters asked for a call back. Re queue them for the next morning.`,
      needs.length ? `${hl('Escalate the needs list')} to the campaign: ${needs.join(', ')} dominate.` : '',
      M.cls.volunteer ? `${hl(`Engage the ${fmt(M.cls.volunteer)} volunteers`)} within 48 hours; several can mobilise others in their communities.` : ''
    ]);
  };

  /* ---------- tables and lists ---------- */
  const H = {};
  H.grievances = (M, X, prefix) => {
    const gs = M.grievances.filter(g => g.total > 0).slice(0, 5);
    const gmax = Math.max(...gs.map(g => g.total), 1);
    const lg = X.lgaNames.map(l => `<span class="mlg"><i style="background:${X.colorOf(l)}"></i>${esc(l)}</span>`).join('');
    const grows = gs.map((g, i) => {
      const wards = Object.entries(g.wards).sort((a, b) => b[1] - a[1]);
      const shown = wards.slice(0, 3).map(([w, n]) => `<b style="color:${X.colorOf(g.wardLga[w])}">${esc(w)}</b> ${n}`).join(' · ') + (wards.length > 3 ? ` · +${wards.length - 3} more` : '');
      const comm = Object.entries(g.communities).sort((a, b) => b[1] - a[1]).slice(0, 6).map(c => esc(c[0])).join(', ');
      return `<tr><td class="gname">${esc(g.label)}</td><td class="gm">${CH.miniBar(g.total, gmax)} <b>${g.total}</b></td><td>${shown || '<span class="muted">None recorded</span>'}</td><td>${ed(prefix + 'comm' + i, comm || '<span class="muted">None named</span>', 'span')}</td></tr>`;
    }).join('');
    return gs.length ? `<table class="gtab"><tr><th>Grievance</th><th>Mentions</th><th>Wards (count)</th><th>Communities named</th></tr>${grows}</table><div class="mlgs">${lg}</div>` : `<p class="muted pad">No grievances were detected in today's feedback.</p>`;
  };
  /* Quotes as data so each style can lay them out its own way. */
  H.quotes = (M, X) => M.quotes.map(q => ({
    text: '“' + esc(q.fb.charAt(0).toUpperCase() + q.fb.slice(1).replace(/\s+$/, '')) + '”',
    meta: `${esc(q.ward)} · ${esc(q.lga)} · ${esc(X.impClasses.find(c => c.key === q.cls).label)}`,
    cls: q.cls, ward: q.ward, lga: q.lga
  }));
  H.league = (M, cls = '') => {
    const A = M.agents;
    const rows = A.map((a, i) => `<tr><td>${i + 1}</td><td class="an">${esc(a.name)}</td><td>${a.dials}</td><td>${pct(a.vsAvg)}</td><td class="imp">${a.imp}</td><td>${pct(a.reach)}</td><td>${a.c.positive}</td><td>${a.c.volunteer}</td><td>${a.c.undecided}</td><td>${a.c.negative}</td><td>${a.c.followup}</td><td>${pct(a.supportRate)}</td><td>${Math.round(a.avgCall)}s</td><td>${Math.round(a.talkMin)}</td><td>${pct(a.feedbackRate)}</td><td>${hhmm(a.first)} to ${hhmm(a.last)}</td><td>${Math.round(a.dialsPerHour)}</td></tr>`).join('');
    return `<table class="rank ${cls}${A.length > 22 ? ' dense' : ''}"><tr><th>#</th><th class="an">Agent</th><th>Dials</th><th>vs avg</th><th>Impressions</th><th>Reach %</th><th>Pos</th><th>Vol</th><th>Und</th><th>Neg</th><th>F up</th><th>Support %</th><th>Avg call</th><th>Talk min</th><th>Feedback %</th><th>Active</th><th>Dials/hr</th></tr>${rows}</table>`;
  };
  H.leagueNote = M => `Ranked by <b>impressions</b> (voters reached), highest first; ties broken by support rate. Non impressions are not counted in the ranking. vs avg compares each call partner's dials with today's team average of ${fmt(M.teamAvgDials)}. Feedback % is measured on conversations only.`;
  H.activity = (M, base, cls = '') => {
    const A = M.agents;
    const mx = Math.max(1, ...M.agentSlots.flat());
    const shade = v => { if (!v) return 'transparent'; const t = Math.min(v / mx, 1); return `color-mix(in srgb, ${base} ${Math.round(12 + 88 * t)}%, white)`; };
    const head = M.slots.map(s => `<th>${hhmm(s)}</th>`).join('');
    const body = A.map((a, i) => `<tr><td class="an">${esc(a.name)}</td>${M.agentSlots[i].map(v => `<td style="background:${shade(v)};color:${v / mx > .45 ? '#fff' : '#1C1340'}">${v || ''}</td>`).join('')}</tr>`).join('');
    return `<table class="heat ${cls}${A.length > 22 ? ' dense' : ''}">${body}<tr class="hx"><td></td>${head}</tr></table>`;
  };
  H.wardHeat = (M, X, base) => {
    const top = wardFacts(M).top;
    const cols = X.impClasses;
    const max = Math.max(...top.map(w => Math.max(...cols.map(c => share(w.c[c.key], w.imp)))), 0.01);
    const shade = v => `color-mix(in srgb, ${base} ${Math.round(6 + 90 * Math.min(v / max, 1))}%, white)`;
    const rows = top.map(w => `<tr><td class="an">${esc(w.label)} (${w.imp})</td>${cols.map(c => { const v = share(w.c[c.key], w.imp); return `<td style="background:${shade(v)};color:${v / max > .45 ? '#fff' : '#1C1340'}">${pct(v)}</td>`; }).join('')}</tr>`).join('');
    return `<table class="wheat"><tr><th></th>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>${rows}</table>`;
  };
  H.defs = X => X.impClasses.map(cl => `<div class="def"><i style="background:${cl.color}"></i><b>${cl.label}</b> · ${esc(cl.def)}</div>`).join('');

  window.CONTENT = {
    util: { esc, pct, fmt, naira, hl, bold, ed, hhmm, longDate, shortDate, share, plural, bullets, signed, hr },
    ctx, lgaFacts, wardFacts, hourFacts, agentFacts, glanceKpis, auditKpis, funnel, T, H
  };
})();
