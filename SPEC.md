# The Grid — Frontend Technical Specification

> **Companion to**: `SPEC.md` (backend). The backend is the authoritative tier for all business rules. This document covers the client only — React/TypeScript UI consuming the REST API described in `SPEC.md §7`.

---

## 1. Overview & Scope

The Grid's frontend is a React + TypeScript single-page application styled with Tailwind CSS. It communicates exclusively with The Grid's own backend REST API. Its job is to let users:

1. Register and log in.
2. Build a full-season pick slate — selecting a team to win (or calling a Tie) for every NFL regular-season game, with all games visible at once as the default experience.
3. Submit their completed Grid (validating the "at least one Tie" rule client-side as a UX aid, with the server as final authority).
4. Track their accuracy live throughout the season.
5. Compete on season-long and per-week leaderboards against other users with submitted Grids.
6. Compare their Grid against another user's finished Grid, game by game.

The frontend never enforces pick-lock rules or the Tie validity rule definitively — it mirrors those checks for UX feedback only. The backend always has the final word.

This is a **desktop-only application** for v1. No mobile or responsive breakpoints are required.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18+ with TypeScript |
| Styling | Tailwind CSS (utility-first; no component library assumed) |
| Routing | React Router v6 |
| Server state | TanStack Query (React Query) — data fetching, caching, background refresh |
| Client state | React Context or Zustand — session/auth state, ephemeral UI state |
| HTTP | `fetch` (native), wrapped in a typed API client layer |
| Forms | React Hook Form |
| Date handling | `date-fns` |
| Build | Vite |

---

## 3. Visual Design Direction

### 3.1 Aesthetic

The Grid is a pick'em game — a ritual, a commitment, a statement. It lives at the intersection of the NFL's analogue football-program history and the cold precision of a spreadsheet. The design should feel like someone took a vintage game-day program and ran it through a wireframe renderer: structured, grid-native, slightly industrial, but with warmth hiding in the type.

**Palette (6 named tokens):**

| Token | Hex | Role |
|---|---|---|
| `--field` | `#0D1117` | Page background — almost black with a green undertone, like turf under stadium lights |
| `--surface` | `#161C23` | Cards, panels, modal surfaces |
| `--border` | `#2A3340` | Dividers, input borders, table rules |
| `--chalk` | `#F0EDE6` | Primary text — off-white, not pure white; warm |
| `--chalk-muted` | `#7A8694` | Secondary text, labels, disabled states |
| `--signal` | `#E8C547` | Accent — scorecard yellow; used sparingly: active picks, correct indicators, CTAs |

No blue or red accents — those belong to team colors and would compete. Yellow is the ref's flag, the highlight marker, the thing that demands your attention on a play that matters.

**Typography:**

- **Display**: `Space Grotesk` (Google Fonts) — geometric, tight-tracked at large sizes; used for headings and the pick-grid team names. It reads like a scoreboard.
- **Body**: `Inter` — clean workhorse for labels, descriptions, body copy.
- **Mono**: `JetBrains Mono` — scores, record stats, accuracy numbers, anything that is a data readout. Numbers that update should always render in mono so they don't reflow the layout.

**Signature element**: The pick row. Each game in the Grid renders as a horizontal "match bar" — away team left, home team right, a centered Tie option in between. Picking a team slides a `--signal` yellow underline and dims the unchosen side to 40% opacity. The whole row is a single interactive unit. It should feel like flipping a card, not ticking a checkbox.

### 3.2 Layout conventions

- Min supported viewport width: `1280px`. No responsive breakpoints needed for v1.
- Max content width: `1200px`, centered.
- Left sidebar: navigation + season status + user stats — `220px` fixed width.
- Main content area: fills remaining width.
- Game grid columns (pick-entry screens): full width of the main content area, one game per row, no horizontal scroll.
- Tables (leaderboard, comparison view): full width, sticky header row, sticky first column where noted.
- All interactive controls: minimum `44px` click target height.
- Reduced motion: respect `prefers-reduced-motion` — disable transition animations on pick selection and page transitions.

