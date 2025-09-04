-- No privacy columns for pets table (all pet information is always public)

-- Add privacy columns to owners table (name is always public)
ALTER TABLE "owners" ADD COLUMN "is_phone_private" boolean NOT NULL DEFAULT false;
ALTER TABLE "owners" ADD COLUMN "is_email_private" boolean NOT NULL DEFAULT false;
ALTER TABLE "owners" ADD COLUMN "is_address_private" boolean NOT NULL DEFAULT false;

-- Add privacy columns to vets table (all vet info can be private)
ALTER TABLE "vets" ADD COLUMN "is_name_private" boolean NOT NULL DEFAULT false;
ALTER TABLE "vets" ADD COLUMN "is_phone_private" boolean NOT NULL DEFAULT false;
ALTER TABLE "vets" ADD COLUMN "is_email_private" boolean NOT NULL DEFAULT false;
ALTER TABLE "vets" ADD COLUMN "is_address_private" boolean NOT NULL DEFAULT false;
