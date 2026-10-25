# Bravo Daily Report Generator

A web page that turns the application's **CallSessions CSV export** into three daily reports:

* **Client report (AVOC)**: 3 pages. Engagement at a glance, Where support is strongest, What voters are saying.
* **Internal audit**: 10 pages, or 11 when a telco match file is supplied. It covers KPIs and funnel, call outcomes, time analysis, call partner output, league table, the 30 minute activity heatmap, the gender and tier profile, the three candidate pages and the ward deep dive.

* **Sentiment analysis**: 5 pages plus the feedback register. Every piece of feedback is read and labelled **Positive** or **Negative**, then grouped into readable themes:
  * Sentiment at a glance: positive and negative counts, net sentiment, sentiment index (0 to 100), how strongly voters feel, sentiment by LGA, and how far feedback agrees with call coding.
  * Where and when: sentiment by ward, through the day, and against the call outcome agents chose.
  * What drives positive sentiment and what drives negative sentiment: themes with charts and the actual comments, cleaned for reading, with repeats and near repeats counted once ("Said by 42 voters").
  * Words, topics and action: the words behind each side, the topics voters raise, supporters who raised a concern, calls whose coding looks wrong, and recommendations.
  * Feedback register: every distinct comment, grouped by sentiment and theme (can be switched off).
  * **Download all feedback with sentiment (CSV)** gives every classified note with its score, confidence, theme and the words that decided it.

All three reports come in two styles, chosen under **Report style**:

* **Classic (landscape)**: the original Bravo layout.
* **Dashboard (portrait)**: a web dashboard look with a sidebar, rounded cards and the centre's campaign colours.

The two styles draw every number and every sentence from the same place (`js/content.js`), so they always agree. Text you edit in one style carries over if you switch to the other.

No text is ever cut off. If real feedback or an edit is too long for its box, the generator first eases the text size down slightly, then leaves out the last quotes on that page (all quotes stay on the "What voters are saying" page), so every box and every page always fits. The dashboard style uses the centre's own campaign colours from `js/profiles.js`, and each centre has a square `face.jpg` used wherever a small portrait is shown.

Everything runs in the browser. The call file is never uploaded anywhere, so voter data stays on the team lead's computer.

## Using it (team leads)

1. Open the site.
2. Pick the centre (for example *Sen. Asuquo Ekpenyong (Calabar)*).
3. Drop the day's CallSessions CSV onto the upload box.
4. Check the settings:
   * Calls started on (the first day of live calls; set per centre in `js/profiles.js` and editable here). The Day number is worked out from it automatically, counting Monday to Saturday, since Sunday is free.
   * Airtime ₦ per minute
   * Report style
5. If a box called **New statuses found** appears, say what each status means. The generator remembers your choice.
6. Read through the reports. Every narrative box, quote and community list can be clicked and edited directly.
7. Press **Download client report (PDF)** or **Download internal audit (PDF)**. In the print window:
   * choose **Save as PDF**
   * set layout to **Landscape** for the classic style, or **Portrait** for the dashboard style
   * set margins to **None**
   * tick **Background graphics**

   Use Chrome or Edge for the best result.

Optional: a telco match file (CSV with `Phone`, `Gender`, `Tier` columns) adds the gender and socio economic tier page to the audit.

## Putting it on GitHub Pages

1. Create a new repository on GitHub, for example `bravoreports`. It can be private if your plan allows private Pages.
2. Upload every file and folder from this package to the root of the repository. Keep the folder structure as it is.
3. Go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, then press **Save**.
4. After a minute the site is live at `https://<youraccount>.github.io/bravoreports/`. Share that link with the team leads.

There is no build step. Any edit you commit is live within a minute.

## Adding a new centre

Open `js/profiles.js`, copy one profile block and change:

* `id`, `label`, `candidateTitle`, `candidateName`, `shortName`, `constituency`
* `submissionLabel`: the badge on the client report, for example *Ekpenyong's Submission*
* `airtimeRatePerMinute`, `callStartDate`
* `theme`: header gradient, brand colours, the accent rule, and the highlight used in narrative panels
* `lgas`: every LGA in the constituency, each with its chart colour. Names are matched loosely against the export's Location column.
* `candidateImage`: put the photo in `assets/profiles/<id>/`.
  * `candidateImageStyle: 'framed'` gives a rounded photo frame.
  * `'cutout'` is for a transparent cut out image, as in the Kwara report.

## Tuning how calls are read

`js/rules.js` holds everything the generator knows about statuses and feedback:

* `statusMap`: application status → one of the 11 classes. Add new statuses here so nobody has to map them by hand.
* `reclassify`: keywords used to move FOLLOW UP and NEGATIVE calls to the class their feedback describes. Team leads can switch this off per report.
  The application has no UNDECIDED disposition. Undecided voters are the FOLLOW UP calls whose feedback shows they hung up, are not sure, or set conditions. If screening is switched off, Undecided shows as 0.
* `needs` and `grievances`: keyword lists behind the *Needs & requests* chart and the *Grievances* table.
* Thresholds:
  * short positive seconds
  * early finish minutes
  * feedback gap
  * maximum wards shown

## Files

```
index.html            control panel and preview
css/report.css        the report design (A4 landscape pages)
css/app.css           the control panel
js/profiles.js        centres
js/rules.js           statuses, keywords, thresholds
js/metrics.js         every number in the reports
js/charts.js          SVG charts
js/content.js         the KPI lists, tables and written commentary shared by both styles
js/pages.js           classic style page layouts
js/pages_dash.js      dashboard style page layouts
js/fit.js             keeps every text box inside its card and every page on the paper
js/sentiment.js       the sentiment engine: word and phrase lists, negation, themes
js/pages_sent.js      the sentiment report in both styles
css/sent.css          sentiment report cards and register
css/dash.css          the dashboard style design
js/app.js             file loading, settings, PDF download
samples/              synthetic Calabar export and telco file for testing
```

The files in `samples/` are **synthetic**. They exist only to show what the reports look like at full scale. Delete them before sharing if you prefer.

## How sentiment is decided

`js/sentiment.js` reads each note in this order:

1. **Clear stance first.** A pledge ("will vote for him", "na our man") makes the note Positive; refusing or naming another party ("will not vote", "PDP") makes it Negative. Side remarks in the same note are kept as a concern, so "will vote, but the road is bad" counts as a supporter with a concern (Mixed).
2. **Words and phrases.** Otherwise each note is scored from the positive and negative word and phrase lists, including Nigerian English and Pidgin. Negation is handled ("not happy" is negative, "not bad" is positive), and "very", "really" and so on strengthen the next word.
3. **Call outcome as a fallback.** A note with no opinion words takes its label from the call outcome and is marked low confidence.
4. **No opinion.** Notes that only record call handling ("call back", "network is bad", "wrong number") are counted separately and not labelled.

To teach it new expressions, add them to `PHRASES` or `WORDS` (positive numbers for positive, negative numbers for negative), or to the theme keyword lists.