---

## 4. Routes & Pages

| Route | Page | Auth |
|---|---|---|
| `/register` | Registration | public |
| `/login` | Login | public |
| `/` | Dashboard | member |
| `/grid` | My Grid — full season view (default pick-entry) | member |
| `/grid/week/:weekNumber` | My Grid — single week view | member |
| `/grid/:userId` | View another user's completed Grid (post-lock only) | member |
| `/grid/:userId/week/:weekNumber` | Another user's Grid — single week view (post-lock only) | member |
| `/leaderboard` | Season leaderboard | member |
| `/leaderboard/week/:weekNumber` | Weekly leaderboard | member |
| `/compare/:userIdA/:userIdB` | Side-by-side Grid comparison | member |
| `/admin` | Admin panel | admin |

A top-level `<AuthGuard>` component wraps all member/admin routes, redirecting to `/login` if no active session. An `<AdminGuard>` wraps `/admin`.

---

## 5. Page Specifications

### 5.1 Registration (`/register`)

**Purpose**: Create an account.

**Fields:**
- Username (text, required, unique — show server-returned uniqueness error inline)
- Email (email, required)
- Password (password, required, min 8 characters)
- Confirm Password (password, required, must match)

**Behavior:**
- `POST /api/auth/register` on submit.
- On success: redirect to `/grid`.
- On error (e.g. username/email taken): surface the specific field error inline below the input, not as a generic toast.
- Link to `/login` at the bottom.

---

### 5.2 Login (`/login`)

**Fields:** Email, Password.

