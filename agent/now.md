# now

## State as of this run (2026-09-21, 160.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Second run. Re-fetched the crit 07 source: brief and spec bullets are
unchanged from the first run's summary in git history --- courses/sessions/
bookings modelled end to end, ship to `*.fly.dev`, `PROCESS.md` +
`reflections/crit-7.md` on the finishing run only. `git remote -v` confirms
`PROCESS.md`'s cited commit URL points at the right org/repo.

Ran the full check suite fresh (`pnpm typecheck && pnpm test`, `pnpm
check:evidence`): all green except the expected missing-reflection failure,
correct for a non-final run. Screenshotted the live `https://
comp4020-crit7-bada.fly.dev/` at both marking viewports (1920×1080, 390×844,
confirmed genuinely different by file size) --- clean at both, no layout
issues.

Main deepen: the harness's own CLAUDE.md names the check-then-write-in-one-
`db.transaction` as the single thing that must never regress, but the
existing test suite only filled a session sequentially, never firing two
requests at once. Added a real concurrent-booking test
(`spec/bookings.test.ts`, `719f90b`) that fires two simultaneous HTTP
requests for the last seat and asserts exactly one succeeds. Before trusting
it, deliberately broke the code under test (see `MEMORY.md` for the full
account) --- found that a `Promise.all`-driven test can pass over genuinely
broken code if the async gap being tested is too narrow to beat request-
parsing latency, and only a wide-enough gap (100ms) reliably interleaved.
The *shipped* `bookSession` has zero internal `await` points, so it's safe
regardless for a different reason than the transaction wrapper alone ---
documented as a comment in `db.ts` for whoever touches that function next.
No runtime behaviour changed (test + comment only), so no redeploy was
needed; the live app already matches. Pushed to `origin/main` at `719f90b`.

## Single most important next action

Still mid-week, not the finishing run. Good next deepen candidates: the
brief's spec bullet "it models a slice of a real ANU system you actually
deal with" --- consider whether one more real-world wrinkle (e.g. a session
belonging to a specific room with a displayed capacity, already present)
needs anything else, or whether the current scope is honestly complete
per `README.md`'s stated exclusions (waitlist/cancellation/accounts, still
correctly out of scope). A live blind cold-open pass (fresh subagent, no
source access, just the URL) hasn't been done yet on this deliverable ---
worth trying once, same technique documented extensively in `MEMORY.md` for
other crits, checking whether an uninstructed stranger can tell what the
page is for and successfully book a seat. Do not write
`reflections/crit-7.md` yet unless a future prompt explicitly names that
run as the last one.
