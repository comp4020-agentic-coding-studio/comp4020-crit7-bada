import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, inject, it } from "vitest";

// The contract this app exists for: a tutorial session never holds more
// people than it has seats — not even when two people race for the last
// one — and every open tab finds out about a booking without reloading.
// Drives the running app over HTTP, the same way spec/invariants.test.ts
// does, rather than calling src/lib/db.ts directly, so this proves the
// deployed behaviour, not just the function.
const baseUrl = inject("baseUrl");

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const book = (sessionId: number, personName: string) =>
  fetch(new URL("/api/bookings", baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body: new URLSearchParams({ sessionId: String(sessionId), personName }),
    redirect: "manual",
  });

async function findSessionWithSpareCapacity(
  minSpare = 1,
): Promise<{ id: number; capacity: number; booked: number }> {
  const res = await fetch(baseUrl);
  const doc = new JSDOM(await res.text()).window.document;
  const sessions = [...doc.querySelectorAll("[data-session-id]")]
    .map((el) => {
      const seatsText = el.querySelector("[data-seats]")?.textContent ?? "";
      const [booked] = seatsText.split("/").map((n) => Number(n.trim()));
      return {
        id: Number(el.getAttribute("data-session-id")),
        capacity: Number(el.getAttribute("data-capacity")),
        booked: booked ?? 0,
      };
    })
    .filter((s) => s.capacity - s.booked >= minSpare)
    .sort((a, b) => a.capacity - b.capacity);
  const smallest = sessions[0];
  if (!smallest) throw new Error(`no session has ${minSpare} spare seat(s) left`);
  return smallest;
}