**Behavior:**
- `POST /api/auth/login` on submit.
- On success: redirect to `/` (or the originally requested route if redirected by AuthGuard).
- On error: single inline message — "Email or password is incorrect." No field-specific hints (don't reveal whether the email exists).
- Link to `/register` at the bottom.

---

### 5.3 Dashboard (`/`)

**Purpose**: Season overview — status, the user's own Grid progress, quick navigation.

**Season Status Banner** (top):
- Current season year + status label.
- If `picks_open`: countdown to `lock_at` using `date-fns`, ticking in real time via `setInterval`. Label: "Picks lock in". When `lock_at` is null (schedule not yet imported), show "Schedule not yet available."
- If `locked` or later: "Picks are locked" with the lock timestamp.

**My Grid Status Card**:
- Total picks made / total games in season (e.g. "247 / 272").
- Tie picks count — number shown in `--signal` yellow when ≥ 1, muted when 0.
- Validity badge: "Valid Grid ✓" (complete + ≥1 Tie) or a plain-language description of what's missing.
- "Build My Grid" CTA → `/grid` (pre-lock), "View My Grid" → `/grid` (post-lock).

**My Accuracy Card** (visible once season is `in_progress` or `completed`):
- `correct_count` / `decided_count` in mono type.
- Three-segment accuracy bar: correct (yellow), incorrect (muted), undecided (border-only). Three styled `<div>`s with percentage widths — no charting library needed.
- Link to `/grid`.

**Leaderboard Snapshot** (visible post-lock, season `in_progress` or `completed`):
- Top 3–5 users by season points, compact format.
- "Full Leaderboard" → `/leaderboard`.

---

### 5.4 My Grid — Full Season View (`/grid`)

This is the **primary pick-entry interface** and the default way to interact with a season's games. All 272 regular-season games are visible on one scrollable page, grouped by week. This is the default view; the week view (`/grid/week/:weekNumber`) is a secondary drill-down.

#### 5.4.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  [Season: 2026]  [272 games · 247 picked · 1 Tie ✓] │  ← sticky page header
│  [Randomize]  [Submit Grid ✓]                        │
├─────────────────────────────────────────────────────┤
│  WEEK 1  ·  Sep 5 – Sep 9                           │  ← week group header (sticky while scrolling through week)
│  ──────────────────────────────────────────────────  │
│  [GameRow]                                           │
│  [GameRow]                                           │
│  [GameRow]                                           │
│  ...                                                 │
├─────────────────────────────────────────────────────┤
│  WEEK 2  ·  Sep 12 – Sep 16                         │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

- **Sticky page header**: pick progress summary + Randomize/Submit controls. Remains visible while scrolling.
- **Week group headers**: sticky while the user is scrolling through that week's games (CSS `position: sticky` with incrementing `top` offsets so the current week label is always visible). Each week header also shows that week's pick completion (e.g. "Week 1 — 14 / 16 picked").
- **Jump nav**: a compact horizontal week-number strip (1–18) below the page header. Clicking a number smooth-scrolls to that week group and highlights the active week as the user scrolls (Intersection Observer). This is not a tab bar — it's a quick-jump anchor row.
- Link to `/grid/week/:weekNumber` on each week header, for the focused single-week view.

#### 5.4.2 Game row (the match bar)

Each row represents one game:

```
[ Away Logo  Away Name ]   [ Away Score* ]  |  TIE  |  [ Home Score* ]   [ Home Name  Home Logo ]
```

*Scores shown only when game status is `in_progress` or `final`. Pre-game: score area is blank.

**Pick interactions (pre-lock):**
- Clicking the left half of the row → picks the away team.
- Clicking the center TIE element → picks a Tie.
- Clicking the right half → picks the home team.
- Active pick: the chosen side gets a `--signal` yellow bottom-border and full opacity; the other side(s) dim to 40% opacity.
- No pick yet: all three areas at full opacity with a neutral `--border` divider.

**Post-game result indicators (when `games.result` is known):**
- The row shows the final score in mono type.
- The user's pick cell gets a ✓ (correct, yellow) or ✗ (incorrect, muted) icon. Color is never the sole indicator.
- If the game hasn't finished yet (status `scheduled` or `in_progress`), no correctness indicator is shown.

**Post-lock:** All rows are read-only. Pick interactions are disabled. Current pick is shown as frozen (same visual as active, but no hover state).

#### 5.4.3 Pick persistence (pre-lock)

- Each pick fires `PUT /api/seasons/:year/picks/:gameId` immediately on click — no per-row save button.
- While the request is in-flight: dim the row slightly; store the `gameId` in a pending-set in local state.
- On error: revert the visual selection; show an inline error message on that row ("Couldn't save — try again").
- Use TanStack Query's `useMutation` with `onMutate`/`onError`/`onSettled` for optimistic updates. Invalidate `['picks', year, 'me']` and `['gridStatus', year, 'me']` on success.

#### 5.4.4 Sticky header controls (pre-lock)

- **Randomize**: `POST /api/seasons/:year/picks/randomize`. Show a confirmation dialog before firing: "This will overwrite all your picks. Continue?" On success, refetch all picks. Disabled post-lock.
- **Submit Grid**: enabled only when local pick state shows the Grid is complete (all games picked + ≥1 Tie). Disabled state shows a tooltip naming what's missing: "3 games unpicked" or "No Tie pick yet". Calls `POST /api/seasons/:year/grid/submit`. On success: button updates to "Grid submitted ✓" (non-interactive confirmation state). On server validation error: surface the specific message inline in the header.

#### 5.4.5 Post-lock state

When the season is `locked`, `in_progress`, or `completed`:
- Sticky header: Randomize and Submit buttons replaced by a "Picks are locked" label with the lock timestamp.
- All game rows: read-only.
- If the Grid was invalid at lock: a prominent warning banner below the sticky header — "Your Grid was not valid at lock time and will not appear in leaderboards or comparisons."

---

### 5.5 My Grid — Week View (`/grid/week/:weekNumber`)

A focused view of a single week's games. Uses the same `<GameRow>` component and the same pick interaction behavior as the full season view.

**Layout:**
- Page header: "Week [N]" + that week's pick completion (e.g. "14 / 16 picked this week") + Randomize/Submit controls (same as full season view — they operate on the whole Grid, not just the week).
- Prev/Next week navigation arrows (← Week 4 | Week 6 →).
- All games for that week, in kickoff-time order.
- "View Full Season" link → `/grid`.

---

### 5.6 Other User's Grid — Full Season View (`/grid/:userId`)

Only accessible post-lock. If accessed pre-lock, show an inline message: "Grids are hidden until the season locks" and a link back to the dashboard — do not redirect.

Layout is identical to the My Grid full season view (§5.4) but fully read-only. The same `<GameRow>` component renders the viewed user's picks. The sticky header shows the viewed user's username, their Grid validity status, and their current accuracy stats. No Randomize or Submit controls.

A "Compare with me" button in the header → `/compare/me/:userId`.

---

### 5.7 Other User's Grid — Week View (`/grid/:userId/week/:weekNumber`)

Same relationship to §5.6 as §5.5 is to §5.4. Read-only, single week, same navigation pattern.

---

### 5.8 Season Leaderboard (`/leaderboard`)

**Purpose**: Rank all users with a submitted (valid, locked) Grid by total correct picks for the season so far.

**Access**: Available to all members post-lock. Pre-lock: show a holding message — "The leaderboard will be available once picks lock."

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│  Season 2026 Leaderboard                  [Week 7 ▼]       │
├────────────────────────────────────────────────────────────┤
│  Rank │ User         │ Correct │ Decided │ Remaining │ Pct  │
│  ─────┼──────────────┼─────────┼─────────┼───────────┼───── │
│   1   │ alice        │  124    │  140    │  132      │ 89%  │
│   2   │ bob          │  119    │  140    │  132      │ 85%  │
│  ...                                                        │
└────────────────────────────────────────────────────────────┘
```

**Columns:**
- **Rank**: ordinal position (ties in correct count share a rank; next rank skips, e.g. 1, 2, 2, 4).
- **User**: username, links to `/grid/:userId`.
- **Correct**: correct picks so far (mono type).
- **Decided**: total games with a final result (same for all users; shown once in the column header or as a shared sub-label).
- **Remaining**: games not yet played.
- **Pct**: correct / decided, as a percentage (mono type).

**Week navigation**: a "Week [N] ▼" dropdown in the top-right of the page header, pre-populated with all weeks that have at least one final game. Selecting a week navigates to `/leaderboard/week/:weekNumber`. "Season" option navigates back to `/leaderboard`.

**Logged-in user's row**: always highlighted (subtle `--surface` background with a `--signal` left border), even if it's not in view — sticky to the bottom of the table when scrolled past.

**Sorting**: default is rank (correct picks, descending). No other sort needed for v1.

---

### 5.9 Weekly Leaderboard (`/leaderboard/week/:weekNumber`)

**Purpose**: Rank users by correct picks for a single week only.

**Access**: Same as season leaderboard — post-lock only.

**Layout**: Identical table structure to §5.8, but scores reflect only that week's games.

**Columns** (same as §5.8, but scoped to the week):
- Rank, User, Correct (this week), Games This Week (total), Pct.

**Week navigation**: Same dropdown as §5.8 for jumping between weeks. "Full Season" option → `/leaderboard`.

**Week header**: displays the week's date range (e.g. "Week 7 · Oct 17–21, 2026") and total games in that week.

---

### 5.10 Grid Comparison (`/compare/:userIdA/:userIdB`)

**Purpose**: Side-by-side game-by-game comparison of two users' Grids.

Only accessible post-lock. Pre-lock: show an inline holding message, do not redirect.

**Header (above table):**
- Both usernames (each links to their Grid view).
- Overall accuracy for each: `correct / decided` in mono type.
- Agreement rate: count and percentage of games where both users made the same pick.

**Table layout:**

| Week | Game (Date · Away @ Home) | [User A pick · correct?] | Final Result | [User B pick · correct?] |
|---|---|---|---|---|

- Games grouped by week with a sticky week header row.
- **Correct pick**: `--signal` yellow text + ✓ icon.
- **Incorrect pick**: `--chalk-muted` text + ✗ icon.
- **Pending** (game not yet final): chalk text, no icon.
- **Agreement rows** (both users made the same pick): a thin `--signal` left-border on the row to draw the eye to consensus picks.
- **Disagreement rows**: no special highlight — the visual contrast between the two pick cells is enough.

**Week jump nav**: compact 1–18 number strip above the table, same pattern as the full season Grid view. Scrolling updates the active week indicator via Intersection Observer.

**"Compare" links**: in the Other User's Grid header (§5.6), clicking "Compare with me" pre-fills `userIdA` as the logged-in user.

---

### 5.11 Admin Panel (`/admin`)

Simple utility screen — function over form.

**Season Management section:**
- Current season year and status.
- "Import Schedule" button → `POST /api/admin/seasons/:year/import-schedule`. Displays result inline: games imported, derived `lock_at` time.
- "Refresh Scores" button → `POST /api/admin/seasons/:year/refresh-scores`. Displays result inline: games updated, picks rescored.
- Both buttons show a loading spinner while in-flight and surface the server's response message on completion.

**Users section:**
- Table: username, email, role, Grid status (valid/invalid/incomplete), accuracy if season is live.

---

## 6. Shared Components

### 6.1 `<GameRow>`

The match bar. Props:
- `game: Game` — full game object with team data, kickoff, scores, result.
- `pick?: Pick` — the current pick for this game, if any.
- `onPick?: (gameId: number, pickedTeamId: number | null, pickType: 'team_win' | 'tie') => void` — omit or leave undefined for read-only rendering.
- `readOnly?: boolean` — disables all interactions; used post-lock and in viewer/comparison contexts.
- `isPending?: boolean` — true while a save request for this game is in-flight; triggers loading visual.

### 6.2 `<WeekGroup>`

Wraps a week's worth of `<GameRow>` components with a sticky week header. Props:
- `week: Week`
- `games: Game[]`
- `picks: Record<number, Pick>` — keyed by gameId.
- `onPick?: (...)` — passed through to each `<GameRow>`.
- `readOnly?: boolean`
- `pendingGameIds?: Set<number>`

The week header includes: "WEEK N · [date range]" and a pick-completion count badge ("14 / 16").

### 6.3 `<SeasonGrid>`

The scrollable full-season game list. Renders a `<WeekGroup>` per week. Also manages the week jump nav strip and Intersection Observer logic for tracking which week is in the viewport. Used by both the My Grid view and the Other User's Grid view.

Props:
- `weeks: Week[]`
- `games: Game[]`
- `picks: Record<number, Pick>`
- `onPick?: (...)`
- `readOnly?: boolean`
- `pendingGameIds?: Set<number>`

### 6.4 `<LeaderboardTable>`

Reused by both `/leaderboard` and `/leaderboard/week/:weekNumber`. Props:
- `entries: LeaderboardEntry[]`
- `currentUserId: number` — for highlighting the logged-in user's row.
- `scope: 'season' | 'week'`
- `weekNumber?: number` — for the week-scoped header.

### 6.5 `<AccuracyBar>`

Three-segment bar. Props: `correct: number`, `incorrect: number`, `undecided: number`.

### 6.6 `<LockCountdown>`

Ticking countdown to `lock_at`. Accepts `lockAt: string | null`. If null, renders "Schedule not yet available." Uses `useEffect` + `setInterval`, cleared on unmount.

### 6.7 `<GridStatusSummary>`

Pick progress and validity summary. Props: `status: GridStatus`. Used in the dashboard, the Grid view sticky header, and the Other User's Grid header. Renders differently depending on whether it's the current user's own status or another user's.

### 6.8 `<WeekNav>`

Dropdown or link-pair (prev/next) used in the week views. Props: `currentWeek: number`, `totalWeeks: number`, `basePath: string` (e.g. `/grid/week` or `/leaderboard/week`).

---

## 7. API Client Layer

All HTTP calls go through a typed client module (`src/api/client.ts`). It wraps `fetch` with:

- Base URL from `VITE_API_BASE_URL`.
- Automatic `credentials: 'include'` on every request (session cookies).
- A typed `ApiError` class with `status` and `message`, thrown on non-2xx responses. The `423 Locked` status is caught and displayed as "The season has started. Picks are locked."
- Response bodies typed via shared TypeScript interfaces (§8).

**Typed methods:**
```typescript
// Auth
register(body: RegisterRequest): Promise<User>
login(body: LoginRequest): Promise<User>
logout(): Promise<void>
getMe(): Promise<User>

// Season & schedule
getSeason(year: number): Promise<Season>
getGames(year: number): Promise<Game[]>

// Picks
getPicks(year: number): Promise<Pick[]>
setPick(year: number, gameId: number, body: PickRequest): Promise<Pick>
randomizePicks(year: number): Promise<Pick[]>
submitGrid(year: number): Promise<GridStatus>
getGridStatus(year: number): Promise<GridStatus>

// Other users
getUserGrid(year: number, userId: number): Promise<UserGridResponse>

// Comparison
compareGrids(year: number, userIdA: number, userIdB: number): Promise<ComparisonResponse>

// Leaderboards
getSeasonLeaderboard(year: number): Promise<LeaderboardEntry[]>
getWeekLeaderboard(year: number, weekNumber: number): Promise<LeaderboardEntry[]>

// Admin
importSchedule(year: number): Promise<ImportResult>
refreshScores(year: number): Promise<RefreshResult>
```

---

## 8. Shared TypeScript Interfaces

`src/types/index.ts`:

```typescript
interface Team {
  id: number;
  espnTeamId: string;
  name: string;
  location: string;
  abbreviation: string;
  logoUrl: string | null;
}

interface Week {
  id: number;
  seasonId: number;
  weekNumber: number;
  seasonType: number;
}

interface Game {
  id: number;
  seasonId: number;
  weekId: number;
  weekNumber: number;
  homeTeam: Team;
  awayTeam: Team;
  kickoffAt: string;        // ISO 8601 UTC
  startTimeEt: string | null;
  location: string | null;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore: number | null;
  awayScore: number | null;
  result: 'home_win' | 'away_win' | 'tie' | null;
}

interface Pick {
  id: number;
  userId: number;
  gameId: number;
  pickedTeamId: number | null;
  pickType: 'team_win' | 'tie';
  isCorrect: boolean | null;
}

interface Season {
  id: number;
  year: number;
  lockAt: string | null;    // ISO 8601 UTC; null until schedule imported
  status: 'upcoming' | 'picks_open' | 'locked' | 'in_progress' | 'completed';
}

interface GridStatus {
  totalGames: number;
  picksMade: number;
  tiePicks: number;
  isComplete: boolean;
  isValid: boolean;         // complete + ≥1 Tie
  submittedAt: string | null;
  correctCount: number;
  decidedCount: number;
}

interface User {
  id: number;
  username: string;
  role: 'member' | 'admin';
}

interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'username'>;
  correctCount: number;
  decidedCount: number;
  remainingCount: number;
  pct: number;              // 0–100
}

