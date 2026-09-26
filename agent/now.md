# now

## State as of this run (2026-09-26, ~40.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Seventeenth run. Re-fetched crit 07 source: unchanged. Took the previous
hand-off's explicit suggestion and rotated onto the read path (attendee-list
ordering) rather than a fifth layer of the name-key/case-fold/emptiness
validation family.

Found and fixed (`35cfd68`): neither `listSessions`'s per-session attendee
query nor the identical-shaped query inside `bookSession`'s transaction (used
to build the SSE broadcast payload) had an `ORDER BY`. Confirmed via
`EXPLAIN QUERY PLAN` on a scratch DB reproducing the real schema that SQLite
satisfies a plain `WHERE session_id = ?` by walking the
`(session_id, person_name_key)` unique index, so attendees came back sorted
by folded name, not by signup order --- an accident of the query plan, and
nothing guaranteed the two identically-shaped queries would keep agreeing
with each other if a future schema/index change shifted one plan and not the
other. Fixed with an explicit `.orderBy(bookings.id)` on both. Added a
regression test ("lists attendees in signup order, not alphabetical order")
booking two names in reverse-alphabetical signup order and asserting the
page lists them in booking order. `pnpm check` 41/41.

Positioned the new test as the last one in `spec/bookings.test.ts` --- every
earlier test in that file either leaves its session fully booked or computes
its own filler count, and this file's own shared-seed-pool hazard (already
documented in MEMORY.md) means a draining test placed mid-file can starve a
later test's `findSessionWithSpareCapacity()` call. First attempt placed it
before the double-submit-race test with a filler-drain loop and did exactly
that; fixed by moving it to genuinely last (no filler loop needed there) and
re-verified 41/41.

Verified twice before committing: the new JSDOM-based spec test, and
separately a live `pnpm dev` run on a dedicated port against a fresh
throwaway DB (booked "Zeta Booker" then "Beta Booker" via raw `curl` POSTs,
confirmed the rendered page lists Zeta before Beta). Deliberately did not
re-verify by booking real names against production --- unlike the previous
run's ZWSP fix (a rejected request leaves no trace), this fix is only
observable by actually taking real seats, and the app has no delete/cancel,
so doing that on the shared production volume would leave permanent junk for
a cosmetic bug. Confirmed instead that all five seeded sessions still read
`0 booked` live after deploying, i.e. the deploy shipped clean with no side
effect of its own.

Pushed (`35cfd68`) and deployed (`flyctl deploy --remote-only --ha=false
-a comp4020-crit7-bada`). Live URL confirmed serving (200, all five sessions
present, still `0 booked` each).

## Single most important next action

Still not the finishing run (~40.5h at this run's start, was ~46.5h last
run). `PROCESS.md` already exists but hasn't been revisited to fold in
threads found since; `reflections/crit-7.md` correctly does not exist yet ---
don't write it before told this is the last run.

Strong threads to draw the finishing `PROCESS.md`/reflection from, roughly
chronological: concurrency (`719f90b`, `faaa85e`), SSE-resync (`066c66d`),
a verified-clean RST-disconnect edge case, the live-update
accessibility/focus fix (`0ecbbd8`), the dead-query-param fix (`f7baee5`),
the three-layer name-key case-fold family (`dc0d99a` ASCII, `36417f9`
non-ASCII, `9cf3082` normalization form), the invisible-name validation fix
(`235ee89`), and this run's attendee-ordering fix (`35cfd68`). Treat the
name-key/validation family as exhausted (four layers across three runs is
enough) and don't force a fifth. If a further deepen run happens before the
finishing one, prefer a genuinely new angle again rather than re-drilling
either the validation family or the ordering fix just done --- candidates
not yet tried: the deploy/ops side proper (fly.toml machine config,
Dockerfile layer caching, `checks.yml` CI itself), or something in the
courses/read-only listing page beyond ordering (e.g. how `listCourses`
composes multiple courses, or whether the readme/process pages hold up
under the same scrutiny the booking flow has had).

Candidates for the reflection breakthrough, in order of strength: the ASCII
case-fold fix (`dc0d99a` --- turned "verify the app's stated claims against
what the code does" into a repeatable method, with the later layers and
subsequent fixes best told as consequences of that method rather than
separate breakthroughs), then the live-update accessibility/focus fix
(`0ecbbd8` --- ties directly to the app's own stated selling point). Decide
explicitly at the finishing run rather than defaulting to the first one
found. On that run: write `PROCESS.md` naming the strongest 2--3 threads
(cited to real commits, not a run-of-fixes listing every commit), and
`reflections/crit-7.md` headed "Build the ANU system you wish existed"
(the source's title, never a week number), 150--300 words answering both
standing prompts.
