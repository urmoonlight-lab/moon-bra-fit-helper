# Moon Bra Fit Helper

Moon Bra Fit Helper is a local-first, mobile-friendly fitting helper for transfem and non-standard bodies. This tool gives fitting starting points, not body judgments.

Tagline: **Not a verdict. A fitting starting point.**

Chinese positioning: **一个温和的内衣尺码与试穿辅助工具。**

## What This Tool Is

This MVP helps users:

- record underbust, bust, and left/right horizontal half-arc measurements;
- estimate a calm first fitting range instead of one fixed answer;
- compare sister sizes;
- understand possible cup shape directions such as shallow cup, wider wire, bralette, wireless, or stretch cup fabric;
- track fit notes and common try-on issues over time;
- export and import records as JSON, and export CSV for spreadsheets.

## What This Tool Is Not

This is not a medical tool, diagnostic tool, or body-value judgment. It does not decide whether a body is correct or incorrect. It provides practical fitting navigation so users can reduce wrong purchases and make calmer first try-on choices.

The tool never tells users they do not need a bra based on size. Bra needs may come from support, coverage, friction protection, silhouette, gender expression, body boundary, or comfort. Even when a result suggests lower support needs, the wording should stay in the range of: "可能暂时不需要强支撑，可以从轻支撑/低压迫/无钢圈/bralette/带胸垫背心等方向开始。"

## Privacy and Data Storage

Moon Bra Fit Helper is local-first. It stores records in the browser's local storage. It does not upload records, does not require login, does not use analytics, and does not sync data to a server. There is no server-side storage.

If you clear browser data, change devices, uninstall the browser, switch browsers, or use private browsing, records may be lost. Export JSON regularly if you want a full backup. CSV export is provided for spreadsheet review.

## Measurement Approach

The app uses:

- tight, comfortable, and loose underbust measurements to suggest a band range;
- standing, leaning, and lying bust measurements with transparent weights:
  `standing * 0.45 + leaning * 0.35 + lying * 0.20`;
- optional left/right horizontal half-arc measurements.

The horizontal half-arc fields are used only for fitting hints, such as breast base width, possible projection tendency, asymmetry-aware notes, and style direction. They are not body judgments.

## Run Locally

Open `index.html` directly in a browser for the simplest local preview.

For PWA service worker testing, run a small local server from this folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to GitHub Pages

This is a pure frontend app. Push the files to a GitHub repository and enable GitHub Pages for the branch or `/docs` folder you choose. No build step is required.

## Launch Checklist

- Open locally.
- Enter sample data.
- Save one record.
- Export JSON.
- Export CSV.
- Import JSON.
- Install as PWA on mobile.
- Confirm data remains local.
- Deploy to GitHub Pages.
