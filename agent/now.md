# now

## State as of this run (2026-09-24, 94.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Tenth run. Re-fetched crit 07 source: unchanged (confirmed against the
previous run's read, not re-summarized from scratch).

Looked hard for a new untried angle before accepting a clean result: read
`bookSession`/`schema.ts`/`bookings.ts`/`index.astro`/`events.ts` end to
end looking for anything the nine prior runs' concurrency, SSE-resync,
RST-disconnect, a11y, and two cold-open passes hadn't touched. Two
candidates surfaced and were explicitly triaged, not silently dropped:

- Duplicate-name matching is case-sensitive (`"Ada"` and `"ada"` are
  distinct rows, both allowed). Checked against the brief's own stated bar
  ("a unique constraint on (session_id, person_name)") and the README's
  explicit no-real-accounts descoping --- concluded this matches the stated
  contract exactly, not a gap against it. Not fixed, deliberately: forcing
  case-folding here would be scope invention, not a bug fix.
- Schema/migration drift: ran `pnpm db:generate` to check `schema.ts`
  against the committed `drizzle/0000_broken_dakota_north.sql` --- "No
  schema changes, nothing to migrate," confirming they're still in sync.
  A genuine check with a legitimate clean result (the failure mode this
  would have caught: someone editing `schema.ts` without regenerating/
  committing the migration, which would make the deployed migrate-at-boot
  step silently diverge from what the app code assumes).

No app code changed this run. `pnpm check` 34/34 green, `astro check` 0/0/0.
Live `https://comp4020-crit7-bada.fly.dev/` still 200. Nothing to commit
(working tree was already clean; the `db:generate` run produced no new
migration file since there was no drift to capture).

## Single most important next action

Still not the finishing run (94.5h at this run's start). The core contract,
SSE live-truth/resync, a11y/keyboard, and cold-open coverage are all solid
from multiple angles now, and this run's fresh look came back clean rather
than finding a tenth thing to fix --- that's a legitimate outcome at this
point, not a reason to force an eleventh audit angle next run too. Next
deepen run's options, in order: (1) if a genuinely new angle occurs to it,
take it, but don't manufacture one; (2) otherwise this is a reasonable
point to start drafting `PROCESS.md`/reflection language in scratch form
(not the real files) so the eventual finishing run is faster; (3) once told
this is the last run, write the real `PROCESS.md` naming the two or three
strongest threads --- the concurrency tests (`719f90b`, widened by
`faaa85e`), the SSE-resync fix (`066c66d`, verified under a real Fly
redeploy) --- per the doctrine's "one narrative" guidance, and write
`reflections/crit-7.md` headed "Build the ANU system you wish existed" (the
source's title, never a week number). Do not write the reflection file
before that run.
