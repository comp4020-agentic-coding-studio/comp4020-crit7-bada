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
