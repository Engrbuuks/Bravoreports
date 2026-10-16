/* Turns the raw export into every number the two reports need. */
(function () {
  const R = window.RULES;
  const IMP = R.impressionClasses.map(c => c.key);
  const NON = R.nonImpressionClasses.map(c => c.key);

  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const titleCase = s => clean(s).toLowerCase().replace(/(^|[\s\/(\-&])([a-z])/g, (m, a, b) => a + b.toUpperCase());

  function kwRegex(kw) {
    const esc = kw.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const short = kw.trim().length <= 4;
    return new RegExp('(^|[^a-z])' + esc + (short ? '($|[^a-z])' : ''), 'i');
  }
  const compiled = new Map();
  function hasAny(text, list) {
    for (const kw of list) {
      let re = compiled.get(kw);
      if (!re) { re = kwRegex(kw); compiled.set(kw, re); }
      if (re.test(text)) return true;
    }
    return false;
  }

  function parseDuration(s) {
    const t = clean(s);
    if (!t) return 0;
    const p = t.split(':').map(Number);
    if (p.some(isNaN)) return 0;
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
    return p[0];
  }

  const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  function parseDate(s) {
    const t = clean(s);
    let m = t.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3})[A-Za-z]*[-\/ ](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?/i);
    if (m) {
      let h = +m[4]; const ap = (m[7] || '').toUpperCase();
      if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
      return new Date(+m[3], MONTHS[m[2].toUpperCase()], +m[1], h, +m[5], +(m[6] || 0));
    }
    m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?/i);
    if (m) {
      let h = +m[4]; const ap = (m[7] || '').toUpperCase();
      if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
      return new Date(+m[3], +m[2] - 1, +m[1], h, +m[5], +(m[6] || 0));
    }
    const d = new Date(t);
    return isNaN(d) ? null : d;
  }

  function mapStatus(raw, overrides) {
    const k = norm(raw);
    if (overrides && overrides[k]) return overrides[k];
    if (R.statusMap[k]) return R.statusMap[k];
    for (const key of Object.keys(R.statusMap)) if (k.includes(key) && key.length > 4) return R.statusMap[key];
    return null;
  }

  function reclassify(cls, fb) {
    const t = ' ' + fb.toLowerCase() + ' ';
    if (!fb.trim()) return cls;
    if (cls === 'followup') {
      if (hasAny(t, R.reclassify.inapplicable)) return 'inapplicable';
      if (hasAny(t, R.reclassify.negative)) return 'negative';
      if (hasAny(t, R.reclassify.followup)) return 'followup';
      if (hasAny(t, R.reclassify.undecided)) return 'undecided';
      if (hasAny(t, R.reclassify.positive)) return 'positive';
      return cls;
    }
    if (cls === 'negative') {
      if (hasAny(t, R.reclassify.inapplicable)) return 'inapplicable';
      if (hasAny(t, R.reclassify.negative)) return 'negative';
      if (hasAny(t, ['will vote', 'he will vote', 'she will vote', 'i will vote'])) return 'positive';
      return cls;
    }
    return cls;
  }

  function matchLga(raw, profile) {
    const n = norm(raw);
    if (!n) return '';
    for (const l of profile.lgas) {
      const ln = norm(l.name);
      if (n === ln || n.startsWith(ln) || ln.startsWith(n)) return l.name;
    }
    for (const l of profile.lgas) {
      const ln = norm(l.name);
      if (n.includes(ln) || ln.includes(n)) return l.name;
    }
    return titleCase(raw);
  }

  function median(a) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function quantile(a, q) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const p = (s.length - 1) * q; const lo = Math.floor(p), hi = Math.ceil(p); return s[lo] + (s[hi] - s[lo]) * (p - lo); }
  const sum = a => a.reduce((x, y) => x + y, 0);
  const zero = keys => Object.fromEntries(keys.map(k => [k, 0]));

  function needsOf(fb) {
    const t = ' ' + fb.toLowerCase() + ' ';
    return R.needs.filter(n => hasAny(t, n.kw)).map(n => n.label);
  }
  function grievancesOf(fb) {
    const t = ' ' + fb.toLowerCase() + ' ';
    return R.grievances.filter(g => hasAny(t, g.kw)).map(g => g.label);
  }
  const STOP = new Set(['the', 'a', 'an', 'his', 'her', 'their', 'our', 'my', 'this', 'that', 'there', 'here', 'home', 'town', 'area', 'community', 'village', 'school', 'church', 'market', 'house', 'compound', 'street', 'road', 'ward', 'time', 'all', 'it', 'him', 'them', 'us', 'order', 'future', 'place', 'general', 'front', 'need', 'last', 'next', 'least', 'case', 'fact']);
  const BREAK = new Set(['and', 'or', 'but', 'did', 'does', 'do', 'not', 'is', 'was', 'are', 'were', 'has', 'have', 'had', 'to', 'for', 'so', 'he', 'she', 'they', 'we', 'it', 'because', 'since', 'with', 'who', 'which', 'when', 'if', 'then', 'that', 'will', 'would', 'should', 'can', 'could', 'be', 'been', 'needs', 'need', 'of', 'on', 'by', 'as', 'also', 'still', 'too', 'very', 'please', 'again', 'yet', 'now', 'there', 'months', 'years', 'since', 'last']);
  function communitiesIn(fb) {
    const out = [];
    const re = /\b(?:at|in|from|around|near)\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/g;
    let m;
    while ((m = re.exec(fb))) {
      const all = m[1].split(/\s+/);
      const cut = all.findIndex(w => BREAK.has(w.toLowerCase()));
      const words = (cut >= 0 ? all.slice(0, cut) : all).filter(w => !STOP.has(w.toLowerCase()));
      if (!words.length) continue;
      const name = words.slice(0, 3).join(' ');
      if (name.length < 3) continue;
      if (/^(the|a|an)$/i.test(name)) continue;
      out.push(titleCase(name));
    }
    return out;
  }

  function isQuotable(fb) {
    const t = clean(fb).toLowerCase().replace(/[.!]+$/, '');
    if (R.emptyFeedback.includes(t)) return false;
    return t.split(' ').length >= 6;
  }

  window.buildMetrics = function (rows, profile, opts) {
    const overrides = opts.statusOverrides || {};
    const recl = opts.reclassify !== false;
    const unknownStatuses = {};
    const recs = [];
    const reclassCounts = {};

    for (const r of rows) {
      const statusRaw = clean(r.Status);
      let cls = mapStatus(statusRaw, overrides);
      if (!cls) { unknownStatuses[statusRaw || '(blank)'] = (unknownStatuses[statusRaw || '(blank)'] || 0) + 1; continue; }
      const fb = clean(r.Feedback);
      const orig = cls;
      if (recl) cls = reclassify(cls, fb);
      if (cls !== orig) { const k = orig + '>' + cls; reclassCounts[k] = (reclassCounts[k] || 0) + 1; }
      const puRaw = clean(r.PU);
      const bar = puRaw.lastIndexOf('|');
      const when = parseDate(r.Date);
      recs.push({
        contact: clean(r.Contact), phone: clean(r.Phone).replace(/\D/g, ''),
        lga: matchLga(r.Location, profile), ward: titleCase(r.Ward), pu: bar >= 0 ? clean(puRaw.slice(0, bar)) : puRaw,
        puCode: bar >= 0 ? clean(puRaw.slice(bar + 1)) : '',
        agent: titleCase(r.Agent), agentEmail: clean(r['Agent Email']).toLowerCase(),
        statusRaw, orig, cls, imp: IMP.includes(cls), fb, hasFb: fb.length > 0 && !['nil', 'none', '-'].includes(fb.toLowerCase()),
        dur: parseDuration(r.Duration), when
      });
    }

    if (opts.telco && opts.telco.size) {
      recs.forEach(x => { const t = opts.telco.get(x.phone.slice(-10)); if (t) { x.gender = t.gender; x.tier = t.tier; } });
    }
    const M = { profile, recs, unknownStatuses, reclassCounts, opts };
    const dials = recs.length;
    M.dials = dials;
    M.cls = zero([...IMP, ...NON]);
    recs.forEach(x => M.cls[x.cls]++);
    M.impressions = sum(IMP.map(k => M.cls[k]));
    M.nonImpressions = dials - M.impressions;
    M.supportive = M.cls.positive + M.cls.volunteer;
    M.qualified = M.supportive + M.cls.undecided + M.cls.negative;
    M.decided = M.qualified;
    M.supportAmongDecided = M.decided ? M.supportive / M.decided : 0;
    M.netSupport = M.decided ? Math.round((M.supportive - M.cls.negative) / M.decided * 100) : 0;
    M.reachRate = dials ? M.impressions / dials : 0;
    M.supportRate = M.impressions ? M.supportive / M.impressions : 0;
    M.negativeRate = M.impressions ? M.cls.negative / M.impressions : 0;
    M.undecidedRate = M.impressions ? M.cls.undecided / M.impressions : 0;

    const talkSec = sum(recs.map(x => x.dur));
    M.talkMinutes = talkSec / 60;
    const connected = recs.filter(x => x.dur > 0);
    M.avgCall = connected.length ? talkSec / connected.length : 0;
    M.rate = +opts.airtimeRate || profile.airtimeRatePerMinute;
    M.airtime = M.talkMinutes * M.rate;
    /* Average airtime per dial counts only dials that produced an impression. */
    M.costPerDial = M.impressions ? M.airtime / M.impressions : 0;
    M.costPerReached = M.impressions ? M.airtime / M.impressions : 0;
    M.costPerSupportive = M.supportive ? M.airtime / M.supportive : 0;
    M.costPerMinute = M.talkMinutes ? M.airtime / M.talkMinutes : 0;

    // dates
    const dated = recs.filter(x => x.when);
    const dayCount = {};
    dated.forEach(x => { const k = x.when.toDateString(); dayCount[k] = (dayCount[k] || 0) + 1; });
    const days = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);
    M.callDate = days.length ? new Date(days[0][0]) : null;
    M.otherDays = days.slice(1).map(d => ({ date: new Date(d[0]), n: d[1] }));
    const times = dated.map(x => x.when.getTime());
    M.firstCall = times.length ? new Date(Math.min(...times)) : null;
    M.lastCall = times.length ? new Date(Math.max(...times)) : null;

    // hourly
    const hours = {};
    dated.forEach(x => { const h = x.when.getHours(); (hours[h] = hours[h] || []).push(x); });
    const hk = Object.keys(hours).map(Number).sort((a, b) => a - b);
    M.hourly = [];
    if (hk.length) for (let h = hk[0]; h <= hk[hk.length - 1]; h++) {
      const list = hours[h] || [];
      const c = zero([...IMP, ...NON]); list.forEach(x => c[x.cls]++);
      const imp = sum(IMP.map(k => c[k]));
      M.hourly.push({ hour: h, dials: list.length, c, imp, nonImp: list.length - imp, reach: list.length ? imp / list.length : null, support: imp ? (c.positive + c.volunteer) / imp : null });
    }
    M.peak = M.hourly.reduce((a, b) => (b.dials > (a ? a.dials : -1) ? b : a), null);

    // durations by class (connected impressions)
    M.durByClass = {};
    IMP.forEach(k => { const d = recs.filter(x => x.cls === k && x.dur > 0).map(x => x.dur); M.durByClass[k] = { n: d.length, min: d.length ? Math.min(...d) : 0, q1: quantile(d, .25), med: median(d), q3: quantile(d, .75), max: d.length ? quantile(d, .95) : 0 }; });
    M.shortPositives = recs.filter(x => x.cls === 'positive' && x.dur > 0 && x.dur < R.shortPositiveSeconds).length;

    // groupings
    function group(keyFn) {
      const g = new Map();
      for (const x of recs) {
        const k = keyFn(x); if (!k) continue;
        if (!g.has(k)) g.set(k, { key: k, list: [] });
        g.get(k).list.push(x);
      }
      for (const v of g.values()) {
        const c = zero([...IMP, ...NON]); v.list.forEach(x => c[x.cls]++);
        v.c = c; v.dials = v.list.length; v.imp = sum(IMP.map(k => c[k]));
        v.sup = c.positive + c.volunteer; v.reach = v.dials ? v.imp / v.dials : 0;
        v.supportRate = v.imp ? v.sup / v.imp : 0; v.negRate = v.imp ? c.negative / v.imp : 0;
        v.persuadable = c.undecided + c.followup;
        v.lga = v.list[0].lga;
      }
      return [...g.values()];
    }
    M.hasTelco = recs.some(x => x.gender || x.tier);
    if (M.hasTelco) {
      M.genderList = group(x => x.imp && x.gender ? x.gender : '').sort((a, b) => a.key.localeCompare(b.key));
      M.tierList = group(x => x.tier ? 'Tier ' + String(x.tier).replace(/\D/g, '') : '').filter(t => t.key !== 'Tier ').sort((a, b) => a.key.localeCompare(b.key));
      M.genderReached = group(x => x.gender ? x.gender : '');
    }
    M.lgaList = group(x => x.lga).sort((a, b) => b.imp - a.imp);
    M.wardList = group(x => x.ward ? x.ward + '||' + x.lga : '').map(w => { w.ward = w.key.split('||')[0]; return w; });
    // disambiguate ward names repeated across LGAs
    const wn = {}; M.wardList.forEach(w => { wn[w.ward] = (wn[w.ward] || 0) + 1; });
    M.wardList.forEach(w => { w.label = wn[w.ward] > 1 ? `${w.ward} (${w.lga})` : w.ward; });

    // agents
    const agents = group(x => x.agent);
    const lastAll = M.lastCall ? M.lastCall.getTime() : 0;
    agents.forEach(a => {
      const ts = a.list.filter(x => x.when).map(x => x.when.getTime());
      a.first = ts.length ? new Date(Math.min(...ts)) : null;
      a.last = ts.length ? new Date(Math.max(...ts)) : null;
      const hrs = a.first ? Math.max((a.last - a.first) / 3600000, 0.25) : 1;
      a.dialsPerHour = a.dials / hrs;
      a.talkMin = sum(a.list.map(x => x.dur)) / 60;
      const conn = a.list.filter(x => x.dur > 0);
      a.avgCall = conn.length ? sum(conn.map(x => x.dur)) / conn.length : 0;
      const conv = a.list.filter(x => x.imp);
      a.feedbackRate = conv.length ? conv.filter(x => x.hasFb).length / conv.length : 0;
      a.earlyFinish = a.last && lastAll && (lastAll - a.last.getTime()) / 60000 >= R.earlyFinishMinutes;
      a.name = a.key;
      const p = a.key.split(' ');
      a.short = p.length > 1 ? `${p[0]} ${p[1][0]}.` : a.key;
    });
    agents.sort((a, b) => b.imp - a.imp || b.supportRate - a.supportRate);
    M.agents = agents;
    /* Everything agents are compared against comes from the file itself: the team average for the day. */
    M.teamAvgDials = agents.length ? dials / agents.length : 0;
    agents.forEach(a => { a.vsAvg = M.teamAvgDials ? a.dials / M.teamAvgDials : 0; });

    // 30 minute heatmap
    if (M.firstCall) {
      const start = new Date(M.firstCall); start.setMinutes(start.getMinutes() < 30 ? 0 : 30, 0, 0);
      const slots = []; for (let t = start.getTime(); t <= M.lastCall.getTime(); t += 1800000) slots.push(t);
      M.slots = slots.map(t => new Date(t));
      M.agentSlots = agents.map(a => { const arr = slots.map(() => 0); a.list.forEach(x => { if (!x.when) return; const i = Math.floor((x.when.getTime() - start.getTime()) / 1800000); if (i >= 0 && i < arr.length) arr[i]++; }); return arr; });
    } else { M.slots = []; M.agentSlots = []; }

    // feedback analysis
    const conv = recs.filter(x => x.imp && x.hasFb);
    M.needs = R.needs.map(n => ({ label: n.label, total: 0, byLga: {} }));
    M.grievances = R.grievances.map(g => ({ label: g.label, total: 0, wards: {}, wardLga: {}, communities: {} }));
    let needVoters = 0;
    conv.forEach(x => {
      const ns = needsOf(x.fb);
      if (ns.length) needVoters++;
      ns.forEach(l => { const n = M.needs.find(z => z.label === l); n.total++; n.byLga[x.lga] = (n.byLga[x.lga] || 0) + 1; });
      const gs = grievancesOf(x.fb);
      gs.forEach(l => {
        const g = M.grievances.find(z => z.label === l); g.total++;
        if (x.ward) { g.wards[x.ward] = (g.wards[x.ward] || 0) + 1; g.wardLga[x.ward] = x.lga; }
        communitiesIn(x.fb).forEach(c => { g.communities[c] = (g.communities[c] || 0) + 1; });
      });
    });
    M.needVoters = needVoters;
    M.needs.sort((a, b) => b.total - a.total);
    M.grievances.sort((a, b) => b.total - a.total);
    M.cashAsks = (M.needs.find(n => n.label === R.cashNeedLabel) || { total: 0 }).total;
    M.positivesNoFeedback = recs.filter(x => x.cls === 'positive' && !x.hasFb).length;

    // quotes: mix of positive and undecided, longest informative first, varied wards
    const pool = recs.filter(x => x.imp && x.hasFb && isQuotable(x.fb) && ['positive', 'volunteer', 'undecided', 'negative'].includes(x.cls));
    pool.sort((a, b) => (needsOf(b.fb).length + grievancesOf(b.fb).length) - (needsOf(a.fb).length + grievancesOf(a.fb).length) || b.fb.length - a.fb.length);
    const picked = []; const usedWard = {}; const seen = new Set();
    const grams = t => { const w = t.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean); const g = []; for (let i = 0; i + 4 <= w.length; i++) g.push(w.slice(i, i + 4).join(' ')); return g; };
    const fresh = x => !grams(x.fb).some(g => seen.has(g));
    const want = ['positive', 'positive', 'undecided', 'undecided', 'positive'];
    for (const w of want) {
      const q = pool.find(x => x.cls === w && !picked.includes(x) && fresh(x) && (usedWard[x.ward] || 0) < 2) || pool.find(x => !picked.includes(x) && fresh(x)) || pool.find(x => !picked.includes(x));
      if (q) grams(q.fb).forEach(g => seen.add(g));
      if (q) { picked.push(q); usedWard[q.ward] = (usedWard[q.ward] || 0) + 1; }
    }
    M.quotes = picked;
    M.quotePool = pool;
    return M;
  };

  window.METRIC_UTILS = { norm, clean, titleCase, median };
})();
