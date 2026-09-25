import { sql } from "drizzle-orm";
import { int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

// A course offers one or more tutorial/lab sessions students book a seat in.
export const courses = sqliteTable("courses", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull(),
  name: text().notNull(),
});

// A bookable slot: a time, a room, and a fixed number of seats.
export const sessions = sqliteTable("sessions", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id),
  label: text().notNull(),
  room: text().notNull(),
  capacity: int().notNull(),
});

// One booking is one person's seat in one session. The unique constraint is
// the load-bearing part: it's what stops the same person double-booking the
// same session, enforced by SQLite itself rather than trusted to app logic.
// It's keyed on personNameKey, not the raw personName, so "Ada" and "ada"
// collide as the same person instead of quietly bypassing the
// one-seat-per-person promise by varying capitalisation — the stored
// personName keeps the casing they typed for display. The generated column
// calls name_key(), a custom function registered in db.ts, rather than
// SQLite's built-in lower(): built-in lower() only folds ASCII, so
// "FRANÇOIS" and "françois" would hash to different keys and double-book —
// name_key() uses the same JS .toLowerCase() the app-level pre-check in
// bookSession uses, so the two never disagree.
export const bookings = sqliteTable(
  "bookings",
  {
    id: int().primaryKey({ autoIncrement: true }),
    sessionId: int("session_id")
      .notNull()
      .references(() => sessions.id),
    personName: text("person_name").notNull(),
    personNameKey: text("person_name_key").generatedAlwaysAs(sql`name_key(person_name)`, {
      mode: "virtual",
    }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [unique().on(table.sessionId, table.personNameKey)],
);

export type Course = typeof courses.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
