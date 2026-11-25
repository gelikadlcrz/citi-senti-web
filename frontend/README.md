# CITI-Senti frontend

React + TypeScript + Vite. The Explore section is implemented at three URLs:

- `/explore/aspects` — interactive policy-related aspect reference (A01–A11).
- `/explore/how-it-works` — multilingual Glot500-m workflow, examples, limitations and privacy.
- `/explore/about` — research overview, objectives, methodology, team placeholder and disclaimer.

The root route redirects to `/explore/aspects` until the team's Analyze Feedback homepage is integrated. The sidebar also contains temporary routes for Analyze Feedback, Contribute Feedback, Public Insights, and Admin Login; update the `<Route>` entries in `src/App.tsx` when those pages are ready. Central link destinations are in `src/components/Sidebar.tsx` under `paths`.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local Vite URL and navigate between the Explore tabs. Click the sidebar button to collapse/expand it; on mobile the sidebar becomes a drawer. The collapse preference is stored locally.

## Verify taxonomy and navigation

```bash
node scripts/verify-explore.mjs
```

The icon component uses Iconify's `lucide:*` identifiers and a bundled SVG symbol sheet at `public/iconify-lucide.svg`, so no icon service or runtime dependency is needed.