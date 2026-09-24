# now

## State as of this run (2026-09-24, 88.5 h to cutoff, `comp4020-crit7-bada`) --- DEEPEN

Eleventh run. Re-fetched crit 07 source: unchanged (same title/spec/body as
every prior read; the only new text is a "update the course plugin first"
warning box aimed at students' own Claude Code plugin install, not
applicable to this agent — no `comp4020` plugin in this session's skill
list, nothing to act on).

Found a genuinely new angle by asking a different question than any of the
prior ten runs' cold-opens/a11y passes had: not "is the static page
accessible" (axe-core, keyboard tab order — both already clean, several
times over) but "is the app's *headline live-update feature itself*
accessible, and what happens to a focused element when the SSE handler
mutates it out from under you?" It wasn't — confirmed both halves live with
two `agent-browser` tabs before touching code:

- None of the three live-mutated regions (`[data-seats]`, `[data-attendees]`,
  `[data-book-slot]`) carried `aria-live`, unlike the top notice banner
  which does — a screen-reader user got zero indication that seat counts,
  attendee lists, or a session filling ever changed, even though "bookings
  are visible to everyone the moment they happen" is the app's own stated
  point.
- Worse: focusing a session's name input in one tab, then filling that
  exact session to capacity from a second tab, silently deleted the focused
  form via `replaceChildren` and dumped focus to `<body>` with no cue why —
  confirmed by direct DOM inspection (`document.activeElement` after the
  live update), not assumed from reading the code.

Fixed both in one small diff (`0ecbbd8`): `aria-live="polite"` on each
session's `<li>` so count/attendee/full changes get announced; the SSE
handler now checks `slot.contains(document.activeElement)` before replacing
the full-session form and moves focus onto the new "Full" paragraph
(`tabIndex = -1` + `.focus()`) only when it actually stole focus — verified
this does NOT fire when an unrelated, unfocused session fills (tested both
branches explicitly with two tabs). Re-ran `pnpm check` (34/34, 0/0/0
typecheck) and a fresh `agent-browser a11y --json` pass (0 violations, 0
incomplete) after the fix. Pushed and deployed
(`flyctl deploy --remote-only --ha=false -a comp4020-crit7-bada`); live URL
confirmed 200 and serving the new `aria-live="polite"` markup via `curl`.

## Single most important next action

Still not the finishing run (88.5h at this run's start). This is now a
strong fourth thread alongside the concurrency tests, the SSE-resync fix,
and the RST-disconnect/a11y-keyboard checks — all found by asking a
question none of the prior ten runs had asked yet, which is the pattern to
keep chasing over forcing a repeat of an already-answered check. Next
deepen run's options, in order: (1) if a genuinely new angle occurs to it,
take it — don't manufacture one just to keep a streak; (2) otherwise start
drafting `PROCESS.md`/reflection language in scratch form (not the real
files yet); (3) once told this is the last run, write the real
`PROCESS.md` naming the strongest 2-3 threads — concurrency (`719f90b`,
`faaa85e`), SSE-resync (`066c66d`, verified under a real Fly redeploy), and
now the live-update accessibility/focus fix (`0ecbbd8`) is a strong
reflection-breakthrough candidate since it's the one finding that ties
directly back to the app's own stated selling point, not just a defensive
edge case — per doctrine's "one narrative" guidance. Write
`reflections/crit-7.md` headed "Build the ANU system you wish existed" (the
source's title, never a week number). Do not write the reflection file
before that run.
