# Process overview

## What I built

A tutorial/lab session booking page: courses, sessions, and bookings, with
seats enforced so a session can never overbook and every open tab sees a
booking the instant it lands.

## How I got here

The brief's own entity list — courses, sessions, bookings, people — mapped
directly onto a schema, so I started there instead of the UI: `courses`,
`sessions` (a time, room, and capacity), and `bookings`, with a unique
constraint on `(session_id, person_name)` so the database itself stops a
double-booking, not just the UI.

The starter's guestbook already demonstrated the two hard parts of a
full-stack prototype — a form that works with no client JS, and an SSE
broadcast so other tabs find out live — so I kept both patterns and pointed
them at bookings instead of messages. The one thing the guestbook didn't
need and this app does is a real race condition: two people can go for the
last seat in the same session. `bookSession` reads the current count and
writes the new row inside one `db.transaction`, so the check and the write
can't be split by a concurrent request the way a plain
select-then-insert would.

I replaced the starter's plumbing test with `spec/bookings.test.ts`, which
drives the running app to fill a session exactly to capacity, checks the
next booking is rejected, checks a duplicate name is rejected, and checks a
booking on a different session reaches a second SSE connection.
([`cff9e1c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bada/commit/cff9e1c))

## Deepening: three threads that mattered

**Don't trust a passing concurrency test until you've tried to break it.**
The first `Promise.all` race test against the last seat passed —
but it would have passed even without the transaction, because better-sqlite3
is synchronous and Node is single-threaded: with no `await` inside
`bookSession`, two calls can never actually interleave. I only trusted the
result after deliberately inserting a simulated async gap into the code
under test and confirming the test *did* go red at some gap width, then
widened the real test to an 8-way race for 2 seats and a 6-way same-name
race, both against the built server, not jsdom
([`719f90b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bada/commit/719f90b),
[`faaa85e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bada/commit/faaa85e)).

**Verify the app's own stated claims against what the code actually does,
not what it's supposed to do.** The README promised a unique constraint
stopped duplicate bookings; a throwaway probe showed SQLite's `lower()`
only folds ASCII, so "FRANÇOIS" and "françois" booked as two different
people into a session that can't overbook. Fixing that surfaced a second,
subtler layer — the same visible accented character can be two different
Unicode byte sequences (precomposed vs. combining) until normalized — found
the same way: write the probe before touching the schema
([`dc0d99a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bada/commit/dc0d99a),
[`36417f9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bada/commit/36417f9),
[`9cf3082`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bada/commit/9cf3082)).

**"Every open tab sees the truth" is a claim about perception, not just
DOM state.** The SSE handler mutated seat counts and attendee lists with
plain `textContent`/`replaceChildren`, so a screen-reader user got no
indication the app's headline feature was doing anything — and filling a
session from a second tab could silently steal focus out from under a
first tab's half-filled form. Two-tab `agent-browser` testing (focus an
element in tab A, mutate from tab B, read `document.activeElement` in A)
found what neither a static a11y scan nor a single-tab cold-open playtest
could
([`0ecbbd8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bada/commit/0ecbbd8)).
