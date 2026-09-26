# now

## State as of this run (2026-09-27, ~29.5 h to cutoff, `comp4020-crit7-bada`) --- FINISHING RUN, deliverable shipped

Eighteenth run, and the prompt named it the last one for this deliverable.
Re-fetched crit 07 source: unchanged from every prior run.

Did the finishing steps in full:

- Verified `pnpm check` (41/41) and, live in `agent-browser` against a local
  `astro preview` server, both real pages (`/`, `/readme/`) at desktop and
  390×844 mobile --- clean, no console errors, cold render matches the
  README's own claims.
- Fixed a stale README claim caught during that verification: "a unique
  constraint on `(session_id, person_name)`" no longer matched
  `schema.ts` after the case-fold/normalization fixes (three prior deepen
  runs) moved the real constraint onto a generated `person_name_key`
  column --- the README had never been updated after the schema changed
  underneath it. Fixed in the same commit as the process/reflection write.
- Wrote the finishing `PROCESS.md` addendum naming the three strongest
  deepen threads per the prior hand-off's own shortlist: the concurrency
  test that could have passed for the wrong reason
  (`719f90b`/`faaa85e`), the three-layer case-fold/normalization bug family
  (`dc0d99a`/`36417f9`/`9cf3082`), and the live-update accessibility/focus
  fix (`0ecbbd8`) --- cited to real commits, not a run-of-fixes listing
  every commit touched this deliverable.
- Wrote `reflections/crit-7.md`, headed "Build the ANU system you wish
  existed" (the source's title), 299 words, breakthrough = "don't trust a
  passing check as evidence of the thing it's named for" (the concurrency-
  test-that-proves-nothing finding), tied to what it changed about wanting
  to actively try to disprove correctness rather than accept a green run.
- `pnpm check` and `pnpm check:evidence` both green
  (`✓ reflections/crit-7.md: entries the marker reads`,
  `✓ PROCESS.md: 7 cited commit(s) all resolve`).
- Committed (`24765ba`) --- `git show --stat HEAD` confirmed the diff
  matched the message exactly (README.md, PROCESS.md,
  reflections/crit-7.md only) --- pushed, and deployed
  (`flyctl deploy --remote-only --ha=false -a comp4020-crit7-bada`).
- Verified the *live* URL after deploying, not just the local build:
  `https://comp4020-crit7-bada.fly.dev/` and `/readme/` both 200, a fresh
  `agent-browser` screenshot of the live page matches the local one, all
  five seeded sessions still read `0 booked` (no test data left on the
  shared production volume, consistent with the standing discipline in
  MEMORY.md for an app with no delete/cancel).

## Single most important next action

`comp4020-crit7-bada` is done --- shipped, deployed, reflection and process
written, nothing further to do on it unless a future prompt reopens it.
Next run's prompt will name whatever deliverable is open next (a new crit or
assignment); read its own course-source URL fresh rather than assuming
continuity from this one. If a future prompt *does* reopen crit-7 (e.g. a
retro crit elsewhere naming it), the strongest breakthrough to draw from is
the concurrency-test-proves-nothing finding (`719f90b`) --- already the
reflection's chosen thread, so a retro's `PROCESS.md`-driven presentation
has a ready before/after to lean on.
