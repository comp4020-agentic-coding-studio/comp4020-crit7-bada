# now

## State as of this run (2026-09-25, 70.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Thirteenth run. Re-fetched crit 07 source: unchanged (same title/body/related
as every prior read; the plugin-update warning box still doesn't apply --- no
`comp4020` plugin in this agent's skill list).

Found a genuinely new angle by checking the README's own stated contract
literally rather than testing behaviour: README says duplicate prevention is
"a unique constraint on (session_id, person_name)," but the constraint was on
the raw typed name, so "Ada" then "ADA" into the same session booked as two
different people --- trivially bypassing the app's whole one-seat-per-person
promise. Twelve prior runs' concurrency races, cold-opens, and a11y passes
never caught this.

Fixed with a schema change (`dc0d99a`):

- `bookings.personNameKey`, a SQLite virtual generated column
  (`lower(trim(person_name))`), carries the unique index instead of the raw
  `personName` column, which stays as-is for display
- `bookSession`'s app-level duplicate check in `src/lib/db.ts` now compares
  against the same normalized form
- added a regression test in `spec/bookings.test.ts` booking "ADA" right
  after "Ada" and expecting the duplicate rejection

Real gotcha hit generating the migration, now in `MEMORY.md`: a `stored`
generated column can't be added to an existing table via `ALTER TABLE` in
SQLite, and `drizzle-kit generate` silently produces a broken migration for
it (prints a warning, then omits the `ADD COLUMN` statement entirely) ---
`mode: "virtual"` is the fix, and a `CREATE UNIQUE INDEX` on a virtual
generated column is valid SQLite.

Verified thoroughly before shipping, not just "tests pass":

- rebuilt a throwaway DB through the *old* migration set first (so drizzle's
  own migration-tracking table is populated the real way, not hand-seeded),
  inserted a real booking row, then applied the *new* migration set on top
  and confirmed it upgrades cleanly with the generated column backfilling
  correctly for the pre-existing row
- queried the actual deployed Fly volume directly (`flyctl machine start`,
  then `flyctl ssh console` running a `node -e` one-liner against
  `better-sqlite3` — no `sqlite3` binary in the image) and confirmed
  production currently holds zero real bookings, so the new constraint
  couldn't conflict with anything already on disk
- `pnpm check` 35/35 (was 34), typecheck clean
- confirmed live against a local dev server with `agent-browser`: booked
  "Grace" then "GRACE" into the same session, got the same
  highlight/scroll/focus duplicate-rejection UI as any other duplicate ---
  screenshotted before committing
- shut the dev server down by PID afterwards and confirmed the port was
  actually free (not just trusting job control)

Pushed and deployed (`flyctl deploy --remote-only --ha=false
-a comp4020-crit7-bada`). Boot logs clean (migration applied with no error),
live URL confirmed 200. Did **not** submit the booking form against
production itself — only checked the page loads — since the app still has no
delete/cancel and a test booking there would be permanent junk, per the
standing rule already in `MEMORY.md`.

## Single most important next action

Still not the finishing run (70.5h at this run's start). This is now a sixth
strong thread alongside concurrency (`719f90b`, `faaa85e`), SSE-resync
(`066c66d`), the RST-disconnect edge case, the live-update
accessibility/focus fix (`0ecbbd8`), and the dead-query-param fix
(`f7baee5`). Next deepen run's options, in order: (1) if a genuinely new
angle occurs to it, take it --- the pattern that keeps working is checking
the app's own stated claims (README, code comments) against what the code
actually does, not just repeating an already-answered cold-open or a11y
pass; (2) otherwise start drafting `PROCESS.md`/reflection language in
scratch form (not the real files yet); (3) once told this is the last run,
write the real `PROCESS.md` naming the strongest 2--3 threads and
`reflections/crit-7.md` headed "Build the ANU system you wish existed" (the
source's title, never a week number). Candidates for the reflection
breakthrough, in descending order of fit: the live-update
accessibility/focus fix (`0ecbbd8`, ties directly to the app's own stated
selling point) and this run's case-folded-duplicate fix (a stated contract
that was silently broken since the very first commit, only found by reading
the README against the schema rather than testing behaviour) are both
strong candidates now --- worth deciding between them explicitly at the
finishing run rather than defaulting to whichever was found first. Do not
write the reflection file before that run.
