DROP INDEX `bookings_session_id_person_name_key_unique`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `person_name_key`;--> statement-breakpoint
ALTER TABLE `bookings` ADD `person_name_key` text GENERATED ALWAYS AS (name_key(person_name)) VIRTUAL;--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_session_id_person_name_key_unique` ON `bookings` (`session_id`,`person_name_key`);