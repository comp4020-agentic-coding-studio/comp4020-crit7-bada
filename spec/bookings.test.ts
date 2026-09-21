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

async function findSessionWithSpareCapacity(): Promise<{ id: number; capacity: number; booked: number }> {
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
    .filter((s) => s.booked < s.capacity)
    .sort((a, b) => a.capacity - b.capacity);
  const smallest = sessions[0];
  if (!smallest) throw new Error("every seeded session is already full");
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
    expect(res.headers.get("location")).toBe(`/?error=duplicate&session=${sessionId}`);
  });

  it("refuses a booking once every seat is taken", async () => {
    // fill whatever's left, then one more should bounce
    for (let n = 1; n < capacity; n++) {
      const res = await book(sessionId, `Guest ${n}`);
      expect(res.status).toBe(303);
    }
    const overflow = await book(sessionId, "One Too Many");
    expect(overflow.status).toBe(303);
    expect(overflow.headers.get("location")).toBe(`/?error=full&session=${sessionId}`);

    const page = await fetch(baseUrl);
    expect(await page.text()).not.toContain("One Too Many");
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
});
