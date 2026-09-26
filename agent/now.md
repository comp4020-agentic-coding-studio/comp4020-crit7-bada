# now

## State as of this run (2026-09-26, ~46.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Sixteenth run. Re-fetched crit 07 source: unchanged. Took the previous
hand-off's own advice and rotated away from the name-key/duplicate-booking
family after three runs drilling it --- looked at input validation instead.

Checked one thing that turned out clean (worth recording so a future run
doesn't re-check it): SQLite foreign keys on `bookings.session_id` and
`sessions.course_id` are enforced by default in this environment
(`better-sqlite3` 13.0.3) even with no explicit `PRAGMA foreign_keys = ON`
anywhere in `db.ts` --- verified with a throwaway script applying all three
migrations to a scratch DB and attempting a raw `INSERT` with a bogus
`session_id`, which failed with `FOREIGN KEY constraint failed` both before
and after explicitly setting the pragma. Not exploitable via the app anyway
(`bookSession` already checks session existence before any insert), but
worth knowing this driver's default before assuming a bug that isn't there.

Found and fixed a real one (`235ee89`): `bookings.ts`'s emptiness check was
`!personName` on a `.trim()`ed string, but `.trim()` only strips whitespace
(Unicode `Zs`), not zero-width/format characters (`Cf`, e.g. U+200B) ---
confirmed in Node that `"​".trim().length` is 1, not 0. A real
browser's own HTML5 `required` validation has the identical gap (it only
checks `value !== ""`), so a name of only invisible characters passed both
layers and would silently take a real seat while displaying as nothing at
all in the attendee list --- worse for this app's whole stated purpose (a
visible, honest attendee list) than the seat just staying open. This is the
same "verify the app's stated claims against what the code does" method
that found the three case-fold layers, aimed at a completely different,
previously-uncovered code path: no test had ever hit `error=invalid` at
all, not even the plain-empty case. Fixed by checking
`/[^\s\p{Cf}]/u.test(personName)` alongside the existing checks. Added
three tests: plain blank name (`"   "`), ZWSP-only name (rejected), and a
name merely *containing* one ZWSP alongside real characters (still
accepted, so the fix doesn't overreach). `pnpm check` 40/40 (was 37).

Verified before shipping: `agent-browser`-free this time --- a raw
`http.request` POST against a throwaway dev server on a dedicated port (not
touched by any other tool concurrently) confirmed the ZWSP-only POST
returns `303` to `/?error=invalid` and the session stayed at `0/2 booked`,
not `1/2`. Killed the dev server by resolving its real listening PID via
`ss -ltnp` rather than trusting the backgrounding job's own PID, per the
standing gotcha in `MEMORY.md` that a `pnpm dev &`-launched process's
apparent PID isn't always the one actually bound to the port. Confirmed
port free afterward.

Pushed (`235ee89`) and deployed (`flyctl deploy --remote-only --ha=false
-a comp4020-crit7-bada`). Re-verified live: the same raw-socket ZWSP POST
against the production URL redirects to `error=invalid`, and all five
seeded sessions still read exactly `0 booked` afterward --- no test data
left on the volume, no migration involved (pure application-code
validation change, no schema touched).

## Single most important next action

Still not the finishing run (~46.5h at this run's start, was 52.5h last
run). PROCESS.md already exists in the repo from an earlier run but hasn't
been revisited to fold in the threads found since; `reflections/crit-7.md`
correctly does not exist yet --- don't write it before told this is the
last run.

Strong threads to draw the finishing `PROCESS.md`/reflection from, roughly
chronological: concurrency (`719f90b`, `faaa85e`), SSE-resync (`066c66d`),
a verified-clean RST-disconnect edge case, the live-update
accessibility/focus fix (`0ecbbd8`), the dead-query-param fix (`f7baee5`),
the three-layer name-key case-fold family (`dc0d99a` ASCII, `36417f9`
non-ASCII, `9cf3082` normalization form), and this run's invisible-name
validation fix (`235ee89`). Treat the name-key family as exhausted (three
layers is enough) and don't force a fourth. This run's fix is a genuinely
new thread, not a fourth layer of that same family — a different code path
(`error=invalid`) that had zero test coverage at all before this run, found
by asking what a well-known JS/HTML validation gap (`.trim()` vs. Unicode
`Cf` characters, `required` vs. `value !== ""`) would let through, not by
poking at Unicode names again for their own sake. If a further deepen run
happens before the finishing one, prefer a genuinely new angle over
re-drilling either of these two families — candidates not yet tried:
something in the courses/sessions read path rather than the booking write
path, or the deploy/ops side (fly.toml, Dockerfile) rather than app code.

Candidates for the reflection breakthrough, in order of strength: the ASCII
case-fold fix (`dc0d99a` — turned "verify the app's stated claims against
what the code does" into a repeatable method, with the later layers and
this run's fix best told as consequences of that method rather than
separate breakthroughs), then the live-update accessibility/focus fix
(`0ecbbd8` — ties directly to the app's own stated selling point). Decide
explicitly at the finishing run rather than defaulting to the first one
found. On that run: write `PROCESS.md` naming the strongest 2–3 threads
(cited to real commits, not a run-of-fixes listing every commit), and
`reflections/crit-7.md` headed "Build the ANU system you wish existed"
(the source's title, never a week number), 150–300 words answering both
standing prompts.
