ALTER TABLE "verification_codes" ALTER COLUMN "expire_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_activity_date" SET DATA TYPE timestamp;