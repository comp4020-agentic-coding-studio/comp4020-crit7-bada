# now

## State as of this run (2026-09-26, ~52.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Fifteenth run. Re-fetched crit 07 source: unchanged.

Took the next-action suggestion from the previous run's hand-off literally:
tested whether NFC vs NFD Unicode normalization is a third layer under the
two case-fold fixes (`dc0d99a` ASCII, `36417f9` non-ASCII). It was ---
"Café" typed as a precomposed `é` and the same glyph typed as `e` +
combining acute accent (`́`) are visually identical but byte-distinct
until normalized, so the existing `.trim().toLowerCase()` key (both the SQL
`name_key()` function and the app-level pre-check) let them double-book.
Verified this really is possible before touching anything (a throwaway
probe), same escalation order as both prior layers.

Fixed (`9cf3082`):

- `src/lib/db.ts`: `name_key()` now does
  `.normalize("NFC").trim().toLowerCase()`
- the app-level pre-check inside `bookSession` normalizes the same way, so
  the two still can't diverge
- `src/lib/schema.ts`'s comment updated to explain the normalization step
- `pnpm db:generate` confirmed "No schema changes, nothing to migrate" ---
  this is a pure JS-function change, no migration needed, since a `virtual`
  generated column re-evaluates against whatever function is registered at
  read time
- added a regression test in `spec/bookings.test.ts` booking the NFC form
  then the NFD form and expecting the duplicate rejection

Real gotcha hit writing the test, now in `MEMORY.md`: retyping "Café" across
different tool-call parameters in the same session produced different
underlying byte sequences (NFC vs NFD) non-deterministically, so `Edit`'s
exact-string-match kept failing even though the text looked identical on
read. Fixed by using explicit `é`/`́` escape sequences in the
source instead of literal accented characters, spliced in via a `node -e`
script rather than fighting the `Edit` tool.

Second real gotcha: the first version of the new test used a dedicated
`findSessionWithSpareCapacity(2)` + filler loop (mirroring the accent
test's pattern) inserted mid-file, which broke a *later*, unrelated race
test by exhausting the suite's total 14-seat capacity budget before it
could find a session with spare capacity left. Diagnosed with a temporary
`afterEach` logging session state + `--reporter=verbose` (default reporter
swallows console output for passing tests). Fixed by repositioning the new
test near the end of the file (after the wide N-way race test) using
default `minSpare = 1` and no filler loop --- nothing after it in file order
assumes a session starts at zero-booked, so partially draining one there is
safe. Didn't touch seed data.

Verified before shipping:

- `pnpm check` 37/37 (was 36), typecheck clean
- confirmed live against a local dev server with `agent-browser`: booked
  the NFC form then the NFD form through the real form (keyboard-typed),
  got the same duplicate-rejection UI, session correctly read `1 / 2
  booked` not 2/2
- shut the dev server and browser down properly, confirmed the port was
  actually free
- queried the deployed Fly volume directly before deploying (`flyctl
  machine start` + `flyctl ssh console` + a `node -e` one-liner) and
  confirmed production still holds zero real bookings --- and this fix
  carries zero migration risk anyway: SQLite doesn't retroactively
  re-validate existing rows against a changed generated-column expression,
  it only matters for new writes

Pushed and deployed (`flyctl deploy --remote-only --ha=false
-a comp4020-crit7-bada`, machine version 7→8). Live URL confirmed 200, all
five seeded sessions still at 0 booked, no test data left behind.

## Single most important next action

Still not the finishing run (~52.5h at this run's start, was 64.5h last
run --- roughly 12h elapsed between hand-offs). This is now an eighth strong
thread alongside concurrency (`719f90b`, `faaa85e`), SSE-resync
(`066c66d`), the RST-disconnect edge case, the live-update
accessibility/focus fix (`0ecbbd8`), the dead-query-param fix (`f7baee5`),
the ASCII case-fold fix (`dc0d99a`), and the Unicode case-fold fix
(`36417f9`) --- this run's normalization fix (`9cf3082`) closes the third
layer of that same family. Worth treating the name-key bug family as
probably exhausted now (ASCII case, non-ASCII case, normalization form ---
the next layer, if any, would be something like grapheme-cluster
equivalence or zero-width-joiner tricks, which is a much longer tail for
much less real-world relevance to an ANU population than the first three
layers). Next deepen run's options, in order: (1) if a genuinely new angle
occurs to it, take it, but consider actively looking somewhere other than
name-key edge cases this time --- three runs in a row on the same bug family
is a sign to rotate the lens, not confirmation to keep drilling; (2)
otherwise start drafting `PROCESS.md`/reflection language in scratch form
(not the real files yet) given cutoff is under 3 days out now; (3) once
told this is the last run, write the real `PROCESS.md` naming the
strongest 2--3 threads and `reflections/crit-7.md` headed "Build the ANU
system you wish existed" (the source's title, never a week number).
Candidates for the reflection breakthrough, now four deep: the live-update
accessibility/focus fix (`0ecbbd8`, ties directly to the app's own stated
selling point), the ASCII case-fold fix (`dc0d99a`, stated contract
silently broken since the first commit), the Unicode case-fold fix
(`36417f9`, the same contract broken again in a way the first fix didn't
anticipate), and this run's normalization fix (`9cf3082`, a third
escalation of the same contract) --- still worth deciding explicitly at the
finishing run. Leaning toward the ASCII case-fold fix (`dc0d99a`) as the
strongest single breakthrough candidate if forced to pick now: it's the
one that turned "verify the app's stated claims against what the code
actually does" into a repeatable method, and the two later layers are best
told as *consequences* of that method rather than separate breakthroughs
in their own right. Do not write the reflection file before that run.
