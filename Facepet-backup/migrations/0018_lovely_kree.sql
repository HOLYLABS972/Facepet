CREATE TYPE "public"."verification_type" AS ENUM('email_verification', 'password_reset', 'email_change');--> statement-breakpoint
CREATE TABLE "email_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_email" varchar(255) NOT NULL,
	"new_email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "email_change_requests_id_unique" UNIQUE("id"),
	CONSTRAINT "email_change_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "password_reset_tokens_id_unique" UNIQUE("id"),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "verification_codes" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_codes" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "type" "verification_type" DEFAULT 'email_verification' NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "used" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_codes' AND column_name = 'created_at') THEN
        ALTER TABLE "verification_codes" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_change_requests" ADD CONSTRAINT "email_change_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;