describe("booking a seat", () => {
  let sessionId: number;
  let capacity: number;

  beforeAll(async () => {
    ({ id: sessionId, capacity } = await findSessionWithSpareCapacity());
  });

  it("accepts a booking and redirects back to the page", async () => {
    const res = await book(sessionId, "Ada");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/?booked=${sessionId}`);
  });

  it("persists the booking: a fresh page load shows the name and count", async () => {
    const res = await fetch(baseUrl);
    const text = await res.text();
    expect(text).toContain("Ada");
    expect(text).toContain(`1 / ${capacity} booked`);
  });

  it("rejects the same person booking the same session twice", async () => {
    const res = await book(sessionId, "Ada");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/?error=duplicate&session=${sessionId}#session-${sessionId}`);
  });

  it("rejects the same name booked with different capitalisation", async () => {
    // the unique constraint is keyed on lower(trim(person_name)), not the raw
    // typed name — "ADA" has to collide with the "Ada" booked above, or a
    // trivial capitalisation change bypasses the app's one-seat-per-person
    // promise.
    const res = await book(sessionId, "ADA");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/?error=duplicate&session=${sessionId}#session-${sessionId}`);
  });

  it("rejects the same name booked with a differently-cased accent", async () => {
    // SQLite's built-in lower() only folds ASCII, so a naive
    // lower(trim(person_name)) key would let "FRANÇOIS" and "françois" book
    // as two different people — the generated column calls the custom
    // name_key() function instead (see schema.ts), which folds case the same
    // way the app-level pre-check does.
    const { id, capacity, booked } = await findSessionWithSpareCapacity(2);
    const first = await book(id, "FRANÇOIS");
    expect(first.status).toBe(303);
    expect(first.headers.get("location")).toBe(`/?booked=${id}`);

    const second = await book(id, "françois");
    expect(second.status).toBe(303);
    expect(second.headers.get("location")).toBe(`/?error=duplicate&session=${id}#session-${id}`);

    // fill any remaining seats so this session reads as full to every later
    // test's own findSessionWithSpareCapacity() call, the same way the
    // capitalisation test above leaves its session fully booked
    for (let n = 1; n <= capacity - booked - 1; n++) {
      await book(id, `Accent filler ${n}`);
    }
  });

  it("refuses a booking once every seat is taken", async () => {
    // fill whatever's left, then one more should bounce
    for (let n = 1; n < capacity; n++) {
      const res = await book(sessionId, `Guest ${n}`);
      expect(res.status).toBe(303);
    }
    const overflow = await book(sessionId, "One Too Many");
    expect(overflow.status).toBe(303);
    expect(overflow.headers.get("location")).toBe(`/?error=full&session=${sessionId}#session-${sessionId}`);

    const page = await fetch(baseUrl);
    expect(await page.text()).not.toContain("One Too Many");
  });

  it("lets only one of two simultaneous requests take the last seat", async () => {
    // the previous tests only ever book one at a time, so they can't catch a
    // real race — this is the one the harness names as the app's whole
    // point: fire two requests for the same last seat concurrently (no
    // await between them) and confirm exactly one gets in.
    const { id: raceSession, capacity: raceCapacity } = await findSessionWithSpareCapacity();
    for (let n = 1; n < raceCapacity; n++) {
      await book(raceSession, `Filler ${n}`);
    }

    const [a, b] = await Promise.all([book(raceSession, "Racer A"), book(raceSession, "Racer B")]);
    const locations = [a, b].map((r) => r.headers.get("location"));
    expect(locations.filter((loc) => loc === `/?booked=${raceSession}`)).toHaveLength(1);
    expect(locations.filter((loc) => loc === `/?error=full&session=${raceSession}#session-${raceSession}`)).toHaveLength(1);

    const page = await fetch(baseUrl);
    expect(await page.text()).toContain(`${raceCapacity} / ${raceCapacity} booked`);
  });

  it("rejects a blank name", async () => {
    const { id } = await findSessionWithSpareCapacity();
    const res = await book(id, "   ");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?error=invalid");
  });

  it("rejects a name made only of invisible Unicode characters", async () => {
    // U+200B (zero-width space) isn't whitespace as far as .trim() or a
    // browser's own `required` validation is concerned, so a name of only
    // invisible characters reads as "present" to both — this would otherwise
    // take a real seat under a name nobody can see in the attendee list.
    const { id } = await findSessionWithSpareCapacity();
    const res = await book(id, "​​​");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?error=invalid");

    const page = await fetch(baseUrl);
    expect(await page.text()).not.toContain(`1 / `);
  });

  it("accepts a name that merely contains an invisible character alongside real ones", async () => {
    const { id } = await findSessionWithSpareCapacity();
    const res = await book(id, "Jo​hn");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/?booked=${id}`);
  });

  it("rejects a booking against a session id that doesn't exist", async () => {
    const res = await book(999_999, "Ghost");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?error=not-found&session=999999#session-999999");
  });

  it("broadcasts a booking to every open tab over the SSE stream", async () => {
    // the first session is full by now (the previous test filled it); find
    // one that still has room left
    const { id: otherSession } = await findSessionWithSpareCapacity();
    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    const name = `Live probe ${process.hrtime.bigint()}`;
    await book(otherSession, name);

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes(name)) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before the booking event arrived");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    expect(received).toContain(`"sessionId":${otherSession}`);
  }, 10_000);

  it("resolves a wide N-way race for the last few seats without overshoot or undershoot", async () => {
    // the earlier race test only ever fires two requests at the very last
    // seat — this asks whether the same transaction boundary holds when more
    // requests land at once than there are seats left, not just one more
    // than fits.
    const { id, capacity, booked } = await findSessionWithSpareCapacity();
    const spare = capacity - booked;
    const leaveOpen = Math.min(2, spare);
    for (let n = 1; n <= spare - leaveOpen; n++) {
      await book(id, `Wide filler ${n}`);
    }

    const racers = leaveOpen + 4;
    const results = await Promise.all(
      Array.from({ length: racers }, (_, i) => book(id, `Wide racer ${i}`)),
    );
    const locations = results.map((r) => r.headers.get("location"));
    expect(locations.filter((l) => l === `/?booked=${id}`)).toHaveLength(leaveOpen);
    expect(locations.filter((l) => l === `/?error=full&session=${id}#session-${id}`)).toHaveLength(
      racers - leaveOpen,
    );

    const page = await fetch(baseUrl);
    expect(await page.text()).toContain(`${capacity} / ${capacity} booked`);
  });

  it("rejects the same name typed with a different Unicode normalization form", async () => {
    // "Café" can be encoded as a precomposed \u00e9 or as e + a combining
    // acute accent (\u0301) — visually identical on screen, but two different
    // strings until normalized, so .toLowerCase() alone (see name_key() in
    // db.ts) would let them double-book.
    const nfcName = "Caf\u00e9";
    const nfdName = "Cafe\u0301";

    const { id } = await findSessionWithSpareCapacity();
    const nfc = await book(id, nfcName);
    expect(nfc.status).toBe(303);
    expect(nfc.headers.get("location")).toBe(`/?booked=${id}`);

    const nfd = await book(id, nfdName);
    expect(nfd.status).toBe(303);
    expect(nfd.headers.get("location")).toBe(`/?error=duplicate&session=${id}#session-${id}`);
  });

  it("resolves a same-name double-submit race to exactly one booking", async () => {
    // a double/triple-click submit sends the same person's name in several
    // concurrent requests — this is the unique-constraint side of the
    // contract, distinct from the capacity race above.
    const { id } = await findSessionWithSpareCapacity();
    const results = await Promise.all(Array.from({ length: 5 }, () => book(id, "Double Clicker")));
    const locations = results.map((r) => r.headers.get("location"));
    expect(locations.filter((l) => l === `/?booked=${id}`)).toHaveLength(1);
    expect(locations.filter((l) => l === `/?error=duplicate&session=${id}#session-${id}`)).toHaveLength(4);

    const page = await fetch(baseUrl);
    const occurrences = ((await page.text()).match(/Double Clicker/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it("lists attendees in signup order, not alphabetical order", async () => {
    // Neither query in db.ts has an ORDER BY of its own choosing — SQLite
    // happens to satisfy a plain WHERE-on-session_id query by walking the
    // (session_id, person_name_key) unique index, which returns rows sorted
    // by folded name rather than by when they booked. Book two names that
    // sort the opposite way alphabetically from the order they're booked in,
    // and confirm the page shows them in the order they actually signed up.
    // Last in the file deliberately: it doesn't need to leave spare capacity
    // behind for a later test, unlike every other capacity-consuming test
    // above.
    const { id } = await findSessionWithSpareCapacity(2);
    await book(id, "Zeta Booker");
    await book(id, "Beta Booker");

    const page = await fetch(baseUrl);
    const doc = new JSDOM(await page.text()).window.document;
    const names = [...doc.querySelector(`[data-session-id="${id}"] [data-attendees]`)!.children].map(
      (li) => li.textContent,
    );
    expect(names.indexOf("Zeta Booker")).toBeLessThan(names.indexOf("Beta Booker"));
  });
});
