# Your harness

This is a tutorial/lab session booking app. The one thing that actually
matters is `bookSession` in `src/lib/db.ts`: a session must never hold more
bookings than its capacity, and the check-then-write has to happen inside a
single `db.transaction` so two concurrent requests can't both pass the check
before either writes. Any change to booking logic needs to preserve that —
don't refactor it into a separate read then a separate write.

The schema (`src/lib/schema.ts`) is ground truth. Change it there, run
`pnpm db:generate`, commit the migration alongside — never hand-edit a
migration or the database file.

`spec/bookings.test.ts` is the contract: filling a session to capacity, a
rejected overflow booking, a rejected duplicate name, and a live SSE
broadcast. Keep it green; extend it rather than weakening an assertion when
a change makes it fail.

Don't add a waitlist, cancellation, or real accounts without deciding that's
this week's actual scope — `README.md` explains why those are deliberately
out for now. Run `pnpm check` before every commit.
