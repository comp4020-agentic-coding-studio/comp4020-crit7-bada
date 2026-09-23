# now

## State as of this run (2026-09-23, 118.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Seventh run. Re-fetched the crit 07 source: unchanged. Picked up candidate
(1) from the previous hand-off — the code-level edge case a playtest can't
reach — and ran it as a real test, not just reasoning about it.

Tested whether `bus.emit("booking", ...)` in `src/pages/api/bookings.ts`
(synchronous, outside the transaction, after a successful booking) could
propagate a throw from a dead SSE listener's `controller.enqueue()` back
into the POST handler — which would mean a user sees a 500 for a booking
that actually committed. Drove a raw `net.Socket` SSE connection and RST'd
it (`resetAndDestroy()`, not a graceful close) with zero delay before firing
a booking, to hit the narrowest possible window. Clean: no throw, no 500,
other tabs unaffected. Went further and checked for a leaked listener if
`cancel()` never fires for an RST specifically (only temporarily instrumented
with `console.error` in `start()`/`cancel()`, viewed via `astro dev logs` —
the daemonized dev server's own stdout, not the wrapper process's — then
fully reverted before doing anything else, never committed): `cancel()`
fired and the listener count returned to 0 every single time. No code
change; a real checked-and-clean result. Full technique and result are in
`MEMORY.md`.

Also re-checked candidate (2): grepped `src/` for waitlist/cancel/login/
account — the only hit is the SSE stream's own `cancel()` lifecycle method,
no scope creep against `README.md`'s stated exclusions.

`pnpm check` still 32/32 green. Working tree was clean before and after
this run (the instrumentation was reverted, not committed) — nothing to
commit. Live `https://comp4020-crit7-bada.fly.dev/` still answers 200, same
deployed commit as before (`066c66d`) — no redeploy needed since nothing
changed.

## Single most important next action

Not the finishing run yet (118.5h at this run start). Two clean cold-opens,
a verified-under-real-deploy SSE resync fix, and now a verified-clean
disconnect/emit edge case means the core contract (no overbooking, live
truth in every tab, no silent failure mode on a dropped connection) is
thoroughly checked from multiple angles. The next deepen run's best use of
time is probably NOT another identical investigation thread — consider
instead: (1) a fresh third blind cold-open pass only if enough real time has
passed that regressions could plausibly have crept in (unlikely this soon);
(2) whether `pnpm db:generate`/the migration story still holds if the schema
needs to grow at all (it hasn't needed to); (3) start drafting `PROCESS.md`
language early (not writing the file yet — that's a finishing step) so the
finishing run isn't starting from scratch. When told this is the last run:
write `PROCESS.md` naming the two or three strongest threads (the
concurrency test `719f90b`, the SSE-resync fix `066c66d` verified under a
real Fly redeploy, and possibly the not-found coverage `28fc134` — not all
of them, per the doctrine's "one narrative" guidance), and write
`reflections/crit-7.md` headed "Build the ANU system you wish existed" (the
source's title, never a week number). Do not write the reflection file
before that run.
