# now

## State as of this run (2026-09-22, 136.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Fifth run. Re-fetched the crit 07 source: unchanged. Picked up the previous
hand-off's flagged candidate --- test whether the live SSE connection survives
Fly's `auto_stop_machines` cycle --- and found something sharper than the
literal question asked.

First established the Fly mechanics empirically on the live app: a machine
with zero open connections auto-stops within about a minute of the last one
closing; with even one SSE tab open it stays `started` indefinitely (14+
minutes observed, no stop) because the open stream itself counts as activity;
closing that tab let it stop within ~1 minute. So the literal framing in the
last hand-off doesn't arise --- an open tab can't be sitting there *while* the
machine stops out from under it, because the tab itself prevents the stop.

The real risk is the reconnect gap, and it's a genuine, reproducible bug: the
booking bus (`src/lib/events.ts`) is a plain in-memory `EventEmitter` with no
backlog, and the client (`index.astro`'s bare `new EventSource(...)`) had no
resync logic on reconnect. Any disconnect --- a network blip, and *every* Fly
redeploy, which restarts the machine and drops every open SSE connection ---
followed by the browser's automatic reconnect left a tab subscribed only to
*future* bookings; anything booked during the gap was silently invisible
until a manual reload. This directly contradicts the app's own stated
promise ("every open tab sees the truth, not a cache of it") and its
README's central claim ("no stale counts --- done right").

Verified concretely against the *local* dev server (never against the
production booking data, which has no delete/cancel — any test booking made
there would be permanent and visible at the crit): killed the dev process,
restarted it, and fired a booking via curl within ~1ms of the port
responding again — well inside the browser's ~3s default EventSource retry
delay. Under the old code the open tab kept showing the stale count (`0/3
booked`) indefinitely, readyState back to OPEN with zero errors, node
correctly stayed stale until a hard reload. Fixed by having
`/api/events`'s `start()` enqueue one `data:` snapshot per session
(`{sessionId, booked, bookedBy}`, the exact shape the client already
parses) before subscribing to the bus — sent on every connect *and* every
reconnect, zero client-side changes needed. Re-ran the identical tight-race
test against the fix: same timing, tab now correctly shows the true count
and attendee name. `pnpm check` 32/32 green. Committed (`066c66d`), pushed,
redeployed to Fly, and confirmed live: `curl -sN
https://comp4020-crit7-bada.fly.dev/api/events` now shows the five-session
snapshot immediately on connect.

No other candidates from the previous hand-off were touched this run.

## Single most important next action

Not the finishing run yet (136.5h at this run). The reconnect-gap thread is
now closed with a real fix, verified both locally (tight race) and live
(snapshot confirmed on the deployed SSE endpoint). Good candidates for a
future deepen run: (1) a second blind cold-open pass (only one has been
done, run 3) could still be worth one more before finishing, now that the
SSE resync fix has landed --- specifically try leaving two tabs open across
an actual `flyctl deploy` (not just a killed dev server) to confirm the fix
holds under the real deploy path, not just a local process restart; (2) when
told this is the last run: update `PROCESS.md` to name the concurrency test,
the not-found coverage fix, and this run's SSE-resync fix as the narrative
(word-cap permitting --- likely means picking the two or three strongest, not
all of them), and write `reflections/crit-7.md` headed "Build the ANU
system you wish existed" (the source's title, never a week number). Do not
write the reflection file before that run.
