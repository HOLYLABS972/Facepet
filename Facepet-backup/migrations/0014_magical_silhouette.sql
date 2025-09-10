ALTER TABLE "owners" ADD COLUMN "is_name_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "is_phone_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "is_email_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "is_address_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "is_name_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "is_breed_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "is_gender_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "is_age_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "is_notes_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vets" ADD COLUMN "is_name_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vets" ADD COLUMN "is_phone_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vets" ADD COLUMN "is_email_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vets" ADD COLUMN "is_address_private" boolean DEFAULT false NOT NULL;