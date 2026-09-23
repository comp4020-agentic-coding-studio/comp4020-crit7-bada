# now

## State as of this run (2026-09-23, 112.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Eighth run. Re-fetched the crit 07 source: unchanged. Rather than repeat a
third blind cold-open (the previous hand-off flagged this as premature —
only ~6h had passed since the last one) or force a schema change just to
exercise `pnpm db:generate` (nothing in the brief needs the schema to grow),
picked a genuinely untried angle: a formal real-browser accessibility pass.

Ran `agent-browser a11y <url> --json` (a built-in axe-core runner, simpler
than the manual CDN-fetch-and-eval technique this repo's memory otherwise
documents) against both pages (`/`, `/readme/`) at desktop and 390×844
mobile viewports — 0 violations, 0 incomplete every time, including colour
contrast, which a real browser can resolve unlike jsdom. Followed with a
real keyboard-only booking: typed via `agent-browser keyboard type` (real
keystrokes) into the first session's name field, submitted with `press
Enter` (no click), confirmed it landed. Then tabbed from a cold load and
read `document.activeElement` + computed `outlineStyle` at each stop — nav
links then straight into the session form, visible focus outline at every
stop, no `all: unset`-style reset stripping it anywhere on this page. All
clean, no code change needed. Full detail in `MEMORY.md`.

`pnpm check` still 32/32 green after clearing the local `.data/` used for
this run's own keyboard test. Working tree clean, nothing to commit. Live
`https://comp4020-crit7-bada.fly.dev/` still answers 200, same deployed
commit as before (`066c66d`) — no redeploy needed since nothing changed.

## Single most important next action

Not the finishing run yet (112.5h at this run's start). The core contract
(no overbooking, live truth in every tab, no silent failure on a dropped
connection) plus discoverability (two cold-opens), a11y and keyboard access
are now all thoroughly checked from multiple independent angles with clean
results throughout. The next deepen run's best use of time is probably one
of: (1) start actually drafting `PROCESS.md` prose in scratch form (still
don't write the real file — that's a finishing step) so the finishing run
moves faster; (2) a light stress/soak check (e.g. many rapid sequential
bookings across sessions) if an angle not yet tried occurs to it; (3) if
close enough to the cutoff that it's plausibly the last or second-to-last
deepen run, start treating this as pre-finishing prep rather than opening a
new investigation thread. When told this is the last run: write
`PROCESS.md` naming the two or three strongest threads (the concurrency
test `719f90b`, the SSE-resync fix `066c66d` verified under a real Fly
redeploy, and possibly the not-found coverage `28fc134` — not all of them,
per the doctrine's "one narrative" guidance — this run's a11y/keyboard pass
is a fine namecheck but doesn't need its own commit citation since it made
no code change), and write `reflections/crit-7.md` headed "Build the ANU
system you wish existed" (the source's title, never a week number). Do not
write the reflection file before that run.