interface UserGridResponse {
  user: Pick<User, 'id' | 'username'>;
  gridStatus: GridStatus;
  picks: Pick[];
}

interface ComparisonResponse {
  userA: Pick<User, 'id' | 'username'>;
  userB: Pick<User, 'id' | 'username'>;
  accuracyA: { correct: number; decided: number };
  accuracyB: { correct: number; decided: number };
  agreementCount: number;
  agreementPct: number;
  games: Array<{
    game: Game;
    pickA: Pick | null;
    pickB: Pick | null;
  }>;
}
```

---

## 9. State Management

**Auth state** (global):
- React Context (`AuthContext`): `currentUser: User | null`, `isLoading: boolean`.
- On app mount: call `GET /api/auth/me` to rehydrate session. `AuthGuard` consumes this context.

**Server data** (TanStack Query keys):
- `['season', year]` — season metadata; refetch on window focus; triggers lock-state transition.
- `['games', year]` — full game list; long `staleTime` (rarely changes post-import).
- `['picks', year, 'me']` — own picks; invalidated on every pick mutation and on randomize.
- `['gridStatus', year, 'me']` — validity/accuracy; invalidated on pick mutations and score refresh.
- `['grid', year, userId]` — another user's picks + status; read-only, fetched on demand.
- `['comparison', year, userIdA, userIdB]` — comparison response.
- `['leaderboard', year]` — season leaderboard.
- `['leaderboard', year, 'week', weekNumber]` — weekly leaderboard.

**Ephemeral UI state** (local `useState`):
- `pendingGameIds: Set<number>` — game IDs with an in-flight save request (for per-row loading state).
- Active week in the jump nav (derived from Intersection Observer; not persisted).
- Confirm dialog open state (Randomize, Submit).

---

## 10. Key UX Details

### 10.1 Optimistic updates on pick selection

Apply the pick visually before the `PUT` request resolves:
- **On success**: no further visual change (the optimistic state was correct).
- **On failure**: roll back the visual state; show an inline row-level error.

Use TanStack Query `onMutate`/`onError`/`onSettled`.

### 10.2 Lock state transitions

The client polls `GET /api/seasons/:year` every 60 seconds while status is `picks_open`. The `<LockCountdown>` component also fires a refetch when its countdown reaches zero. When the response status changes to `locked`, all pick-entry UI switches to read-only without a page reload.

### 10.3 Empty states

- No picks yet → full-width nudge on the grid page with a "Get started" callout summarising the rules (all games must be picked, at least one Tie, picks lock on [date]).
- Another user's Grid not available pre-lock → inline message: "Check back after picks lock on [lock_at date]."
- Leaderboard pre-lock → "The leaderboard will be available once picks lock."
- No completed Grids from others yet → "No valid Grids to compare yet."
- A week with no final games → weekly leaderboard shows a "No results yet for this week" message.

### 10.4 Error handling

- Network error (no response): toast — "Connection error. Check your network and try again."
- `401 Unauthorized`: redirect to `/login`.
- `423 Locked`: inline persistent message on the Grid page — "The season has started. Picks are locked." Not a toast.
- `500` / other server errors: toast — "Something went wrong. Try again in a moment."

### 10.5 Accessibility

- All interactive game rows: keyboard-navigable with `Tab` to focus the row, `ArrowLeft`/`ArrowRight` to cycle between away / tie / home, `Enter`/`Space` to confirm.
- Team logos: `alt` set to the full team name.
- Accuracy bar and leaderboard percentage cells: `aria-label` with numeric values.
- Correctness indicators: always use both color and an icon (✓ / ✗) — color is never the sole indicator.
- Leaderboard table: proper `<thead>` / `<tbody>` / `<th scope="col">` markup.

---

## 11. Build & Environment

```
VITE_API_BASE_URL=http://localhost:3001
```

`vite.config.ts` should proxy `/api` to the backend in development to avoid CORS issues.

---

## 12. Suggested Build Order

1. **Scaffold**: Vite + React + TypeScript + Tailwind. Routing, `AuthContext`, API client, shared types.
2. **Auth screens**: Register, Login.
3. **Dashboard**: season banner + lock countdown + Grid status card.
4. **Full-season Grid view**: `<SeasonGrid>` + `<WeekGroup>` + `<GameRow>` with pick interaction + `PUT` mutation + optimistic updates. This is the highest-value screen — get it right before building the week view.
5. **Week view**: reuses all components from step 4; adds `<WeekNav>`.
6. **Submit + Randomize flows**.
7. **Post-lock read-only mode** + other user's Grid views (`/grid/:userId`, `/grid/:userId/week/:weekNumber`).
8. **Leaderboards**: season (`/leaderboard`) then weekly (`/leaderboard/week/:weekNumber`).
9. **Comparison view** (`/compare`).
10. **Admin panel**.
11. **Polish**: full Tailwind styling pass, typography, motion, accessibility audit.
