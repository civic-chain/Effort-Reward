# Civic-Chain Onboard Inquiry

A one-minute inquiry form that also keeps count of who is interested. Built on the
TLaaS pricing app's foundation (Vite + React + Tailwind, brand tokens, Firebase).

## What it collects and counts

Every valid click on **Submit inquiry** saves the inquiry and bumps these tallies:

| Tally | Source |
|---|---|
| People who clicked submit | one count per submission |
| Country | dropdown, United States first, then A–Z |
| State | dropdown of all 50 states, shown for United States only |
| Attended a town council meeting | Yes / No |
| How they learned about CC | LinkedIn, YouTube, Podcast, Word of Mouth, Facebook (pick one) |

Name, email and an optional town/organization are saved with each inquiry so you can follow up.

## Pages

- `#/` — the inquiry form
- `#/stats` — the tallies as bar charts, behind a light passphrase (`VITE_STATS_PASSPHRASE`, default `civicchain`).
  The passphrase is visible to anyone who reads the shipped JavaScript, so treat it as a curtain, not a lock.

## Storage

- **With Firebase** (`.env`, see `.env.example`): inquiries go to the `inquiries` collection and the counters to
  `stats/tallies`, written together in one batch. Publish `firestore.rules` first.
- **Without Firebase**: demo mode. Tallies are kept in the browser's localStorage so everything still works,
  but only counts that browser.

## Run

```bash
npm install
npm run dev      # http://localhost:5180
npm test         # option lists, validation, tally keys, stats rows
npm run build    # static bundle in dist/ (Netlify settings are in netlify.toml)
```

Where things live: `src/lib/inquiry.ts` (options, validation, tally keys), `src/lib/store.ts` (saving and
loading), `src/components/InquiryForm.tsx`, `src/components/StatsView.tsx`.
