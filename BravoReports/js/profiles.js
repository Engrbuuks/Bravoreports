/*
  CENTRE PROFILES
  One entry per candidate / call centre. To add a centre, copy a block,
  change the values, and put its images in assets/profiles/<id>/.

  airtimeRatePerMinute : naira charged per minute of talk time
  callStartDate        : the first day of live calls (YYYY-MM-DD); the report's
                         Day number is counted from it, Monday to Saturday
  candidateFace        : a square head and shoulders photo used wherever a
                         small round or square portrait is shown
  lgas                 : the LGAs in the constituency, with the colour used for
                         them in every chart (spelling is matched loosely to the
                         Location column of the export)
*/
window.PROFILES = [
  {
    id: 'ekpenyong',
    label: 'Sen. Asuquo Ekpenyong (Calabar)',
    candidateTitle: 'Distinguished Senator',
    candidateName: 'Asuquo Ekpenyong',
    shortName: 'Sen. Ekpenyong',
    submissionLabel: "Ekpenyong's Submission",
    auditSubmissionLabel: "Bravo's Submission",
    division: 'Voters Engagement Division',
    constituency: 'Cross River South Senatorial District',
    partyLogo: 'assets/common/apc.png',
    candidateImage: 'assets/profiles/ekpenyong/candidate.png',
    candidateFace: 'assets/profiles/ekpenyong/face.jpg',
    callStartDate: '2026-10-13',
    candidateImageStyle: 'framed',
    network: 'MTN',
    airtimeRatePerMinute: 10.17,
    theme: {
      headerFrom: '#031E52', headerMid: '#052D73', headerTo: '#0A4BB0',
      brand: '#052D73', brandStrong: '#031E52', brandSoft: '#E8EEF9',
      rule: '#C10059', badge: '#C10059', highlight: '#FF9DCB',
      volunteer: '#1F3F94'
    },
    lgas: [
      { name: 'Akamkpa', color: '#1F3F94' },
      { name: 'Akpabuyo', color: '#C10059' },
      { name: 'Bakassi', color: '#0F9D9A' },
      { name: 'Biase', color: '#E07B00' },
      { name: 'Calabar Municipal', color: '#7A3FD1' },
      { name: 'Calabar South', color: '#2E8B3D' },
      { name: 'Odukpani', color: '#5B6B86' }
    ]
  },
  {
    id: 'shagaya',
    label: 'Hon. Muktar Shagaya (Ilorin West / Asa)',
    candidateTitle: 'Honorable',
    candidateName: 'Muktar Shagaya',
    shortName: 'Hon. Shagaya',
    submissionLabel: "Shagaya's Submission",
    auditSubmissionLabel: "Bravo's Submission",
    division: 'Voters Engagement Division',
    constituency: 'Ilorin West / Asa Federal Constituency',
    partyLogo: 'assets/common/apc.png',
    candidateImage: 'assets/profiles/shagaya/candidate.png',
    candidateFace: 'assets/profiles/shagaya/face.jpg',
    callStartDate: '2026-10-02',
    candidateImageStyle: 'cutout',
    network: 'MTN',
    airtimeRatePerMinute: 10.17,
    theme: {
      headerFrom: '#2A0F63', headerMid: '#4C079E', headerTo: '#7A0BD0',
      brand: '#5B12C9', brandStrong: '#3A0D86', brandSoft: '#F1EAFD',
      rule: '#2EA44F', badge: '#7A1BE0', highlight: '#C6F68D',
      volunteer: '#5B12C9'
    },
    lgas: [
      { name: 'Ilorin West', color: '#5B12C9' },
      { name: 'Asa', color: '#2EA44F' }
    ]
  }
];
