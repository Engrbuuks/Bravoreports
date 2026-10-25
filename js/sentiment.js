/*
  SENTIMENT
  Reads every piece of call feedback and decides whether the voter spoke
  positively or negatively about the candidate. Runs entirely in the browser.

  How a feedback note is scored
    1. Phrases are matched first ("will vote", "nothing done", "e don do well").
    2. Remaining single words are matched against the word lists.
    3. "not", "never", "no", "n't" just before a word turns it around
       ("not happy" counts as negative, "not bad" as mildly positive).
    4. "very", "really", "so" make the next word count more.
    5. The total decides the label: above zero is Positive, below zero Negative.
       A note with no opinion words borrows its label from the call outcome the
       agent chose, and is marked as low confidence.
    6. Notes that only record call handling ("call back", "busy", "wrong
       number") carry no opinion and are counted separately.

  Every list below can be extended without touching the rest of the code.
*/
(function () {
  const R = window.RULES;

  /* ---------- lexicon ---------- */
  const PHRASES = [
    // pledges and support
    ['will vote for him', 3.5], ['will vote for her', 3.5], ['vote for him', 3], ['vote for her', 3], ['will vote', 3], ['going to vote', 3], ['voting for him', 3],
    ['support him', 3], ['support her', 3], ['supports him', 3], ['supports her', 3], ['supporting him', 3], ['behind him', 2.5], ['with him all the way', 3.5],
    ['already decided for', 2.5], ['our man', 2.5], ['our son', 2], ['100%', 2], ['100 percent', 2], ['no shaking', 2.5], ['second term', 1.5], ['return him', 2.5], ['re elect', 2], ['reelect', 2],
    ['vote and mobilise', 3.5], ['mobilise his family', 3], ['mobilise people', 3], ['bring his youth', 2.5], ['work as an agent', 2.5],
    // praise
    ['has done well', 3], ['done well', 3], ['doing well', 3], ['is doing well', 3], ['good job', 3], ['well done', 2.5], ['keep it up', 2.5], ['done a lot', 3], ['has done a lot', 3],
    ['has seen the', 2], ['seen the road', 2.5], ['seen the borehole', 2.5], ['delivered', 2], ['performing', 2], ['performed', 2], ['good representative', 3], ['good senator', 3],
    ['god bless him', 2.5], ['god bless', 2], ['thank him', 2.5], ['thank you', 1.5], ['thanks', 1.5], ['grateful', 2.5], ['appreciate', 2.5], ['appreciates', 2.5],
    ['paid school fees', 2.5], ['school fees for', 2], ['because of the scholarship', 2.5], ['because of the empowerment', 2.5], ['benefited from', 2], ['benefitted from', 2],
    // pidgin positive
    ['e don do well', 3], ['e dey try', 2.5], ['na our man', 3], ['we dey with am', 3], ['we go vote am', 3.5], ['i go vote', 3], ['we go vote', 3], ['e good', 2], ['correct man', 2.5],
    // opposition and refusal
    ['will not vote', -3.5], ["won't vote", -3.5], ['wont vote', -3.5], ['not voting for', -3.5], ['never vote', -3.5], ['not going to vote', -3.5], ['no vote', -2.5],
    ['another party', -2.5], ['other party', -2.5], ['labour party', -2.5], ['opposition', -2], ['against him', -3], ['against her', -3], ['does not support', -3], ["doesn't support", -3], ['not supporting', -3],
    // disappointment and grievance
    ['nothing done', -3], ['done nothing', -3], ['not done anything', -3], ['has not done', -2.5], ['no project', -2.5], ['nothing in', -1.5], ['nothing for', -2], ['not seen anything', -2.5], ["haven't seen", -2], ['have not seen', -2],
    ['never received', -2], ['not received', -2], ['did not reach', -2], ["didn't reach", -2], ['not reach', -2], ['never reach', -2.5], ['never benefit', -2.5], ['did not benefit', -2.5], ["didn't benefit", -2.5], ['not benefit', -2],
    ['only leaders', -2], ['ward leaders', -1.5], ['leaders and followers', -1.5], ['stops with', -2], ['shared among', -1.5],
    ['did not fulfil', -3], ['did not fulfill', -3], ['not fulfil', -2.5], ['not fulfill', -2.5], ['broken promise', -3], ['failed promise', -3], ['promised and', -1.5], ['empty promise', -3],
    ['not responsive', -2.5], ['does not pick', -2], ["doesn't pick", -2], ['never answer', -2], ['no response', -2], ['not reachable', -1], ['carry us along', -1.5], ['carried along', -1], ['left out', -2], ['feel left out', -2.5],
    ['very bad', -2.5], ['is bad', -1.5], ['has been bad', -2], ['bad road', -2], ['no light', -1.5], ['no water', -1.5], ['no job', -1.5], ['no jobs', -1.5],
    ['all the same', -2], ['politicians are', -1.5], ['only come during', -2.5], ['only remember us', -2.5], ['see them only', -2.5],
    // pidgin negative
    ['e no do anything', -3], ['e no do', -2.5], ['nothing dey', -2], ['we no see', -2], ['we never see', -2.5], ['dem no', -1.5], ['no dey pick', -2], ['wetin him do', -2],
    // hesitation
    ['not sure', -1], ['not decided', -1], ['yet to decide', -1], ['still deciding', -1], ['will think', -0.8], ['thinking about it', -0.8], ['depends on', -0.8], ['see what he', -0.6], ['hung up', -0.8], ['hanged up', -0.8], ['hang up', -0.8]
  ];
  const WORDS = {
    // positive
    yes: 1, sure: 1.2, definitely: 2, certainly: 2, absolutely: 2, committed: 2, loyal: 2, happy: 2, glad: 1.8, pleased: 1.8, impressed: 2.5, excellent: 3, great: 2, good: 1.5, nice: 1.2,
    love: 2.5, loves: 2.5, likes: 1.5, liked: 1.5, best: 2, trust: 2, trusts: 2, reliable: 2, honest: 2, caring: 2, kind: 1.5, helpful: 2, supportive: 2, proud: 2, satisfied: 2.5, wonderful: 2.5,
    thank: 2, thanks: 1.5, thankful: 2.5, grateful: 2.5, appreciate: 2.5, bless: 1.5, blessing: 1.5, pray: 1, praying: 1, volunteer: 2, mobilise: 2, mobilize: 2, mobilising: 2, mobilizing: 2,
    benefited: 1.5, benefitted: 1.5, progress: 1.5, development: 1, improved: 2, better: 1, fulfilled: 2, capable: 2, competent: 2, deserves: 1.5, endorse: 2.5, backing: 1.5,
    // negative
    no: 0, bad: -2, poor: -1.5, worse: -2.5, worst: -3, terrible: -3, useless: -3, waste: -2, wasted: -2, corrupt: -3, corruption: -2.5, thief: -3, thieves: -3, liar: -3, lied: -3, lies: -3,
    deceive: -3, deceived: -3, deceit: -3, cheat: -2.5, cheated: -2.5, disappointed: -3, disappointing: -3, disappointment: -3, unhappy: -3, sad: -2, angry: -3, annoyed: -2.5, frustrated: -2.5, tired: -1.5,
    abandoned: -3, abandon: -2.5, neglect: -2.5, neglected: -2.5, ignored: -2.5, ignore: -2, forgotten: -2, forgot: -1.5, sidelined: -2.5, marginalised: -2.5, marginalized: -2.5,
    suffering: -2.5, suffer: -2, hardship: -2, hungry: -1.5, hunger: -1.5, poverty: -1.5, insecurity: -1.5, unemployed: -1.5, complain: -2, complained: -2, complains: -2, complaint: -2, complaining: -2,
    failed: -2.5, failure: -2.5, fail: -2, against: -1.5, opposed: -2.5, opposition: -2, pdp: -2, adc: -2, apga: -2, hate: -3, never: -1, nothing: -1.2, hijack: -2.5, hijacked: -2.5, cornered: -2,
    stolen: -1.5, broken: -1.5, collapsed: -2, unfulfilled: -3, empty: -1, selfish: -3, arrogant: -3, unreachable: -1.5, absent: -2, invisible: -2, wahala: -1.5,
    // hesitation
    undecided: -1, indecisive: -1, unsure: -1, doubt: -1.5, doubtful: -1.5, maybe: -0.5, conditional: -0.8
  };
  const NEGATORS = new Set(['not', 'no', 'never', "n't", 'dont', "don't", 'didnt', "didn't", 'doesnt', "doesn't", 'isnt', "isn't", 'wasnt', "wasn't", 'cannot', "can't", 'cant', 'hardly', 'without', 'nor']);
  const BOOST = { very: 1.5, really: 1.4, so: 1.3, too: 1.3, extremely: 1.8, truly: 1.4, highly: 1.5, totally: 1.5, completely: 1.5, well: 1.1 };

  /* Notes that only describe call handling, not an opinion. */
  const PROCEDURAL = ['call back', 'callback', 'call later', 'busy', 'network', 'not audible', 'noise', 'noisy', 'driving', 'in a meeting', 'at work', 'switched off', 'not picking', 'did not pick', 'no answer', 'unanswered', 'not reachable', 'not connected',
    'wrong number', 'wrong no', 'not the person', 'not resident', 'relocated', 'not in town', 'travelled', 'traveled', 'no pvc', 'does not have pvc', "doesn't have pvc", 'cannot vote', "can't vote", 'not registered', 'deceased', 'language', 'hausa', 'yoruba', 'igbo', 'efik'];

  /* Call handling remarks that use opinion words but are not opinions ("network is bad"). */
  const NOISE = /\b(the\s+)?(network|signal|line|connection|reception|call|phone|audio|voice)\s+(is|was|were|dey)?\s*(very\s+|too\s+|so\s+)?(bad|poor|weak|terrible|not\s+good|not\s+clear)\b|\b(bad|poor|weak)\s+(network|signal|line|connection|reception)\b/g;

  /* A clear statement of where the voter stands outweighs side remarks:
     "will vote for him, but the road is bad" is a supporter with a concern. */
  const PLEDGE = new Set(['will vote for him', 'will vote for her', 'vote for him', 'vote for her', 'will vote', 'going to vote', 'voting for him', 'support him', 'support her', 'supports him', 'supports her', 'supporting him', 'behind him', 'with him all the way', 'already decided for', 'no shaking', 'return him', 'vote and mobilise', 'mobilise his family', 'na our man', 'we dey with am', 'we go vote am', 'i go vote', 'we go vote']);
  const OPPOSE = new Set(['will not vote', "won't vote", 'wont vote', 'not voting for', 'never vote', 'not going to vote', 'another party', 'other party', 'labour party', 'against him', 'against her', 'does not support', "doesn't support", 'not supporting', 'pdp', 'adc', 'apga', 'opposed']);

  /* ---------- themes ---------- */
  /* Most specific themes first; a plain pledge of support is the fallback. */
  const POS_THEMES = [
    { key: 'mobilise', label: 'Ready to mobilise others', kw: ['mobilis', 'mobiliz', 'volunteer', 'agent', 'youth group', 'women leader', 'bring his', 'bring her', 'his family', 'her family', 'my family', 'our community', 'canvass'] },
    { key: 'delivery', label: 'Praise for projects and performance', kw: ['done well', 'doing well', 'good job', 'well done', 'keep it up', 'done a lot', 'delivered', 'performing', 'performed', 'has seen', 'seen the', 'saw the', 'built', 'constructed', 'fixed the', 'projects he', 'project he', 'good representative', 'good senator', 'impressed', 'excellent', 'e don do well', 'e dey try'] },
    { key: 'benefit', label: 'Grateful for scholarships and empowerment', kw: ['scholarship', 'school fees', 'empowerment', 'benefit', 'grant', 'palliative', 'bursary', 'support for my', 'helped', 'paid'] },
    { key: 'goodwill', label: 'Gratitude, prayers and goodwill', kw: ['thank', 'grateful', 'appreciate', 'god bless', 'bless', 'pray', 'love', 'happy', 'proud', 'glad'] },
    { key: 'pledge', label: 'Pledged their vote and support', kw: ['will vote', 'vote for', 'voting for', 'support him', 'support her', 'supports him', 'supports her', 'supporting', 'our man', 'decided for', 'committed', 'loyal', '100%', 'no shaking', 'i go vote', 'we go vote', 'behind him', 'return him', 're elect', 'reelect', 'second term', 'definitely', 'sure', 'yes'] }
  ];
  const NEG_THEMES = [
    { key: 'oppose', label: 'Opposed or loyal to another party', kw: ['will not vote', "won't vote", 'wont vote', 'not voting', 'never vote', 'another party', 'other party', 'pdp', 'labour party', ' lp ', 'adc', 'apga', 'against him', 'against her', 'does not support', "doesn't support", 'not supporting', 'opposed', 'opposition'] },
    ...R.grievances.map((g, i) => ({ key: 'g' + i, label: g.label, kw: g.kw })),
    { key: 'distrust', label: 'Distrust of politicians', kw: ['lied', 'lies', 'liar', 'deceive', 'deceived', 'all the same', 'politicians', 'only come during', 'only remember', 'see them only', 'corrupt', 'thief', 'thieves', 'cheat'] },
    { key: 'hesitant', label: 'Hesitant or undecided', kw: ['not sure', 'not decided', 'yet to decide', 'still deciding', 'will think', 'thinking about', 'depends', 'see what', 'undecided', 'indecisive', 'hung up', 'hanged up', 'hang up', 'maybe', 'conditional', 'manifesto'] },
    { key: 'needs', label: 'Unmet needs and hardship', kw: ['bad', 'no light', 'no water', 'no job', 'hardship', 'suffering', 'hungry', 'poverty', 'insecurity', 'unemploy', 'erosion', 'flood', 'collapsed', 'broken', 'needs', 'need help', 'asks for', 'help with'] }
  ];
  const OTHER_POS = { key: 'otherpos', label: 'Other positive remarks' };
  const OTHER_NEG = { key: 'otherneg', label: 'Other negative remarks' };

  /* ---------- helpers ---------- */
  const STOPWORDS = new Set('a an the and or but if of to in on at for from by with about as is are was were be been being am i you he she it we they me him her us them my your his our their this that these those there here what which who whom when where why how all any both each few more most other some such only own same than too very can will just should now said says say told tell also into over under again then once out up down off so not no nor dont do does did doing have has had having would could may might must shall get got make made go going gone come came yes like one two three day calls call voter voters person people asks ask asked wants want needs need senator ekpenyong shagaya hon sen distinguished'.split(' '));
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phraseRe = PHRASES.map(([p, w]) => ({ p, w, re: new RegExp('(^|[^a-z0-9%])' + esc(p) + '(?=$|[^a-z0-9])', 'g') }));
  const has = (t, list) => list.some(k => t.includes(k));

  function tidy(s) {
    let t = String(s || '').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/([,.;:!?])(?=[A-Za-z])/g, '$1 ').trim();
    t = t.replace(/\bpls\b/gi, 'please').replace(/\bu\b/gi, 'you').replace(/\bd\b/gi, 'the').replace(/\bgov\b/gi, 'government').replace(/\bi\b/g, 'I');
    t = t.replace(/^[-–—•*\s]+/, '').replace(/\s*[;,:]\s*([;,:.])/g, '$1').replace(/([.!?])\s*[.;,]+/g, '$1');
    t = t.replace(/[\s,;:]+$/, '');
    if (!t) return '';
    t = t.charAt(0).toUpperCase() + t.slice(1);
    t = t.replace(/([.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
    if (!/[.!?]$/.test(t)) t += '.';
    return t;
  }
  const keyOf = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  /* Score one note. Returns { score, pos, neg, hits:[{term, w}] } */
  function score(text) {
    let t = ' ' + String(text || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').replace(NOISE, ' ') + ' ';
    const hits = [];
    let total = 0, pos = 0, neg = 0;
    // phrases first, longest first, masked so their words are not counted again
    const sorted = [...phraseRe].sort((a, b) => b.p.length - a.p.length);
    for (const ph of sorted) {
      ph.re.lastIndex = 0;
      let m;
      while ((m = ph.re.exec(t))) {
        const start = m.index + m[1].length;
        const before = t.slice(Math.max(0, start - 22), start);
        let w = ph.w;
        if (/\b(not|never|no|n't|dont|didnt|doesnt|isnt|wasnt)\s+((a|an|the|really|very|so)\s+)?$/.test(before) && w > 0) w = -w * 0.8;
        total += w; if (w > 0) pos += w; else neg += w;
        hits.push({ term: ph.p, w });
        t = t.slice(0, start) + ' '.repeat(ph.p.length) + t.slice(start + ph.p.length);
        ph.re.lastIndex = start + ph.p.length;
      }
    }
    const toks = t.split(/[^a-z0-9']+/).filter(Boolean);
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      let w = WORDS[tk];
      if (w === undefined || w === 0) continue;
      let k = 1;
      const prev = toks.slice(Math.max(0, i - 3), i);
      if (prev.length && BOOST[prev[prev.length - 1]]) k *= BOOST[prev[prev.length - 1]];
      if (prev.some(p => NEGATORS.has(p) || p.endsWith("n't"))) w = -w * (w > 0 ? 0.8 : 0.5);
      w *= k;
      total += w; if (w > 0) pos += w; else neg += w;
      hits.push({ term: tk, w });
    }
    return { score: total, pos, neg, hits };
  }

  function themeOf(text, list) {
    const t = ' ' + text.toLowerCase() + ' ';
    return list.filter(th => has(t, th.kw)).map(th => th.key);
  }

  /* ---------- main analysis ---------- */
  window.analyseSentiment = function (M) {
    const items = [];
    let procedural = 0, empty = 0;
    for (const r of M.recs) {
      const raw = (r.fb || '').trim();
      if (!raw || R.emptyFeedback.includes(raw.toLowerCase().replace(/[.!]+$/, ''))) { if (r.imp) empty++; continue; }
      const s = score(raw);
      const low = ' ' + raw.toLowerCase() + ' ';
      if (Math.abs(s.score) < 0.01 && has(low, PROCEDURAL)) { procedural++; continue; }
      let label, basis = 'words';
      const opposes = s.hits.some(h => (OPPOSE.has(h.term) && h.w < 0) || (PLEDGE.has(h.term) && h.w < 0));
      const pledges = s.hits.some(h => PLEDGE.has(h.term) && h.w > 0);
      if (opposes) { label = 'negative'; basis = 'stance'; }
      else if (pledges) { label = 'positive'; basis = 'stance'; }
      else if (s.score > 0.01) label = 'positive';
      else if (s.score < -0.01) label = 'negative';
      else {
        basis = 'outcome';
        if (r.cls === 'positive' || r.cls === 'volunteer') label = 'positive';
        else if (r.cls === 'negative' || r.cls === 'undecided') label = 'negative';
        else { procedural++; continue; }
      }
      const words = raw.split(/\s+/).length;
      const strength = Math.abs(s.score);
      const confidence = basis === 'outcome' ? 'Low' : basis === 'stance' ? 'High' : strength >= 2.5 ? 'High' : strength >= 1 ? 'Medium' : 'Low';
      let norm = Math.max(-1, Math.min(1, s.score / Math.max(3, Math.sqrt(words) * 1.6)));
      if (basis === 'stance' && Math.sign(norm) !== (label === 'positive' ? 1 : -1)) norm = label === 'positive' ? 0.1 : -0.1;
      const mixed = s.pos > 0.9 && s.neg < -0.9;
      const posT = themeOf(raw, POS_THEMES), negT = themeOf(raw, NEG_THEMES);
      const theme = label === 'positive' ? (posT[0] || OTHER_POS.key) : (negT[0] || OTHER_NEG.key);
      items.push({ rec: r, raw, text: tidy(raw), key: keyOf(raw), label, basis, score: s.score, norm, confidence, mixed, hits: s.hits, theme, posT, negT,
        lga: r.lga, ward: r.ward, wardLabel: r.ward, cls: r.cls, hour: r.when ? r.when.getHours() : null, agent: r.agent });
    }
    // ward labels match the rest of the report (ward name with LGA when ambiguous)
    const wl = {}; M.wardList.forEach(w => { wl[w.lga + '|' + w.ward] = w.label; });
    items.forEach(i => { i.wardLabel = wl[i.lga + '|' + i.ward] || i.ward; });

    const S = { items, procedural, empty, total: items.length };
    S.pos = items.filter(i => i.label === 'positive');
    S.neg = items.filter(i => i.label === 'negative');
    S.posRate = S.total ? S.pos.length / S.total : 0;
    S.negRate = S.total ? S.neg.length / S.total : 0;
    S.net = Math.round((S.posRate - S.negRate) * 100);
    S.avg = S.total ? items.reduce((a, i) => a + i.norm, 0) / S.total : 0;
    S.index = Math.round((S.avg + 1) * 50); // 0 to 100
    S.mixed = items.filter(i => i.mixed);
    S.lowConf = items.filter(i => i.confidence === 'Low').length;
    S.highConf = items.filter(i => i.confidence === 'High').length;
    S.feedbackOnConversations = M.impressions ? (M.recs.filter(r => r.imp && r.hasFb).length / M.impressions) : 0;

    // distribution in five bands
    const bands = [['Strongly negative', -1, -0.5], ['Negative', -0.5, -0.05], ['Neutral leaning', -0.05, 0.05], ['Positive', 0.05, 0.5], ['Strongly positive', 0.5, 1.01]];
    S.bands = bands.map(([label, a, b]) => ({ label, n: items.filter(i => i.norm >= a && i.norm < b).length }));

    // groupings
    const groupBy = (fn, list = items) => {
      const g = new Map();
      list.forEach(i => { const k = fn(i); if (k == null || k === '') return; if (!g.has(k)) g.set(k, { key: k, n: 0, pos: 0, neg: 0, list: [] }); const o = g.get(k); o.n++; o[i.label === 'positive' ? 'pos' : 'neg']++; o.list.push(i); });
      return [...g.values()].map(o => ({ ...o, posRate: o.n ? o.pos / o.n : 0, net: o.n ? Math.round((o.pos - o.neg) / o.n * 100) : 0 }));
    };
    S.byLga = groupBy(i => i.lga).sort((a, b) => b.n - a.n);
    S.byWard = groupBy(i => i.wardLabel).map(w => ({ ...w, lga: w.list[0].lga })).sort((a, b) => b.n - a.n);
    S.byHour = groupBy(i => i.hour).sort((a, b) => a.key - b.key);
    S.byOutcome = groupBy(i => i.cls);
    S.byAgent = groupBy(i => i.agent).sort((a, b) => b.n - a.n);

    // coding agreement: positive outcomes with positive words, negative outcomes with negative words
    const judged = items.filter(i => i.basis !== 'outcome' && ['positive', 'volunteer', 'negative'].includes(i.cls));
    const agree = judged.filter(i => (i.cls === 'negative') === (i.label === 'negative'));
    S.agreement = judged.length ? agree.length / judged.length : 0;
    S.posCodedNeg = items.filter(i => i.basis !== 'outcome' && (i.cls === 'positive' || i.cls === 'volunteer') && i.label === 'negative');
    S.negCodedPos = items.filter(i => i.basis !== 'outcome' && i.cls === 'negative' && i.label === 'positive');

    // themes with readable, de duplicated statements
    function themes(list, defs, other) {
      const all = [...defs, other];
      return all.map(th => {
        const members = list.filter(i => i.theme === th.key);
        const also = list.filter(i => i.theme !== th.key && (i.label === 'positive' ? i.posT : i.negT).includes(th.key)).length;
        const uniq = new Map();
        members.forEach(i => { if (!uniq.has(i.key)) uniq.set(i.key, { text: i.text, n: 0, wards: {}, lgas: {}, conf: i.confidence, strength: Math.abs(i.score), item: i }); const u = uniq.get(i.key); u.n++; u.wards[i.wardLabel] = (u.wards[i.wardLabel] || 0) + 1; u.lgas[i.lga] = (u.lgas[i.lga] || 0) + 1; });
        const exact = [...uniq.values()].sort((a, b) => b.n - a.n || b.strength - a.strength || Math.abs(a.text.length - 120) - Math.abs(b.text.length - 120));
        /* Comments that say the same thing in nearly the same words (often only the
           community name differs) are shown once, with everyone who said it counted. */
        const words = u => new Set(keyOf(u.text).split(' ').filter(w => w.length > 2));
        const statements = [];
        exact.forEach(u => {
          const wu = words(u);
          const twin = statements.length < 400 && statements.find(k => { let inter = 0; wu.forEach(w => { if (k.w.has(w)) inter++; }); return inter / (wu.size + k.w.size - inter || 1) >= 0.72; });
          if (twin) { twin.n += u.n; twin.similar = (twin.similar || 0) + 1; Object.entries(u.wards).forEach(([w, c]) => { twin.wards[w] = (twin.wards[w] || 0) + c; }); }
          else statements.push({ ...u, wards: { ...u.wards }, w: wu });
        });
        statements.sort((a, b) => b.n - a.n || b.strength - a.strength);
        const wards = {}; members.forEach(i => { wards[i.wardLabel] = (wards[i.wardLabel] || 0) + 1; });
        const lgas = {}; members.forEach(i => { lgas[i.lga] = (lgas[i.lga] || 0) + 1; });
        return { ...th, n: members.length, also, share: list.length ? members.length / list.length : 0, statements, exact, unique: exact.length,
          topWards: Object.entries(wards).sort((a, b) => b[1] - a[1]).slice(0, 3), topLgas: Object.entries(lgas).sort((a, b) => b[1] - a[1]).slice(0, 3) };
      }).filter(t => t.n > 0).sort((a, b) => (a.key.startsWith('other') - b.key.startsWith('other')) || b.n - a.n);
    }
    S.posThemes = themes(S.pos, POS_THEMES, OTHER_POS);
    S.negThemes = themes(S.neg, NEG_THEMES, OTHER_NEG);

    // the words that drive each side
    const wordCount = (list, sign) => {
      const c = {};
      list.forEach(i => { const seen = new Set(); i.hits.forEach(h => { if ((sign > 0 ? h.w > 0 : h.w < 0) && !seen.has(h.term)) { seen.add(h.term); c[h.term] = (c[h.term] || 0) + 1; } }); });
      return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([term, n]) => ({ term, n }));
    };
    S.posWords = wordCount(S.pos, 1);
    S.negWords = wordCount(S.neg, -1);
    // topics voters raise (the needs list in rules.js), with how warm the notes about each are
    const topics = [...R.needs.map(n => ({ term: n.label, kw: n.kw })), { term: 'Party politics', kw: ['party', 'pdp', 'apc', 'adc', 'apga', 'labour', 'politician', 'election'] }];
    S.subjects = topics.map(tp => { const list = items.filter(i => has(' ' + i.raw.toLowerCase() + ' ', tp.kw)); return { term: tp.term, n: list.length, pos: list.filter(i => i.label === 'positive').length }; })
      .filter(s => s.n > 0).sort((a, b) => b.n - a.n).map(s => ({ ...s, posRate: s.pos / s.n }));
    return S;
  };
  window.SENTIMENT_LEXICON = { PHRASES, WORDS, POS_THEMES, NEG_THEMES, score, tidy };
})();
