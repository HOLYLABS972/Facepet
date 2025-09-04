CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"code" varchar(6),
	"expire_date" date NOT NULL,
	CONSTRAINT "verification_codes_id_unique" UNIQUE("id")
);
