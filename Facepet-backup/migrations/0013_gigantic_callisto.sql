CREATE TYPE "public"."ad_status" AS ENUM('active', 'inactive', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."ad_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "advertisements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "ad_type" NOT NULL,
	"content" text NOT NULL,
	"duration" integer DEFAULT 5 NOT NULL,
	"status" "ad_status" DEFAULT 'inactive' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "advertisements_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;