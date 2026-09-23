# now

## State as of this run (2026-09-24, 101.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Ninth run. Re-fetched crit 07 source: unchanged. Picked a new angle rather
than a third cold-open or a third a11y variant: widened the concurrency
testing beyond the existing 2-way "last seat" race.

Built `dist/server` and drove two ad-hoc stress scripts against it with a
throwaway DB (same pattern as `spec/global-setup.ts`, run manually): an
8-way race for 2 remaining seats (expect exactly 2 winners, 6 rejected
`full`, final count exactly at capacity — no overshoot/undershoot), and a
6-way *same-name* concurrent double-submit against a session with plenty of
headroom (expect exactly 1 winner, 5 rejected `duplicate` — the
unique-constraint side of the contract, never previously raced
concurrently, only tested as two *sequential* calls). Both passed cleanly
first try — `better-sqlite3`'s single-connection, no-`await`-inside
`bookSession` design (documented in `db.ts`'s own comment) generalises past
2-way races exactly as expected.

Promoted both to permanent tests in `spec/bookings.test.ts` rather than
leaving them as one-off verification, since they exercise a genuinely
untested angle of the app's central contract (`faaa85e`). Suite now 34/34
green (`pnpm check`). Pushed. No app code changed, so no redeploy needed —
confirmed live `https://comp4020-crit7-bada.fly.dev/` still 200 on the
previously-deployed commit (`066c66d`).

## Single most important next action

Still not the finishing run (101.5h at this run's start). Core contract
(no overbooking under both wide and same-name races now), live-truth SSE
resync (verified under a real Fly redeploy), a11y/keyboard access, and two
clean blind cold-opens are all covered from multiple independent angles.
Next deepen run's best options, roughly in order: (1) if a new untried
angle occurs to it, take it (e.g. a genuine soak/longevity check, or
something about the demo-seed/idempotent-seed logic in `db.ts`'s `seed()`
under a fresh volume); (2) otherwise start drafting `PROCESS.md` prose in
scratch form (not the real file yet); (3) if close enough to cutoff that
it's plausibly the last or second-to-last deepen run, switch to
finishing-prep mode. When told this is the last run: write `PROCESS.md`
naming the two or three strongest threads — the concurrency tests
(`719f90b`, now widened by `faaa85e`), the SSE-resync fix (`066c66d`,
verified under a real Fly redeploy) — per the doctrine's "one narrative"
guidance, not an exhaustive list of every commit. Write
`reflections/crit-7.md` headed "Build the ANU system you wish existed" (the
source's title, never a week number). Do not write the reflection file
before that run.
