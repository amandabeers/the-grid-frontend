# CLAUDE.md

We're building the app described in @SPEC.md. Read that file for general architectural tasks or to double-check the exact database structure, tech stack, or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to ensure that you're working with up-to-date information.
Use the DocsExplorer subagent for efficient documentation lookup.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is the frontend for **The Grid**, a desktop-only NFL season-long pick'em web app. The repo is at an **early scaffold stage**: it is essentially a fresh Vite + React 19 + TypeScript template (`src/App.tsx` is still largely the starter page) with a single backend API call wired up (`GET /conferences`).

**`SPEC.md` is the authoritative product specification** — it describes the full intended UI (routes, pages, pick-grid interactions, leaderboards, comparison views) and visual design system. Treat it as the target to build toward and the source of truth for product behavior. **However, most of what SPEC.md describes is not yet implemented.** The specced libraries are now installed (except Zustand — see Stack gap) but **most are not yet wired up**. Check `package.json` before importing.

Business rules (pick-lock timing, the "at least one Tie" rule, scoring) are enforced by a separate backend, which is authoritative. The frontend only mirrors them for UX. The companion backend `SPEC.md §7` referenced in the spec lives in the backend repo, not here.

## Commands

- `npm run dev` — start Vite dev server (HMR)
- `npm run build` — type-check (`tsc -b`) then produce a production build; the build fails on type errors
- `npm run lint` — run ESLint over the repo
- `npm run preview` — serve the production build locally

**Vitest** is installed (`devDependencies`) but there is **no `test` script yet** and no tests. If asked to add tests, add a `test` script (e.g. `vitest`) and any needed config first — don't assume a runnable test command exists.

## Architecture & key files

- **`src/apiConfig.ts`** — resolves the backend base URL by hostname: `localhost` → `http://localhost:${VITE_API_PORT}` (development), otherwise `VITE_PROD_API_URL` (production). Import the default export as the API base for all requests. Env vars come from `.env` (git-ignored): `VITE_API_PORT`, `VITE_PROD_API_URL`.
- **HTTP** — SPEC §7 specifies a native-`fetch` typed API client layer (`src/api/client.ts`) + TanStack Query; neither exists yet. `axios` has been removed from the deps, but `src/App.tsx` still has a stray `axios` import (from the `fetchConferences` example) that will error until refactored.
- **`src/main.tsx`** — app entry; mounts `<App>` in `<StrictMode>`.
- **Build/compiler** — Vite with `@vitejs/plugin-react` and the **React Compiler** enabled via `@rolldown/plugin-babel` + `reactCompilerPreset()` in `vite.config.ts`. The compiler auto-memoizes; avoid manual `useMemo`/`useCallback` micro-optimizations unless profiling shows a need.
- **TypeScript** — project-references setup: `tsconfig.json` → `tsconfig.app.json` (app code) + `tsconfig.node.json` (build tooling).
- **Static assets** — `public/` holds `favicon.svg` and `icons.svg` (SVG sprite referenced via `<use href="/icons.svg#...">`); imported assets live in `src/assets/`.

## Stack gap (important)

SPEC.md §2 lists the *intended* stack. Nearly all of it is now installed; only Zustand is deliberately deferred.

- **Installed**: React 19, react-dom, React Router v6 (`react-router-dom`), TanStack Query (`@tanstack/react-query`), React Hook Form, date-fns, Tailwind CSS (+ `postcss`, `autoprefixer`), Vite, TypeScript, ESLint, Vitest.
- **Deliberately deferred**: Zustand — held off until a concrete need for shared client state emerges. SPEC §2 lists it as an alternative to React Context; reach for Context first.
- **Removed**: `axios` — no longer a dependency (SPEC §7 specifies a native-`fetch` typed client). Note `src/App.tsx` still imports it and will error until refactored.

Although the packages are installed, most are **not yet wired up** (no Tailwind directives/config `content` globs, no `QueryClientProvider`, no router). Add the configuration for each as part of the first feature that needs it. Note SPEC.md says "React 18+" but the repo is on React 19.

## Design system (from SPEC.md §3)

When building UI, follow the spec's design tokens rather than inventing styles: 6-color palette (`--field` `#0D1117`, `--surface` `#161C23`, `--border` `#2A3340`, `--chalk` `#F0EDE6`, `--chalk-muted` `#7A8694`, `--signal` `#E8C547`); fonts Space Grotesk (display), Inter (body), JetBrains Mono (data readouts — always use mono for numbers that update). Desktop-only, min viewport 1280px, max content width 1200px, 220px fixed left sidebar. Respect `prefers-reduced-motion`.
