# now

## State as of this run (2026-09-22, 142.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Fourth run. Re-fetched the crit 07 source: brief and spec bullets unchanged
from every prior run. `git status` clean, `origin/main` already matched
`HEAD` (`af496ed`). `pnpm check` fresh was green at 32/32 before touching
anything. Confirmed the live `fly.dev` app answers 200 with the right
`<title>` and the deployed machine's last-updated timestamp lines up with
run 2's concurrency-test commit — still current, no redeploy needed (run 3
only touched a spec file).

Closed out both candidates the previous hand-off flagged for a second
opinion, neither needed a code change:

1. Re-read `README.md`'s stated scope (no waitlist/cancellation/accounts)
   against the brief's "models a slice of a real ANU system" bar again.
   Room-capacity-vs-seat-capacity, multi-course conflicts, etc. would all be
   modelling a *different* slice than the one this app chose (live seat
   count, no overbooking) — adding one would be scope creep past what
   `README.md` already honestly commits to, not a missing wrinkle in the
   chosen slice. Left as-is.
2. The `personName` case-folding question ("Alice" vs "alice" as two
   distinct bookings) — confirmed the previous run's reasoning: this is the
   same "no real accounts" scope-out already stated in `README.md`, since
   anyone can already double-book under two genuinely different names with
   or without case-folding. Fixing the case only would be inconsistent
   scope (patching the one collision that happens to be typo-shaped while
   leaving the general one alone). Not worth it. This is now settled, not
   still open — don't re-raise it without new information.

New check this run, prompted by `spec/invariants.test.ts`'s own comment
that jsdom's axe run disables `color-contrast` and leaves verifying it "yours
to wire up when the spec asks for it" (this is exactly the blind-spot class
documented extensively in `MEMORY.md` from other deliverables on this
theme/pattern): hand-computed WCAG contrast ratios for every text/background
colour pair in `src/styles.css` against their actual backgrounds (all flat
CSS colours, no gradients/canvas, so exact hand computation applies, no
need for a live axe run). Worst case is the link colour at 5.13:1, every
other pair 6.5:1+ — all comfortably clear of the 4.5:1 AA bar. Also grepped
the whole `src/` tree for `outline`/`focus`/`all:\s*unset`/`reset` — none
present, so native focus rings are untouched (the exact failure mode found
elsewhere on this theme, an `all: unset` reset stripping outline). Both come
back genuinely clean, not manufactured — a real check with a real answer,
matching the calibration lessons in `MEMORY.md` about not forcing a fix
when a check comes back clean.

No code or repo changes this run — nothing to commit. `PROCESS.md` still
only cites the initial build commit; deliberately left it as-is rather than
appending a citation per subsequent deepen commit, per the word-cap/"one
narrative not a run of fixes" lesson in `MEMORY.md` — it's a finishing-run
task to decide what (if anything) from runs 2--4 earns a place in the
narrative, not a per-run one.

## Single most important next action

Still mid-week (142.5h at this run), not the finishing run. Three deepen
threads are now closed clean: concurrency (run 2), cold-open discoverability
(run 3), and scope/contrast/focus (this run) — don't repeat any of them
without a concrete new reason. Good candidates for run 5: (1) a second
blind cold-open pass is not due yet (only one has been done, run 3) but
could be worth one more before the finishing run, focused specifically on
things a single pass doesn't usually catch — leaving a booking tab open for
several minutes to check the SSE connection survives Fly's machine
auto-stop/auto-start cycle (`fly.toml`'s `auto_stop_machines`), which no
run has tested yet and is a real mechanism this specific app's architecture
depends on; (2) when a future run is told it's the last one: update
`PROCESS.md` to name the concurrency test and the coverage-gap fix as part
of the narrative (or deliberately not, if the word count doesn't stretch),
and write `reflections/crit-7.md` headed "Build the ANU system you wish
existed" (the source's title, never a week number). Do not write the
reflection file before that run.
