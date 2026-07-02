# CLAUDE.md

We're building the app described in @SPEC.md. Read that file for general architectural tasks or to double-check the exact database structure, tech stack, or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to ensure that you're working with up-to-date information.
Use the DocsExplorer subagent for efficient documentation lookup.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is the frontend for **The Grid**, a desktop-only NFL season-long pick'em web app. The repo is at an **early scaffold stage**: the app shell is wired up (router, TanStack Query provider, Tailwind, a typed `fetch` API client, and Zustand auth store) with the auth flow — register, login, session rehydration, and route guards — implemented. Everything past auth (dashboard, grid, leaderboards) is still stubbed.

**`SPEC.md` is the authoritative product specification** — it describes the full intended UI (routes, pages, pick-grid interactions, leaderboards, comparison views) and visual design system. Treat it as the target to build toward and the source of truth for product behavior. **However, most of what SPEC.md describes is not yet implemented** (only the auth surface exists so far). The specced libraries are all installed; check `package.json` before importing.

Business rules (pick-lock timing, the "at least one Tie" rule, scoring) are enforced by a separate backend, which is authoritative. The frontend only mirrors them for UX. The companion backend `SPEC.md §7` referenced in the spec lives in the backend repo, not here.

## Commands

- `npm run dev` — start Vite dev server (HMR)
- `npm run build` — type-check (`tsc -b`) then produce a production build; the build fails on type errors
- `npm run lint` — run ESLint over the repo
- `npm run preview` — serve the production build locally

**Vitest** is installed (`devDependencies`) but there is **no `test` script yet** and no tests. If asked to add tests, add a `test` script (e.g. `vitest`) and any needed config first — don't assume a runnable test command exists.

## Architecture & key files

- **`src/apiConfig.ts`** — resolves the backend base URL by hostname: `localhost` → `http://localhost:${VITE_API_PORT}` (development), otherwise `VITE_PROD_API_URL` (production). Import the default export as the API base for all requests. Env vars come from `.env` (git-ignored): `VITE_API_PORT`, `VITE_PROD_API_URL`.
- **HTTP** — `src/api/client.ts` is the native-`fetch` typed API client (SPEC §7): `credentials: 'include'`, a typed `ApiError`, text-first body parsing, and a double-submit `X-XSRF-TOKEN` header on mutating requests. TanStack Query is wired via `QueryClientProvider` in `src/App.tsx` (no queries yet beyond auth, which uses the store). `axios` is not a dependency.
- **`src/main.tsx`** — app entry; mounts `<App>` in `<StrictMode>`.
- **Build/compiler** — Vite with `@vitejs/plugin-react` and the **React Compiler** enabled via `@rolldown/plugin-babel` + `reactCompilerPreset()` in `vite.config.ts`. The compiler auto-memoizes; avoid manual `useMemo`/`useCallback` micro-optimizations unless profiling shows a need.
- **TypeScript** — project-references setup: `tsconfig.json` → `tsconfig.app.json` (app code) + `tsconfig.node.json` (build tooling).
- **Static assets** — `public/` holds `favicon.svg` and `icons.svg` (SVG sprite referenced via `<use href="/icons.svg#...">`); imported assets live in `src/assets/`.

## Stack

SPEC.md §2 lists the *intended* stack; the whole thing is now installed and the core is wired up.

- **Installed**: React 19, react-dom, React Router v6 (`react-router-dom`), TanStack Query (`@tanstack/react-query`), Zustand, React Hook Form, date-fns, Tailwind CSS (+ `postcss`, `autoprefixer`), Vite, TypeScript, ESLint, Vitest.
- **Client state**: Zustand is used for auth (`src/store/authStore.ts`). SPEC §2 lists it as an alternative to React Context; both are acceptable — reach for whichever fits the state's scope.
- **Not a dependency**: `axios` — SPEC §7 specifies the native-`fetch` typed client (`src/api/client.ts`).

Wired up: Tailwind (directives in `src/index.css`, `content` globs in `tailwind.config.js`), `QueryClientProvider` and the router in `src/App.tsx`. Features past auth still need building. Note SPEC.md says "React 18+" but the repo is on React 19.

## Design system (from SPEC.md §3)

When building UI, follow the spec's design tokens rather than inventing styles: 6-color palette (`--field` `#0D1117`, `--surface` `#161C23`, `--border` `#2A3340`, `--chalk` `#F0EDE6`, `--chalk-muted` `#7A8694`, `--signal` `#E8C547`); fonts Space Grotesk (display), Inter (body), JetBrains Mono (data readouts — always use mono for numbers that update). Desktop-only, min viewport 1280px, max content width 1200px, 220px fixed left sidebar. Respect `prefers-reduced-motion`.
