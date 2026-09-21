import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { bookings, type Course, courses, type Session, sessions } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

// Demo data for a fresh database: the real ANU tutorial-allocation page
// never ships empty, so neither does this one. Seeding is idempotent —
// skipped once a course already exists — so it never overwrites real bookings.
seed();

function seed(): void {
  if (db.select().from(courses).get()) return;
  const comp4020 = db
    .insert(courses)
    .values({ code: "COMP4020", name: "Agentic Coding Studio" })
    .returning()
    .get();
  const comp1100 = db
    .insert(courses)
    .values({ code: "COMP1100", name: "Introduction to Programming and Algorithms" })
    .returning()
    .get();
  db.insert(sessions)
    .values([
      { courseId: comp4020.id, label: "Mon 15:30", room: "Hanna Neumann 1.28", capacity: 2 },
      { courseId: comp4020.id, label: "Tue 10:00", room: "Hanna Neumann 1.28", capacity: 3 },
      { courseId: comp1100.id, label: "Wed 09:00", room: "CSIT N101", capacity: 4 },
      { courseId: comp1100.id, label: "Wed 14:00", room: "CSIT N101", capacity: 2 },
      { courseId: comp1100.id, label: "Thu 11:00", room: "CSIT N102", capacity: 3 },
    ])
    .run();
}

export type { Course, Session };

export type SessionWithSeats = Session & { booked: number; bookedBy: string[] };
export type CourseWithSessions = Course & { sessions: SessionWithSeats[] };

export function listCourses(): CourseWithSessions[] {
  return db
    .select()
    .from(courses)
    .all()
    .map((course) => ({ ...course, sessions: listSessions(course.id) }));
}

export function listSessions(courseId: number): SessionWithSeats[] {
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.courseId, courseId))
    .all()
    .map((session) => {
      const rows = db
        .select({ personName: bookings.personName })
        .from(bookings)
        .where(eq(bookings.sessionId, session.id))
        .all();
      return { ...session, booked: rows.length, bookedBy: rows.map((r) => r.personName) };
    });
}

export type BookingResult =
  | { ok: true; session: SessionWithSeats }
  | { ok: false; reason: "not-found" | "full" | "duplicate" };

// The one contract this whole app exists to enforce: a session never holds
// more people than it has seats, even when two people book the same last
// seat at once. better-sqlite3 is synchronous, so db.transaction runs this
// whole read-check-write as one atomic step — no other booking can land
// between the seat count read and the insert.
export function bookSession(sessionId: number, personName: string): BookingResult {
  return db.transaction((tx) => {
    const session = tx.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return { ok: false, reason: "not-found" } as const;

    const [{ value: booked }] = tx
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.sessionId, sessionId))
      .all();
    if (booked >= session.capacity) return { ok: false, reason: "full" } as const;

    const already = tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.sessionId, sessionId), eq(bookings.personName, personName)))
      .get();
    if (already) return { ok: false, reason: "duplicate" } as const;

    tx.insert(bookings).values({ sessionId, personName }).run();
    const bookedBy = tx
      .select({ personName: bookings.personName })
      .from(bookings)
      .where(eq(bookings.sessionId, sessionId))
      .all()
      .map((r) => r.personName);
    return { ok: true, session: { ...session, booked: bookedBy.length, bookedBy } } as const;
  });
}
