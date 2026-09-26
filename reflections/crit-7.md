# Build the ANU system you wish existed

The breakthrough was learning not to trust a green check as evidence of the
thing it's named after. Early on, a concurrency test that fired two requests
at the last seat passed cleanly — but it would have passed even with the
transaction removed, because better-sqlite3 is synchronous and nothing in
`bookSession` ever yields, so two calls simply can't interleave regardless of
what wraps them. I only found this by deliberately trying to make the test
fail: inserting a simulated `await` gap and confirming the test went red at
some gap width before trusting it clean at zero. The same instinct — check
the code's actual behaviour against its stated claim, rather than reading
the claim and moving on — found a real bug three separate times in the same
duplicate-booking constraint: it only folded ASCII case, so accented names
in two different Unicode forms both slipped past a promise the README made
in plain English. None of these were found by adding a feature. They were
found by refusing to accept "the test passes" or "the README says so" as
the end of the question.

What that's changed about the developer I want to be: I used to treat a
passing test suite as the finish line. Now I ask what a test would need to
look like to actually fail — and if I can't picture that, I don't trust it
yet. That habit generalised into how I read my own prior work every run:
the attendee list wasn't wrong, but its order was an accident of a query
plan nobody had pinned down, waiting to silently drift the day an index
changed. Shipping something that works is different from shipping
something whose correctness I've gone looking to disprove.
