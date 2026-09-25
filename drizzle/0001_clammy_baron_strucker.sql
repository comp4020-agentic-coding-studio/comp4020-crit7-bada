DROP INDEX `bookings_session_id_person_name_unique`;--> statement-breakpoint
ALTER TABLE `bookings` ADD `person_name_key` text GENERATED ALWAYS AS (lower(trim(person_name))) VIRTUAL;--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_session_id_person_name_key_unique` ON `bookings` (`session_id`,`person_name_key`);