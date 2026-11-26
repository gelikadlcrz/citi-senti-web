# CITI-Senti frontend

React, TypeScript and Vite provide the citizen portal and administration interfaces. See the [repository README](../README.md) and [local development guide](../docs/LOCAL_DEVELOPMENT.md) for full setup, including FastAPI and model artifacts.

## Development

From this directory:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Vite forwards `/api` requests to `http://localhost:8000` during development. Start the backend separately for live analysis and other API-backed features. The root route redirects to `/analyze-feedback`.

## Routes

| Route | Page |
| --- | --- |
| `/analyze-feedback` | Feedback input and live Analysis Results (same route) |
| `/contribute-feedback` | Contribution workflow |
| `/public-insights` | Public feedback statistics |
| `/explore/aspects` | Aspect category reference |
| `/explore/how-it-works` | Analysis workflow and limitations |
| `/explore/about` | Research overview |
| `/admin/login` | Admin sign-in (outside the citizen layout) |

Route destinations are centralized in `src/components/Sidebar.tsx` (`paths`); registration is in `src/App.tsx`. See the [architecture guide](../docs/ARCHITECTURE.md) for the inspected implementation status of teammate-owned routes.

## Conventions

- Reuse the citizen `Layout`, sidebar and global styling; keep feature-specific CSS scoped to the corresponding page or component.
- Keep HTTP calls and response types in `src/services/`; do not embed database credentials in browser code.
- Use `src/data/aspects.ts` for names and definitions of A01–A11. Coordinate taxonomy changes with the model and database developers.
- `IconifyIcon` uses `lucide:*` identifiers and local SVG symbols in `public/iconify-lucide.svg`; add missing symbols without removing existing ones.
- Keep temporary analysis state in React, not URL parameters or browser persistent storage. Sidebar collapse preference is stored locally and is unrelated to feedback data.
- Use the shared analysis context for contribution drafts. See [analysis developer guide](../docs/ANALYSIS_DEVELOPMENT.md) for the exact API contract and handoff.

## Verification

```bash
pnpm lint
pnpm build
pnpm verify:explore
```

`pnpm preview` serves the built frontend for local preview; it is not a production hosting strategy and does not automatically provide the development API proxy. Verify API routing and SPA fallback in the deployment environment.

Follow the [testing guide](../docs/TESTING.md) for live inference, error handling, results, accessibility, responsive behavior and regression checks.
