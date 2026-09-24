import type { APIRoute } from "astro";
import { bookSession } from "../../lib/db";
import { bus } from "../../lib/events";

// The write half of the app: a plain HTML form POSTs here, the booking is
// checked and written inside one atomic transaction (see bookSession), and
// a successful one is broadcast to every open SSE connection. The redirect
// makes the form work with no client-side JavaScript at all — the
// submitting tab re-renders from the database; every *other* tab hears
// about the new seat count over the stream. A rejection (full, or the same
// name booking twice) redirects back with a reason instead of a seat.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const sessionId = Number(form.get("sessionId"));
  const personName = String(form.get("personName") ?? "").trim().slice(0, 80);

  if (!Number.isInteger(sessionId) || !personName) {
    return redirect("/?error=invalid", 303);
  }

  const result = bookSession(sessionId, personName);
  if (!result.ok) {
    // The fragment scrolls the rejected session into view and, paired with
    // its tabindex="-1" in index.astro, gives it focus — otherwise a generic
    // top-of-page banner leaves the user to hunt for which of several
    // sessions their booking actually failed on.
    return redirect(`/?error=${result.reason}&session=${sessionId}#session-${sessionId}`, 303);
  }

  bus.emit("booking", { sessionId, booked: result.session.booked, bookedBy: result.session.bookedBy });
  return redirect(`/?booked=${sessionId}`, 303);
};
