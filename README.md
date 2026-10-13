# Bravo Daily Report Generator

A web page that turns the application's **CallSessions CSV export** into the two daily reports:

* **Client report (AVOC)**: 3 pages. Engagement at a glance, Where support is strongest, What voters are saying.
* **Internal audit**: 10 pages, or 11 when a telco match file is supplied. It covers KPIs and funnel, call outcomes, time analysis, call partner output, league table, the 30 minute activity heatmap, the gender and tier profile, the three candidate pages and the ward deep dive.

Everything runs in the browser. The call file is never uploaded anywhere, so voter data stays on the team lead's computer.

## Using it (team leads)

1. Open the site.
2. Pick the centre (for example *Sen. Asuquo Ekpenyong (Calabar)*).
3. Drop the day's CallSessions CSV onto the upload box.
4. Check the settings:
   * Day number
   * Airtime ₦ per minute
5. If a box called **New statuses found** appears, say what each status means. The generator remembers your choice.
6. Read through the reports. Every narrative box, quote and community list can be clicked and edited directly.
7. Press **Download client report (PDF)** or **Download internal audit (PDF)**. In the print window:
   * choose **Save as PDF**
   * set layout to **Landscape**
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
* `airtimeRatePerMinute`
* `theme`: header gradient, brand colours, the accent rule, and the highlight used in narrative panels
* `lgas`: every LGA in the constituency, each with its chart colour. Names are matched loosely against the export's Location column.
* `candidateImage`: put the photo in `assets/profiles/<id>/`.
  * `candidateImageStyle: 'framed'` gives a rounded photo frame.
  * `'cutout'` is for a transparent cut out image, as in the Kwara report.

## Tuning how calls are read

`js/rules.js` holds everything the generator knows about statuses and feedback:

* `statusMap`: application status → one of the 11 classes. Add new statuses here so nobody has to map them by hand.
* `reclassify`: keywords used to move FOLLOW UP and NEGATIVE calls to the class their feedback describes. Team leads can switch this off per report.
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
js/pages.js           page layouts and the written commentary
js/app.js             file loading, settings, PDF download
samples/              synthetic Calabar export and telco file for testing
```

The files in `samples/` are **synthetic**. They exist only to show what the reports look like at full scale. Delete them before sharing if you prefer.
