# now

## State as of this run (2026-09-25, 64.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Fourteenth run. Re-fetched crit 07 source: unchanged (same title/body/related
as every prior read; the plugin-update warning box still doesn't apply --- no
`comp4020` plugin in this agent's skill list).

Found a second layer under the previous run's case-fold duplicate-name fix
(`dc0d99a`): SQLite's built-in `lower()` only folds ASCII, so the generated
`person_name_key` column and the app-level JS pre-check in `bookSession`
quietly disagreed on non-ASCII names --- booking "FRANÇOIS" then "françois"
into the same session succeeded as two different people, both at the
app-level check and the unique index itself, overbooking a session the
schema's own comment says can never overbook. Verified empirically with a
throwaway vitest probe before touching anything.

Fixed (`36417f9`):

- `src/lib/db.ts` registers a custom deterministic SQL function
  (`name_key`, backed by the exact JS `.trim().toLowerCase()` the app
  already uses) via better-sqlite3's `client.function(...)`
- `src/lib/schema.ts`'s generated column now calls `name_key(person_name)`
  instead of built-in `lower(trim(person_name))`, so the DB side and the
  app-level pre-check can't diverge on any input, ASCII or not
- added a regression test in `spec/bookings.test.ts` booking "FRANÇOIS"
  then "françois" and expecting the duplicate rejection

Real gotcha hit generating the migration, now in `MEMORY.md`: `drizzle-kit
generate` for this change tried to `DROP COLUMN` before dropping the unique
index that references it --- SQLite rejects that outright. Hand-fixed the
migration to `DROP INDEX` first. Also hit a test-ordering gotcha: a new test
inserted earlier in `spec/bookings.test.ts` that left its own session
partially booked broke a *later*, unrelated test's `capacity - 1` filler
math --- fixed by making the new test fully consume whatever seats it
touches, matching the existing convention.

Verified thoroughly before shipping:

- rebuilt a throwaway DB through the *old* migration set, booked a real
  "FRANÇOIS" row via the actual built server's POST endpoint, then rebooted
  the *new* build against that same file and confirmed the migration
  applied cleanly and the duplicate case now correctly redirects to
  `?error=duplicate`
- `pnpm check` 36/36 (was 35), typecheck clean
- confirmed live against a local dev server with `agent-browser`: booked
  "Müller" then "müller" through the real form (keyboard-typed, not
  `.value =`), got the same highlight/scroll/focus duplicate-rejection UI
  as any other duplicate --- screenshotted before committing
- shut the dev server and browser down properly, confirmed the port was
  actually free
- queried the deployed Fly volume directly before deploying (`flyctl
  machine start` + `flyctl ssh console` + a `node -e` one-liner) and
  confirmed production still holds zero real bookings, so the new
  constraint couldn't conflict with anything already there

Pushed and deployed (`flyctl deploy --remote-only --ha=false
-a comp4020-crit7-bada`). Live URL confirmed 200, page renders all five
seeded sessions at 0 booked, no test data left behind.

## Single most important next action

Still not the finishing run (64.5h at this run's start). This is now a
seventh strong thread alongside concurrency (`719f90b`, `faaa85e`),
SSE-resync (`066c66d`), the RST-disconnect edge case, the live-update
accessibility/focus fix (`0ecbbd8`), the dead-query-param fix (`f7baee5`),
and the ASCII case-fold fix (`dc0d99a`) --- this run's Unicode case-fold fix
(`36417f9`) closes the gap the previous fix left open. Next deepen run's
options, in order: (1) if a genuinely new angle occurs to it, take it ---
the pattern that keeps working is checking the app's own stated claims
(README, schema comments) against what the code actually does, at
increasing levels of rigor (ASCII case fold, then Unicode case fold was the
next layer down --- worth asking whether there's a third layer, e.g. NFC vs
NFD Unicode normalization: does "é" (single codepoint U+00E9) collide with
"e" + combining acute (U+0065 U+0301)? Untested); (2) otherwise start
drafting `PROCESS.md`/reflection language in scratch form (not the real
files yet); (3) once told this is the last run, write the real
`PROCESS.md` naming the strongest 2--3 threads and `reflections/crit-7.md`
headed "Build the ANU system you wish existed" (the source's title, never a
week number). Candidates for the reflection breakthrough, now three deep:
the live-update accessibility/focus fix (`0ecbbd8`, ties directly to the
app's own stated selling point), the ASCII case-fold fix (`dc0d99a`,
stated contract silently broken since the first commit), and this run's
Unicode layer (`36417f9`, the same contract broken again in a way the
first fix didn't anticipate, real-world relevant for an ANU population) ---
still worth deciding explicitly at the finishing run, not defaulting to
whichever was found first or found last. Do not write the reflection file
before that run.
