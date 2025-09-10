CREATE TABLE "pet_ids_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pet_ids_pool_id_unique" UNIQUE("id")
);
