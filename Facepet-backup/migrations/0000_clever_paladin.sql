CREATE TABLE "breeds" (
	"id" integer PRIMARY KEY NOT NULL,
	"en" varchar(100) NOT NULL,
	"he" varchar(100) NOT NULL,
	CONSTRAINT "breeds_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "genders" (
	"id" integer PRIMARY KEY NOT NULL,
	"en" varchar(50) NOT NULL,
	"he" varchar(50) NOT NULL,
	CONSTRAINT "genders_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"home_address" text NOT NULL,
	"postcode" varchar(20),
	CONSTRAINT "owners_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image_url" text NOT NULL,
	"gender_id" integer NOT NULL,
	"breed_id" integer NOT NULL,
	"birth_date" date NOT NULL,
	"notes" text,
	"user_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"vet_id" uuid,
	CONSTRAINT "pets_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" text NOT NULL,
	"phone" varchar(15),
	"password" text NOT NULL,
	"last_activity_date" date DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "vets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone_number" varchar(50),
	"email" varchar(255),
	"address" text,
	"postcode" varchar(20),
	CONSTRAINT "vets_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_gender_id_genders_id_fk" FOREIGN KEY ("gender_id") REFERENCES "public"."genders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_breed_id_breeds_id_fk" FOREIGN KEY ("breed_id") REFERENCES "public"."breeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_vet_id_vets_id_fk" FOREIGN KEY ("vet_id") REFERENCES "public"."vets"("id") ON DELETE set null ON UPDATE no action;