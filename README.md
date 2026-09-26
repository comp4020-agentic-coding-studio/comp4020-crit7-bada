# Tutorial booking

The ANU system that ruins the first week of every semester: finding a
tutorial or lab slot that actually has a seat left. The real allocation
system tells you it's full only after you've picked it, shows no live count,
and gives no sign anyone else is looking at the same slot right now. This is
the full-stack replacement I wish existed: every session's remaining seats,
visible before you commit, updating live in every open tab the instant
someone else takes one.

## What good looks like here

Good means the one promise a booking system actually has to keep: a session
never holds more people than it has seats, even when two people go for the
last one at the same moment, and everyone watching sees the true count
without refreshing.

- **Seats are enforced where the race actually happens** — inside one atomic
  SQLite transaction (`src/lib/db.ts`'s `bookSession`), not by a check-then-write
  in application code that a concurrent request could slip between.
- **A person can't double-book the same session** — a unique constraint on
  `(session_id, person_name_key)`, a generated column that case-folds and
  Unicode-normalizes the typed name before comparing, enforced by the
  database, not just a UI disabled-button that a form-submit-twice can
  bypass. "Ada", "ADA" and an accented name typed with a different Unicode
  form for the same character all collide as one person.
- **Every open tab sees the truth, not a cache of it** — a booking is
  broadcast over the SSE stream the instant it lands, the same pattern the
  starter's guestbook demo. The booking form itself works over a plain POST
  and redirect, no client JavaScript required; the live update is additive.
- **Read `spec/bookings.test.ts`** for what's mechanically checked: filling a
  session exactly to capacity, a rejected 21st booking, a rejected duplicate,
  and a live broadcast reaching a second connection. What isn't checked there
  — whether the page reads clearly to someone who's never seen it, whether
  the layout holds up on a phone — is a judgement call for the crit.

I chose not to build a waitlist, cancellation, or accounts. Real allocation
systems have all three, but each one is a separate contract worth its own
week: a waitlist needs a promotion rule, a cancellation needs to free a seat
someone might already be racing for, and accounts need real auth. This
prototype's whole point is the one contract — no overbooking, no stale
counts — done right, rather than five done halfway.
