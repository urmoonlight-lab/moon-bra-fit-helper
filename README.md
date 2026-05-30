# Moon Bra Fit Helper

Moon Bra Fit Helper is a local-first, mobile-friendly bra fitting helper for transfem users and people who do not fit standard bra-sizing assumptions.

Tagline: Not a verdict. A fitting starting point.

定位： 一个温和的内衣尺码与试穿辅助工具。

Moon Bra Fit Helper is designed to turn measurements into practical try-on starting points, sister-size comparisons, style directions, and fit notes. It is meant to support calmer first try-on choices rather than produce a single fixed answer.

## What This Tool Does

This MVP helps users:

- record underbust, bust, and left/right horizontal half-arc measurements;
- estimate a first fitting range instead of one fixed size;
- compare sister sizes;
- understand possible fit directions such as shallow cup, projected cup, wider wire, bralette, wireless bra, stretch cup fabric, adjustable straps, or stable band;
- track fit notes and common try-on issues over time;
- export and import records as JSON;
- export CSV for spreadsheet review.

The app is a fitting helper, not a final sizing authority.

## What This Tool Is Not

This is not a medical tool, diagnostic tool, or body-value judgment.

It does not evaluate whether a body is correct or incorrect. It does not diagnose development, health, or anatomy. It provides practical fitting navigation so users can reduce wrong purchases and make more informed try-on choices.

Bra fitting can involve many needs, including:

- support;
- coverage;
- friction protection;
- silhouette;
- gender expression;
- body boundary;
- comfort;
- personal preference.

For smaller cup differences or lower support needs, the app may suggest lighter-support options such as bralette, wireless bra, soft cup, low-compression sports bra, or padded camisole. These are presented as style directions, not as judgments.

## Privacy and Data Storage

Moon Bra Fit Helper is local-first.

It stores records in the current browser’s local storage. It does not upload records, does not require login, does not use analytics, and does not sync data to a server. There is no server-side storage.

Your data stays in your browser unless you manually export it.

Records may be lost if you:

- clear browser data;
- change devices;
- uninstall the browser;
- switch browsers;
- use private browsing;
- reset site storage.

Export JSON regularly if you want a full backup.

CSV export is provided for spreadsheet review. JSON export is the preferred full backup format because it preserves the full record structure.

## Measurement Approach

Moon Bra Fit Helper uses several measurements to create fitting starting points.

### Underbust Measurements

The app uses:

- tight underbust;
- comfortable / snug underbust;
- loose underbust.

These measurements help suggest a band anchor and band range. The comfortable / snug underbust is used as the main anchor, while tight and loose measurements help estimate tolerance and comfort.

### Bust Measurements

The app uses:

- standing bust;
- leaning bust;
- lying bust.

The estimated bust value uses transparent weights:

estimatedBust = standingBust * 0.45 + leaningBust * 0.35 + lyingBust * 0.20 

This estimate is used only to generate a first fitting range. It is not a final judgment.

### Horizontal Half-Arc Measurements

The app also supports optional left/right horizontal half-arc measurements.

These fields are used only for fitting hints, such as:

- possible breast base width;
- possible projection tendency;
- left-right difference;
- style direction.

They are not body judgments.

The app may use these values to suggest observations such as:

- broader base / lower projection tendency;
- narrower base / higher projection tendency;
- asymmetry-aware try-on notes;
- possible style directions such as shallow cup, wide wire, projected cup, or stretch cup fabric.

All such hints should be treated as try-on directions, not fixed body labels.

## Understanding the Results

The result page is designed as a fitting map.

It may include:

- priority starting sizes;
- expanded comparison sizes;
- sister sizes;
- band range;
- base/projection hints;
- asymmetry notes;
- style direction suggestions;
- try-on observations;
- uncertainty notes.

The core result sentence is:

> 这不是身体评价，只是第一批试穿起点。

### Priority Starting Points

priorityStartingPoints are the first sizes to try.

These are usually the most useful first candidates. If you only want to try one or two items first, start near this group and choose returnable items when possible.

### Expanded Comparison Sizes

expandedStartingPoints are comparison sizes.

They help compare band stability and cup volume, but they do not mean you need to buy everything in the list.

### Sister Sizes

Sister sizes are comparison anchors, not another verdict.

They help compare how a smaller band/larger cup or larger band/smaller cup changes the fit. They are useful for observing band stability, cup space, and comfort.

### Combined Suggested Sizes

The export may include:

- priorityStartingPoints
- expandedStartingPoints
- fittingRange
- allSuggestedSizes

fittingRange and/or allSuggestedSizes may combine priority and expanded suggestions for archive/reference purposes. They should not be read as all sizes being equally recommended.

## Try-On Issues

The app can help users think through common fit issues, such as:

- cup edge gaps;
- side tissue feels compressed;
- center gore does not tack;
- underband rides up;
- straps carry too much weight;
- wire feels too narrow;
- cup feels too deep;
- cup cuts into tissue;
- one side fits differently.

Example guidance:

- If the cup edge gaps but the side tissue feels compressed, the issue may be cup shape or wire width, not simply cup size.
- If the underband rides up, check band stability before changing cup size.
- If straps carry too much weight, check whether the band provides enough support.
- If left and right sides fit differently, fit by the side that needs more space and adjust with straps, stretch fabric, or removable pads.

These notes are practical fitting observations, not body evaluations.

## Run Locally

Open index.html directly in a browser for the simplest local preview.

For PWA service worker testing, run a small local server from this folder:

bash python3 -m http.server 8000 

Then open:

http://localhost:8000 

## Deploy to GitHub Pages

This is a pure frontend app.

Push the files to a GitHub repository and enable GitHub Pages from the main branch root folder.

No build step is required.

Expected root-level files include:

index.html styles.css app.js manifest.webmanifest service-worker.js README.md .gitignore 

Do not upload local-only or generated files such as:

.env node_modules/ logs/ .DS_Store ._* 

## PWA Notes

Moon Bra Fit Helper can be installed as a PWA on supported mobile browsers.

Because records are stored locally in the browser, installed PWA data may still be affected by browser/site storage behavior. Export JSON regularly if the records matter to you.

## Launch Checklist

Before publishing or updating the GitHub Pages version:

- Open locally.
- Enter sample data.
- Generate a result.
- Save one record.
- Export JSON.
- Export CSV.
- Import JSON.
- Confirm older JSON import still works if applicable.
- Install as PWA on mobile.
- Confirm data remains local.
- Confirm there are no analytics or remote API calls.
- Confirm no secrets are included.
- Deploy to GitHub Pages.
- Open the GitHub Pages URL and test again.

## Development Principles

Moon Bra Fit Helper should remain:

- local-first;
- no-login;
- no-upload;
- non-shaming;
- mobile-friendly;
- practical;
- transparent about uncertainty;
- focused on fitting navigation rather than body judgment.

The goal is simple:

> Help users find a calmer first fitting path and reduce wrong purchases without turning body measurements into a verdict.
