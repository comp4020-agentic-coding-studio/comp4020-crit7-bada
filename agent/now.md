# now

## State as of this run (2026-09-22, 149.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Third run. Re-fetched the crit 07 source again: brief and spec bullets still
unchanged. `pnpm check` fresh (typecheck + build + vitest) was green at 31/31
before touching anything.

Did the blind cold-open pass now.md's last hand-off flagged as not yet done:
a fresh subagent, `agent-browser` only, no source access, pointed at a local
`pnpm dev` on a dedicated port (5199, so it couldn't collide with the main
thread --- didn't touch the browser myself until after it reported back, per
the standing cross-talk lesson in `MEMORY.md`). It came back fully clean:
purpose discoverable with no instructions, booking works, persists on
reload, duplicate name rejected with a clear message, filling a session
removes the form and shows "Full" (not just a disabled button), a second
tab's seat count updates live over SSE with no reload, mobile viewport
(390×844) reflows correctly, empty-name submission blocked client-side. One
item flagged as a minor implementation leak, not a bug: the `?booked=N`
confirmation banner persists on any later reload/bookmark of that URL ---
harmless, decided not worth chasing.

Given the clean pass, followed the established "next angle is a code-level
edge case, not another playtest" pattern: `bookSession` has four outcomes
(ok, full, duplicate, not-found) but `spec/bookings.test.ts` only covered
three. Confirmed the not-found path (`sessionId=999999`) already works
correctly by hand via curl (redirects `?error=not-found`, no crash), same
for a malformed `sessionId` and an empty name (both already correctly
bounce to `?error=invalid`) --- so no bug, just a coverage gap on the one
already-working branch. Added the missing regression test
(`spec/bookings.test.ts`, `28fc134`). 32/32 green after. No runtime
behaviour changed, so no redeploy needed; the live `fly.dev` app already
matches. Pushed to `origin/main` at `28fc134`.

Dev server on port 5199 was started and killed by PID this run (confirmed
down by a failed curl afterwards, not just trusting the kill) --- the
throwaway `.data/dev-cold.db*` files it created were deleted before
committing, never staged.

## Single most important next action

Still mid-week, not the finishing run. The concurrency contract (deepened
run 2) and the cold-open discoverability pass (run 3) are both now done and
clean --- don't repeat either just to keep a streak going. Good next deepen
candidates for run 4, in rough priority order: (1) re-read the brief's own
"models a slice of a real ANU system" bar once more with fresh eyes --- is
there a second real wrinkle worth modelling (e.g. a session's room capacity
vs seat capacity, a course with zero sessions) that's honestly missing, or
is `README.md`'s stated scope (no waitlist/cancellation/accounts) still the
right honest line; (2) the `personName` uniqueness constraint is exact
string match with no case-folding (`.trim()` only) --- a person could
technically get two seats in one session as "Alice" and "alice"; decided in
this run's reasoning (not yet in `MEMORY.md`) that this is really just an
instance of the already-acknowledged "no real accounts" scope-out (anyone
can already double-book under two different names) rather than a new gap,
so probably not worth fixing, but worth a second opinion before the
finishing run locks it in. Do not write `reflections/crit-7.md` yet unless
a future prompt explicitly names that run as the last one.
