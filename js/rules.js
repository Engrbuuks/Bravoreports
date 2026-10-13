/*
  RULES
  Everything the generator "knows" about the application's statuses and about
  reading the Feedback column lives here, so it can be tuned without touching
  the rest of the code. Keywords are matched in lower case, anywhere in the text.
*/
window.RULES = {
  /* The 11 classes every dial ends up in. */
  impressionClasses: [
    { key: 'positive', label: 'Positive', color: '#22A04B', def: 'Committed to vote for {name}' },
    { key: 'volunteer', label: 'Volunteer', color: 'THEME', def: 'Willing to work / mobilise for the campaign' },
    { key: 'undecided', label: 'Undecided', color: '#F2A81D', def: 'Not committed, hung up or conditional support (read from Follow up feedback)' },
    { key: 'followup', label: 'Follow up', color: '#3B82F6', def: 'Needs a call back (network, busy, language, noise)' },
    { key: 'negative', label: 'Negative', color: '#E23B4E', def: 'Opposed / other party' },
    { key: 'inapplicable', label: 'Inapplicable', color: '#9AA3B2', def: "Wrong number, can't vote, not resident or not in town" }
  ],
  nonImpressionClasses: [
    { key: 'notreachable', label: 'Not reachable', color: '#4B5263' },
    { key: 'switchedoff', label: 'Switched off', color: '#8A8F9C' },
    { key: 'barred', label: 'Barred / invalid line', color: '#B9B4CF' },
    { key: 'noanswer', label: 'Rang, no answer', color: '#CDBFEA' },
    { key: 'rejected', label: 'Call rejected', color: '#E7A9B3' }
  ],

  /* Application status text -> class. Matching ignores case, spaces, dashes and
     underscores. Statuses not listed here are shown on screen so they can be
     assigned before the report is produced. */
  statusMap: {
    POSITIVE: 'positive', SUPPORTIVE: 'positive', SUPPORT: 'positive',
    VOLUNTEER: 'volunteer', MOBILISER: 'volunteer', MOBILIZER: 'volunteer',
    FOLLOWUP: 'followup', CALLBACK: 'followup', BUSY: 'followup',
    NEGATIVE: 'negative', OPPOSED: 'negative',
    INAPPLICABLE: 'inapplicable', WRONGNUMBER: 'inapplicable', NOTAPPLICABLE: 'inapplicable',
    NOTCONNECTED: 'notreachable', NOTREACHABLE: 'notreachable', UNREACHABLE: 'notreachable', FAILED: 'notreachable',
    SWITCHEDOFF: 'switchedoff', OFF: 'switchedoff',
    BARRED: 'barred', INVALID: 'barred', INVALIDLINE: 'barred', BARREDINVALIDLINE: 'barred',
    UNANSWERED: 'noanswer', NOANSWER: 'noanswer', RANGNOANSWER: 'noanswer', NOTANSWERED: 'noanswer', NOTPICKED: 'noanswer',
    REJECTED: 'rejected', CALLREJECTED: 'rejected', DECLINED: 'rejected'
  },

  /* Feedback screening: FOLLOW-UP and NEGATIVE calls are re-read and moved to
     the class their feedback actually describes. Checked in this order.
     The application has no UNDECIDED disposition: Undecided voters are the
     FOLLOW-UP calls whose feedback shows they hung up, are not sure, or attach
     conditions, exactly as in the Kwara audit. */
  reclassify: {
    inapplicable: ['wrong number', 'wrong no', 'not the person', 'not resident', 'not living', 'relocated', 'moved to', 'not in town', 'out of town', 'travelled', 'traveled', "can't vote", 'cant vote', 'cannot vote', 'can not vote', 'no pvc', "doesn't have pvc", 'does not have pvc', 'not registered', 'not a registered', 'deceased', 'died', 'dead', 'underage', 'under age', 'minor'],
    negative: ['other party', 'another party', 'pdp', 'labour party', ' lp ', 'adc', 'apga', "won't vote", 'will not vote', 'not voting for', 'against him', 'against her', 'does not support', "doesn't support", 'opposed', 'opposition'],
    followup: ['call back', 'callback', 'call later', 'busy', 'network', 'poor network', 'not audible', 'noise', 'noisy', 'language', 'driving', 'in a meeting', 'at work'],
    undecided: ['hang up', 'hanged up', 'hung up', 'hangs up', 'indecisive', 'undecided', 'not sure', 'not decided', 'yet to decide', 'will think', 'thinking about', 'depends', 'conditional', 'if he', 'if she', 'manifesto', 'see what', 'still deciding'],
    positive: ['will vote', 'he will vote', 'she will vote', 'i will vote', 'yes', 'support him', 'support her', 'supports him', 'supports her', 'sure', 'definitely', 'already decided for']
  },

  /* Needs and requests raised in Feedback. */
  needs: [
    { label: 'Financial Support', kw: ['money', 'cash', 'fund', 'financial', 'financially', 'transport fare', 'stipend', 'loan', 'support me', 'assist me', 'help me with'] },
    { label: 'Business & Livelihood Empowerment', kw: ['empower', 'business', 'capital', 'livelihood', 'grant', 'tricycle', 'keke', 'machine', 'trade', 'shop', 'farm input', 'fertili'] },
    { label: 'Roads & Bridges', kw: ['road', 'bridge', 'drainage', 'culvert', 'erosion', 'pothole', 'tarred', 'street'] },
    { label: 'Employment & Jobs', kw: ['job', 'employ', 'work for', 'unemploy', 'recruit', 'appointment', 'placement'] },
    { label: 'Power & Lighting', kw: ['light', 'transformer', 'electric', 'power', 'solar', 'nepa', 'phcn', 'street light'] },
    { label: 'Religious & Community Facilities', kw: ['church', 'mosque', 'town hall', 'community hall', 'market', 'centre for', 'community center', 'community centre', 'palace'] },
    { label: 'Water & Sanitation', kw: ['water', 'borehole', 'bore hole', 'well', 'toilet', 'sanitation', 'waste'] },
    { label: 'Engagement & Inclusion', kw: ['carry us along', 'carry them along', 'carried along', 'visit', 'come to', 'meet him', 'meet her', 'meeting with', 'involve', 'inclusion', 'reach out', 'see him'] },
    { label: 'Education & Scholarships', kw: ['school', 'scholarship', 'education', 'fees', 'bursary', 'student', 'classroom', 'jamb', 'waec'] },
    { label: 'Welfare & Palliatives', kw: ['palliative', 'food', 'rice', 'welfare', 'widow', 'elderly', 'aged', 'relief'] },
    { label: 'Health & Medical', kw: ['hospital', 'health', 'clinic', 'medical', 'drug', 'treatment', 'sick'] },
    { label: 'Security & Welfare of Agents', kw: ['security', 'agent', 'vigilante', 'insecurity', 'kidnap', 'cult'] }
  ],
  /* Which need counts as "asking for cash or funds" on the scorecard. */
  cashNeedLabel: 'Financial Support',

  /* Grievances heard in Feedback. */
  grievances: [
    { label: 'Empowerment not reaching them', kw: ['not reach', "didn't reach", 'did not reach', 'never benefit', 'not benefit', "didn't benefit", 'did not benefit', 'only leaders', 'ward leaders', 'leaders and followers', 'shared among', 'hijack', 'cornered', 'we never get', 'never received', 'not received', 'stops with'] },
    { label: 'No visible project in area', kw: ['no project', 'nothing in', 'nothing for', 'not seen anything', "haven't seen", 'have not seen', 'no development', 'abandoned', 'nothing done'] },
    { label: 'Feels ignored / unresponsive office', kw: ['ignored', 'neglect', 'not responsive', 'unresponsive', 'never answer', 'no response', 'forgotten', 'abandon us', 'does not pick', "doesn't pick"] },
    { label: 'Unfulfilled promises', kw: ['promise', 'promised', 'fulfil', 'fulfill', 'lied', 'lies', 'deceive', 'deceived'] },
    { label: 'Party / governance discontent', kw: ['party', 'government', 'governance', 'hardship', 'economy', 'tinubu', 'price', 'suffering', 'bad leadership'] }
  ],

  /* Feedback that carries no information and should not be quoted. */
  emptyFeedback: ['', 'yes', 'no', 'ok', 'okay', 'call back', 'hanged up', 'hang up', 'not picking call', 'not picking', 'switched off', 'busy', 'nil', 'none', 'n/a', 'na', '-'],

  /* Positives shorter than this (seconds) are flagged for spot-checking. */
  shortPositiveSeconds: 20,
  /* An agent whose last call is this many minutes before the centre's last call is an early finish. */
  earlyFinishMinutes: 120,
  /* Feedback capture below this share of an agent's conversations is a gap. */
  feedbackGapThreshold: 0.6,
  /* Most wards shown in a single ward chart or table. */
  maxWardsShown: 22,
  /* Wards with fewer conversations than this are not named as warmest or coolest. */
  minWardSample: 20
};
