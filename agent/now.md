# now

## State as of this run (2026-09-21, 166.5 h to cutoff, `comp4020-crit7-bada`) --- FIRST RUN, PLANNED + BUILT + SHIPPED

First run for this deliverable. Fetched the crit 07 source
("Build the ANU system you wish existed" --- courses/sessions/bookings/people
on the Astro + Drizzle + SQLite scaffold, migrations as ground truth, shipped
to Fly.io). Repo arrived at the template tip (`0c66e3f`), nothing built yet.

Picked tutorial/lab session booking over room booking or enrolment: it maps
directly onto the brief's own entity list, and the starter's guestbook
(no-JS form + SSE broadcast) already demonstrates the two hard parts a
booking page needs --- a form that works without client JS, and a live
cross-tab update when someone else takes a seat.

Built:

- `src/lib/schema.ts` --- `courses`, `sessions` (label/room/capacity),
  `bookings`, with a **unique constraint on `(session_id, person_name)`** so
  the database itself refuses a double-booking, not just the UI.
- `src/lib/db.ts` --- `bookSession()` wraps the capacity check, the duplicate
  check, and the insert inside one `db.transaction()`, so two people racing
  for the last seat can't both get in between a check and a write. Seeds two
  courses, five sessions across them.
- `src/pages/api/bookings.ts` --- POST + 303 redirect, no client JS required;
  broadcasts the new seat count over the existing SSE bus on success.
- `src/pages/index.astro` --- session cards with live seat counts and
  attendee lists; an `EventSource` client script patches every open tab's
  DOM on any booking, anywhere, without a reload.
- `spec/bookings.test.ts` --- drives the *running* app over HTTP: fills a
  session exactly to capacity and confirms the overflow booking is rejected
  and never appears on the page, rejects a duplicate name, and confirms a
  booking on a different session reaches a second open SSE connection.

Verified live in `agent-browser` (not just the spec suite): booking, capacity
enforcement, duplicate rejection, and a genuine cross-tab SSE update ---
found semi-accidentally via an `agent-browser tab switch` syntax mistake
(correct form is `agent-browser tab <target>`, no "switch" keyword) that
left a booking landing in the wrong tab, which then surfaced the *other*
tab's DOM live-patching itself to "Full" with no reload. Real confirmation,
not a bug. Also ran a real-browser axe-core audit (`agent-browser eval
--stdin`): zero violations.

`pnpm check:evidence` fails on the missing `reflections/crit-7.md` --- this
is correct and expected: doctrine places reflection-writing under
"Finishing steps (on your final run)" only, and this is the first run of a
168-hour week. Did not write one. `PROCESS.md` citations resolve.

Pushed to `origin/main` at `e2c0b29`. Deployed via
`flyctl deploy --remote-only --ha=false -a comp4020-crit7-bada` --- succeeded
(132MB image, 1GB volume, machine `7845952b303038`). Verified the **live**
URL, not just the local build: `https://comp4020-crit7-bada.fly.dev/` returns
200, `/readme/` returns 200, `/api/events` streams (SSE connects).

## Single most important next action

This deliverable is mid-week (deepen phase next, not finish) --- the next run
should NOT write `reflections/crit-7.md` yet either, unless the prompt
explicitly names it as the final run. Good deepen candidates: check both
marking viewports live (only checked axe/functionality this run, not a
1920×1080 + 390×844 screenshot pass); consider whether the brief's published
spec (re-fetch the course source, don't trust this summary) asks for
anything this build doesn't yet cover; re-run `pnpm check` fresh since CI
itself is currently skipped (repo private) and only `check:evidence`'s
CLI form was exercised directly. `check-evidence.ts`'s citation check only
verifies the SHA resolves locally, not that the URL's org/repo is correct
(per a general lesson already in `MEMORY.md`) --- worth a by-eye check of
`PROCESS.md`'s citation URL against `git remote -v` before the finishing run.
